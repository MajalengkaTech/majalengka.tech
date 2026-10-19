import { z } from 'zod'
import { and, count, eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { defineEventHandler } from 'nuxt/server'
import { parseProjectId, requirePublishedProject, requireSignedIn } from '../../../utils/project-access'

const bodySchema = z.object({
	liked: z.boolean().optional()
}).nullish()

// Klien mengirim status yang diinginkan ({ liked }) supaya klik beruntun aman diulang; tanpa body tetap toggle seperti dulu.
export default defineEventHandler(async (event) => {
	const session = await requireSignedIn(event, 'Masuk dulu untuk memberi apresiasi')
	const projectId = parseProjectId(event)
	const body = await readBodyWith(event, bodySchema)
	const project = await requirePublishedProject(projectId)
	const userId = String(session.user.id)

	if (project.userId === userId) {
		throw createError({
			status: 403,
			statusText: 'Kamu tidak bisa mengapresiasi proyekmu sendiri'
		})
	}

	const likeWhere = and(
		eq(schema.projectLikes.projectId, projectId),
		eq(schema.projectLikes.userId, userId)
	)

	let liked = body?.liked
	if (liked === undefined) {
		const [existing] = await db.select().from(schema.projectLikes).where(likeWhere).limit(1)
		liked = !existing
	}

	// Tulis dan hitung ulang dalam satu batch: satu perjalanan ke D1, bukan dua.
	const write = liked
		? db.insert(schema.projectLikes).values({ projectId, userId, createdAt: new Date() }).onConflictDoNothing()
		: db.delete(schema.projectLikes).where(likeWhere)
	const [, likeRows] = await db.batch([
		write,
		db.select({ total: count() }).from(schema.projectLikes).where(eq(schema.projectLikes.projectId, projectId))
	])

	return {
		liked,
		likeCount: likeRows[0]?.total ?? 0
	}
})
