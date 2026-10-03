import { z } from 'zod'
import { and, desc, eq, isNotNull, sql } from 'drizzle-orm'
import { db, schema } from 'hub:db'

const querySchema = z.object({
	terbuka: z.enum(['true', '1']).optional(),
	limit: z.coerce.number().int().min(1).max(48).default(12)
})

// Hanya kreator yang punya username dan minimal satu proyek terbit, urut dari yang terakhir menerbitkan.
export default defineEventHandler(async (event) => {
	const query = await getQueryWith(event, querySchema)
	const { user } = schema
	// Kolom user ditulis lengkap: query satu tabel membuat drizzle menulis "id" polos, yang di subquery terbaca sebagai p.id.

	const projectCount = sql<number>`(select count(*) from projects p where p.user_id = "user"."id" and p.is_published = 1)`
	const lastPublished = sql<number>`(select max(p.created_at) from projects p where p.user_id = "user"."id" and p.is_published = 1)`

	const rows = await db
		.select({
			id: user.id,
			name: user.name,
			username: user.username,
			avatarUrl: user.image,
			creatorRole: user.creatorRole,
			location: user.location,
			openToWork: user.openToWork,
			projectCount: projectCount.as('project_count'),
			coverUrl: sql<string | null>`(select p.thumbnail_url from projects p where p.user_id = "user"."id" and p.is_published = 1 and p.thumbnail_url is not null order by p.created_at desc limit 1)`.as('cover_url')
		})
		.from(user)
		.where(and(
			isNotNull(user.username),
			sql`coalesce(${user.banned}, 0) = 0`,
			sql`${projectCount} > 0`,
			query.terbuka ? eq(user.openToWork, true) : undefined
		))
		.orderBy(desc(lastPublished))
		.limit(query.limit)

	return {
		creators: rows.map(row => ({ ...row, projectCount: Number(row.projectCount) || 0, openToWork: Boolean(row.openToWork) }))
	}
})
