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
			label: 'Keluar (Logout)',
			icon: 'i-lucide-log-out',
			onSelect: () => handleLogout()
		}
	]
])

const items = computed(() => [{
	label: 'Dokumentasi',
	to: '/docs',
	active: isDocs.value
}, {
	label: 'Inisiatif',
	to: '/docs/inisiatif'
}, {
	label: 'Design System',
	to: '/docs/design-system'
}, {
	label: 'OKF Knowledge',
	to: '/docs/open-knowledge-format'
}, {
	label: 'Blog',
	to: '/blog'
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

			<UContentSearchButton class="lg:hidden" />

			<UButton
				icon="i-simple-icons-github"
				color="neutral"
				variant="ghost"
				to="https://github.com/majalengka-tech"
				target="_blank"
				aria-label="Majalengka Tech on GitHub"
			/>

			<template v-if="loggedIn && user">
				<UDropdownMenu :items="userMenuItems">
					<UButton
						color="neutral"
						variant="ghost"
						class="flex items-center gap-2 p-1.5"
					>
						<UAvatar
							:src="user.avatar"
							:alt="user.name"
							size="sm"
						/>
						<span class="text-sm font-medium hidden sm:inline">{{ user.name }}</span>
					</UButton>
				</UDropdownMenu>
			</template>

			<template v-else>
				<UButton
					label="Masuk"
					color="neutral"
					variant="ghost"
					to="/login"
					class="hidden sm:inline-flex"
				/>

				<UButton
					label="Gabung"
					color="primary"
					trailing-icon="i-lucide-arrow-right"
					to="/signup"
				/>
			</template>
		</template>

		<template #body>
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
			</template>
		</template>
	</UHeader>
</template>
