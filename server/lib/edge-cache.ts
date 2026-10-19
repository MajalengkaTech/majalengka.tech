import { getRequestHeader, getRequestURL, type H3Event } from 'h3'

// Paket Workers Gratis hanya memberi ±10 ms CPU per request, sedangkan render SSR halaman publik butuh ratusan ms
// (Error 1102 "exceeded CPU time limit"). HTML untuk pengunjung yang belum login disimpan di cache edge Cloudflare
// (Cache API, per data center, tanpa kuota tulis), jadi request berikutnya tidak perlu render ulang.

const PAYLOAD_SUFFIX = '/_payload.json'

// Segmen tunggal yang bukan profil kreator, supaya halaman aplikasi tidak ikut di-cache sebagai profil.
const NOT_PROFILE = new Set(['login', 'signup', 'logout', 'dashboard', 'kelola', 'docs', 'blog', 'changelog', 'api'])

const RULES: { pattern: RegExp, ttl: number }[] = [
	{ pattern: /^\/$/, ttl: 300 },
	{ pattern: /^\/(?:projek|kreator|tentang)$/, ttl: 300 },
	{ pattern: /^\/projek\/[^/]+$/, ttl: 600 },
	// Profil kreator di /username atau /@username.
	{ pattern: /^\/@?[a-z0-9](?:[\w-]*[a-z0-9])?$/, ttl: 600 }
]

type EdgeCache = { match: (request: Request) => Promise<Response | undefined>, put: (request: Request, response: Response) => Promise<void> }

// Hanya ada di runtime Cloudflare; di dev lokal (Node) cache dilewati.
export function edgeCache() {
	return (globalThis as { caches?: { default?: EdgeCache } }).caches?.default
}

// ID build ikut di kunci: setelah deploy, HTML lama (yang menautkan CSS/JS build lama, sudah 404) tidak disajikan lagi.
export function edgeCacheKey(event: H3Event) {
	const url = getRequestURL(event)
	url.searchParams.set('__build', String(useRuntimeConfig().app.buildId || 'dev'))
	return new Request(url.toString(), { method: 'GET' })
}

// Detik simpan untuk request ini, atau null kalau tidak boleh di-cache.
export function edgeCacheTtl(event: H3Event): number | null {
	if (event.method !== 'GET' && event.method !== 'HEAD') return null
	// Pengguna yang login melihat data pribadi (apresiasiku, menu akun), jadi selalu dirender langsung.
	if ((getRequestHeader(event, 'cookie') || '').includes('better-auth.session_token')) return null

	let path = getRequestURL(event).pathname
	if (path.endsWith(PAYLOAD_SUFFIX)) path = path.slice(0, -PAYLOAD_SUFFIX.length) || '/'

	const segment = path.slice(1).replace(/^@/, '')
	if (!path.slice(1).includes('/') && NOT_PROFILE.has(segment)) return null

	return RULES.find(rule => rule.pattern.test(path))?.ttl ?? null
}
