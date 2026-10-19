const FILES_PREFIX = '/api/files/'

function safeDecode(segment: string) {
	try {
		return decodeURIComponent(segment)
	} catch {
		return segment
	}
}

// Nama file upload lama bisa berisi spasi atau tanda kurung ("Screenshot 2026-10-05 at 10.40.35.png"). Di srcset spasi
// adalah pemisah kandidat, jadi URL terpotong dan gambar gagal dimuat. Setiap segmen di-encode; yang sudah ter-encode tidak dobel.
export function fileSrc<T extends string | null | undefined>(url: T): T {
	if (!url || !url.startsWith(FILES_PREFIX)) return url
	const path = url.slice(FILES_PREFIX.length).split('/').map(segment => encodeURIComponent(safeDecode(segment))).join('/')
	return `${FILES_PREFIX}${path}` as T
}

// Nama file baru dirapikan sebelum diunggah: huruf kecil, hanya huruf, angka, titik, dan tanda hubung.
export function safeUploadName(name: string) {
	const dot = name.lastIndexOf('.')
	const base = dot > 0 ? name.slice(0, dot) : name
	const ext = dot > 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '') : ''
	const cleanBase = base
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9.]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 60) || 'gambar'
	return ext ? `${cleanBase}.${ext}` : cleanBase
}
