import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { defineEventHandler } from 'nuxt/server'
import { logTarget } from '../../../utils/activity-log'
import { requireTutorialReviewer } from '../../../utils/tutorials'
import { parseTutorialId } from '../../../utils/tutorial-write'

export default defineEventHandler(async (event) => {
	const { userId } = await requireTutorialReviewer(event)
	const id = parseTutorialId(event)
	const body = await readBodyWith(event, tutorialReviewSchema)
	const [row] = await db.select({ userId: schema.tutorials.userId, status: schema.tutorials.status, publishedAt: schema.tutorials.publishedAt })
		.from(schema.tutorials).where(eq(schema.tutorials.id, id)).limit(1)

	if (!row) {
		throw createError({ status: 404, statusText: 'Tutorial ini sudah tidak ada. Muat ulang daftar tinjauan.' })
	}
	if (row.userId === userId) {
		throw createError({ status: 403, statusText: 'Tutorialmu sendiri ditinjau peninjau lain.' })
	}
	if (row.status !== 'ditinjau') {
		throw createError({ status: 409, statusText: 'Tutorial ini sudah ditinjau atau ditarik penulisnya. Muat ulang daftar tinjauan.' })
	}
	logTarget(event, { tutorialId: id, action: body.action })

	const now = new Date()
	const approve = body.action === 'setujui'
	await db.batch([
		db.update(schema.tutorials).set({
			status: approve ? 'terbit' : 'ditolak',
			reviewNote: approve ? (body.note || null) : body.note,
			reviewedBy: userId,
			reviewedAt: now,
			publishedAt: approve ? (row.publishedAt ?? now) : row.publishedAt
		}).where(eq(schema.tutorials.id, id)),
		db.insert(schema.notifications).values({
			userId: row.userId,
			actorId: userId,
			type: approve ? 'tutorial_terbit' : 'tutorial_ditolak',
			tutorialId: id,
			createdAt: now
		})
	])
	return { success: true, message: approve ? 'Tutorial diterbitkan.' : 'Tutorial dikembalikan ke penulis dengan catatanmu.' }
})
