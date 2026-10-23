import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { isAdmin } from '../utils/admin'
import { hasCloudinaryCredentials, uploadToCloudinary } from '../utils/cloudinary'

const querySchema = z.object({
	projectId: z.coerce.number().int().positive().optional(),
	folder: z.string().trim().regex(/^[a-zA-Z0-9_-]+$/).optional()
})

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const
const MAX_FILE_SIZE = 8 * 1024 * 1024 // 8MB

export default defineEventHandler(async (event) => {
	const session = await getUserSession(event)
	if (!session?.user?.id) {
		throw createError({
			status: 401,
			statusText: 'Masuk dulu untuk mengunggah gambar.'
		})
	}

	let ownerId = String(session.user.id)
	const { projectId, folder: requestedFolder } = getQueryWith(event, querySchema)
	if (projectId) {
		const project = await db.query.projects.findFirst({ where: eq(schema.projects.id, projectId) })
		if (!project) {
			throw createError({ status: 404, statusText: 'Proyek tidak ditemukan. Muat ulang halaman lalu coba lagi.' })
		}
		if (project.userId !== ownerId && !isAdmin(session.user)) {
			throw createError({ status: 403, statusText: 'Kamu hanya bisa mengunggah gambar untuk proyekmu sendiri.' })
		}
		ownerId = project.userId
	}

	// Folder di Cloudinary: majalengka.tech/<subfolder> (default: projek)
	const subfolder = requestedFolder || 'projek'

	// Jika kredensial Cloudinary dikonfigurasi, unggah ke Cloudinary
	if (hasCloudinaryCredentials()) {
		const parts = await readMultipartFormData(event)
		const file = parts?.find(part => part.name === 'file')
		if (!file || !file.data?.length) {
			throw createError({
				status: 400,
				statusText: 'File belum terbaca. Unggah ulang gambar JPG, PNG, WebP, atau GIF.'
			})
		}

		if (file.type && !ALLOWED_MIME_TYPES.includes(file.type as any)) {
			throw createError({
				status: 400,
				statusText: 'Format gambar tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.'
			})
		}

		if (file.data.length > MAX_FILE_SIZE) {
			throw createError({
				status: 400,
				statusText: 'Ukuran gambar maksimal 8 MB.'
			})
		}

		const result = await uploadToCloudinary(file.data, {
			folder: subfolder,
			tags: ['majalengka.tech', subfolder, `user-${ownerId}`]
		})

		return {
			success: true,
			pathname: result.publicId,
			url: result.url
		}
	}

	// Fallback ke NuxtHub blob (R2 / local)
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
