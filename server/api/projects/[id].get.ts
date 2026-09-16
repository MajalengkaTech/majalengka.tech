import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
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

	return {
		project
	}
})
