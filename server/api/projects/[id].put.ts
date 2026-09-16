import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

const updateProjectSchema = z.object({
	title: z.string().min(3, 'Judul minimal 3 karakter').max(120, 'Judul maksimal 120 karakter'),
	description: z.string().min(10, 'Deskripsi minimal 10 karakter').max(2000, 'Deskripsi maksimal 2000 karakter'),
	thumbnailUrl: z.string().refine(
		val => !val || val.startsWith('/') || /^https?:\/\//i.test(val),
		{ message: 'URL thumbnail tidak valid' }
	).optional().nullable(),
	repoUrl: z.string().url('URL repositori tidak valid').or(z.literal('')).optional().nullable(),
	demoUrl: z.string().url('URL demo tidak valid').or(z.literal('')).optional().nullable(),
	tags: z.string().max(200, 'Tag maksimal 200 karakter').optional().nullable(),
	isPublished: z.boolean().default(true)
})

export default defineEventHandler(async (event) => {
	const session = await getUserSession(event)
	if (!session?.user?.id) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Unauthorized'
		})
	}

	const id = getRouterParam(event, 'id')
	if (!id) {
		throw createError({
			statusCode: 400,
			statusMessage: 'ID projek tidak valid'
		})
	}

	const project = await db.query.projects.findFirst({
		where: eq(schema.projects.id, Number(id))
	})

	if (!project) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Projek tidak ditemukan'
		})
	}

	// Verify ownership
	if (project.userId !== Number(session.user.id)) {
		throw createError({
			statusCode: 403,
			statusMessage: 'Anda tidak memiliki hak akses untuk mengedit projek ini'
		})
	}

	const body = await readValidatedBody(event, updateProjectSchema.parse)
	const now = new Date()

	const [updated] = await db.update(schema.projects).set({
		title: body.title.trim(),
		description: body.description.trim(),
		thumbnailUrl: body.thumbnailUrl?.trim() || null,
		repoUrl: body.repoUrl?.trim() || null,
		demoUrl: body.demoUrl?.trim() || null,
		tags: body.tags?.trim() || null,
		isPublished: body.isPublished,
		updatedAt: now
	}).where(eq(schema.projects.id, Number(id))).returning()

	return {
		success: true,
		project: updated
	}
})
