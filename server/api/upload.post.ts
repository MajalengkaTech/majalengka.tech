import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { isAdmin } from '../utils/admin'
import { CLOUDINARY_FOLDERS, hasCloudinaryCredentials, uploadToCloudinary } from '../utils/cloudinary'

const querySchema = z.object({
	projectId: z.coerce.number().int().positive().optional(),
	folder: z.enum(CLOUDINARY_FOLDERS).default('projek')
})

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const
// Sama dengan batas di app/composables/useImageUpload.ts.
const MAX_FILE_SIZE = 8 * 1024 * 1024

export default defineEventHandler(async (event) => {
	const session = await getUserSession(event)
	if (!session?.user?.id) {
		throw createError({
			status: 401,
			statusText: 'Masuk dulu untuk mengunggah gambar.'
		})
	}

	let ownerId = String(session.user.id)
	const { projectId, folder } = getQueryWith(event, querySchema)
	// Saat admin mengedit proyek orang lain, gambar disimpan di folder pemilik proyek supaya lolos cek kepemilikan dan ikut terhapus bersama proyeknya.
	if (projectId && folder === 'projek') {
		const project = await db.query.projects.findFirst({ where: eq(schema.projects.id, projectId) })
		if (!project) {
			throw createError({ status: 404, statusText: 'Proyek tidak ditemukan. Muat ulang halaman lalu coba lagi.' })
		}
		if (project.userId !== ownerId && !isAdmin(session.user)) {
			throw createError({ status: 403, statusText: 'Kamu hanya bisa mengunggah gambar untuk proyekmu sendiri.' })
		}
		ownerId = project.userId
	}

	if (hasCloudinaryCredentials()) {
		const parts = await readMultipartFormData(event)
		const file = parts?.find(part => part.name === 'file')
		if (!file || !file.data?.length) {
			throw createError({
				status: 400,
				statusText: 'File belum terbaca. Unggah ulang gambar JPG, PNG, WebP, atau GIF.'
			})
		}

		// SVG ditolak karena bisa membawa script; tipe kosong juga ditolak supaya tidak lolos tanpa dicek.
		if (!ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number])) {
			throw createError({
				status: 400,
				statusText: 'Format gambar tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.'
			})
		}

		if (file.data.length > MAX_FILE_SIZE) {
			throw createError({
				status: 400,
				statusText: 'Ukuran gambar maksimal 8 MB. Perkecil atau kompres gambarnya, lalu unggah lagi.'
			})
		}

		try {
			const result = await uploadToCloudinary(file.data, { folder, ownerId })
			return {
				success: true,
				pathname: result.publicId,
				url: result.url
			}
		} catch (error) {
			const message = (error as { message?: string })?.message || ''
			// Isi file yang bukan gambar JPG, PNG, WebP, atau GIF ditolak Cloudinary dengan pesan "format not allowed".
			if (/format/i.test(message)) {
				throw createError({
					status: 400,
					statusText: 'Isi file bukan gambar JPG, PNG, WebP, atau GIF. Simpan ulang gambarnya dalam salah satu format itu.'
				})
			}
			console.error('[upload] Cloudinary gagal', error)
			throw createError({
				status: 502,
				statusText: 'Penyimpanan gambar sedang tidak bisa dihubungi. Coba unggah lagi beberapa saat lagi.'
			})
		}
	}

	// Tanpa kredensial Cloudinary (misalnya di lokal), file disimpan di blob NuxtHub (.data/blob).
	const uploadedBlobs = await blob.handleUpload(event, {
		formKey: 'file',
		multiple: false,
		ensure: {
			maxSize: '8MB',
			// SVG ditolak karena bisa membawa script yang jalan di domain majalengka.tech.
			types: [...ALLOWED_MIME_TYPES]
		},
		put: {
			addRandomSuffix: true,
			prefix: projectUploadPrefix(ownerId)
		}
	})

	const uploaded = uploadedBlobs?.[0]
	if (!uploaded) {
		throw createError({
			status: 400,
			statusText: 'File belum terbaca. Unggah ulang gambar JPG, PNG, WebP, atau GIF.'
		})
	}

	return {
		success: true,
		pathname: uploaded.pathname,
		url: `/api/files/${uploaded.pathname}`
	}
})
