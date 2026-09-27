import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { isAdmin } from '../../utils/admin'
import { assertThumbnailAllowed, deleteOwnedBlob } from '../../utils/project-blob'

export default defineEventHandler(async (event) => {
	const session = await getUserSession(event)
	if (!session?.user?.id) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Silakan masuk terlebih dahulu'
		})
	}

	const id = Number(getRouterParam(event, 'id'))
	if (!Number.isInteger(id) || id <= 0) {
		throw createError({
			statusCode: 400,
			statusMessage: 'ID projek tidak valid'
		})
	}

	const project = await db.query.projects.findFirst({
		where: eq(schema.projects.id, id)
	})

	if (!project) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Projek tidak ditemukan'
		})
	}

	if (project.userId !== session.user.id && !isAdmin(session.user)) {
		throw createError({
			statusCode: 403,
			statusMessage: 'Kamu tidak punya akses untuk mengedit projek ini'
		})
	}

	const body = await readValidatedBody(event, projectInputSchema.parse)
	const newThumbnailUrl = body.thumbnailUrl?.trim() || null
	assertThumbnailAllowed(newThumbnailUrl, project.userId, project.thumbnailUrl)

	const [updated] = await db.update(schema.projects).set({
		title: body.title.trim(),
		description: body.description.trim(),
		thumbnailUrl: newThumbnailUrl,
		repoUrl: body.repoUrl?.trim() || null,
		demoUrl: body.demoUrl?.trim() || null,
		tags: body.tags?.trim() || null,
		isPublished: body.isPublished,
		updatedAt: new Date()
	}).where(eq(schema.projects.id, id)).returning()

	if (project.thumbnailUrl && project.thumbnailUrl !== newThumbnailUrl) {
		await deleteOwnedBlob(project.thumbnailUrl, project.userId)
	}

	return {
		success: true,
		project: updated
	}
})
