import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { defineEventHandler, getRouterParam } from 'nuxt/server'
import { requireAdminSession } from '../../../utils/admin'
import { logTarget } from '../../../utils/activity-log'

const bodySchema = z.object({
	status: z.enum(['baru', 'selesai'])
})

export default defineEventHandler(async (event) => {
	const session = await requireAdminSession(event)
	const id = Number(getRouterParam(event, 'id'))
	if (!Number.isInteger(id) || id <= 0) {
		throw createError({ status: 400, statusText: 'Laporan tidak dikenali. Muat ulang halaman, lalu coba lagi.' })
	}
	const body = await readBodyWith(event, bodySchema)
	logTarget(event, { reportId: id, status: body.status })

	const [updated] = await db.update(schema.contentReports).set({
		status: body.status,
		resolvedBy: body.status === 'selesai' ? String(session.user.id) : null,
		resolvedAt: body.status === 'selesai' ? new Date() : null
	}).where(eq(schema.contentReports.id, id)).returning({ id: schema.contentReports.id })

	if (!updated) {
		throw createError({ status: 404, statusText: 'Laporan ini sudah tidak ada. Muat ulang halaman untuk melihat daftar terbaru.' })
	}
	return { success: true, message: body.status === 'selesai' ? 'Laporan ditandai selesai.' : 'Laporan dibuka kembali.' }
})
