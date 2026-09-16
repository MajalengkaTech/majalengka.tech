import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

const createProjectSchema = z.object({
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

function slugify(text: string): string {
	return text
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, '')
		.replace(/[\s_-]+/g, '-')
		.replace(/^-+|-+$/g, '')
}

export default defineEventHandler(async (event) => {
	const session = await getUserSession(event)
	if (!session?.user?.id) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Unauthorized'
		})
	}

	const body = await readValidatedBody(event, createProjectSchema.parse)
	const now = new Date()

	let baseSlug = slugify(body.title)
	if (!baseSlug) {
		baseSlug = `project-${Date.now()}`
	}

	// Ensure unique slug
	let slug = baseSlug
	const existing = await db.query.projects.findFirst({
		where: eq(schema.projects.slug, slug)
	})
	if (existing) {
		slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`
	}

	const [newProject] = await db.insert(schema.projects).values({
		userId: Number(session.user.id),
		title: body.title.trim(),
		slug,
		description: body.description.trim(),
		thumbnailUrl: body.thumbnailUrl?.trim() || null,
		repoUrl: body.repoUrl?.trim() || null,
		demoUrl: body.demoUrl?.trim() || null,
		tags: body.tags?.trim() || null,
		isPublished: body.isPublished,
		createdAt: now,
		updatedAt: now
	}).returning()

	return {
		success: true,
		project: newProject
	}
})
