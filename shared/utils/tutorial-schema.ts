import { z } from 'zod'

export const TUTORIAL_LEVELS = {
	pemula: 'Pemula',
	menengah: 'Menengah',
	lanjut: 'Lanjut'
} as const

export type TutorialLevel = keyof typeof TUTORIAL_LEVELS
export type TutorialStatus = 'draf' | 'ditinjau' | 'terbit' | 'ditolak'

export const TUTORIAL_STATUS_LABELS: Record<TutorialStatus, string> = {
	draf: 'Draf',
	ditinjau: 'Menunggu tinjauan',
	terbit: 'Terbit',
	ditolak: 'Perlu diperbaiki'
}

const levelValues = Object.keys(TUTORIAL_LEVELS) as [TutorialLevel, ...TutorialLevel[]]

// Dipakai bersama oleh form dashboard dan API simpan tutorial.
export const tutorialInputSchema = z.object({
	title: z.string({ error: 'Isi judul tutorial' }).trim().min(5, 'Judul minimal 5 karakter').max(120, 'Judul maksimal 120 karakter'),
	summary: z.string().trim().max(200, 'Ringkasan maksimal 200 karakter').optional().nullable(),
	body: z.string({ error: 'Isi langkah-langkah tutorialnya' }).min(100, 'Isi tutorial minimal 100 karakter').max(30000, 'Isi tutorial maksimal 30.000 karakter'),
	level: z.enum(levelValues, { message: 'Pilih tingkat kesulitan' }),
	tags: z.string().max(200, 'Teknologi maksimal 200 karakter').optional().nullable(),
	projectId: z.number().int().positive().optional().nullable()
})

export type TutorialInput = z.infer<typeof tutorialInputSchema>

export const tutorialReviewSchema = z.object({
	action: z.enum(['setujui', 'tolak']),
	note: z.string().trim().max(1000, 'Catatan maksimal 1000 karakter').optional().nullable()
}).refine(data => data.action !== 'tolak' || Boolean(data.note), {
	message: 'Tulis alasan supaya penulis tahu apa yang perlu diperbaiki.',
	path: ['note']
})

// Perkiraan waktu baca dari jumlah kata Markdown (sekitar 200 kata per menit, minimal 1 menit).
export function tutorialReadingMinutes(markdown: string | null | undefined) {
	const words = (markdown || '').replace(/```[\s\S]*?```/g, ' ').split(/\s+/).filter(Boolean).length
	return Math.max(1, Math.round(words / 200))
}
