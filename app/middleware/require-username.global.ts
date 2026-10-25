export default defineNuxtRouteMiddleware((to) => {
	const { loggedIn, user } = useUserSession()
	if (!loggedIn.value || !user.value) return

	const username = (user.value as { username?: string | null })?.username
	const hasUsername = Boolean(username && username.trim())

	// Jika akun sudah login tetapi belum memiliki username
	if (!hasUsername) {
		// Izinkan membuka halaman pengaturan profil
		if (to.path === '/dashboard/settings') return

		// Izinkan rute publik tertentu seperti keluar atau landing page
		if (to.path === '/login' || to.path === '/signup' || to.path === '/') return

		// Jika mencoba mengakses rute dashboard atau kelola lainnya, arahkan untuk isi username
		if (to.path.startsWith('/dashboard') || to.path.startsWith('/kelola')) {
			return navigateTo('/dashboard/settings?setup=username')
		}
	}
})
