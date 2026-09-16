import { desc } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { requireAdminSession } from '../../utils/admin'

export default defineEventHandler(async (event) => {
	await requireAdminSession(event)

	const users = await db
		.select({
			id: schema.user.id,
			name: schema.user.name,
			email: schema.user.email,
			emailVerified: schema.user.emailVerified,
			image: schema.user.image,
			role: schema.user.role,
			banned: schema.user.banned,
			banReason: schema.user.banReason,
			bio: schema.user.bio,
			githubUsername: schema.user.githubUsername,
			websiteUrl: schema.user.websiteUrl,
			createdAt: schema.user.createdAt,
			updatedAt: schema.user.updatedAt
		})
		.from(schema.user)
		.orderBy(desc(schema.user.createdAt))

	// Get all projects to count projects per user
	const allProjects = await db
		.select({
			id: schema.projects.id,
			userId: schema.projects.userId
		})
		.from(schema.projects)

	const projectCountMap: Record<string, number> = {}
	for (const p of allProjects) {
		projectCountMap[p.userId] = (projectCountMap[p.userId] || 0) + 1
	}

	const formattedUsers = users.map(u => ({
		...u,
		projectCount: projectCountMap[u.id] || 0
	}))

	return {
		users: formattedUsers
	}
})
