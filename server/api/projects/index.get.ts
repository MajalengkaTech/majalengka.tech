import { desc, eq, inArray } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
	const query = getQuery(event)
	const isMine = query.mine === 'true' || query.mine === '1'

	if (isMine) {
		const session = await getUserSession(event)
		if (!session?.user?.id) {
			throw createError({
				statusCode: 401,
				statusMessage: 'Unauthorized'
			})
		}

		const myProjects = await db.query.projects.findMany({
			where: eq(schema.projects.userId, session.user.id),
			orderBy: [desc(schema.projects.createdAt)]
		})

		const projectIds = myProjects.map(p => p.id)
		const allReviews = projectIds.length > 0
			? await db
					.select({
						projectId: schema.projectReviews.projectId,
						rating: schema.projectReviews.rating
					})
					.from(schema.projectReviews)
					.where(inArray(schema.projectReviews.projectId, projectIds))
			: []

		const statsMap = new Map<number, { sum: number, count: number }>()
		for (const rev of allReviews) {
			const curr = statsMap.get(rev.projectId) || { sum: 0, count: 0 }
			curr.sum += rev.rating
			curr.count += 1
			statsMap.set(rev.projectId, curr)
		}

		const enriched = myProjects.map((p) => {
			const stats = statsMap.get(p.id)
			const averageRating = stats && stats.count > 0
				? Number((stats.sum / stats.count).toFixed(1))
				: 0
			const reviewCount = stats ? stats.count : 0

			return {
				...p,
				averageRating,
				reviewCount
			}
		})

		return {
			projects: enriched
		}
	}

	const session = await getUserSession(event).catch(() => null)
	const currentUserId = session?.user?.id

	// Public showcase projects
	const allProjects = await db.query.projects.findMany({
		where: eq(schema.projects.isPublished, true),
		orderBy: [desc(schema.projects.createdAt)]
	})

	// Enrich with author info
	const userIds = [...new Set(allProjects.map(p => p.userId))]
	const authors = userIds.length > 0
		? await db.query.user.findMany({
				where: (user, { inArray: inArr }) => inArr(user.id, userIds)
			})
		: []

	const authorMap = new Map(authors.map(u => [u.id, {
		id: u.id,
		name: u.name,
		avatarUrl: u.image,
		githubUsername: null
	}]))

	// Fetch review statistics
	const projectIds = allProjects.map(p => p.id)
	const allReviews = projectIds.length > 0
		? await db
				.select({
					projectId: schema.projectReviews.projectId,
					rating: schema.projectReviews.rating,
					userId: schema.projectReviews.userId
				})
				.from(schema.projectReviews)
				.where(inArray(schema.projectReviews.projectId, projectIds))
		: []

	const statsMap = new Map<number, { sum: number, count: number }>()
	const userRatingsMap = new Map<number, number>()
	for (const rev of allReviews) {
		const curr = statsMap.get(rev.projectId) || { sum: 0, count: 0 }
		curr.sum += rev.rating
		curr.count += 1
		statsMap.set(rev.projectId, curr)
		if (currentUserId && rev.userId === currentUserId) {
			userRatingsMap.set(rev.projectId, rev.rating)
		}
	}

	const enriched = allProjects.map((p) => {
		const stats = statsMap.get(p.id)
		const averageRating = stats && stats.count > 0
			? Number((stats.sum / stats.count).toFixed(1))
			: 0
		const reviewCount = stats ? stats.count : 0
		const currentUserRating = userRatingsMap.get(p.id) || null

		return {
			...p,
			averageRating,
			reviewCount,
			currentUserRating,
			author: authorMap.get(p.userId) || {
				id: p.userId,
				name: 'Komunitas Majalengka',
				avatarUrl: null,
				githubUsername: null
			}
		}
	})

	return {
		projects: enriched
	}
})
