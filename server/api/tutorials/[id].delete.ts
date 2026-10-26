import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { defineEventHandler } from 'nuxt/server'
import { isAdmin } from '../../utils/admin'
import { requireSignedIn } from '../../utils/project-access'
import { logTarget } from '../../utils/activity-log'
import { deleteUnusedTutorialImages, parseTutorialId, tutorialImageUrls } from '../../utils/tutorial-write'

export default defineEventHandler(async (event) => {
	const session = await requireSignedIn(event)
	const id = parseTutorialId(event)
	const [row] = await db.select({ userId: schema.tutorials.userId, title: schema.tutorials.title, body: schema.tutorials.body })
		.from(schema.tutorials).where(eq(schema.tutorials.id, id)).limit(1)
	if (!row || (row.userId !== String(session.user.id) && !isAdmin(session.user))) {
		throw createError({ status: 404, statusText: 'Tutorial ini tidak ada atau bukan milikmu.' })
	}
	logTarget(event, { tutorialId: id, title: row.title, ownerId: row.userId })
	// Notifikasi terkait dihapus eksplisit karena cascade FK tidak aktif di SQLite lokal.
	await db.batch([
		db.delete(schema.notifications).where(eq(schema.notifications.tutorialId, id)),
		db.delete(schema.tutorials).where(eq(schema.tutorials.id, id))
	])
	// Hanya gambar di folder milik penulis yang dihapus; gambar orang lain yang kebetulan ditempel dibiarkan.
	await deleteUnusedTutorialImages(tutorialImageUrls(row.body), row.userId, id)
	return { success: true, message: 'Tutorial dihapus' }
})
