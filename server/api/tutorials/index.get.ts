import { z } from 'zod'
import { and, desc, eq, sql } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { defineEventHandler } from 'nuxt/server'

const querySchema = z.object({
	teknologi: z.string().trim().min(1).max(40).optional(),
	level: z.enum(['pemula', 'menengah', 'lanjut']).optional(),
	proyek: z.coerce.number().int().positive().optional(),
	penulis: z.string().trim().min(1).max(40).optional(),
	limit: z.coerce.number().int().min(1).max(60).default(24)
})

// Hanya tutorial berstatus terbit dari akun yang tidak ditangguhkan.
export default defineEventHandler(async (event) => {
	const query = await getQueryWith(event, querySchema)
	const { tutorials, user, projects } = schema
	const rows = await db
		.select({
			id: tutorials.id,
			slug: tutorials.slug,
			title: tutorials.title,
			summary: tutorials.summary,
			level: tutorials.level,
			tags: tutorials.tags,
			body: tutorials.body,
			publishedAt: tutorials.publishedAt,
			authorName: user.name,
			authorUsername: user.username,
			authorImage: user.image,
			projectTitle: projects.title,
			projectSlug: projects.slug
		})
		.from(tutorials)
		.innerJoin(user, eq(tutorials.userId, user.id))
		.leftJoin(projects, and(eq(tutorials.projectId, projects.id), eq(projects.isPublished, true)))
		.where(and(
			eq(tutorials.status, 'terbit'),
			sql`coalesce(${user.banned}, 0) = 0`,
			query.level ? eq(tutorials.level, query.level) : undefined,
			query.proyek ? eq(tutorials.projectId, query.proyek) : undefined,
			query.penulis ? sql`lower(${user.username}) = ${query.penulis.toLowerCase()}` : undefined,
			// instr supaya % dan _ dari pengguna tidak dibaca sebagai wildcard LIKE.
			query.teknologi ? sql`instr(lower(coalesce(${tutorials.tags}, '')), ${query.teknologi.toLowerCase()}) > 0` : undefined
		))
		.orderBy(desc(tutorials.publishedAt))
		.limit(query.limit)

	return {
		tutorials: rows.map(({ body, authorName, authorUsername, authorImage, projectTitle, projectSlug, ...row }) => ({
			...row,
			readingMinutes: tutorialReadingMinutes(body),
			author: { name: authorUsername ? `@${authorUsername}` : (authorName || 'Kreator'), username: authorUsername, avatarUrl: authorImage },
			project: projectSlug ? { title: projectTitle, slug: projectSlug } : null
		}))
	}
})
