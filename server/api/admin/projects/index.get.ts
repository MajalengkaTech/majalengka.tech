import { z } from 'zod'
import { and, desc, eq, like, or, type SQL } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { requireAdminSession } from '../../../utils/admin'
import { projectListColumns, toProjectItem } from '../../../utils/project-listing'

const querySchema = z.object({
	q: z.string().trim().max(80).optional(),
	status: z.enum(['semua', 'terbit', 'draf']).default('semua')
})

// Daftar semua proyek, termasuk Draf, untuk dikelola admin.
export default defineEventHandler(async (event) => {
	const session = await requireAdminSession(event)
	const query = getQueryWith(event, querySchema)

	const filters: SQL[] = []
	if (query.status === 'terbit') filters.push(eq(schema.projects.isPublished, true))
	if (query.status === 'draf') filters.push(eq(schema.projects.isPublished, false))
	if (query.q) {
		const term = `%${query.q.toLowerCase()}%`
		const match = or(
			like(schema.projects.title, term),
			like(schema.user.name, term),
			like(schema.user.username, term)
		)
		if (match) filters.push(match)
	}

	const rows = await db
		.select(projectListColumns(String(session.user.id)))
		.from(schema.projects)
		.leftJoin(schema.user, eq(schema.projects.userId, schema.user.id))
		.where(filters.length ? and(...filters) : undefined)
		.orderBy(desc(schema.projects.createdAt))
		.limit(200)

	return { projects: rows.map(toProjectItem) }
})
