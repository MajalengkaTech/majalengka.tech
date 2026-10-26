// Percakapan Maja, dipakai bersama panel samping dan mode layar penuh supaya pindah tampilan tidak menghapus chat.
// Jawaban dialirkan dari /api/chat sebagai SSE: search → sources → token... → done, atau error.
// Status disimpan di modul (bukan useState) karena hanya dipakai di sisi browser; panelnya dibungkus ClientOnly.
export interface MajaSource { title: string, url: string }
export interface MajaChatMessage {
	id: string
	role: 'user' | 'assistant'
	parts: { type: 'text', text: string }[]
	metadata?: { sources?: MajaSource[], error?: string }
}
export interface MajaQuota { limit: number, remaining: number, signedIn: boolean, resetAt: number | null }

const messages = ref<MajaChatMessage[]>([])
const status = ref<'ready' | 'submitted' | 'streaming' | 'error'>('ready')
const input = ref('')
const quota = ref<MajaQuota | null>(null)
let controller: AbortController | null = null
let nextId = 0

export const MAJA_SUGGESTIONS = [
	{ label: 'Proyek aplikasi desktop apa saja yang ada di sini?', icon: 'i-lucide-monitor' },
	{ label: 'Bagaimana cara memamerkan proyekku?', icon: 'i-lucide-rocket' },
	{ label: 'Siapa saja kreator di Majalengka Tech?', icon: 'i-lucide-users' },
	{ label: 'Tutorial apa saja yang sudah terbit?', icon: 'i-lucide-book-open' }
]

export function majaMessageText(message: MajaChatMessage) {
	return message.parts.map(part => part.text).join('')
}

function limitMessage(data: { code?: string, signedIn?: boolean, limit?: number }) {
	if (data.code === 'minute_limit') return 'Pertanyaanmu terlalu cepat. Tunggu sebentar, lalu tanya lagi.'
	if (data.code === 'global_limit') return 'Maja sedang ramai hari ini dan kuota hariannya habis. Coba lagi besok.'
	return data.signedIn
		? `Kuota ${data.limit ?? 50} pertanyaan hari ini sudah habis. Coba lagi besok.`
		: `Kuota ${data.limit ?? 10} pertanyaan tanpa masuk sudah habis. Masuk untuk mendapat 50 pertanyaan per hari, atau coba lagi besok.`
}

export function useMajaChat() {
	const open = useState('maja-chat-open', () => false)
	const fullscreen = useState('maja-chat-fullscreen', () => false)

	const busy = computed(() => status.value === 'submitted' || status.value === 'streaming')
	const outOfQuota = computed(() => quota.value?.remaining === 0)
	const mood = computed<MajaMood | undefined>(() => {
		if (status.value === 'submitted') return 'thinking'
		if (status.value === 'streaming') return 'happy'
		if (status.value === 'error') return 'sad'
		if (outOfQuota.value) return 'sleeping'
		// Saat diam, Maja mengatur ekspresinya sendiri (melirik, tertidur, kaget).
		return undefined
	})

	async function loadQuota() {
		try {
			quota.value = await $fetch<MajaQuota>('/api/chat/quota')
		} catch {
			quota.value = null
		}
	}

	async function ask(raw: string) {
		const question = raw.trim()
		if (!question || busy.value) return
		input.value = ''

		const history = messages.value
			.filter(message => majaMessageText(message) && !message.metadata?.error)
			.slice(-6)
			.map(message => ({ role: message.role, content: majaMessageText(message) }))
		messages.value.push({ id: `m${nextId++}`, role: 'user', parts: [{ type: 'text', text: question }] })
		messages.value.push({ id: `m${nextId++}`, role: 'assistant', parts: [{ type: 'text', text: '' }], metadata: { sources: [] } })
		const answer = messages.value[messages.value.length - 1]!
		const part = answer.parts[0]!
		status.value = 'submitted'
		controller = new AbortController()

		try {
			const res = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: question, lang: 'id', history }),
				signal: controller.signal
			})
			if (!res.ok) {
				const data = await res.json().catch(() => ({})) as { code?: string, signedIn?: boolean, limit?: number, statusMessage?: string }
				if (res.status === 429) {
					if (data.code === 'daily_limit' && quota.value) quota.value = { ...quota.value, remaining: 0 }
					throw new Error(limitMessage(data))
				}
				if (res.status === 400) throw new Error('Pertanyaannya terlalu panjang atau kosong. Ringkas jadi kurang dari 2.000 karakter, lalu kirim lagi.')
				throw new Error(data.statusMessage || 'Maja sedang tidak bisa dihubungi. Coba lagi beberapa menit lagi.')
			}
			if (!res.body) throw new Error('Jawaban Maja kosong. Coba tanya lagi.')

			const reader = res.body.getReader()
			const decoder = new TextDecoder()
			let buffer = ''
			for (;;) {
				const { value, done } = await reader.read()
				if (done) break
				buffer += decoder.decode(value, { stream: true })
				const events = buffer.split('\n\n')
				buffer = events.pop() ?? ''
				for (const block of events) {
					const event = block.match(/^event: (.+)$/m)?.[1]
					const dataLine = block.match(/^data: (.+)$/m)?.[1]
					if (!event || !dataLine) continue
					const data = JSON.parse(dataLine)
					if (event === 'sources') answer.metadata = { ...answer.metadata, sources: data }
					else if (event === 'token') {
						status.value = 'streaming'
						part.text += data.token
					} else if (event === 'done' && quota.value && typeof data.remaining === 'number') {
						quota.value = { ...quota.value, remaining: data.remaining, limit: data.limit ?? quota.value.limit }
					} else if (event === 'error') throw new Error('Jawaban Maja terputus. Coba tanya lagi.')
				}
			}
			status.value = 'ready'
		} catch (err) {
			if (controller?.signal.aborted) {
				if (!part.text) part.text = 'Jawaban dihentikan.'
				status.value = 'ready'
			} else {
				answer.metadata = { ...answer.metadata, error: err instanceof Error ? err.message : 'Maja belum bisa menjawab. Coba lagi sebentar lagi.' }
				status.value = 'error'
			}
		} finally {
			controller = null
		}
	}

	function stop() {
		controller?.abort()
	}

	function retry() {
		const lastQuestion = [...messages.value].reverse().find(message => message.role === 'user')
		if (!lastQuestion) return
		messages.value = messages.value.slice(0, messages.value.lastIndexOf(lastQuestion))
		ask(majaMessageText(lastQuestion))
	}

	function reset() {
		stop()
		messages.value = []
		status.value = 'ready'
	}

	return { open, fullscreen, messages, status, input, quota, busy, outOfQuota, mood, loadQuota, ask, stop, retry, reset }
}
