import { bumpCacheVersion, changesPublicData, edgeCache, edgeCacheKey } from '../lib/edge-cache'

export default defineNitroPlugin((nitroApp) => {
	// Menyimpan HTML hasil render anonim halaman publik ke cache edge, ditandai oleh server/middleware/edge-cache.ts.
	nitroApp.hooks.hook('beforeResponse', (event, response) => {
		const entry = event.context.edgeCache as { ttl: number, version: number } | undefined
		const cache = edgeCache()
		if (!entry || !cache || event.method !== 'GET') return

		const res = event.node.res
		if (res.statusCode !== 200 || res.getHeader('set-cookie') || typeof response.body !== 'string') return

		const stored = new Response(response.body, {
			headers: {
				'content-type': String(res.getHeader('content-type') || 'text/html;charset=utf-8'),
				// s-maxage dipatuhi Cache API Cloudflare dan cache memori; browser memakai header dari middleware saat HIT.
				'cache-control': `public, s-maxage=${entry.ttl}`
			}
		})
		event.waitUntil(cache.put(edgeCacheKey(event, entry.version), stored).catch(() => {}))
	})

	// Setiap perubahan lewat API menaikkan versi data, jadi semua HTML di cache langsung kedaluwarsa.
	// Ditunggu sebelum respons dikirim: halaman yang dibuka sesudahnya sudah pasti memakai versi baru.
	nitroApp.hooks.hook('beforeResponse', async (event, response) => {
		if (!changesPublicData(event, response.body)) return
		await bumpCacheVersion().catch(error => console.error('[edge-cache] Versi cache gagal dinaikkan', error))
	})
})
