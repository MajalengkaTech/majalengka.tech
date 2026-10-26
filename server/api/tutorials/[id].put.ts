import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { defineEventHandler } from 'nuxt/server'
import { requireSignedIn } from '../../utils/project-access'
import { logTarget } from '../../utils/activity-log'
import { assertOwnProject, cleanTags, parseTutorialId } from '../../utils/tutorial-write'

const bodySchema = tutorialInputSchema.extend({ kirim: z.boolean().optional() })

// Perubahan pada tutorial yang sudah terbit masuk antrean tinjauan lagi, supaya isi yang tayang selalu sudah diperiksa.
export default defineEventHandler(async (event) => {
	const session = await requireSignedIn(event)
	const userId = String(session.user.id)
	const id = parseTutorialId(event)
	const [current] = await db.select({ userId: schema.tutorials.userId, status: schema.tutorials.status })
		.from(schema.tutorials).where(eq(schema.tutorials.id, id)).limit(1)
	if (!current || current.userId !== userId) {
		throw createError({ status: 404, statusText: 'Tutorial ini tidak ada atau bukan milikmu.' })
	}
	const body = await readBodyWith(event, bodySchema)
	const projectId = await assertOwnProject(body.projectId, userId)
	const status = body.kirim || current.status === 'terbit' || current.status === 'ditinjau' ? 'ditinjau' : current.status
	logTarget(event, { tutorialId: id, status })

	const [updated] = await db.update(schema.tutorials).set({
		projectId,
		title: body.title,
		summary: body.summary || null,
		body: body.body,
		level: body.level,
		tags: cleanTags(body.tags),
		status,
		updatedAt: new Date()
	}).where(eq(schema.tutorials.id, id)).returning({ id: schema.tutorials.id, slug: schema.tutorials.slug, status: schema.tutorials.status })
	return { success: true, tutorial: updated }
})
