import { and, eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { getRouterParam } from 'nuxt/server'
import type { ServerEvent } from './validation'

type RouteParamEvent = Parameters<typeof getRouterParam>[0]

export function parseTutorialId(event: ServerEvent) {
	const id = Number(getRouterParam(event as unknown as RouteParamEvent, 'id', { decode: true }))
	if (!Number.isInteger(id) || id <= 0) {
		throw createError({ status: 400, statusText: 'Alamat tutorial tidak valid. Buka lagi dari daftar tutorialmu.' })
	}
	return id
}

// Tutorial hanya boleh ditautkan ke proyek milik penulisnya sendiri.
export async function assertOwnProject(projectId: number | null | undefined, userId: string) {
	if (!projectId) return null
	const [project] = await db.select({ id: schema.projects.id }).from(schema.projects)
		.where(and(eq(schema.projects.id, projectId), eq(schema.projects.userId, userId))).limit(1)
	if (!project) {
		throw createError({ status: 400, statusText: 'Proyek terkait harus salah satu proyekmu sendiri. Pilih lagi dari daftar.' })
	}
	return project.id
}

export function cleanTags(tags: string | null | undefined) {
	const list = (tags || '').split(',').map(tag => tag.trim()).filter(Boolean)
	return list.length ? [...new Set(list)].slice(0, 10).join(', ') : null
}
