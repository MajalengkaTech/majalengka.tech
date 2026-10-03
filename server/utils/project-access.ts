import type { H3Event } from 'h3'
import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export function parseProjectId(event: H3Event) {
	const id = Number(getRouterParam(event, 'id'))
	if (!Number.isInteger(id) || id <= 0) {
		throw createError({
			statusCode: 400,
			statusMessage: 'ID proyek tidak valid'
		})
	}
	return id
}

export async function requirePublishedProject(id: number) {
	const project = await db.query.projects.findFirst({
		where: eq(schema.projects.id, id)
	})
	if (!project || !project.isPublished) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Proyek tidak ditemukan'
		})
	}
	return project
}

export async function requireSignedIn(event: H3Event, message = 'Masuk dulu untuk melanjutkan.') {
	const session = await getUserSession(event)
	if (!session?.user?.id) {
		throw createError({
			statusCode: 401,
			statusMessage: message
		})
	}
	return session
}
