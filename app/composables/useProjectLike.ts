interface LikeableProject {
	id: number
	title: string
	likeCount?: number
	likedByMe?: boolean
}

export function useProjectLike() {
	const { loggedIn } = useUserSession()
	const route = useRoute()
	const toast = useToast()
	// Data useFetch di Nuxt 4 berupa shallowRef: mengubah project.likedByMe tidak memicu render ulang.
	// Status apresiasi disimpan di state bersama ini, jadi kartu dan halaman detail langsung ikut berubah.
	const likes = useState<Record<number, { liked: boolean, count: number }>>('project-likes', () => ({}))

	function likeState(project: LikeableProject) {
		return likes.value[project.id] ?? { liked: Boolean(project.likedByMe), count: project.likeCount || 0 }
	}

	function setLike(project: LikeableProject, liked: boolean, count: number) {
		likes.value[project.id] = { liked, count: Math.max(0, count) }
		project.likedByMe = liked
		project.likeCount = Math.max(0, count)
	}
	// Nomor klik terakhir per proyek: hanya jawaban server untuk klik terakhir yang boleh mengubah tampilan.
	const latestClick = new Map<number, number>()
	// Request per proyek dikirim berurutan supaya urutan tiba di server sama dengan urutan klik.
	const queue = new Map<number, Promise<unknown>>()

	// Ikon hati membesar saat diklik, tanpa menunggu server, seperti tombol suka di media sosial.
	async function popIcon(button: HTMLElement | null) {
		if (!button || !motionAllowed()) return
		await nextTick()
		const icon = button.querySelector<HTMLElement>('[data-slot="leadingIcon"]')
		if (!icon) return
		const anim = icon.animate([
			{ transform: 'scale(1)' },
			{ transform: 'scale(1.45)' },
			{ transform: 'scale(1)' }
		], {
			duration: 480,
			easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
		})
		anim.onfinish = () => icon.style.removeProperty('transform')
	}

	async function toggleLike(project: LikeableProject, event?: Event) {
		const button = event?.currentTarget instanceof HTMLElement ? event.currentTarget : null
		if (!loggedIn.value) {
			toast.add({
				title: 'Masuk dulu, ya',
				description: 'Apresiasi dicatat per akun supaya hitungannya jujur.',
				color: 'neutral',
				actions: [{ label: 'Masuk', to: `/login?redirect=${encodeURIComponent(route.fullPath)}` }]
			})
			return
		}
		const previous = likeState(project)
		const liked = !previous.liked
		setLike(project, liked, previous.count + (liked ? 1 : -1))
		if (liked) popIcon(button)

		const click = (latestClick.get(project.id) || 0) + 1
		latestClick.set(project.id, click)

		try {
			// Status yang diinginkan ikut dikirim, jadi klik beruntun tidak saling membatalkan di server.
			const request = (queue.get(project.id) || Promise.resolve())
				.catch(() => {})
				.then(() => $fetch<{ liked: boolean, likeCount: number }>(`/api/projects/${project.id}/like`, {
					method: 'POST',
					body: { liked }
				}))
			queue.set(project.id, request)
			const res = await request
			if (latestClick.get(project.id) !== click) return
			setLike(project, res.liked, res.likeCount)
		} catch (err: unknown) {
			if (latestClick.get(project.id) !== click) return
			setLike(project, previous.liked, previous.count)
			const errorResponse = err as { data?: { statusMessage?: string } }
			toast.add({
				title: 'Apresiasi belum tersimpan',
				description: errorResponse.data?.statusMessage || 'Periksa koneksimu lalu coba lagi.',
				color: 'error'
			})
		}
	}

	return { toggleLike, likeState }
}
