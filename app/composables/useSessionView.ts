// Status sesi untuk tampilan komponen yang ikut dirender server: selama hidrasi sama dengan yang dirender server,
// sesudahnya status terbaru (lihat app/plugins/session-view.client.ts). Untuk aksi seperti klik, pakai useUserSession.
export function useSessionView() {
	const { loggedIn, user } = useUserSession()
	const view = useNuxtApp().$sessionView as { user: unknown, loggedIn: boolean, hydrated: Ref<boolean> } | undefined
	if (!view) return { loggedIn, user }
	return {
		loggedIn: computed(() => view.hydrated.value ? loggedIn.value : view.loggedIn),
		user: computed(() => (view.hydrated.value ? user.value : view.user) as typeof user.value)
	}
}
