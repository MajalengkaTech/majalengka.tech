<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'

// Menu ponsel buatan sendiri (menggantikan menu bawaan UHeader): kartu navigasi berikon, Tanya Maja, dan isi Panduan
// saat di halaman Panduan. Tombol masuk dan menu akun tetap di header (AppAccountPopover).
const open = defineModel<boolean>('open', { default: false })

const route = useRoute()
const navigation = inject<Ref<ContentNavigationItem[]>>('navigation')
const { loggedIn } = useSessionView()
const majaOpen = useState('maja-chat-open', () => false)

const isDocs = computed(() => route.path === '/docs' || route.path.startsWith('/docs/'))
const links = computed(() => [
	{ label: 'Showcase', description: 'Proyek para kreator', icon: 'i-lucide-layout-grid', to: '/projek' },
	{ label: 'Kreator', description: 'Developer dan desainer', icon: 'i-lucide-users', to: '/kreator' },
	{ label: 'Tutorial', description: 'Belajar dari kreator', icon: 'i-lucide-book-open', to: '/tutorial' },
	{ label: 'Tentang', description: 'Kenapa situs ini ada', icon: 'i-lucide-info', to: '/tentang' },
	{ label: 'Panduan', description: 'Cara memakai situs', icon: 'i-lucide-compass', to: '/docs', active: isDocs.value }
])

function isActive(link: { to: string, active?: boolean }) {
	return link.active ?? (route.path === link.to || route.path.startsWith(`${link.to}/`))
}

function askMaja() {
	open.value = false
	majaOpen.value = true
}

// Menu ditutup setiap kali pindah halaman.
watch(() => route.fullPath, () => {
	open.value = false
})
</script>

<template>
	<USlideover
		v-model:open="open"
		side="right"
		title="Menu"
		description="Navigasi Majalengka Tech"
		:content="{ onOpenAutoFocus: (event: Event) => event.preventDefault() }"
		:ui="{ content: 'max-w-sm', header: 'flex items-center justify-between gap-2 py-3', body: 'flex flex-col gap-3 p-4 sm:p-4', footer: 'flex items-center justify-between gap-2 px-4 py-2' }"
	>
		<template #header>
			<NuxtLink
				to="/"
				class="rounded-md"
			>
				<AppLogo />
			</NuxtLink>
			<UButton
				icon="i-lucide-x"
				color="neutral"
				variant="ghost"
				aria-label="Tutup menu"
				@click="open = false"
			/>
		</template>

		<template #body>
			<UContentSearchButton
				:collapsed="false"
				class="w-full"
			/>

			<nav
				aria-label="Navigasi utama"
				class="flex flex-col gap-1"
			>
				<NuxtLink
					v-for="link in links"
					:key="link.to"
					:to="link.to"
					:aria-current="isActive(link) ? 'page' : undefined"
					class="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors"
					:class="isActive(link) ? 'bg-primary/10' : 'hover:bg-elevated'"
				>
					<span
						class="flex size-8 shrink-0 items-center justify-center rounded-md border"
						:class="isActive(link) ? 'border-primary/40 text-primary' : 'border-default text-muted'"
					>
						<UIcon
							:name="link.icon"
							class="size-4"
						/>
					</span>
					<span class="flex min-w-0 flex-col">
						<span
							class="text-sm font-semibold"
							:class="isActive(link) ? 'text-primary' : 'text-highlighted'"
						>{{ link.label }}</span>
						<span class="truncate text-xs text-muted">{{ link.description }}</span>
					</span>
				</NuxtLink>
			</nav>

			<button
				type="button"
				class="flex items-center gap-3 rounded-lg border border-default bg-elevated/50 px-3 py-2 text-start transition-colors hover:bg-elevated"
				@click="askMaja"
			>
				<MajaMascot
					variant="head"
					:interactive="false"
					class="size-8 shrink-0 text-primary"
				/>
				<span class="flex flex-col">
					<span class="text-sm font-semibold text-highlighted">Tanya Maja</span>
					<span class="text-xs text-muted">Cari kreator, proyek, atau tutorial dengan bertanya.</span>
				</span>
			</button>

			<!-- Isi panduan dilipat secara bawaan supaya menu tetap muat satu layar tanpa digulir. -->
			<UCollapsible
				v-if="isDocs && navigation?.length"
				class="flex flex-col gap-2"
			>
				<UButton
					label="Isi panduan"
					icon="i-lucide-list-tree"
					trailing-icon="i-lucide-chevron-down"
					color="neutral"
					variant="ghost"
					block
					class="justify-start"
					:ui="{ trailingIcon: 'ms-auto transition-transform group-data-[state=open]:rotate-180' }"
				/>
				<template #content>
					<UContentNavigation
						:navigation="navigation"
						highlight
						class="px-1"
					/>
				</template>
			</UCollapsible>

			<UButton
				v-if="!loggedIn"
				label="Daftar sebagai Kreator"
				icon="i-lucide-user-plus"
				to="/signup"
				block
			/>
		</template>

		<template #footer>
			<UColorModeButton />
			<UButton
				label="GitHub"
				icon="i-simple-icons-github"
				color="neutral"
				variant="ghost"
				to="https://github.com/majalengkatech"
				target="_blank"
			/>
		</template>
	</USlideover>
</template>
