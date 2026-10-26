<script setup lang="ts">
const route = useRoute()
const { open: searchOpen } = useContentSearch()
const { loggedIn, user } = useSessionView()

const open = ref(false)
const isDocs = computed(() => route.path === '/docs' || route.path.startsWith('/docs/'))

watch(searchOpen, (value) => {
	if (value) {
		open.value = false
	}
})

const items = computed(() => [{
	label: 'Showcase',
	to: '/projek'
}, {
	label: 'Kreator',
	to: '/kreator'
}, {
	label: 'Tutorial',
	to: '/tutorial'
}, {
	label: 'Tentang',
	to: '/tentang'
}, {
	label: 'Panduan',
	to: '/docs',
	active: isDocs.value
}])
</script>

<template>
	<UHeader :toggle="false">
		<template #left>
			<NuxtLink
				to="/"
				class="focus-visible:outline-3 outline-primary/25 rounded-md p-1 -ms-1"
			>
				<AppLogo
					compact
					class="h-7 w-auto shrink-0"
				/>
			</NuxtLink>
		</template>

		<UNavigationMenu
			:items="items"
			variant="link"
		/>

		<template #right>
			<MajaAskButton />

			<UColorModeButton class="hidden lg:inline-flex" />

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
				to="https://github.com/majalengkatech"
				target="_blank"
				aria-label="Majalengka Tech di GitHub"
				class="hidden sm:inline-flex"
			/>

			<template v-if="loggedIn && user">
				<ClientOnly>
					<NotificationBell />
				</ClientOnly>
				<AppAccountPopover />
			</template>

			<template v-else>
				<UButton
					icon="i-lucide-log-in"
					color="neutral"
					variant="ghost"
					to="/login"
					aria-label="Masuk"
					title="Masuk"
				/>
			</template>
		</template>

		<template #toggle>
			<UButton
				icon="i-lucide-menu"
				color="neutral"
				variant="ghost"
				aria-label="Buka menu"
				class="lg:hidden"
				@click="open = true"
			/>
		</template>
	</UHeader>

	<AppMobileMenu v-model:open="open" />
</template>
