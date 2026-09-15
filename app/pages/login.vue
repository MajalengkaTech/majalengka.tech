<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
	layout: 'auth'
})

useSeoMeta({
	title: 'Masuk · Majalengka Tech',
	description: 'Masuk ke portal komunitas developer Majalengka Tech'
})

const { loggedIn, fetch: refreshSession } = useUserSession()
const toast = useToast()
const loading = ref(false)

// Redirect jika sudah login
watchEffect(() => {
	if (loggedIn.value) {
		navigateTo('/')
	}
})

const fields = [{
	name: 'email',
	type: 'text' as const,
	label: 'Email',
	placeholder: 'Masukkan email Anda',
	required: true
}, {
	name: 'password',
	label: 'Kata Sandi',
	type: 'password' as const,
	placeholder: 'Masukkan kata sandi'
}, {
	name: 'remember',
	label: 'Ingat saya',
	type: 'checkbox' as const
}]

const providers = [{
	label: 'Masuk dengan GitHub',
	icon: 'i-simple-icons-github',
	color: 'neutral' as const,
	onClick: () => {
		window.location.href = '/api/auth/github'
	}
}, {
	label: 'Masuk dengan Google',
	icon: 'i-simple-icons-google',
	color: 'neutral' as const,
	onClick: () => {
		window.location.href = '/api/auth/google'
	}
}]

const schema = z.object({
	email: z.string().email('Format email tidak valid'),
	password: z.string().min(1, 'Kata sandi wajib diisi')
})

type Schema = z.output<typeof schema>

async function onSubmit(payload: FormSubmitEvent<Schema>) {
	try {
		loading.value = true
		await $fetch('/api/auth/login', {
			method: 'POST',
			body: {
				email: payload.data.email,
				password: payload.data.password
			}
		})
		await refreshSession()
		toast.add({
			title: 'Berhasil Masuk',
			description: 'Selamat datang kembali di Majalengka Tech!',
			color: 'success'
		})
		navigateTo('/')
	} catch (err: unknown) {
		const errorResponse = err as { data?: { statusMessage?: string } }
		toast.add({
			title: 'Gagal Masuk',
			description: errorResponse?.data?.statusMessage || 'Email atau kata sandi tidak valid.',
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
		title="Selamat Datang Kembali"
		icon="i-lucide-lock"
		:submit="{ label: 'Masuk' }"
		@submit="onSubmit"
	>
		<template #description>
			Belum punya akun? <ULink
				to="/signup"
				class="text-primary font-medium"
			>Daftar sekarang</ULink>.
		</template>

		<template #password-hint>
			<ULink
				to="/"
				class="text-primary font-medium"
				tabindex="-1"
			>Lupa kata sandi?</ULink>
		</template>

		<template #footer>
			Dengan masuk, Anda menyetujui <ULink
				to="/docs"
				class="text-primary font-medium"
			>Kode Etik Komunitas</ULink> Majalengka Tech.
		</template>
	</UAuthForm>
</template>
