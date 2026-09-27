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

	// Ulasan dihapus eksplisit karena cascade FK tidak aktif di SQLite lokal.
	await db.batch([
		db.delete(schema.projectReviews).where(eq(schema.projectReviews.projectId, id)),
		db.delete(schema.projects).where(eq(schema.projects.id, id))
	])

	await deleteOwnedBlob(project.thumbnailUrl, project.userId)

	return {
		success: true,
		message: 'Projek berhasil dihapus'
	}
})
