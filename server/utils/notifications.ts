import { and, eq, isNull } from 'drizzle-orm'
import { db, schema } from 'hub:db'

// Notifikasi untuk pemilik proyek. Aksi di proyek sendiri tidak memberi notifikasi.
export async function notifyProjectOwner(input: { ownerId: string, actorId: string, type: 'like' | 'comment', projectId: number, commentId?: number }) {
	if (input.ownerId === input.actorId) return
	// Apresiasi yang ditarik lalu diberi lagi tidak menumpuk notifikasi yang sama.
	if (input.type === 'like') {
		const [existing] = await db.select({ id: schema.notifications.id }).from(schema.notifications).where(and(
			eq(schema.notifications.userId, input.ownerId),
			eq(schema.notifications.actorId, input.actorId),
			eq(schema.notifications.type, 'like'),
			eq(schema.notifications.projectId, input.projectId),
			isNull(schema.notifications.readAt)
		)).limit(1)
		if (existing) return
	}
	await db.insert(schema.notifications).values({
		userId: input.ownerId,
		actorId: input.actorId,
		type: input.type,
		projectId: input.projectId,
		commentId: input.commentId ?? null,
		createdAt: new Date()
	})
}

// Apresiasi yang ditarik sebelum dibaca pemilik tidak perlu tetap muncul.
export async function removeUnreadLikeNotification(ownerId: string, actorId: string, projectId: number) {
	await db.delete(schema.notifications).where(and(
		eq(schema.notifications.userId, ownerId),
		eq(schema.notifications.actorId, actorId),
		eq(schema.notifications.type, 'like'),
		eq(schema.notifications.projectId, projectId),
		isNull(schema.notifications.readAt)
	))
}
