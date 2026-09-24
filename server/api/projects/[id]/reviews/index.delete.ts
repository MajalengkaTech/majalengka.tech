import { and, eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { SUPER_ADMIN_EMAIL } from '~~/server/utils/admin'

export default defineEventHandler(async (event) => {
	const session = await getUserSession(event)
	if (!session?.user?.id) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Silakan login terlebih dahulu'
		})
	}

	const projectIdParam = getRouterParam(event, 'id')
	const projectId = Number(projectIdParam)

	if (!projectId || Number.isNaN(projectId)) {
		throw createError({
			statusCode: 400,
			statusMessage: 'ID projek tidak valid'
		})
	}

	const query = getQuery(event)
	const reviewId = query.reviewId ? Number(query.reviewId) : null

	const role = (session.user as { role?: string })?.role
	const email = session.user.email?.toLowerCase()
	const isAdmin = role === 'admin' || email === SUPER_ADMIN_EMAIL.toLowerCase()

	if (reviewId && isAdmin) {
		// Admin can delete specific review by reviewId
		await db
			.delete(schema.projectReviews)
			.where(
				and(
					eq(schema.projectReviews.id, reviewId),
					eq(schema.projectReviews.projectId, projectId)
				)
			)
	} else {
		// Normal user deletes their own review for this project
		await db
			.delete(schema.projectReviews)
			.where(
				and(
					eq(schema.projectReviews.projectId, projectId),
					eq(schema.projectReviews.userId, session.user.id)
				)
			)
	}

	return {
		success: true,
		message: 'Ulasan berhasil dihapus'
	}
})
