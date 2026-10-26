<script setup lang="ts">
import * as z from 'zod'
import type { AuthFormField, ButtonProps, FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
	layout: 'auth'
})

useSeoMeta({
	title: 'Masuk',
	description: 'Masuk untuk mengelola proyek dan profil kreatormu di Majalengka Tech.'
})

const { loggedIn, user } = useUserSession()
const authClient = useAuthClient()
const toast = useToast()
const loading = ref(false)
const route = useRoute()
const { data: features } = await useSiteFeatures()
const captchaToken = ref('')
const turnstile = useTemplateRef<{ reset: () => void }>('turnstile')
const captchaPending = computed(() => Boolean(features.value.turnstileSiteKey) && !captchaToken.value)

// Redirect jika sudah login
watchEffect(() => {
	if (loggedIn.value) {
		const u = user.value as { username?: string | null } | null
		if (!u?.username) {
			navigateTo('/dashboard/settings?setup=username')
			return
		}
		const destination = (route.query.redirect as string) || '/dashboard'
		navigateTo(destination)
	}
})

const fields: AuthFormField[] = [{
	name: 'email',
	type: 'email',
	label: 'Email',
	placeholder: 'nama@email.com',
	required: true
}, {
	name: 'password',
	label: 'Kata Sandi',
	type: 'password',
	placeholder: 'Masukkan kata sandi',
	required: true
}, {
	name: 'remember',
	type: 'checkbox',
	label: 'Ingat saya'
}]

// Label dipendekkan supaya dua tombol muat berdampingan di layar kecil.
const providers: ButtonProps[] = [{
	label: 'GitHub',
	icon: 'i-simple-icons-github',
	color: 'neutral',
	variant: 'subtle',
	onClick: async () => {
		await authClient?.signIn.social({
			provider: 'github',
			callbackURL: (route.query.redirect as string) || '/dashboard'
		})
	}
}, {
	label: 'Google',
	icon: 'i-simple-icons-google',
	color: 'neutral',
	variant: 'subtle',
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
			rememberMe: payload.data.remember,
			fetchOptions: { headers: { 'x-captcha-response': captchaToken.value } }
		})

		if (error) {
			toast.add({
				title: 'Belum bisa masuk',
				description: authErrorMessage(error, 'Kamu belum bisa masuk. Periksa email dan kata sandimu, lalu coba lagi.'),
				color: 'error'
			})
			return
		}

		toast.add({
			title: 'Kamu sudah masuk',
			description: 'Selamat datang kembali di Majalengka Tech.',
			color: 'success'
		})
		const destination = (route.query.redirect as string) || '/dashboard'
		await navigateTo(destination)
	} catch {
		toast.add({
			title: 'Belum bisa masuk',
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
	<UAuthForm
		:fields="fields"
		:schema="schema"
		:providers="providers"
		:loading="loading"
		separator="atau"
		title="Selamat datang kembali"
		icon="i-lucide-lock"
		:submit="{ label: 'Masuk', block: true, size: 'lg', disabled: captchaPending }"
		:ui="{
			root: 'w-full space-y-4 sm:space-y-6',
			leading: 'hidden sm:block mb-2',
			title: 'text-lg sm:text-xl',
			description: 'mt-1 text-sm sm:text-base',
			body: 'flex flex-col gap-y-4 sm:gap-y-6',
			providers: 'grid grid-cols-2 gap-2 space-y-0 sm:gap-3',
			form: 'space-y-4 sm:space-y-5'
		}"
		@submit="onSubmit"
	>
		<template #description>
			Belum punya akun? <ULink
				to="/signup"
				class="text-primary font-medium"
			>Daftar sekarang</ULink>.
		</template>

		<template
			v-if="features.email"
			#password-hint
		>
			<ULink
				to="/lupa-sandi"
				class="text-xs font-medium text-primary sm:text-sm"
			>Lupa kata sandi?</ULink>
		</template>

		<template
			v-if="features.turnstileSiteKey"
			#validation
		>
			<TurnstileWidget
				ref="turnstile"
				v-model="captchaToken"
				:site-key="features.turnstileSiteKey"
				action="login"
			/>
		</template>
	</UAuthForm>
</template>
