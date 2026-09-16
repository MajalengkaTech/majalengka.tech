import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
	const session = await getUserSession(event)
	if (!session?.user?.id) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Unauthorized'
		})
	}

	const id = getRouterParam(event, 'id')
	if (!id) {
		throw createError({
			statusCode: 400,
			statusMessage: 'ID projek tidak valid'
		})
	}

	const project = await db.query.projects.findFirst({
		where: eq(schema.projects.id, Number(id))
	})

	if (!project) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Projek tidak ditemukan'
		})
	}

	// Verify ownership
	if (project.userId !== Number(session.user.id)) {
		throw createError({
			statusCode: 403,
			statusMessage: 'Anda tidak memiliki hak akses untuk menghapus projek ini'
		})
	}

	await db.delete(schema.projects).where(eq(schema.projects.id, Number(id)))

	return {
		success: true,
		message: 'Projek berhasil dihapus'
	}
})
