import { desc, eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { parseProjectId, requirePublishedProject } from '../../../../utils/project-access'

export default defineEventHandler(async (event) => {
	const projectId = parseProjectId(event)
	await requirePublishedProject(projectId)

	const rows = await db
		.select({
			id: schema.projectComments.id,
			body: schema.projectComments.body,
			createdAt: schema.projectComments.createdAt,
			updatedAt: schema.projectComments.updatedAt,
			authorId: schema.user.id,
			authorName: schema.user.name,
			authorUsername: schema.user.username,
			authorImage: schema.user.image
		})
		.from(schema.projectComments)
		.leftJoin(schema.user, eq(schema.projectComments.userId, schema.user.id))
		.where(eq(schema.projectComments.projectId, projectId))
		.orderBy(desc(schema.projectComments.createdAt))
		.limit(200)

	return {
		comments: rows.map(row => ({
			id: row.id,
			body: row.body,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
			author: {
				id: row.authorId,
				name: row.authorName || 'Kreator Majalengka',
				username: row.authorUsername,
				avatarUrl: row.authorImage
			}
		}))
	}
})
