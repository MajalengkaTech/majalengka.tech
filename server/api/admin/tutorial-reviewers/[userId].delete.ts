import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { defineEventHandler, getRouterParam } from 'nuxt/server'
import { requireAdminSession } from '../../../utils/admin'
import { logTarget } from '../../../utils/activity-log'

export default defineEventHandler(async (event) => {
	await requireAdminSession(event)
	const userId = String(getRouterParam(event, 'userId') || '')
	logTarget(event, { reviewerId: userId })
	await db.delete(schema.tutorialReviewers).where(eq(schema.tutorialReviewers.userId, userId))
	return { success: true, message: 'Peninjau dilepas.' }
})
