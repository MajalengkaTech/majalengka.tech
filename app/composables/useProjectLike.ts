import { animate } from 'animejs'

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
	const pendingIds = ref<number[]>([])

	function isPending(id: number) {
		return pendingIds.value.includes(id)
	}

	// Ikon hati membesar sesaat setelah apresiasi tersimpan, sebagai tanda aksinya berhasil (bukan saat masih menunggu server).
	async function popIcon(button: HTMLElement | null) {
		if (!button || !motionAllowed()) return
		await nextTick()
		const icon = button.querySelector<HTMLElement>('[data-slot="leadingIcon"]')
		if (!icon) return
		animate(icon, {
			scale: [1, 1.45, 1],
			duration: 480,
			ease: 'out(3)',
			onComplete: () => icon.style.removeProperty('transform')
		})
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
		if (isPending(project.id)) return

		const previous = { liked: Boolean(project.likedByMe), count: project.likeCount || 0 }
		project.likedByMe = !previous.liked
		project.likeCount = Math.max(0, previous.count + (previous.liked ? -1 : 1))
		pendingIds.value.push(project.id)

		try {
			const res = await $fetch<{ liked: boolean, likeCount: number }>(`/api/projects/${project.id}/like`, {
				method: 'POST'
			})
			project.likedByMe = res.liked
			project.likeCount = res.likeCount
			if (res.liked) popIcon(button)
		} catch (err: unknown) {
			project.likedByMe = previous.liked
			project.likeCount = previous.count
			const errorResponse = err as { data?: { statusMessage?: string } }
			toast.add({
				title: 'Apresiasi belum tersimpan',
				description: errorResponse.data?.statusMessage || 'Periksa koneksimu lalu coba lagi.',
				color: 'error'
			})
		} finally {
			pendingIds.value = pendingIds.value.filter(id => id !== project.id)
		}
	}

	return { toggleLike, isPending }
}
