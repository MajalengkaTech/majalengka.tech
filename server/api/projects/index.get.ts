import { z } from 'zod'
import { and, desc, eq, sql, type SQL } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { projectListColumns, toProjectItem } from '../../utils/project-listing'

const querySchema = z.object({
	mine: z.enum(['true', '1']).optional(),
	category: z.enum(projectCategoryValues).optional(),
	featured: z.enum(['true', '1']).optional(),
	author: z.string().trim().max(30).optional(),
	sort: z.enum(['terbaru', 'populer']).default('terbaru'),
	limit: z.coerce.number().int().min(1).max(60).default(60)
})

export default defineEventHandler(async (event) => {
	const query = await getQueryWith(event, querySchema)
	const session = await getUserSession(event).catch(() => null)
	const currentUserId = session?.user?.id ? String(session.user.id) : null

	const filters: SQL[] = []

	if (query.mine) {
		if (!currentUserId) {
			throw createError({
				statusCode: 401,
				statusMessage: 'Silakan masuk terlebih dahulu'
			})
		}
		filters.push(eq(schema.projects.userId, currentUserId))
	} else {
		filters.push(eq(schema.projects.isPublished, true))
	}

	if (query.category) filters.push(eq(schema.projects.category, query.category))
	if (query.featured) filters.push(eq(schema.projects.isFeatured, true))
	if (query.author) filters.push(eq(schema.user.username, query.author.toLowerCase()))

	const columns = projectListColumns(currentUserId)
	const orderBy = query.sort === 'populer'
		? [desc(sql`like_count`), desc(schema.projects.createdAt)]
		: [desc(schema.projects.createdAt)]

	const rows = await db
		.select(columns)
		.from(schema.projects)
		.leftJoin(schema.user, eq(schema.projects.userId, schema.user.id))
		.where(and(...filters))
		.orderBy(...orderBy)
		.limit(query.limit)

	return {
		projects: rows.map(toProjectItem)
	}
})
