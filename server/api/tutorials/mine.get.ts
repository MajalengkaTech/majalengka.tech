import { desc, eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { defineEventHandler } from 'nuxt/server'
import { requireSignedIn } from '../../utils/project-access'

export default defineEventHandler(async (event) => {
	const session = await requireSignedIn(event)
	const { tutorials, projects } = schema
	const rows = await db
		.select({
			id: tutorials.id,
			slug: tutorials.slug,
			title: tutorials.title,
			summary: tutorials.summary,
			level: tutorials.level,
			status: tutorials.status,
			reviewNote: tutorials.reviewNote,
			publishedAt: tutorials.publishedAt,
			updatedAt: tutorials.updatedAt,
			createdAt: tutorials.createdAt,
			projectTitle: projects.title
		})
		.from(tutorials)
		.leftJoin(projects, eq(tutorials.projectId, projects.id))
		.where(eq(tutorials.userId, String(session.user.id)))
		.orderBy(desc(tutorials.createdAt))
	return { tutorials: rows }
})
