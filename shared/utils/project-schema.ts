import { z } from 'zod'

export const PROJECT_CATEGORIES = {
	'web': 'Aplikasi Web',
	'mobile': 'Aplikasi Mobile',
	'uiux': 'Desain UI/UX',
	'grafis': 'Desain Grafis & Branding',
	'open-source': 'Open Source & Library',
	'data': 'Data & AI',
	'iot': 'IoT & Hardware',
	'game': 'Game',
	'lainnya': 'Lainnya'
} as const

export type ProjectCategory = keyof typeof PROJECT_CATEGORIES

export const projectCategoryValues = Object.keys(PROJECT_CATEGORIES) as [ProjectCategory, ...ProjectCategory[]]

const optionalUrl = (message: string) => z.string().url(message).or(z.literal('')).optional().nullable()

export const projectInputSchema = z.object({
	title: z.string().min(3, 'Judul minimal 3 karakter').max(120, 'Judul maksimal 120 karakter'),
	tagline: z.string().max(140, 'Tagline maksimal 140 karakter').optional().nullable(),
	description: z.string().min(10, 'Cerita karya minimal 10 karakter').max(5000, 'Cerita karya maksimal 5000 karakter'),
	category: z.enum(projectCategoryValues, { message: 'Pilih kategori karya' }).optional(),
	contribution: z.string().max(120, 'Peranmu maksimal 120 karakter').optional().nullable(),
	// Path lokal hanya boleh berupa file hasil upload; kepemilikannya dicek lagi di server.
	thumbnailUrl: z.string().refine(
		val => !val || val.startsWith('/api/files/') || /^https?:\/\//i.test(val),
		{ message: 'Thumbnail harus berupa gambar yang diunggah atau link https:// yang valid' }
	).optional().nullable(),
	repoUrl: optionalUrl('URL repositori tidak valid'),
	demoUrl: optionalUrl('URL demo tidak valid'),
	designUrl: optionalUrl('URL Figma, Behance, atau Dribbble tidak valid'),
	tags: z.string().max(200, 'Tag maksimal 200 karakter').optional().nullable(),
	isPublished: z.boolean().default(true)
})

export type ProjectInput = z.output<typeof projectInputSchema>

export const projectCommentSchema = z.object({
	body: z.string().trim().min(2, 'Komentar minimal 2 karakter').max(1000, 'Komentar maksimal 1000 karakter')
})
