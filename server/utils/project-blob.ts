const FILES_URL_PREFIX = '/api/files/'

export function projectUploadPrefix(userId: string | number) {
	return `Projek/${userId}`
}

function blobPathnameFromUrl(url?: string | null) {
	if (!url?.startsWith(FILES_URL_PREFIX)) return null
	return url.slice(FILES_URL_PREFIX.length)
}

export function isOwnedBlobUrl(url: string | null | undefined, ownerId: string | number) {
	const pathname = blobPathnameFromUrl(url)
	return !!pathname && pathname.startsWith(`${projectUploadPrefix(ownerId)}/`)
}

// File upload milik user lain tidak boleh dipakai sebagai thumbnail, supaya tidak bisa ikut terhapus lewat projek ini.
export function assertThumbnailAllowed(url: string | null, ownerId: string | number, currentUrl?: string | null) {
	if (!url || /^https?:\/\//i.test(url) || url === currentUrl) return
	if (!isOwnedBlobUrl(url, ownerId)) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Thumbnail harus gambar yang kamu unggah sendiri atau link https:// yang valid'
		})
	}
}

export async function deleteOwnedBlob(url: string | null | undefined, ownerId: string | number) {
	const pathname = blobPathnameFromUrl(url)
	if (!pathname || !isOwnedBlobUrl(url, ownerId)) return
	try {
		await blob.delete(pathname)
	} catch (error) {
		console.warn('[Blob] Gagal menghapus file dari R2:', pathname, error)
	}
}
