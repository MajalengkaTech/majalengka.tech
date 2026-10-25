import { asc, eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { defineEventHandler, getRouterParam } from 'nuxt/server'
import { isAdmin } from '../../../utils/admin'
import { projectListColumns, toProjectItem } from '../../../utils/project-listing'
import { parseSocialLinks } from '../../../utils/profile'

export default defineEventHandler(async (event) => {
	const slug = getRouterParam(event, 'slug', { decode: true })?.trim().toLowerCase()
	if (!slug) {
		throw createError({
			status: 400,
			statusText: 'Alamat proyek tidak valid. Buka lagi proyeknya dari showcase.'
		})
	}

	const session = await getAuthSession(event).catch(() => null)

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
			status: 404,
			statusText: 'Proyek ini tidak ditemukan. Mungkin sudah dihapus pemiliknya.'
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
			linkedinUrl: schema.user.linkedinUrl,
			socialLinks: schema.user.socialLinks
		})
			.from(schema.user)
			.where(eq(schema.user.id, row.project.userId))
			.limit(1)
	])

	const item = toProjectItem(row)
	const authorData = authorProfile[0]
	return {
		project: {
			...item,
			author: {
				...item.author,
				...(authorData || {}),
				socialLinks: parseSocialLinks(authorData?.socialLinks)
			},
			images,
			isOwner: currentUserId === row.project.userId,
			// Hanya untuk tampilan tombol; endpoint ubah dan hapus tetap memeriksa sendiri.
			canManage: currentUserId === row.project.userId || isAdmin(session?.user)
		}
	}
})
