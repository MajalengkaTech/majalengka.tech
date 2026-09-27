import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { isAdmin } from '../../utils/admin'
import { deleteOwnedBlob } from '../../utils/project-blob'

export default defineEventHandler(async (event) => {
	const session = await getUserSession(event)
	if (!session?.user?.id) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Silakan masuk terlebih dahulu'
		})
	}

	const id = Number(getRouterParam(event, 'id'))
	if (!Number.isInteger(id) || id <= 0) {
		throw createError({
			statusCode: 400,
			statusMessage: 'ID projek tidak valid'
		})
	}

	const project = await db.query.projects.findFirst({
		where: eq(schema.projects.id, id)
	})

	if (!project) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Projek tidak ditemukan'
		})
	}

	if (project.userId !== session.user.id && !isAdmin(session.user)) {
		throw createError({
			statusCode: 403,
			statusMessage: 'Kamu tidak punya akses untuk menghapus projek ini'
		})
	}

	const images = await db
		.select({ url: schema.projectImages.url })
		.from(schema.projectImages)
		.where(eq(schema.projectImages.projectId, id))

	// Relasi dihapus eksplisit karena cascade FK tidak aktif di SQLite lokal.
	await db.batch([
		db.delete(schema.projectComments).where(eq(schema.projectComments.projectId, id)),
		db.delete(schema.projectLikes).where(eq(schema.projectLikes.projectId, id)),
		db.delete(schema.projectImages).where(eq(schema.projectImages.projectId, id)),
		db.delete(schema.projects).where(eq(schema.projects.id, id))
	])

	for (const url of [project.thumbnailUrl, ...images.map(image => image.url)]) {
		await deleteOwnedBlob(url, project.userId)
	}

	return {
		success: true,
		message: 'Projek berhasil dihapus'
	}
})
