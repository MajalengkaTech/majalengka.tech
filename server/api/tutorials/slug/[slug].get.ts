import { and, eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { defineEventHandler, getRouterParam } from 'nuxt/server'
import { isAdmin } from '../../../utils/admin'
import { getAuthSession } from '../../../utils/project-access'
import { isTutorialReviewer } from '../../../utils/tutorials'

// Tutorial terbit bisa dibaca siapa saja; yang belum terbit hanya oleh penulisnya, admin, dan peninjau (untuk pratinjau).
export default defineEventHandler(async (event) => {
	const slug = String(getRouterParam(event, 'slug') || '')
	const { tutorials, user, projects } = schema
	const [row] = await db
		.select({
			id: tutorials.id,
			userId: tutorials.userId,
			slug: tutorials.slug,
			title: tutorials.title,
			summary: tutorials.summary,
			body: tutorials.body,
			level: tutorials.level,
			tags: tutorials.tags,
			status: tutorials.status,
			publishedAt: tutorials.publishedAt,
			updatedAt: tutorials.updatedAt,
			createdAt: tutorials.createdAt,
			authorName: user.name,
			authorUsername: user.username,
			authorImage: user.image,
			authorBanned: user.banned,
			projectTitle: projects.title,
			projectSlug: projects.slug,
			projectTagline: projects.tagline,
			projectThumbnail: projects.thumbnailUrl
		})
		.from(tutorials)
		.innerJoin(user, eq(tutorials.userId, user.id))
		.leftJoin(projects, and(eq(tutorials.projectId, projects.id), eq(projects.isPublished, true)))
		.where(eq(tutorials.slug, slug))
		.limit(1)

	const notFound = () => createError({ status: 404, statusText: 'Tutorial ini tidak ada atau belum terbit. Cari tutorial lain di /tutorial.' })
	if (!row) throw notFound()

	if (row.status !== 'terbit' || row.authorBanned) {
		const session = await getAuthSession(event)
		const viewerId = session?.user?.id ? String(session.user.id) : null
		const allowed = viewerId && (viewerId === row.userId || isAdmin(session!.user) || await isTutorialReviewer(viewerId))
		if (!allowed) throw notFound()
	}

	const { userId: _userId, authorName, authorUsername, authorImage, authorBanned: _banned, projectTitle, projectSlug, projectTagline, projectThumbnail, ...tutorial } = row
	return {
		tutorial: {
			...tutorial,
			readingMinutes: tutorialReadingMinutes(row.body),
			author: { name: authorName || 'Kreator', username: authorUsername, avatarUrl: authorImage },
			project: projectSlug ? { title: projectTitle, slug: projectSlug, tagline: projectTagline, thumbnailUrl: projectThumbnail } : null
		}
	}
})
