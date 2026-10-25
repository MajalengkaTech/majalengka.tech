<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
	layout: 'auth'
})

useSeoMeta({
	title: 'Lupa Kata Sandi',
	robots: 'noindex, nofollow'
})

const authClient = useAuthClient()
const toast = useToast()
const loading = ref(false)
const sentTo = ref('')
const { data: features } = await useSiteFeatures()
const captchaToken = ref('')
const turnstile = useTemplateRef<{ reset: () => void }>('turnstile')
const captchaPending = computed(() => Boolean(features.value.turnstileSiteKey) && !captchaToken.value)

const fields = [{
	name: 'email',
	type: 'text' as const,
	label: 'Email',
	placeholder: 'Email yang kamu pakai saat mendaftar',
	required: true
}]

const schema = z.object({
	email: z.string({ error: 'Isi email akunmu' }).email('Format email tidak valid')
})

type Schema = z.output<typeof schema>

async function onSubmit(payload: FormSubmitEvent<Schema>) {
	if (!authClient) return
	try {
		loading.value = true
		const { error } = await authClient.requestPasswordReset({
			email: payload.data.email,
			redirectTo: '/reset-sandi',
			fetchOptions: { headers: { 'x-captcha-response': captchaToken.value } }
		})

		if (error) {
			toast.add({
				title: 'Link belum terkirim',
				description: authErrorMessage(error, 'Permintaanmu belum bisa diproses. Coba lagi beberapa saat lagi.'),
				color: 'error'
			})
			return
		}

		sentTo.value = payload.data.email
	} catch {
		toast.add({
			title: 'Link belum terkirim',
			description: 'Server belum bisa dihubungi. Periksa koneksimu, lalu coba lagi.',
			color: 'error'
		})
	} finally {
		loading.value = false
		turnstile.value?.reset()
	}
}
</script>

<template>
	<UEmpty
		v-if="!features.email"
		icon="i-lucide-mail-x"
		title="Reset lewat email belum aktif"
		description="Pengiriman email di Majalengka Tech belum dinyalakan. Sementara ini, minta pengelola situs membantu mengatur ulang kata sandimu."
		:actions="[{ label: 'Kembali ke Halaman Masuk', icon: 'i-lucide-arrow-left', color: 'neutral', variant: 'outline', to: '/login' }]"
		variant="naked"
	/>

	<UEmpty
		v-else-if="sentTo"
		icon="i-lucide-mail-check"
		title="Cek kotak masukmu"
		:description="`Kalau ${sentTo} terdaftar, link untuk membuat kata sandi baru sudah kami kirim. Link berlaku 1 jam. Tidak ada di kotak masuk? Cek folder spam.`"
		:actions="[
			{ label: 'Kembali ke Halaman Masuk', icon: 'i-lucide-arrow-left', color: 'neutral', variant: 'outline', to: '/login' },
			{ label: 'Pakai Email Lain', color: 'neutral', variant: 'ghost', onClick: () => { sentTo = '' } }
		]"
		variant="naked"
	/>

	<UAuthForm
		v-else
		:fields="fields"
		:schema="schema"
		:loading="loading"
		title="Lupa kata sandi"
		icon="i-lucide-key-round"
		:submit="{ label: 'Kirim Link Reset', disabled: captchaPending }"
		@submit="onSubmit"
	>
		<template #description>
			Masukkan email akunmu. Kami kirim link untuk membuat kata sandi baru.
		</template>

		<template
			v-if="features.turnstileSiteKey"
			#validation
		>
			<TurnstileWidget
				ref="turnstile"
				v-model="captchaToken"
				:site-key="features.turnstileSiteKey"
				action="reset"
			/>
		</template>

		<template #footer>
			Sudah ingat? <ULink
				to="/login"
				class="text-primary font-medium"
			>Masuk di sini</ULink>.
		</template>
	</UAuthForm>
</template>
