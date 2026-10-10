import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { getRouterParam } from 'nuxt/server'
import type { ServerEvent } from './validation'

type RouteParamEvent = Parameters<typeof getRouterParam>[0]
type AuthEvent = Parameters<typeof getUserSession>[0]

export async function getAuthSession(event: ServerEvent) {
	return getUserSession(event as unknown as AuthEvent)
}

export function parseProjectId(event: ServerEvent) {
	const id = Number(getRouterParam(event as unknown as RouteParamEvent, 'id', { decode: true }))
	if (!Number.isInteger(id) || id <= 0) {
		throw createError({
			status: 400,
			statusText: 'ID proyek tidak valid'
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
			status: 404,
			statusText: 'Proyek tidak ditemukan'
		})
	}
	return project
}

export async function requireSignedIn(event: ServerEvent, message = 'Masuk dulu untuk melanjutkan.') {
	const session = await getAuthSession(event)
	if (!session?.user?.id) {
		throw createError({
			status: 401,
			statusText: message
		})
	}
	return session
}
