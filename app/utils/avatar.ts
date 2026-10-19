// Foto dari login Google tersimpan dengan ukuran 96px (=s96-c) dan GitHub tanpa ukuran, sehingga pecah saat
// ditampilkan besar di layar ber-DPI tinggi. Kedua CDN bisa memberi resolusi lain lewat URL yang sama.
export function avatarSrc(url: string | null | undefined, size = 256): string | undefined {
	if (!url) return undefined
	try {
		const parsed = new URL(url)
		if (parsed.hostname.endsWith('googleusercontent.com')) {
			const base = url.replace(/=[swh]\d+[^/]*$/, '')
			return `${base}=s${size}-c`
		}
		if (parsed.hostname === 'avatars.githubusercontent.com') {
			parsed.searchParams.set('s', String(size))
			return parsed.toString()
		}
	} catch {
		// Path lokal seperti /api/files/... bukan URL absolut; kembalikan apa adanya.
	}
	return url
}
