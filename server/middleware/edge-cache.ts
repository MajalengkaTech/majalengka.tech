import { defineEventHandler, setResponseHeader } from 'h3'
import { edgeCache, edgeCacheKey, edgeCacheTtl, hasSession, readCacheVersion } from '../lib/edge-cache'

// Menyajikan HTML halaman publik dari cache sebelum Nuxt merender ulang (lihat server/lib/edge-cache.ts).
// Memakai h3 langsung (bukan nuxt/server) karena hook beforeResponse di plugin pasangannya memberi H3Event yang sama.
export default defineEventHandler(async (event) => {
	const ttl = edgeCacheTtl(event)
	const cache = edgeCache()
	if (!ttl || !cache) return

	// Versi dibaca sebelum render. Kalau data berubah selama render, versinya sudah naik dan hasil render ini
	// tidak akan dibaca lagi. Tabel versi belum ada atau database gagal: lewati cache daripada menyajikan data lama.
	const version = await readCacheVersion().catch(() => null)
	if (version === null) return

	const hit = await cache.match(edgeCacheKey(event, version)).catch(() => undefined)
	if (!hit) {
		// Render untuk pengguna yang login berisi data pribadi, jadi hanya render anonim yang disimpan
		// oleh server/plugins/edge-cache.ts.
		if (!hasSession(event)) event.context.edgeCache = { ttl, version }
		setResponseHeader(event, 'x-edge-cache', 'MISS')
		return
	}

	// Browser tidak ikut menyimpan, supaya perubahan data dan versi pribadi setelah login langsung terlihat.
	const headers = new Headers(hit.headers)
	headers.set('cache-control', 'public, max-age=0, must-revalidate')
	headers.set('x-edge-cache', 'HIT')
	return new Response(event.method === 'HEAD' ? null : hit.body, { status: hit.status, headers })
})
