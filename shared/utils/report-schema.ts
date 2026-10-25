import { z } from 'zod'

export const REPORT_REASONS = {
	'spam': 'Spam atau promosi',
	'tidak-pantas': 'Konten tidak pantas atau kasar',
	'plagiat': 'Bukan proyek milik pengunggah',
	'menyesatkan': 'Informasi menyesatkan',
	'lainnya': 'Lainnya'
} as const

export type ReportReason = keyof typeof REPORT_REASONS

const reportReasonValues = Object.keys(REPORT_REASONS) as [ReportReason, ...ReportReason[]]

// Bagian yang diisi pelapor di form; API memakai versi lengkap di bawahnya.
export const reportFormSchema = z.object({
	reason: z.enum(reportReasonValues, { message: 'Pilih alasan laporan' }),
	note: z.string().trim().max(500, 'Catatan maksimal 500 karakter').optional().nullable()
})

export const contentReportSchema = reportFormSchema.extend({
	targetType: z.enum(['project', 'comment']),
	projectId: z.number().int().positive(),
	commentId: z.number().int().positive().optional().nullable()
}).refine(data => data.targetType !== 'comment' || Boolean(data.commentId), {
	message: 'Komentar yang dilaporkan tidak dikenali. Muat ulang halaman, lalu coba lagi.',
	path: ['commentId']
})

export type ContentReportInput = z.infer<typeof contentReportSchema>
