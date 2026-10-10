import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { defineEventHandler, getRouterParam } from 'nuxt/server'
import { isAdmin } from '../../utils/admin'
import { assertThumbnailAllowed, deleteOwnedBlob } from '../../utils/project-blob'

export default defineEventHandler(async (event) => {
	const session = await getAuthSession(event)
	if (!session?.user?.id) {
		throw createError({
			status: 401,
			statusText: 'Masuk dulu untuk melanjutkan.'
		})
	}

	const id = Number(getRouterParam(event, 'id', { decode: true }))
	if (!Number.isInteger(id) || id <= 0) {
		throw createError({
			status: 400,
			statusText: 'ID proyek tidak valid'
		})
	}

	const project = await db.query.projects.findFirst({
		where: eq(schema.projects.id, id)
	})

	if (!project) {
		throw createError({
			status: 404,
			statusText: 'Proyek tidak ditemukan'
		})
	}

	if (project.userId !== session.user.id && !isAdmin(session.user)) {
		throw createError({
			status: 403,
			statusText: 'Kamu tidak punya akses untuk mengedit proyek ini'
		})
	}

	const body = await readBodyWith(event, projectInputSchema)
	const newThumbnailUrl = body.thumbnailUrl?.trim() || null
	assertThumbnailAllowed(newThumbnailUrl, project.userId, project.thumbnailUrl)

	const changes: Partial<typeof schema.projects.$inferInsert> = {
		title: body.title.trim(),
		description: body.description.trim(),
		thumbnailUrl: newThumbnailUrl,
		repoUrl: body.repoUrl?.trim() || null,
		demoUrl: body.demoUrl?.trim() || null,
		tags: body.tags?.trim() || null,
		isPublished: body.isPublished,
		updatedAt: new Date()
	}
	// Field baru hanya diubah bila dikirim, supaya form lama tidak mengosongkannya.
	if (body.tagline !== undefined) changes.tagline = body.tagline?.trim() || null
	if (body.category !== undefined) changes.category = body.category
	if (body.contribution !== undefined) changes.contribution = body.contribution?.trim() || null
	if (body.designUrl !== undefined) changes.designUrl = body.designUrl?.trim() || null

	const [updated] = await db.update(schema.projects)
		.set(changes)
		.where(eq(schema.projects.id, id))
		.returning()

	if (project.thumbnailUrl && project.thumbnailUrl !== newThumbnailUrl) {
		await deleteOwnedBlob(project.thumbnailUrl, project.userId)
	}

	return {
		success: true,
		project: updated
	}
})
