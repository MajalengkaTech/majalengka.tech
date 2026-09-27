import { asc, eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { isAdmin } from '../../../utils/admin'
import { projectListColumns, toProjectItem } from '../../../utils/project-listing'

export default defineEventHandler(async (event) => {
	const slug = getRouterParam(event, 'slug')?.trim().toLowerCase()
	if (!slug) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Alamat karya tidak valid'
		})
	}

	const session = await getUserSession(event).catch(() => null)
	const currentUserId = session?.user?.id ? String(session.user.id) : null

	const [row] = await db
		.select(projectListColumns(currentUserId))
		.from(schema.projects)
		.leftJoin(schema.user, eq(schema.projects.userId, schema.user.id))
		.where(eq(schema.projects.slug, slug))
		.limit(1)

	const canSeeDraft = !!row && !!session?.user && (currentUserId === row.project.userId || isAdmin(session.user))
	if (!row || (!row.project.isPublished && !canSeeDraft)) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Karya tidak ditemukan'
		})
	}

	const [images, authorProfile] = await Promise.all([
		db.select({
			id: schema.projectImages.id,
			url: schema.projectImages.url,
			alt: schema.projectImages.alt
		})
			.from(schema.projectImages)
			.where(eq(schema.projectImages.projectId, row.project.id))
			.orderBy(asc(schema.projectImages.sortOrder), asc(schema.projectImages.id)),
		db.select({
			bio: schema.user.bio,
			location: schema.user.location,
			openToWork: schema.user.openToWork,
			websiteUrl: schema.user.websiteUrl,
			designUrl: schema.user.designUrl,
			linkedinUrl: schema.user.linkedinUrl
		})
			.from(schema.user)
			.where(eq(schema.user.id, row.project.userId))
			.limit(1)
	])

	const item = toProjectItem(row)
	return {
		project: {
			...item,
			author: { ...item.author, ...(authorProfile[0] || {}) },
			images,
			isOwner: currentUserId === row.project.userId
		}
	}
})
