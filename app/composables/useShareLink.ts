interface SharePayload {
	title: string
	text?: string
	url: string
}

// Bagikan lewat menu bawaan perangkat bila ada, kalau tidak salin link. Tanpa Permissions API supaya tidak bergantung pada izin browser.
export function useShareLink() {
	const toast = useToast()

	async function shareLink(payload: SharePayload) {
		if (import.meta.client && typeof navigator.share === 'function') {
			try {
				await navigator.share(payload)
				return
			} catch (error) {
				if ((error as DOMException)?.name === 'AbortError') return
			}
		}

		try {
			await navigator.clipboard.writeText(payload.url)
			toast.add({ title: 'Link disalin', description: 'Tempel di WhatsApp, Instagram, atau LinkedIn.', color: 'success' })
		} catch {
			toast.add({ title: 'Link belum bisa disalin', description: payload.url, color: 'neutral' })
		}
	}

	return { shareLink }
}
