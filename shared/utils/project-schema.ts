import { z } from 'zod'

export const projectInputSchema = z.object({
	title: z.string().min(3, 'Judul minimal 3 karakter').max(120, 'Judul maksimal 120 karakter'),
	description: z.string().min(10, 'Deskripsi minimal 10 karakter').max(2000, 'Deskripsi maksimal 2000 karakter'),
	// Path lokal hanya boleh berupa file hasil upload; kepemilikannya dicek lagi di server.
	thumbnailUrl: z.string().refine(
		val => !val || val.startsWith('/api/files/') || /^https?:\/\//i.test(val),
		{ message: 'Thumbnail harus berupa gambar yang diunggah atau link https:// yang valid' }
	).optional().nullable(),
	repoUrl: z.string().url('URL repositori tidak valid').or(z.literal('')).optional().nullable(),
	demoUrl: z.string().url('URL demo tidak valid').or(z.literal('')).optional().nullable(),
	tags: z.string().max(200, 'Tag maksimal 200 karakter').optional().nullable(),
	isPublished: z.boolean().default(true)
})

export type ProjectInput = z.output<typeof projectInputSchema>
