import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

const reviewSchema = z.object({
	rating: z.number().int().min(1, 'Rating minimal 1 bintang').max(5, 'Rating maksimal 5 bintang'),
	comment: z.string().max(1000, 'Ulasan maksimal 1000 karakter').optional().nullable()
})

export default defineEventHandler(async (event) => {
	const session = await getUserSession(event)
	if (!session?.user?.id) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Silakan login terlebih dahulu untuk memberikan ulasan'
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

	const body = await readValidatedBody(event, reviewSchema.parse)
	const now = new Date()
	const trimmedComment = body.comment?.trim() ? body.comment.trim() : null

	// Check existing review by this user on this project
	const [existingReview] = await db
		.select()
		.from(schema.projectReviews)
		.where(
			and(
				eq(schema.projectReviews.projectId, projectId),
				eq(schema.projectReviews.userId, session.user.id)
			)
		)

	let review
	let isUpdate = false

	if (existingReview) {
		isUpdate = true
		const [updated] = await db
			.update(schema.projectReviews)
			.set({
				rating: body.rating,
				comment: trimmedComment,
				updatedAt: now
			})
			.where(eq(schema.projectReviews.id, existingReview.id))
			.returning()
		review = updated
	} else {
		const [created] = await db
			.insert(schema.projectReviews)
			.values({
				projectId,
				userId: session.user.id,
				rating: body.rating,
				comment: trimmedComment,
				createdAt: now,
				updatedAt: now
			})
			.returning()
		review = created
	}

	return {
		success: true,
		isUpdate,
		message: isUpdate ? 'Ulasan Anda berhasil diperbarui' : 'Terima kasih, ulasan Anda berhasil dikirim',
		review
	}
})
