import { eq, sql } from 'drizzle-orm'
import { getRequestHeader, getRequestURL, isError, type H3Event } from 'h3'
import { db, schema } from 'hub:db'

// Paket Workers Gratis hanya memberi ±10 ms CPU per request, sedangkan render SSR halaman publik butuh ratusan ms
// (Error 1102 "exceeded CPU time limit"). HTML halaman publik disimpan di cache edge Cloudflare
// (Cache API, per data center, tanpa kuota tulis), jadi request berikutnya tidak perlu render ulang.
//
// Supaya data tetap terbaru, kunci cache memuat nomor versi data dari D1. Setiap perubahan lewat API menaikkan
// versinya (server/plugins/edge-cache.ts), sehingga HTML lama langsung tidak terpakai di semua data center.
// HTML hanya disimpan dari render untuk pengunjung tanpa sesi, tetapi disajikan juga ke pengguna yang login;
// data pribadinya (apresiasiku, tombol pemilik) diambil ulang di browser (app/composables/useCachedPage.ts).

const PAYLOAD_SUFFIX = '/_payload.json'

// Segmen tunggal yang bukan profil kreator, supaya halaman aplikasi tidak ikut di-cache sebagai profil.
const NOT_PROFILE = new Set(['login', 'signup', 'logout', 'dashboard', 'kelola', 'docs', 'blog', 'changelog', 'api'])

// Kesegaran dijaga oleh nomor versi; TTL hanya batas atas untuk perubahan di luar API (misalnya SQL manual di D1).
const RULES: { pattern: RegExp, ttl: number }[] = [
	{ pattern: /^\/$/, ttl: 3600 },
	{ pattern: /^\/(?:projek|kreator|tentang)$/, ttl: 3600 },
	{ pattern: /^\/projek\/[^/]+$/, ttl: 3600 },
	// Profil kreator di /username atau /@username.
	{ pattern: /^\/@?[a-z0-9](?:[\w-]*[a-z0-9])?$/, ttl: 3600 }
]

// Satu versi untuk semua halaman: nama atau foto kreator ikut tampil di kartu, profil, dan beranda,
// jadi versi per halaman gampang terlewat saat ada perubahan.
const VERSION_KEY = 'site'

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
// Rute tulis yang tidak mengubah isi halaman publik: login dan sesi, serta unggah file (baru tampil setelah proyek disimpan).
const NO_VERSION_BUMP = ['/api/auth/', '/api/upload']

type EdgeCache = { match: (request: Request) => Promise<Response | undefined>, put: (request: Request, response: Response) => Promise<void> }

// Hanya ada di runtime Cloudflare; di dev lokal (Node) cache dilewati.
export function edgeCache() {
	return (globalThis as { caches?: { default?: EdgeCache } }).caches?.default
}

// ID build ikut di kunci: setelah deploy, HTML lama (yang menautkan CSS/JS build lama, sudah 404) tidak disajikan lagi.
export function edgeCacheKey(event: H3Event, version: number) {
	const url = getRequestURL(event)
	url.searchParams.set('__build', String(useRuntimeConfig().app.buildId || 'dev'))
	url.searchParams.set('__v', String(version))
	return new Request(url.toString(), { method: 'GET' })
}

export function hasSession(event: H3Event) {
	return (getRequestHeader(event, 'cookie') || '').includes('better-auth.session_token')
}

// Detik simpan untuk request ini, atau null kalau tidak boleh di-cache.
export function edgeCacheTtl(event: H3Event): number | null {
	if (event.method !== 'GET' && event.method !== 'HEAD') return null

	let path = getRequestURL(event).pathname
	if (path.endsWith(PAYLOAD_SUFFIX)) path = path.slice(0, -PAYLOAD_SUFFIX.length) || '/'

	const segment = path.slice(1).replace(/^@/, '')
	if (!path.slice(1).includes('/') && NOT_PROFILE.has(segment)) return null

	return RULES.find(rule => rule.pattern.test(path))?.ttl ?? null
}

export async function readCacheVersion() {
	const [row] = await db.select({ version: schema.cacheVersions.version })
		.from(schema.cacheVersions)
		.where(eq(schema.cacheVersions.key, VERSION_KEY))
		.limit(1)
	return row?.version ?? 0
}

export async function bumpCacheVersion() {
	await db.insert(schema.cacheVersions)
		.values({ key: VERSION_KEY, version: 1 })
		.onConflictDoUpdate({ target: schema.cacheVersions.key, set: { version: sql`${schema.cacheVersions.version} + 1` } })
}

// Request tulis ke API yang berhasil. h3 memanggil hook beforeResponse sebelum status ditulis,
// jadi error dan Response (dari handler better-auth) dibaca dari body-nya sendiri.
export function changesPublicData(event: H3Event, body: unknown) {
	if (!WRITE_METHODS.has(event.method)) return false
	const path = getRequestURL(event).pathname
	if (!path.startsWith('/api/') || NO_VERSION_BUMP.some(prefix => path.startsWith(prefix))) return false
	if (isError(body)) return false
	const status = body instanceof Response ? body.status : event.node.res.statusCode
	return status < 400
}
