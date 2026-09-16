<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'

const route = useRoute()
const navigation = inject<Ref<ContentNavigationItem[]>>('navigation')
const { open: searchOpen } = useContentSearch()
const { loggedIn, user, clear } = useUserSession()

const open = ref(false)
const isDocs = computed(() => route.path === '/docs' || route.path.startsWith('/docs/'))

watch(searchOpen, (value) => {
	if (value) {
		open.value = false
	}
})

async function handleLogout() {
	await clear()
	await navigateTo('/')
}

const userMenuItems = computed(() => [
	[
		{
			label: user.value?.name || 'Developer',
			avatar: {
				src: user.value?.avatar
			}
		}
	],
	[
		{
			label: 'Dashboard',
			icon: 'i-lucide-layout-dashboard',
			to: '/dashboard'
		},
		{
			label: 'Projek Saya',
			icon: 'i-lucide-folder-git-2',
			to: '/dashboard/projects'
		},
		{
			label: 'Edit Profil',
			icon: 'i-lucide-user-cog',
			to: '/dashboard/settings'
		}
	],
	[
		{
			label: 'Keluar (Logout)',
			icon: 'i-lucide-log-out',
			color: 'error' as const,
			onSelect: () => handleLogout()
		}
	]
])

const authMenuItems = computed(() => [
	[
		{
			label: 'Masuk (Login)',
			icon: 'i-lucide-log-in',
			to: '/login'
		},
		{
			label: 'Daftar Akun',
			icon: 'i-lucide-user-plus',
			to: '/signup'
		}
	]
])

const items = computed(() => [{
	label: 'Dokumentasi',
	to: '/docs',
	active: isDocs.value
}, {
	label: 'Blog',
	to: '/blog'
}, {
	label: 'Showcase',
	to: '/projek'
}])
</script>

<template>
	<UHeader v-model:open="open">
		<template #left>
			<NuxtLink
				to="/"
				class="focus-visible:outline-3 outline-primary/25 rounded-md p-1 -ms-1"
			>
				<AppLogo class="w-auto h-7 shrink-0" />
			</NuxtLink>
		</template>

		<UNavigationMenu
			:items="items"
			variant="link"
		/>

		<template #right>
			<UColorModeButton />

			<UContentSearchButton
				:collapsed="true"
				color="neutral"
				variant="ghost"
				aria-label="Pencarian"
			/>

			<UButton
				icon="i-simple-icons-github"
				color="neutral"
				variant="ghost"
				to="https://github.com/majalengka-tech"
				target="_blank"
				aria-label="Majalengka Tech on GitHub"
				class="hidden sm:inline-flex"
			/>

			<template v-if="loggedIn && user">
				<UDropdownMenu :items="userMenuItems">
					<UButton
						color="neutral"
						variant="ghost"
						class="p-0.5 rounded-full"
						aria-label="Menu Pengguna"
					>
						<UAvatar
							:src="user.avatar"
							:alt="user.name"
							size="sm"
						/>
					</UButton>
				</UDropdownMenu>
			</template>

			<template v-else>
				<UDropdownMenu :items="authMenuItems">
					<UButton
						icon="i-lucide-circle-user"
						label="Akun"
						color="neutral"
						variant="outline"
						trailing-icon="i-lucide-chevron-down"
						size="sm"
						class="hidden sm:inline-flex"
					/>
					<UButton
						icon="i-lucide-circle-user"
						color="neutral"
						variant="ghost"
						size="sm"
						aria-label="Akun"
						class="sm:hidden"
					/>
				</UDropdownMenu>
			</template>
		</template>

		<template #body>
			<UContentSearchButton
				:collapsed="false"
				class="mb-4 w-full"
			/>

			<UNavigationMenu
				:items="items"
				orientation="vertical"
				class="-mx-2.5"
			/>

			<template v-if="isDocs">
				<USeparator class="my-6" />

				<UContentNavigation
					:navigation="navigation"
					highlight
				/>
			</template>

			<USeparator class="my-6" />

			<template v-if="loggedIn && user">
				<div class="flex items-center gap-3 p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 mb-3">
					<UAvatar
						:src="user.avatar"
						:alt="user.name"
					/>
					<div class="flex flex-col">
						<span class="font-medium text-sm">{{ user.name }}</span>
						<span class="text-xs text-muted">{{ user.email || user.provider }}</span>
					</div>
				</div>
				<UButton
					label="Keluar (Logout)"
					color="error"
					variant="subtle"
					block
					@click="handleLogout"
				/>
			</template>

			<template v-else>
				<UButton
					label="Masuk"
					color="neutral"
					variant="subtle"
					to="/login"
					block
					class="mb-3"
				/>
				<UButton
					label="Daftar Developer"
					color="primary"
					to="/signup"
					block
				/>
				<UButton
					label="GitHub Majalengka Tech"
					icon="i-simple-icons-github"
					color="neutral"
					variant="subtle"
					to="https://github.com/majalengka-tech"
					target="_blank"
					block
					class="mt-3"
				/>
			</template>
		</template>
	</UHeader>
</template>
