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

const { loggedIn } = useUserSession()
const authClient = useAuthClient()
const toast = useToast()
const loading = ref(false)
const route = useRoute()

// Redirect jika sudah login
watchEffect(() => {
	if (loggedIn.value) {
		const destination = (route.query.redirect as string) || '/dashboard'
		navigateTo(destination)
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
	type: 'checkbox' as const
}]

const providers = [{
	label: 'Masuk dengan GitHub',
	icon: 'i-simple-icons-github',
	color: 'neutral' as const,
	onClick: async () => {
		await authClient?.signIn.social({
			provider: 'github',
			callbackURL: (route.query.redirect as string) || '/dashboard'
		})
	}
}, {
	label: 'Masuk dengan Google',
	icon: 'i-simple-icons-google',
	color: 'neutral' as const,
	onClick: async () => {
		await authClient?.signIn.social({
			provider: 'google',
			callbackURL: (route.query.redirect as string) || '/dashboard'
		})
	}
}]

const schema = z.object({
	email: z.string().email('Format email tidak valid'),
	password: z.string().min(1, 'Kata sandi wajib diisi'),
	remember: z.boolean().optional()
})

type Schema = z.output<typeof schema>

async function onSubmit(payload: FormSubmitEvent<Schema>) {
	if (!authClient) return
	try {
		loading.value = true
		const { error } = await authClient.signIn.email({
			email: payload.data.email,
			password: payload.data.password,
			rememberMe: payload.data.remember
		})

		if (error) {
			toast.add({
				title: 'Gagal Masuk',
				description: error.message || 'Email atau kata sandi tidak valid.',
				color: 'error'
			})
			return
		}

		toast.add({
			title: 'Berhasil Masuk',
			description: 'Selamat datang kembali di Majalengka Tech!',
			color: 'success'
		})
		const destination = (route.query.redirect as string) || '/dashboard'
		await navigateTo(destination)
	} catch (err: unknown) {
		const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.'
		toast.add({
			title: 'Gagal Masuk',
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

		<template #remember-field="{ state }">
			<UCheckbox
				v-model="state.remember"
				label="Ingat saya"
				name="remember"
			/>
		</template>

		<template #footer>
			Dengan masuk, Anda menyetujui <ULink
				to="/docs"
				class="text-primary font-medium"
			>Kode Etik Komunitas</ULink> Majalengka Tech.
		</template>
	</UAuthForm>
</template>
