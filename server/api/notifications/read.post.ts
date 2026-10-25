import { and, eq, isNull } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { defineEventHandler } from 'nuxt/server'
import { requireSignedIn } from '../../utils/project-access'

// Semua notifikasi milik pengguna ini ditandai sudah dibaca saat panel notifikasi dibuka.
export default defineEventHandler(async (event) => {
	const session = await requireSignedIn(event)
	await db.update(schema.notifications)
		.set({ readAt: new Date() })
		.where(and(eq(schema.notifications.userId, String(session.user.id)), isNull(schema.notifications.readAt)))
	return { success: true }
})
