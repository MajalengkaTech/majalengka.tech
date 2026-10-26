import { alias } from 'drizzle-orm/sqlite-core'
import { and, count, desc, eq, isNull } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { defineEventHandler } from 'nuxt/server'
import { requireSignedIn } from '../../utils/project-access'

const LIMIT = 30

export default defineEventHandler(async (event) => {
	const session = await requireSignedIn(event)
	const userId = String(session.user.id)
	const actor = alias(schema.user, 'actor')

	const [rows, [unread]] = await Promise.all([
		db.select({
			id: schema.notifications.id,
			type: schema.notifications.type,
			readAt: schema.notifications.readAt,
			createdAt: schema.notifications.createdAt,
			commentId: schema.notifications.commentId,
			actorName: actor.name,
			actorUsername: actor.username,
			actorImage: actor.image,
			projectTitle: schema.projects.title,
			projectSlug: schema.projects.slug,
			tutorialTitle: schema.tutorials.title,
			tutorialSlug: schema.tutorials.slug,
			tutorialId: schema.tutorials.id
		})
			.from(schema.notifications)
			.leftJoin(actor, eq(schema.notifications.actorId, actor.id))
			.leftJoin(schema.projects, eq(schema.notifications.projectId, schema.projects.id))
			.leftJoin(schema.tutorials, eq(schema.notifications.tutorialId, schema.tutorials.id))
			.where(eq(schema.notifications.userId, userId))
			.orderBy(desc(schema.notifications.createdAt))
			.limit(LIMIT),
		db.select({ total: count() })
			.from(schema.notifications)
			.where(and(eq(schema.notifications.userId, userId), isNull(schema.notifications.readAt)))
	])

	return {
		unread: unread?.total ?? 0,
		notifications: rows.map(row => ({
			id: row.id,
			type: row.type as 'like' | 'comment' | 'tutorial_terbit' | 'tutorial_ditolak',
			unread: !row.readAt,
			createdAt: row.createdAt,
			actor: {
				name: row.actorUsername ? `@${row.actorUsername}` : (row.actorName || 'Seseorang'),
				avatarUrl: row.actorImage
			},
			project: row.projectSlug ? { title: row.projectTitle, slug: row.projectSlug } : null,
			commentId: row.commentId,
			tutorial: row.tutorialId ? { id: row.tutorialId, title: row.tutorialTitle, slug: row.tutorialSlug } : null
		}))
	}
})
