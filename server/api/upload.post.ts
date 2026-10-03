import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { blob } from 'hub:blob'
import { db, schema } from 'hub:db'
import { isAdmin } from '../utils/admin'

const querySchema = z.object({
	projectId: z.coerce.number().int().positive().optional()
})

export default defineEventHandler(async (event) => {
	const session = await getUserSession(event)
	if (!session?.user?.id) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Masuk dulu untuk mengunggah gambar.'
		})
	}

	// Saat admin mengedit proyek orang lain, gambar disimpan di folder pemilik proyek supaya lolos cek kepemilikan dan ikut terhapus bersama proyeknya.
	let ownerId = String(session.user.id)
	const { projectId } = getQueryWith(event, querySchema)
	if (projectId) {
		const project = await db.query.projects.findFirst({ where: eq(schema.projects.id, projectId) })
		if (!project) {
			throw createError({ statusCode: 404, statusMessage: 'Proyek tidak ditemukan. Muat ulang halaman lalu coba lagi.' })
		}
		if (project.userId !== ownerId && !isAdmin(session.user)) {
			throw createError({ statusCode: 403, statusMessage: 'Kamu hanya bisa mengunggah gambar untuk proyekmu sendiri.' })
		}
		ownerId = project.userId
	}

	const uploadedBlobs = await blob.handleUpload(event, {
		formKey: 'file',
		multiple: false,
		ensure: {
			maxSize: '8MB',
			// SVG ditolak karena bisa membawa script yang jalan di domain majalengka.tech.
			types: ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
		},
		put: {
			addRandomSuffix: true,
			prefix: projectUploadPrefix(ownerId)
		}
	})

	const uploaded = uploadedBlobs?.[0]
	if (!uploaded) {
		throw createError({
			statusCode: 400,
			statusMessage: 'File belum terbaca. Unggah ulang gambar JPG, PNG, WebP, atau GIF.'
		})
	}

	return {
		success: true,
		pathname: uploaded.pathname,
		url: `/api/files/${uploaded.pathname}`
	}
})
