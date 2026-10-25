<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
	layout: 'auth'
})

useSeoMeta({
	title: 'Buat Kata Sandi Baru',
	robots: 'noindex, nofollow'
})

const authClient = useAuthClient()
const toast = useToast()
const route = useRoute()
const loading = ref(false)

// Better Auth mengarahkan link email ke sini dengan ?token=..., atau ?error=INVALID_TOKEN bila link tidak berlaku.
const token = computed(() => typeof route.query.token === 'string' ? route.query.token : '')
const linkInvalid = computed(() => !token.value || Boolean(route.query.error))

const fields = [{
	name: 'password',
	type: 'password' as const,
	label: 'Kata Sandi Baru',
	placeholder: 'Minimal 8 karakter',
	required: true
}, {
	name: 'confirm',
	type: 'password' as const,
	label: 'Ulangi Kata Sandi Baru',
	placeholder: 'Ketik ulang kata sandi baru',
	required: true
}]

const schema = z.object({
	password: z.string({ error: 'Isi kata sandi baru' }).min(8, 'Kata sandi minimal 8 karakter'),
	confirm: z.string({ error: 'Ketik ulang kata sandi baru' })
}).refine(data => data.password === data.confirm, {
	message: 'Kedua kata sandi belum sama',
	path: ['confirm']
})

type Schema = z.output<typeof schema>

async function onSubmit(payload: FormSubmitEvent<Schema>) {
	if (!authClient) return
	try {
		loading.value = true
		const { error } = await authClient.resetPassword({
			newPassword: payload.data.password,
			token: token.value
		})

		if (error) {
			toast.add({
				title: 'Kata sandi belum berubah',
				description: authErrorMessage(error, 'Kata sandi baru belum tersimpan. Coba lagi, atau minta link reset baru.'),
				color: 'error'
			})
			return
		}

		toast.add({
			title: 'Kata sandi baru tersimpan',
			description: 'Masuk dengan kata sandi barumu. Perangkat lain yang masih masuk sudah dikeluarkan.',
			color: 'success'
		})
		await navigateTo('/login')
	} catch {
		toast.add({
			title: 'Kata sandi belum berubah',
			description: 'Server belum bisa dihubungi. Periksa koneksimu, lalu coba lagi.',
			color: 'error'
		})
	} finally {
		loading.value = false
	}
}
</script>

<template>
	<UEmpty
		v-if="linkInvalid"
		icon="i-lucide-link-2-off"
		title="Link reset tidak berlaku"
		description="Link ini sudah kedaluwarsa, sudah pernah dipakai, atau tidak lengkap. Minta link baru, lalu buka link dari email terbaru."
		:actions="[
			{ label: 'Minta Link Baru', icon: 'i-lucide-mail', to: '/lupa-sandi' },
			{ label: 'Kembali ke Halaman Masuk', color: 'neutral', variant: 'ghost', to: '/login' }
		]"
		variant="naked"
	/>

	<UAuthForm
		v-else
		:fields="fields"
		:schema="schema"
		:loading="loading"
		title="Buat kata sandi baru"
		icon="i-lucide-key-round"
		:submit="{ label: 'Simpan Kata Sandi' }"
		@submit="onSubmit"
	>
		<template #description>
			Setelah tersimpan, kamu bisa langsung masuk dengan kata sandi ini.
		</template>
	</UAuthForm>
</template>
