import { and, count, eq, gte, isNull } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { defineEventHandler } from 'nuxt/server'
import { requirePublishedProject, requireSignedIn } from '../../utils/project-access'

// Batas harian supaya tombol lapor tidak dipakai untuk membanjiri antrean pengelola.
const DAILY_LIMIT = 10

export default defineEventHandler(async (event) => {
	const session = await requireSignedIn(event, 'Masuk dulu untuk melaporkan konten.')
	const reporterId = String(session.user.id)
	const body = await readBodyWith(event, contentReportSchema)
	const project = await requirePublishedProject(body.projectId)

	let ownerId = project.userId
	if (body.targetType === 'comment') {
		const [comment] = await db.select({ userId: schema.projectComments.userId })
			.from(schema.projectComments)
			.where(and(eq(schema.projectComments.id, body.commentId!), eq(schema.projectComments.projectId, body.projectId)))
			.limit(1)
		if (!comment) {
			throw createError({ status: 404, statusText: 'Komentar ini sudah tidak ada. Muat ulang halaman untuk melihat komentar terbaru.' })
		}
		ownerId = comment.userId
	}
	if (ownerId === reporterId) {
		throw createError({ status: 400, statusText: 'Kamu tidak bisa melaporkan kontenmu sendiri. Edit atau hapus saja kontennya.' })
	}

	const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
	const [today] = await db.select({ total: count() }).from(schema.contentReports)
		.where(and(eq(schema.contentReports.reporterId, reporterId), gte(schema.contentReports.createdAt, since)))
	if ((today?.total ?? 0) >= DAILY_LIMIT) {
		throw createError({ status: 429, statusText: 'Kamu sudah mengirim 10 laporan hari ini. Coba lagi besok.' })
	}

	// Laporan yang sama dari orang yang sama dan belum ditinjau cukup tercatat sekali.
	const [duplicate] = await db.select({ id: schema.contentReports.id }).from(schema.contentReports).where(and(
		eq(schema.contentReports.reporterId, reporterId),
		eq(schema.contentReports.targetType, body.targetType),
		eq(schema.contentReports.projectId, body.projectId),
		body.commentId ? eq(schema.contentReports.commentId, body.commentId) : isNull(schema.contentReports.commentId),
		eq(schema.contentReports.status, 'baru')
	)).limit(1)
	if (!duplicate) {
		await db.insert(schema.contentReports).values({
			reporterId,
			targetType: body.targetType,
			projectId: body.projectId,
			commentId: body.commentId ?? null,
			reason: body.reason,
			note: body.note?.trim() || null,
			createdAt: new Date()
		})
	}

	return {
		success: true,
		message: 'Terima kasih. Laporanmu sudah masuk dan akan ditinjau pengelola situs.'
	}
})
