export interface NotificationItem {
	id: number
	type: 'like' | 'comment' | 'tutorial_terbit' | 'tutorial_ditolak'
	unread: boolean
	createdAt: string
	actor: { name: string, avatarUrl: string | null }
	project: { title: string | null, slug: string } | null
	commentId: number | null
	tutorial: { id: number, title: string | null, slug: string | null } | null
}

// State bersama untuk lonceng di header situs, lonceng di dashboard, dan panel notifikasi di app.vue.
export function useNotifications() {
	const open = useState('notifications-open', () => false)
	const items = useState<NotificationItem[]>('notifications-items', () => [])
	const unread = useState('notifications-unread', () => 0)
	const status = useState<'idle' | 'pending' | 'error'>('notifications-status', () => 'idle')

	async function refresh() {
		status.value = 'pending'
		try {
			const res = await $fetch<{ unread: number, notifications: NotificationItem[] }>('/api/notifications')
			items.value = res.notifications
			unread.value = res.unread
			status.value = 'idle'
		} catch {
			status.value = 'error'
		}
	}

	// Saat panel dibuka, yang belum dibaca langsung ditandai dibaca; titik merah hilang tanpa menunggu server.
	async function markAllRead() {
		if (!unread.value) return
		unread.value = 0
		await $fetch('/api/notifications/read', { method: 'POST' }).catch(() => {})
	}

	return { open, items, unread, status, refresh, markAllRead }
}
