// Atom sesi @nuxtjs/better-auth bisa selesai mengambil sesi di tengah hidrasi. Di halaman yang HTML-nya versi anonim
// (prerender, atau dari cache edge) pengguna yang login lalu berubah tampilan sebelum hidrasi selesai, dan Vue
// melaporkan hydration mismatch. Plugin ini mencatat sesi yang dipakai server saat merender, sebelum plugin auth
// berjalan (enforce: 'pre'); useSessionView memakai catatan itu sampai hidrasi selesai.
export default defineNuxtPlugin({
	name: 'session-view',
	enforce: 'pre',
	setup(nuxtApp) {
		if (!nuxtApp.isHydrating || !nuxtApp.payload.serverRendered) return
		const user = useState('auth:user').value
		const session = useState('auth:session').value
		const hydrated = shallowRef(false)
		nuxtApp.hooks.hookOnce('app:suspense:resolve', () => {
			hydrated.value = true
		})
		return { provide: { sessionView: { user, loggedIn: Boolean(user && session), hydrated } } }
	}
})
