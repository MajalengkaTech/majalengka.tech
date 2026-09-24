import { desc, eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import type { ProjectReviewItem, ProjectReviewSummary } from '~/types/project'

export default defineEventHandler(async (event) => {
	const projectIdParam = getRouterParam(event, 'id')
	const projectId = Number(projectIdParam)

	if (!projectId || Number.isNaN(projectId)) {
		throw createError({
			statusCode: 400,
			statusMessage: 'ID projek tidak valid'
		})
	}

	// Verify project exists
	const project = await db.query.projects.findFirst({
		where: eq(schema.projects.id, projectId)
	})

	if (!project) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Projek tidak ditemukan'
		})
	}

	// Get current user session if available (optional)
	const session = await getUserSession(event).catch(() => null)
	const currentUserId = session?.user?.id

	// Fetch all reviews for this project
	const rawReviews = await db
		.select()
		.from(schema.projectReviews)
		.where(eq(schema.projectReviews.projectId, projectId))
		.orderBy(desc(schema.projectReviews.createdAt))

	// Fetch author data for reviewers
	const reviewerUserIds = [...new Set(rawReviews.map(r => r.userId))]
	const users = reviewerUserIds.length > 0
		? await db.query.user.findMany({
				where: (user, { inArray: inArr }) => inArr(user.id, reviewerUserIds)
			})
		: []

	const userMap = new Map(users.map(u => [u.id, {
		id: u.id,
		name: u.name,
		avatarUrl: u.image,
		role: (u as { role?: string }).role || 'user'
	}]))

	const distribution: Record<number, number> = {
		1: 0,
		2: 0,
		3: 0,
		4: 0,
		5: 0
	}

	let totalScore = 0
	let userReview: ProjectReviewItem | null = null

	const formattedReviews: ProjectReviewItem[] = rawReviews.map((r) => {
		const rating = Math.min(5, Math.max(1, r.rating))
		distribution[rating] = (distribution[rating] || 0) + 1
		totalScore += rating

		const author = userMap.get(r.userId) || {
			id: r.userId,
			name: 'Pengguna Komunitas',
			avatarUrl: null,
			role: 'user'
		}

		const item: ProjectReviewItem = {
			id: r.id,
			projectId: r.projectId,
			userId: r.userId,
			rating: r.rating,
			comment: r.comment,
			createdAt: r.createdAt,
			updatedAt: r.updatedAt,
			author
		}

		if (currentUserId && r.userId === currentUserId) {
			userReview = item
		}

		return item
	})

	const totalReviews = rawReviews.length
	const averageRating = totalReviews > 0
		? Number((totalScore / totalReviews).toFixed(1))
		: 0

	const summary: ProjectReviewSummary = {
		averageRating,
		totalReviews,
		distribution
	}

	return {
		summary,
		reviews: formattedReviews,
		userReview
	}
})
