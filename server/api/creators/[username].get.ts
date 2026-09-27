import { and, desc, eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { projectListColumns, toProjectItem } from '../../utils/project-listing'

export default defineEventHandler(async (event) => {
	const username = getRouterParam(event, 'username')?.trim().toLowerCase().replace(/^@/, '')
	if (!username) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Username tidak valid'
		})
	}

	const [creator] = await db
		.select({
			id: schema.user.id,
			name: schema.user.name,
			username: schema.user.username,
			avatarUrl: schema.user.image,
			bio: schema.user.bio,
			creatorRole: schema.user.creatorRole,
			location: schema.user.location,
			skills: schema.user.skills,
			openToWork: schema.user.openToWork,
			githubUsername: schema.user.githubUsername,
			websiteUrl: schema.user.websiteUrl,
			designUrl: schema.user.designUrl,
			linkedinUrl: schema.user.linkedinUrl,
			banned: schema.user.banned,
			createdAt: schema.user.createdAt
		})
		.from(schema.user)
		.where(eq(schema.user.username, username))
		.limit(1)

	if (!creator || creator.banned) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Kreator tidak ditemukan'
		})
	}

	const session = await getUserSession(event).catch(() => null)
	const rows = await db
		.select(projectListColumns(session?.user?.id ? String(session.user.id) : null))
		.from(schema.projects)
		.leftJoin(schema.user, eq(schema.projects.userId, schema.user.id))
		.where(and(eq(schema.projects.userId, creator.id), eq(schema.projects.isPublished, true)))
		.orderBy(desc(schema.projects.isFeatured), desc(schema.projects.createdAt))

	const projects = rows.map(toProjectItem)
	const { banned: _banned, ...profile } = creator

	return {
		creator: {
			...profile,
			projectCount: projects.length,
			likeCount: projects.reduce((total, project) => total + project.likeCount, 0)
		},
		projects
	}
})
