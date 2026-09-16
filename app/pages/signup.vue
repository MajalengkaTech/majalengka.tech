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

const { loggedIn } = useUserSession()
const authClient = useAuthClient()
const toast = useToast()
const loading = ref(false)

watchEffect(() => {
	if (loggedIn.value) {
		navigateTo('/dashboard')
	}
})

const fields = [{
	name: 'name',
	type: 'text' as const,
	label: 'Nama Lengkap / Username',
	placeholder: 'Masukkan nama Anda',
	required: true
}, {
	name: 'email',
	type: 'text' as const,
	label: 'Email',
	placeholder: 'Masukkan email aktif',
	required: true
}, {
	name: 'password',
	label: 'Kata Sandi',
	type: 'password' as const,
	placeholder: 'Buat kata sandi aman'
}]

const providers = [{
	label: 'Daftar dengan GitHub',
	icon: 'i-simple-icons-github',
	color: 'neutral' as const,
	onClick: async () => {
		await authClient?.signIn.social({
			provider: 'github',
			callbackURL: '/dashboard'
		})
	}
}, {
	label: 'Daftar dengan Google',
	icon: 'i-simple-icons-google',
	color: 'neutral' as const,
	onClick: async () => {
		await authClient?.signIn.social({
			provider: 'google',
			callbackURL: '/dashboard'
		})
	}
}]

const schema = z.object({
	name: z.string().min(2, 'Nama minimal 2 karakter'),
	email: z.string().email('Format email tidak valid'),
	password: z.string().min(8, 'Kata sandi minimal 8 karakter')
})

type Schema = z.output<typeof schema>

async function onSubmit(payload: FormSubmitEvent<Schema>) {
	if (!authClient) return
	try {
		loading.value = true
		const { error } = await authClient.signUp.email({
			name: payload.data.name,
			email: payload.data.email,
			password: payload.data.password,
			callbackURL: '/dashboard'
		})

		if (error) {
			toast.add({
				title: 'Gagal Mendaftar',
				description: error.message || 'Terjadi kesalahan saat mendaftar.',
				color: 'error'
			})
			return
		}

		toast.add({
			title: 'Pendaftaran Berhasil',
			description: `Selamat datang di Majalengka Tech, ${payload.data.name}!`,
			color: 'success'
		})
		await navigateTo('/dashboard')
	} catch (err: unknown) {
		const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat mendaftar.'
		toast.add({
			title: 'Gagal Mendaftar',
			description: errorMessage,
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
			Dengan mendaftar, Anda menyetujui <ULink
				to="/docs"
				class="text-primary font-medium"
			>Ketentuan & Pedoman Komunitas</ULink>.
		</template>
	</UAuthForm>
</template>
