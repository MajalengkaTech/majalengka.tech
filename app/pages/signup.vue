<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
	layout: 'auth'
})

useSeoMeta({
	title: 'Daftar sebagai Kreator',
	description: 'Buat akun untuk memamerkan proyek dan profilmu sebagai developer atau desainer Majalengka.'
})

const { loggedIn, user } = useUserSession()
const authClient = useAuthClient()
const toast = useToast()
const loading = ref(false)

watchEffect(() => {
	if (loggedIn.value) {
		const u = user.value as { username?: string | null } | null
		if (!u?.username) {
			navigateTo('/dashboard/settings?setup=username')
		} else {
			navigateTo('/dashboard')
		}
	}
})

const fields = [{
	name: 'name',
	type: 'text' as const,
	label: 'Nama',
	placeholder: 'Masukkan nama kamu',
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
	placeholder: 'Minimal 8 karakter'
}]

const providers = [{
	label: 'Daftar dengan GitHub',
	icon: 'i-simple-icons-github',
	color: 'neutral' as const,
	onClick: async () => {
		await authClient?.signIn.social({
			provider: 'github',
			callbackURL: '/dashboard/settings?setup=username'
		})
	}
}, {
	label: 'Daftar dengan Google',
	icon: 'i-simple-icons-google',
	color: 'neutral' as const,
	onClick: async () => {
		await authClient?.signIn.social({
			provider: 'google',
			callbackURL: '/dashboard/settings?setup=username'
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
			callbackURL: '/dashboard/settings?setup=username'
		})

		if (error) {
			toast.add({
				title: 'Belum bisa mendaftar',
				description: authErrorMessage(error, 'Akunmu belum berhasil dibuat. Periksa isian form, lalu coba lagi.'),
				color: 'error'
			})
			return
		}

		toast.add({
			title: 'Akunmu sudah dibuat',
			description: 'Sekarang pilih username supaya profil publikmu bisa dibuka orang lain.',
			color: 'success'
		})
		await navigateTo('/dashboard/settings?setup=username')
	} catch {
		toast.add({
			title: 'Belum bisa mendaftar',
			description: 'Server belum bisa dihubungi. Periksa koneksimu, lalu coba lagi.',
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
		separator="atau"
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
			Sebelum mengunggah, baca <ULink
				to="/docs"
				class="text-primary font-medium"
			>panduan memamerkan proyek</ULink>.
		</template>
	</UAuthForm>
</template>
