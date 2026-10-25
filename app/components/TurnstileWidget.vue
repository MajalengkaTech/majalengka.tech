<script setup lang="ts">
interface TurnstileApi {
	render: (el: HTMLElement, options: Record<string, unknown>) => string
	reset: (id: string) => void
	remove: (id: string) => void
}

const props = defineProps<{
	siteKey: string
	action: string
}>()

const token = defineModel<string>({ default: '' })

const container = useTemplateRef<HTMLElement>('container')
const colorMode = useColorMode()
const failed = ref(false)
let widgetId: string | null = null

// Satu tag script untuk semua widget di halaman; render dipanggil manual supaya bisa di-reset setelah submit.
let scriptPromise: Promise<TurnstileApi> | null = null
function loadTurnstile() {
	const win = window as unknown as { turnstile?: TurnstileApi }
	if (win.turnstile) return Promise.resolve(win.turnstile)
	scriptPromise ??= new Promise<TurnstileApi>((resolve, reject) => {
		const script = document.createElement('script')
		script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
		script.async = true
		script.onload = () => win.turnstile ? resolve(win.turnstile) : reject(new Error('Turnstile tidak termuat'))
		script.onerror = () => {
			scriptPromise = null
			reject(new Error('Turnstile tidak termuat'))
		}
		document.head.appendChild(script)
	})
	return scriptPromise
}

async function render() {
	failed.value = false
	try {
		const turnstile = await loadTurnstile()
		if (!container.value) return
		widgetId = turnstile.render(container.value, {
			'sitekey': props.siteKey,
			'action': props.action,
			'language': 'id',
			'theme': colorMode.value === 'dark' ? 'dark' : 'light',
			'callback': (value: string) => {
				token.value = value
			},
			'expired-callback': () => {
				token.value = ''
			},
			'error-callback': () => {
				token.value = ''
				failed.value = true
			}
		})
	} catch {
		failed.value = true
	}
}

// Token Turnstile hanya berlaku sekali, jadi form memanggil reset() setelah setiap percobaan.
function reset() {
	token.value = ''
	failed.value = false
	const win = window as unknown as { turnstile?: TurnstileApi }
	if (widgetId && win.turnstile) win.turnstile.reset(widgetId)
}

function retry() {
	if (widgetId) reset()
	else render()
}

defineExpose({ reset })

onMounted(render)

onBeforeUnmount(() => {
	const win = window as unknown as { turnstile?: TurnstileApi }
	if (widgetId && win.turnstile) win.turnstile.remove(widgetId)
})
</script>

<template>
	<div class="flex flex-col gap-2">
		<div
			ref="container"
			class="min-h-[65px]"
		/>
		<UAlert
			v-if="failed"
			color="error"
			variant="subtle"
			icon="i-lucide-shield-alert"
			title="Pemeriksaan keamanan gagal dimuat"
			description="Matikan pemblokir iklan untuk situs ini atau periksa koneksimu, lalu coba lagi."
			:actions="[{ label: 'Coba Lagi', color: 'error', variant: 'outline', onClick: retry }]"
		/>
	</div>
</template>
