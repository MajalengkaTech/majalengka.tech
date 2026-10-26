const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export default defineNitroPlugin((nitroApp) => {
	// GET yang berhasil dibuang oleh sampling di nuxt.config; aksi yang mengubah data (termasuk login dan daftar) selalu disimpan.
	nitroApp.hooks.hook('evlog:emit:keep', (ctx) => {
		// MCP memakai POST tapi hanya membaca data publik; yang berhasil tidak perlu memenuhi log aktivitas.
		if (WRITE_METHODS.has(ctx.method ?? '') && !ctx.path?.startsWith('/mcp')) ctx.shouldKeep = true
	})

	// Situs hanya bisa dibuka lewat Cloudflare Tunnel, jadi IP asli pengunjung ada di CF-Connecting-IP.
	nitroApp.hooks.hook('evlog:enrich', (ctx) => {
		const headers = ctx.headers ?? {}
		const ip = headers['cf-connecting-ip'] || headers['x-forwarded-for']?.split(',')[0]?.trim()
		if (ip) ctx.event.ip = ip
		if (headers['cf-ipcountry']) ctx.event.country = headers['cf-ipcountry']
		if (headers['user-agent']) ctx.event.userAgent = headers['user-agent'].slice(0, 200)

		// Stack hanya disimpan untuk error server (5xx). Penolakan biasa (401, 403, 404) cukup pesannya.
		const error = ctx.event.error as { stack?: string } | undefined
		if (error && typeof error === 'object' && (ctx.response?.status ?? 500) < 500) delete error.stack
	})
})
