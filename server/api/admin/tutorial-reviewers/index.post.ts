import { z } from 'zod'
import { sql } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { defineEventHandler } from 'nuxt/server'
import { requireAdminSession } from '../../../utils/admin'
import { logTarget } from '../../../utils/activity-log'

const bodySchema = z.object({
	username: z.string().trim().min(1, 'Isi username kreator').max(40).transform(value => value.replace(/^@/, '').toLowerCase())
})

export default defineEventHandler(async (event) => {
	const session = await requireAdminSession(event)
	const body = await readBodyWith(event, bodySchema)
	const [target] = await db.select({ id: schema.user.id, name: schema.user.name })
		.from(schema.user).where(sql`lower(${schema.user.username}) = ${body.username}`).limit(1)
	if (!target) {
		throw createError({ status: 404, statusText: `Kreator @${body.username} tidak ditemukan. Periksa lagi username-nya.` })
	}
	logTarget(event, { reviewerId: target.id, username: body.username })
	await db.insert(schema.tutorialReviewers)
		.values({ userId: target.id, addedBy: String(session.user.id), createdAt: new Date() })
		.onConflictDoNothing()
	return { success: true, message: `@${body.username} sekarang bisa meninjau tutorial.` }
})
