import { z } from 'zod'
import { db, schema } from 'hub:db'
import { defineEventHandler } from 'nuxt/server'
import { requireSignedIn } from '../../utils/project-access'
import { uniqueTutorialSlug } from '../../utils/tutorials'
import { assertOwnProject, cleanTags } from '../../utils/tutorial-write'

const bodySchema = tutorialInputSchema.extend({ kirim: z.boolean().optional() })

export default defineEventHandler(async (event) => {
	const session = await requireSignedIn(event, 'Masuk dulu untuk menulis tutorial.')
	const userId = String(session.user.id)
	if (!(session.user as { username?: string | null }).username) {
		throw createError({ status: 400, statusText: 'Pilih username dulu di Edit Profil, supaya tutorialmu punya nama penulis.' })
	}
	const body = await readBodyWith(event, bodySchema)
	const projectId = await assertOwnProject(body.projectId, userId)
	const now = new Date()
	const [created] = await db.insert(schema.tutorials).values({
		userId,
		projectId,
		title: body.title,
		slug: await uniqueTutorialSlug(body.title),
		summary: body.summary || null,
		body: body.body,
		level: body.level,
		tags: cleanTags(body.tags),
		status: body.kirim ? 'ditinjau' : 'draf',
		createdAt: now,
		updatedAt: now
	}).returning({ id: schema.tutorials.id, slug: schema.tutorials.slug, status: schema.tutorials.status })
	return { success: true, tutorial: created }
})
