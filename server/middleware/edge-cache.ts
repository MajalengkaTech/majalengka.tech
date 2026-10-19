import { defineEventHandler, setResponseHeader } from 'h3'
import { edgeCache, edgeCacheKey, edgeCacheTtl } from '../lib/edge-cache'

// Menyajikan HTML halaman publik dari cache edge sebelum Nuxt merender ulang (lihat server/lib/edge-cache.ts).
// Memakai h3 langsung (bukan nuxt/server) karena hook beforeResponse di plugin pasangannya memberi H3Event yang sama.
export default defineEventHandler(async (event) => {
	const ttl = edgeCacheTtl(event)
	const cache = edgeCache()
	if (!ttl || !cache) return

	const hit = await cache.match(edgeCacheKey(event)).catch(() => undefined)
	if (!hit) {
		// Disimpan oleh server/plugins/edge-cache.ts setelah render selesai.
		event.context.edgeCacheTtl = ttl
		setResponseHeader(event, 'x-edge-cache', 'MISS')
		return
	}

	// Browser tidak ikut menyimpan, supaya setelah login halaman langsung tampil versi pribadi.
	const headers = new Headers(hit.headers)
	headers.set('cache-control', 'public, max-age=0, must-revalidate')
	headers.set('x-edge-cache', 'HIT')
	return new Response(event.method === 'HEAD' ? null : hit.body, { status: hit.status, headers })
})
