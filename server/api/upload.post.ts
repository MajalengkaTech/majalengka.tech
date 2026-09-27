import { blob } from 'hub:blob'

export default defineEventHandler(async (event) => {
	const session = await getUserSession(event)
	if (!session?.user?.id) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Silakan masuk terlebih dahulu untuk mengunggah gambar.'
		})
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
			prefix: projectUploadPrefix(session.user.id)
		}
	})

	const uploaded = uploadedBlobs?.[0]
	if (!uploaded) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Gagal memproses file yang diunggah.'
		})
	}

	return {
		success: true,
		pathname: uploaded.pathname,
		url: `/api/files/${uploaded.pathname}`
	}
})
