import { edgeCache, edgeCacheKey } from '../lib/edge-cache'

// Menyimpan HTML hasil render halaman publik ke cache edge, ditandai oleh server/middleware/edge-cache.ts.
export default defineNitroPlugin((nitroApp) => {
	nitroApp.hooks.hook('beforeResponse', (event, response) => {
		const ttl = event.context.edgeCacheTtl as number | undefined
		const cache = edgeCache()
		if (!ttl || !cache || event.method !== 'GET') return

		const res = event.node.res
		if (res.statusCode !== 200 || res.getHeader('set-cookie') || typeof response.body !== 'string') return

		const stored = new Response(response.body, {
			headers: {
				'content-type': String(res.getHeader('content-type') || 'text/html;charset=utf-8'),
				// s-maxage dipatuhi Cache API Cloudflare; browser memakai header dari middleware saat HIT.
				'cache-control': `public, s-maxage=${ttl}`
			}
		})
		event.waitUntil(cache.put(edgeCacheKey(event), stored).catch(() => {}))
	})
})
