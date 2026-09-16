<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
	layout: 'auth'
})

useSeoMeta({
	title: 'Daftar Developer · Majalengka Tech',
	description: 'Bergabung dengan ekosistem open-source dan komunitas teknologi Majalengka'
})

const { loggedIn, fetch: refreshSession } = useUserSession()
const toast = useToast()
const loading = ref(false)

watchEffect(() => {
	if (loggedIn.value) {
		navigateTo('/')
	}
})

const fields = [{
	name: 'name',
	type: 'text' as const,
	label: 'Nama Lengkap / Panggilan',
	placeholder: 'Nama lengkap kamu',
	required: true
}, {
	name: 'email',
	type: 'text' as const,
	label: 'Email',
	placeholder: 'nama@domain.com',
	required: true
}, {
	name: 'password',
	label: 'Kata Sandi',
	type: 'password' as const,
	placeholder: 'Minimal 8 karakter'
}]

const providers = [{
	label: 'Daftar dengan GitHub',
	icon: 'i-simple-icons-github',
	color: 'neutral' as const,
	onClick: () => {
		window.location.href = '/api/auth/github'
	}
}, {
	label: 'Daftar dengan Google',
	icon: 'i-simple-icons-google',
	color: 'neutral' as const,
	onClick: () => {
		window.location.href = '/api/auth/google'
	}
}]

const schema = z.object({
	name: z.string().min(2, 'Nama minimal 2 karakter'),
	email: z.string().email('Format email belum benar'),
	password: z.string().min(8, 'Kata sandi minimal 8 karakter')
})

type Schema = z.output<typeof schema>

async function onSubmit(payload: FormSubmitEvent<Schema>) {
	try {
		loading.value = true
		await $fetch('/api/auth/register', {
			method: 'POST',
			body: {
				name: payload.data.name,
				email: payload.data.email,
				password: payload.data.password
			}
		})
		await refreshSession()
		toast.add({
			title: 'Pendaftaran Berhasil',
			description: `Selamat datang di Majalengka Tech, ${payload.data.name}!`,
			color: 'success'
		})
		navigateTo('/')
	} catch (err: unknown) {
		const errorResponse = err as { data?: { statusMessage?: string } }
		toast.add({
			title: 'Gagal Mendaftar',
			description: errorResponse?.data?.statusMessage || 'Terjadi kendala saat mendaftar. Silakan coba sesaat lagi.',
			color: 'error'
		})
	} finally {
		loading.value = false
	}
}
</script>

<template>
	<UAuthForm
		:fields="fields"
		:schema="schema"
		:providers="providers"
		:loading="loading"
		title="Bergabung ke Majalengka Tech"
		:submit="{ label: 'Daftar Sekarang' }"
		@submit="onSubmit"
	>
		<template #description>
			Sudah punya akun? <ULink
				to="/login"
				class="text-primary font-medium"
			>Masuk di sini</ULink>.
		</template>

		<template #footer>
			Dengan mendaftar, kamu menyetujui <ULink
				to="/docs"
				class="text-primary font-medium"
			>Ketentuan & Pedoman Komunitas</ULink>.
		</template>
	</UAuthForm>
</template>
