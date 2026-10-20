// HTML yang akan disimpan di cache edge dirender untuk pengunjung anonim (server/lib/edge-cache.ts), lalu
// disajikan juga ke pengguna yang login. Tanda isCached membuat @nuxtjs/better-auth membaca sesi lagi di browser,
// dan halaman memakai onCachedPageSignIn untuk mengambil data pribadinya.
export default defineNuxtPlugin((nuxtApp) => {
	if (useRequestEvent()?.context.edgeCache) nuxtApp.payload.isCached = true
})
