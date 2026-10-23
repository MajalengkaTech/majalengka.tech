import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { generateCreatorCardPng } from '../../../../utils/creator-card'
import { getCreatorStats } from '../../../../utils/creator-stats'

export default defineEventHandler(async (event) => {
	const rawUsername = getRouterParam(event, 'username', { decode: true })?.trim().toLowerCase().replace(/^@/, '')
	if (!rawUsername) {
		throw createError({ statusCode: 400, statusMessage: 'Username tidak valid' })
	}

	const [creator] = await db
		.select({
			id: schema.user.id,
			name: schema.user.name,
			username: schema.user.username,
			avatarUrl: schema.user.image,
			role: schema.user.creatorRole,
			banned: schema.user.banned
		})
		.from(schema.user)
		.where(eq(schema.user.username, rawUsername))
		.limit(1)

	if (!creator || creator.banned) {
		throw createError({ statusCode: 404, statusMessage: 'Kreator tidak ditemukan' })
	}

	const stats = await getCreatorStats(creator.id)
	const pngBuffer = await generateCreatorCardPng({
		name: creator.name || creator.username || rawUsername,
		username: creator.username || rawUsername,
		avatarUrl: creator.avatarUrl,
		role: creator.role,
		projectCount: stats.projectCount,
		likeCount: stats.likeCount,
		rank: stats.rank,
		totalCreators: stats.totalCreators
	})

	setResponseHeaders(event, {
		'Content-Type': 'image/png',
		'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
		'Content-Length': String(pngBuffer.length)
	})

	return pngBuffer
})
