import { z } from 'zod'
import { and, asc, isNotNull, notInArray, sql } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { defineEventHandler } from 'nuxt/server'
import { requireAdminSession } from '../../../utils/admin'

const querySchema = z.object({
	q: z.string().trim().max(40).default('')
})

// Saran kreator untuk dijadikan peninjau: cocok dengan username atau nama, belum peninjau, dan tidak ditangguhkan.
export default defineEventHandler(async (event) => {
	await requireAdminSession(event)
	const { q } = await getQueryWith(event, querySchema)
	const term = q.replace(/^@/, '').toLowerCase()
	const { user } = schema
	const rows = await db
		.select({ id: user.id, name: user.name, username: user.username, image: user.image })
		.from(user)
		.where(and(
			isNotNull(user.username),
			sql`coalesce(${user.banned}, 0) = 0`,
			notInArray(user.id, db.select({ id: schema.tutorialReviewers.userId }).from(schema.tutorialReviewers)),
			// instr supaya % dan _ dari ketikan tidak dibaca sebagai wildcard LIKE.
			term ? sql`(instr(lower(${user.username}), ${term}) > 0 or instr(lower(${user.name}), ${term}) > 0)` : undefined
		))
		.orderBy(asc(user.username))
		.limit(10)
	return { users: rows }
})
