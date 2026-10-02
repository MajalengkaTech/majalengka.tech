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
		'X-Content-Type-Options': 'nosniff',
		// Upload karya dan avatar selalu bernama acak sehingga isinya tidak pernah berubah; kartu kreator ditimpa di path yang sama.
		'Cache-Control': pathname.startsWith('Projek/')
			? 'public, max-age=31536000, immutable'
			: 'public, max-age=3600'
	})

	try {
		return await blob.serve(event, pathname)
	} catch (error) {
		if ((error as { statusCode?: number }).statusCode === 404) {
			throw createError({
				statusCode: 404,
				statusMessage: 'Gambar tidak ditemukan. Mungkin sudah dihapus pemiliknya.'
			})
		}
		throw error
	}
})
