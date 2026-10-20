// HTML dari cache edge selalu versi anonim (app/plugins/edge-cache.server.ts). Kalau ternyata pengunjungnya login,
// load dipanggil sekali setelah sesi terbaca di browser untuk mengambil data pribadinya.
export function onCachedPageSignIn(load: () => unknown) {
	if (import.meta.server) return
	const nuxtApp = useNuxtApp()
	// Navigasi di browser sudah mengambil data dengan cookie sesi, jadi hanya halaman pertama yang perlu ini.
	if (!nuxtApp.isHydrating || !nuxtApp.payload.isCached) return
	const { loggedIn } = useUserSession()
	whenever(loggedIn, () => load(), { once: true })
}
