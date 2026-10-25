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
			projectSlug: schema.projects.slug
		})
			.from(schema.notifications)
			.leftJoin(actor, eq(schema.notifications.actorId, actor.id))
			.leftJoin(schema.projects, eq(schema.notifications.projectId, schema.projects.id))
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
			type: row.type as 'like' | 'comment',
			unread: !row.readAt,
			createdAt: row.createdAt,
			actor: {
				name: row.actorUsername ? `@${row.actorUsername}` : (row.actorName || 'Seseorang'),
				avatarUrl: row.actorImage
			},
			project: row.projectSlug ? { title: row.projectTitle, slug: row.projectSlug } : null,
			commentId: row.commentId
		}))
	}
})
