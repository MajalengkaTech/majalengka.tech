import { count, eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { defineEventHandler } from 'nuxt/server'
import { requireAdminSession } from '../../../utils/admin'

export default defineEventHandler(async (event) => {
	await requireAdminSession(event)
	const [row] = await db.select({ open: count() })
		.from(schema.contentReports)
		.where(eq(schema.contentReports.status, 'baru'))
	return { open: row?.open ?? 0 }
})
