import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { defineEventHandler } from 'nuxt/server'
import { isAdmin } from '../../utils/admin'
import { requireSignedIn } from '../../utils/project-access'
import { parseTutorialId } from '../../utils/tutorial-write'

// Data lengkap untuk form edit: hanya penulisnya atau admin.
export default defineEventHandler(async (event) => {
	const session = await requireSignedIn(event)
	const id = parseTutorialId(event)
	const [row] = await db.select().from(schema.tutorials).where(eq(schema.tutorials.id, id)).limit(1)
	if (!row || (row.userId !== String(session.user.id) && !isAdmin(session.user))) {
		throw createError({ status: 404, statusText: 'Tutorial ini tidak ada atau bukan milikmu.' })
	}
	return { tutorial: row }
})
