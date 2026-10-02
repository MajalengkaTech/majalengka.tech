import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { assertThumbnailAllowed } from '../../utils/project-blob'

function slugify(text: string): string {
	return text
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, '')
		.replace(/[\s_-]+/g, '-')
		.replace(/^-+|-+$/g, '')
}

async function findUniqueSlug(title: string) {
	const baseSlug = slugify(title) || 'projek'
	let slug = baseSlug
	for (let attempt = 0; attempt < 5; attempt++) {
		const existing = await db.query.projects.findFirst({
			where: eq(schema.projects.slug, slug)
		})
		if (!existing) return slug
		slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`
	}
	return `${baseSlug}-${Date.now().toString(36)}`
}

export default defineEventHandler(async (event) => {
	const session = await getUserSession(event)
	if (!session?.user?.id) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Silakan masuk terlebih dahulu untuk menambah projek'
		})
	}

	const body = await readBodyWith(event, projectInputSchema)
	const thumbnailUrl = body.thumbnailUrl?.trim() || null
	assertThumbnailAllowed(thumbnailUrl, session.user.id)

	const now = new Date()
	const [newProject] = await db.insert(schema.projects).values({
		userId: session.user.id,
		title: body.title.trim(),
		slug: await findUniqueSlug(body.title),
		tagline: body.tagline?.trim() || null,
		description: body.description.trim(),
		category: body.category ?? 'lainnya',
		contribution: body.contribution?.trim() || null,
		thumbnailUrl,
		repoUrl: body.repoUrl?.trim() || null,
		demoUrl: body.demoUrl?.trim() || null,
		designUrl: body.designUrl?.trim() || null,
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
