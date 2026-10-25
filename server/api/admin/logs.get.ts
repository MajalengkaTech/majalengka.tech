import { z } from 'zod'
import { and, desc, gte, inArray, like, lt, not, or, type SQL } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { defineEventHandler } from 'nuxt/server'
import { requireSuperAdminSession } from '../../utils/admin'

const PAGE_SIZE = 50
const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

const querySchema = z.object({
	jenis: z.enum(['semua', 'gagal', 'masuk', 'perubahan']).default('semua'),
	q: z.string().trim().max(80).optional(),
	sebelum: z.string().datetime().optional()
})

type LogData = {
	user?: { id?: string, username?: string | null }
	target?: Record<string, unknown>
	ip?: string
	country?: string
	userAgent?: string
}

function parseJson<T>(value: string | null): T | null {
	if (!value) return null
	try {
		return JSON.parse(value) as T
	} catch {
		return null
	}
}

export default defineEventHandler(async (event) => {
	await requireSuperAdminSession(event)
	const query = getQueryWith(event, querySchema)
	const { evlogEvents } = schema

	const filters: SQL[] = []
	if (query.jenis === 'gagal') filters.push(or(gte(evlogEvents.status, 400), inArray(evlogEvents.level, ['error', 'fatal']))!)
	if (query.jenis === 'masuk') filters.push(like(evlogEvents.path, '/api/auth/%'))
	if (query.jenis === 'perubahan') filters.push(and(inArray(evlogEvents.method, WRITE_METHODS), not(like(evlogEvents.path, '/api/auth/%')))!)
	if (query.q) {
		const term = `%${query.q}%`
		filters.push(or(like(evlogEvents.path, term), like(evlogEvents.data, term))!)
	}
	if (query.sebelum) filters.push(lt(evlogEvents.timestamp, query.sebelum))

	const rows = await db.select()
		.from(evlogEvents)
		.where(filters.length ? and(...filters) : undefined)
		.orderBy(desc(evlogEvents.timestamp))
		.limit(PAGE_SIZE + 1)

	const logs = rows.slice(0, PAGE_SIZE).map((row) => {
		const data = parseJson<LogData>(row.data) ?? {}
		const error = parseJson<{ message?: string, statusMessage?: string }>(row.error)
		return {
			id: row.id,
			timestamp: row.timestamp,
			level: row.level,
			method: row.method,
			path: row.path,
			status: row.status,
			durationMs: row.durationMs,
			user: data.user ?? null,
			target: data.target ?? null,
			ip: data.ip ?? null,
			country: data.country ?? null,
			userAgent: data.userAgent ?? null,
			error: error?.statusMessage || error?.message || null
		}
	})

	return {
		logs,
		nextCursor: rows.length > PAGE_SIZE ? logs.at(-1)?.timestamp ?? null : null
	}
})
