import { blob } from 'hub:blob'

export default defineEventHandler(async (event) => {
	const pathname = getRouterParam(event, 'pathname')
	if (!pathname) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Path file wajib diisi'
		})
	}

	// File upload pengguna disajikan tanpa izin menjalankan script, termasuk SVG lama yang sudah terlanjur diunggah.
	setResponseHeaders(event, {
		'Content-Security-Policy': 'default-src \'none\'; img-src \'self\'; style-src \'unsafe-inline\'; sandbox',
		'X-Content-Type-Options': 'nosniff'
	})

	return blob.serve(event, pathname)
})
