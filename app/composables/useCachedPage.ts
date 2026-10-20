// HTML dari cache edge selalu versi anonim (app/plugins/edge-cache.server.ts). Kalau ternyata pengunjungnya login,
// load dipanggil sekali setelah sesi terbaca di browser untuk mengambil data pribadinya.
export function onCachedPageSignIn(load: () => unknown) {
	if (import.meta.server) return
	const nuxtApp = useNuxtApp()
	// Navigasi di browser sudah mengambil data dengan cookie sesi, jadi hanya halaman pertama yang perlu ini.
	if (!nuxtApp.isHydrating || !nuxtApp.payload.isCached) return
	const { loggedIn } = useUserSession()

	let active = true
	let stop: (() => void) | undefined
	onBeforeUnmount(() => {
		active = false
		stop?.()
	})
	// Selama hidrasi, refresh() dari useFetch hanya mengembalikan data payload tanpa request baru, jadi tunggu
	// hidrasi selesai. Sesi bisa sudah terbaca saat itu, jadi status sekarang juga diperiksa (immediate).
	onNuxtReady(() => {
		if (active) stop = whenever(loggedIn, () => load(), { once: true, immediate: true })
	})
}
