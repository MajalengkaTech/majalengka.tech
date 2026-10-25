<script setup lang="ts">
const { user } = useUserSession()
const authClient = useAuthClient()
const toast = useToast()
const route = useRoute()
const router = useRouter()
const { data: features } = await useSiteFeatures()
const sending = ref(false)
const sent = ref(false)

const account = computed(() => user.value as { email?: string, emailVerified?: boolean } | null)
const show = computed(() => features.value.email && account.value?.email && account.value.emailVerified === false)

// Link verifikasi kembali ke sini dengan ?verified=1, atau dengan ?error=... bila link tidak berlaku.
onMounted(() => {
	const { verified, error, ...rest } = route.query
	if (!verified && !error) return
	if (error) {
		toast.add({
			title: 'Email belum terverifikasi',
			description: authErrorMessage({ code: String(error) }, 'Link verifikasi tidak berlaku. Kirim ulang link dari banner di dashboard.'),
			color: 'error'
		})
	} else {
		toast.add({ title: 'Email terverifikasi', description: 'Terima kasih, email-mu sudah dipastikan.', color: 'success' })
	}
	router.replace({ query: rest })
})

async function resend() {
	if (!authClient || !account.value?.email) return
	sending.value = true
	try {
		const { error } = await authClient.sendVerificationEmail({
			email: account.value.email,
			callbackURL: `${route.path}?verified=1`
		})
		if (error) {
			toast.add({
				title: 'Link belum terkirim',
				description: authErrorMessage(error, 'Coba kirim ulang beberapa saat lagi.'),
				color: 'error'
			})
			return
		}
		sent.value = true
	} catch {
		toast.add({ title: 'Link belum terkirim', description: 'Server belum bisa dihubungi. Periksa koneksimu, lalu coba lagi.', color: 'error' })
	} finally {
		sending.value = false
	}
}
</script>

<template>
	<UAlert
		v-if="show"
		color="warning"
		variant="subtle"
		icon="i-lucide-mail-warning"
		title="Email-mu belum terverifikasi"
		:description="sent
			? `Link verifikasi sudah dikirim ke ${account?.email}. Cek kotak masuk atau folder spam.`
			: `Verifikasi ${account?.email} supaya kamu bisa mengatur ulang kata sandi kalau lupa.`"
		:actions="sent ? [] : [{ label: 'Kirim Link Verifikasi', icon: 'i-lucide-send', color: 'warning', variant: 'outline', loading: sending, onClick: resend }]"
	/>
</template>
