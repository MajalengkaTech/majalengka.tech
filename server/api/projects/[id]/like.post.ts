import { and, count, eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { parseProjectId, requirePublishedProject, requireSignedIn } from '../../../utils/project-access'

// Toggle apresiasi: sekali klik memberi, klik lagi menarik kembali.
export default defineEventHandler(async (event) => {
	const session = await requireSignedIn(event, 'Masuk dulu untuk memberi apresiasi')
	const projectId = parseProjectId(event)
	const project = await requirePublishedProject(projectId)
	const userId = String(session.user.id)

	if (project.userId === userId) {
		throw createError({
			statusCode: 403,
			statusMessage: 'Kamu tidak bisa mengapresiasi proyekmu sendiri'
		})
	}

	const likeWhere = and(
		eq(schema.projectLikes.projectId, projectId),
		eq(schema.projectLikes.userId, userId)
	)
	const [existing] = await db.select().from(schema.projectLikes).where(likeWhere).limit(1)

	if (existing) {
		await db.delete(schema.projectLikes).where(likeWhere)
	} else {
		await db.insert(schema.projectLikes)
			.values({ projectId, userId, createdAt: new Date() })
			.onConflictDoNothing()
	}

	const [likeRow] = await db
		.select({ total: count() })
		.from(schema.projectLikes)
		.where(eq(schema.projectLikes.projectId, projectId))

	return {
		liked: !existing,
		likeCount: likeRow?.total ?? 0
	}
})
