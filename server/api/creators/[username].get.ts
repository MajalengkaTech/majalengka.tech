import { and, desc, eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { defineEventHandler, getRouterParam } from 'nuxt/server'
import { projectListColumns, toProjectItem } from '../../utils/project-listing'
import { getCreatorStats } from '../../utils/creator-stats'
import { parseSocialLinks } from '../../utils/profile'

export default defineEventHandler(async (event) => {
	const username = getRouterParam(event, 'username', { decode: true })?.trim().toLowerCase().replace(/^@/, '')
	if (!username) {
		throw createError({
			status: 400,
			statusText: 'Username tidak valid'
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
			socialLinks: schema.user.socialLinks,
			banned: schema.user.banned,
			createdAt: schema.user.createdAt
		})
		.from(schema.user)
		.where(eq(schema.user.username, username))
		.limit(1)

	if (!creator || creator.banned) {
		throw createError({
			status: 404,
			statusText: 'Kreator tidak ditemukan'
		})
	}

	const session = await getAuthSession(event).catch(() => null)

	const rows = await db
		.select(projectListColumns(session?.user?.id ? String(session.user.id) : null))
		.from(schema.projects)
		.leftJoin(schema.user, eq(schema.projects.userId, schema.user.id))
		.where(and(eq(schema.projects.userId, creator.id), eq(schema.projects.isPublished, true)))
		.orderBy(desc(schema.projects.isFeatured), desc(schema.projects.createdAt))

	const projects = rows.map(toProjectItem)
	const { banned: _banned, ...profile } = creator
	const stats = await getCreatorStats(creator.id)

	return {
		creator: {
			...profile,
			name: profile.username ? `@${profile.username}` : (profile.name || 'Kreator Majalengka'),
			socialLinks: parseSocialLinks(profile.socialLinks),
			...stats
		},
		card: {
			url: `/api/creators/${creator.username}/card.png`,
			svgUrl: `/api/creators/${creator.username}/card.svg`,
			projectCount: stats.projectCount,
			likeCount: stats.likeCount,
			rank: stats.rank
		},
		projects
	}
})
