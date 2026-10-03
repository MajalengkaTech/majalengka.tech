import { asc, eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { isAdmin } from '../../utils/admin'

export default defineEventHandler(async (event) => {
	const id = Number(getRouterParam(event, 'id'))
	if (!Number.isInteger(id) || id <= 0) {
		throw createError({
			statusCode: 400,
			statusMessage: 'ID proyek tidak valid'
		})
	}

	const project = await db.query.projects.findFirst({
		where: eq(schema.projects.id, id)
	})

	// Draf dijawab 404, bukan 403, supaya keberadaannya tidak bocor ke orang lain.
	if (project && !project.isPublished) {
		const session = await getUserSession(event).catch(() => null)
		const canSeeDraft = !!session?.user && (session.user.id === project.userId || isAdmin(session.user))
		if (!canSeeDraft) {
			throw createError({
				statusCode: 404,
				statusMessage: 'Proyek tidak ditemukan'
			})
		}
	}

	if (!project) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Proyek tidak ditemukan'
		})
	}

	const [images, [owner]] = await Promise.all([
		db
			.select({ id: schema.projectImages.id, url: schema.projectImages.url, alt: schema.projectImages.alt })
			.from(schema.projectImages)
			.where(eq(schema.projectImages.projectId, id))
			.orderBy(asc(schema.projectImages.sortOrder), asc(schema.projectImages.id)),
		// Nama pemilik dipakai form edit untuk memberi tahu admin proyek siapa yang sedang diubah.
		db
			.select({ name: schema.user.name, username: schema.user.username })
			.from(schema.user)
			.where(eq(schema.user.id, project.userId))
			.limit(1)
	])

	return {
		project: {
			...project,
			images,
			author: { name: owner?.name || 'Kreator Majalengka', username: owner?.username ?? null }
		}
	}
})
