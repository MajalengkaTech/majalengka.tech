<script setup lang="ts">
// Menu akun di header (ponsel dan desktop): avatar membuka popover berisi kartu akun, pintasan, dan tombol keluar.
// Email tidak ditampilkan; yang tampil nama dan @username.
const { signOut } = useUserSession()
const { user } = useSessionView()
const toast = useToast()

const open = ref(false)
const loggingOut = ref(false)
const username = computed(() => (user.value as { username?: string | null } | null)?.username || null)
const avatar = computed(() => (user.value as { image?: string | null } | null)?.image || undefined)

const links = computed(() => [
	...(username.value ? [{ label: 'Profil Publik', icon: 'i-lucide-circle-user', to: `/${username.value}` }] : []),
	{ label: 'Dashboard', icon: 'i-lucide-layout-dashboard', to: '/dashboard' },
	{ label: 'Proyek Saya', icon: 'i-lucide-folder-git-2', to: '/dashboard/projects' },
	{ label: 'Edit Profil', icon: 'i-lucide-user-cog', to: '/dashboard/settings' }
])

// Selalu kembali ke beranda, juga saat request logout gagal; replace supaya tombol Back tidak membuka dashboard lagi.
async function logout() {
	loggingOut.value = true
	try {
		await signOut()
	} catch {
		toast.add({ title: 'Gagal keluar', description: 'Sesi belum terhapus. Coba keluar lagi sebentar.', color: 'error' })
	} finally {
		loggingOut.value = false
		open.value = false
		await navigateTo('/', { replace: true })
	}
}
</script>

<template>
	<UPopover
		v-model:open="open"
		:content="{ align: 'end', sideOffset: 8 }"
		:ui="{ content: 'w-56 p-2' }"
	>
		<UButton
			color="neutral"
			variant="ghost"
			class="rounded-full p-0.5"
			aria-label="Menu akun"
		>
			<UAvatar
				:src="avatar"
				:alt="user?.name"
				size="sm"
			/>
		</UButton>

		<template #content>
			<div class="flex flex-col gap-3">
				<div class="flex items-center gap-2.5 px-1 pt-1">
					<UAvatar
						:src="avatar"
						:alt="user?.name"
						size="md"
					/>
					<div class="flex min-w-0 flex-col">
						<span class="truncate text-sm font-semibold text-highlighted">{{ user?.name || 'Kreator' }}</span>
						<span
							v-if="username"
							class="truncate text-xs text-muted"
						>@{{ username }}</span>
					</div>
				</div>
				<nav
					aria-label="Pintasan akun"
					class="flex flex-col gap-0.5 border-y border-default py-2"
				>
					<UButton
						v-for="link in links"
						:key="link.to"
						:label="link.label"
						:icon="link.icon"
						:to="link.to"
						color="neutral"
						variant="ghost"
						size="sm"
						block
						class="justify-start"
						@click="open = false"
					/>
				</nav>
				<UButton
					label="Keluar"
					icon="i-lucide-log-out"
					color="error"
					variant="ghost"
					size="sm"
					block
					class="justify-start"
					:loading="loggingOut"
					@click="logout"
				/>
			</div>
		</template>
	</UPopover>
</template>
