import { desc, eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { defineEventHandler } from 'nuxt/server'
import { requireAdminSession } from '../../../utils/admin'

export default defineEventHandler(async (event) => {
	await requireAdminSession(event)
	const rows = await db
		.select({
			userId: schema.tutorialReviewers.userId,
			createdAt: schema.tutorialReviewers.createdAt,
			name: schema.user.name,
			username: schema.user.username,
			image: schema.user.image
		})
		.from(schema.tutorialReviewers)
		.innerJoin(schema.user, eq(schema.tutorialReviewers.userId, schema.user.id))
		.orderBy(desc(schema.tutorialReviewers.createdAt))
	return { reviewers: rows }
})
