import { z } from 'zod'
import { desc, eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { defineEventHandler } from 'nuxt/server'
import { requireTutorialReviewer } from '../../../utils/tutorials'

const querySchema = z.object({
	status: z.enum(['ditinjau', 'terbit', 'ditolak']).default('ditinjau')
})

export default defineEventHandler(async (event) => {
	const { userId } = await requireTutorialReviewer(event)
	const query = await getQueryWith(event, querySchema)
	const { tutorials, user, projects } = schema
	const rows = await db
		.select({
			id: tutorials.id,
			userId: tutorials.userId,
			slug: tutorials.slug,
			title: tutorials.title,
			summary: tutorials.summary,
			level: tutorials.level,
			tags: tutorials.tags,
			status: tutorials.status,
			reviewNote: tutorials.reviewNote,
			updatedAt: tutorials.updatedAt,
			publishedAt: tutorials.publishedAt,
			authorName: user.name,
			authorUsername: user.username,
			projectTitle: projects.title
		})
		.from(tutorials)
		.innerJoin(user, eq(tutorials.userId, user.id))
		.leftJoin(projects, eq(tutorials.projectId, projects.id))
		.where(eq(tutorials.status, query.status))
		.orderBy(desc(tutorials.updatedAt))
		.limit(100)

	return {
		tutorials: rows.map(({ userId: authorId, ...row }) => ({ ...row, isOwn: authorId === userId }))
	}
})
