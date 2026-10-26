<script setup lang="ts">
import { id } from '@nuxt/ui/locale'

const colorMode = useColorMode()
const { loggedIn } = useUserSession()

const color = computed(() => colorMode.value === 'dark' ? '#020618' : 'white')

useHead({
	meta: [
		{ charset: 'utf-8' },
		{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
		{ key: 'theme-color', name: 'theme-color', content: color }
	],
	link: [
		{ rel: 'icon', href: '/favicon.ico' }
	],
	// Jalan sebelum halaman tergambar, supaya elemen yang akan dianimasikan tidak sempat tampil lalu berkedip hilang.
	script: [
		{
			key: 'motion-ready',
			tagPosition: 'head',
			innerHTML: 'try{var d=document.documentElement;if(!matchMedia(\'(prefers-reduced-motion: reduce)\').matches){d.classList.add(\'motion-ready\')}if(sessionStorage.getItem(\'mt-hero-seen\')){d.classList.add(\'hero-seen\')}}catch(e){}'
		}
	],
	htmlAttrs: {
		lang: 'id'
	}
})

// Statistik pengunjung tanpa cookie; halaman kerja kreator dan pengelola tidak dihitung.
if (!import.meta.dev) {
	useHead({
		script: [{
			'key': 'simple-analytics',
			'src': 'https://scripts.simpleanalyticscdn.com/latest.js',
			'async': true,
			'data-ignore-pages': '/dashboard,/dashboard/*,/kelola,/kelola/*'
		}]
	})
}

if (import.meta.client && motionAllowed()) {
	// Halaman SPA (dashboard) tidak membawa skrip <head> di HTML awal, jadi kelasnya dipasang di sini juga.
	document.documentElement.classList.add('motion-ready')
}

const site = useSiteConfig()

// defineOgImage tidak menghasilkan gambar di produksi (zeroRuntime), jadi halaman tanpa gambar sendiri memakai kartu statis ini.
useSeoMeta({
	titleTemplate: '%s · Majalengka Tech',
	twitterCard: 'summary_large_image',
	ogImage: new URL('/og-default.png', site.url).href
})
interface ContentNavItem {
	title: string
	path: string
	stem?: string
	icon?: string
	children?: ContentNavItem[]
	[key: string]: unknown
}

function stripChildIcons(children?: ContentNavItem[]): ContentNavItem[] | undefined {
	if (!children) return undefined
	return children.map(child => ({
		...child,
		icon: undefined,
		children: stripChildIcons(child.children)
	}))
}

const CATEGORY_ICONS: Record<string, string> = {
	'getting-started': 'i-lucide-compass',
	'kontribusi': 'i-lucide-git-pull-request'
}

const { data: navigation } = await useAsyncData('navigation', () => queryCollectionNavigation('docs'), {
	transform: (data) => {
		const docsNav = (data.find(item => item.path === '/docs')?.children || []) as ContentNavItem[]

		return docsNav.map((category) => {
			let categoryIcon = category.icon
			if (!categoryIcon) {
				for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
					if (category.path?.includes(key)) {
						categoryIcon = icon
						break
					}
				}
			}

			return {
				...category,
				icon: categoryIcon || 'i-lucide-folder',
				children: stripChildIcons(category.children)
			}
		})
	}
})
const { data: files } = useLazyAsyncData('search', () => queryCollectionSearchSections('docs'), {
	server: false
})

const { data: tutorialsData, refresh: refreshSearchTutorials } = useLazyFetch<{ tutorials: { id: number, slug: string, title: string, summary: string | null, level: TutorialLevel }[] }>('/api/tutorials', {
	key: 'search-tutorials',
	query: { limit: 60 },
	server: false
})
// Hanya dipakai palet pencarian di browser; tidak diambil saat render server supaya tiap halaman hemat CPU.
const { data: projectsData, refresh: refreshSearchProjects } = useLazyFetch('/api/projects', {
	key: 'search-projects',
	server: false
})

// Daftar proyek diambil sekali saat situs dibuka, jadi proyek yang baru diunggah perlu diambil ulang saat pencarian dibuka.
const { open: searchOpen } = useContentSearch()
watch(searchOpen, (isOpen) => {
	if (isOpen) {
		refreshSearchProjects()
		refreshSearchTutorials()
	}
})

interface SearchGroupItem {
	id: string
	label: string
	description?: string
	icon?: string
	to?: string
	suffix?: string
}

interface SearchGroup {
	id: string
	label: string
	items: SearchGroupItem[]
}

const searchGroups = computed<SearchGroup[]>(() => {
	const groups: SearchGroup[] = []

	const tutorials = tutorialsData.value?.tutorials ?? []
	if (tutorials.length) {
		groups.push({
			id: 'tutorial',
			label: 'Tutorial',
			items: tutorials.map(tutorial => ({
				id: `tutorial-${tutorial.id}`,
				label: tutorial.title,
				description: tutorial.summary || undefined,
				icon: 'i-lucide-book-open',
				to: `/tutorial/${tutorial.slug}`,
				suffix: TUTORIAL_LEVELS[tutorial.level]
			}))
		})
	}

	const projects = (projectsData.value?.projects as Array<{
		id: number
		slug: string
		title: string
		tagline?: string | null
		description: string
		tags?: string | null
		author?: { name?: string | null }
	}>) || []

	if (projects.length > 0) {
		groups.push({
			id: 'projects',
			label: 'Proyek',
			items: projects.map(p => ({
				id: `project-${p.id}`,
				label: p.title,
				description: p.tagline || storyPlainText(p.description, 120),
				icon: 'i-lucide-folder-git-2',
				to: `/projek/${p.slug}`,
				suffix: p.tags?.split(',')[0]?.trim() || p.author?.name || 'Proyek'
			}))
		})
	}

	return groups
})

provide('navigation', navigation)
</script>

<template>
	<UApp :locale="id">
		<NuxtLoadingIndicator :color="'var(--color-primary)'" />

		<NuxtLayout>
			<NuxtPage />
		</NuxtLayout>

		<ClientOnly>
			<LazyUContentSearch
				:files="files"
				:navigation="navigation"
				:groups="searchGroups"
				:links="navLinks"
				:fuse="{ resultLimit: 42 }"
				placeholder="Cari proyek, panduan, atau artikel..."
			/>
			<NotificationsSlideover v-if="loggedIn" />
		</ClientOnly>

		<!-- Muncul hanya bila deploy baru menghapus kode yang sedang dipakai tab ini. -->
		<SkewNotification v-slot="{ isCurrentChunksOutdated, dismiss, reload }">
			<div
				v-if="isCurrentChunksOutdated"
				class="fixed inset-x-4 bottom-4 z-50 sm:left-auto sm:w-96"
			>
				<UAlert
					role="status"
					color="neutral"
					variant="outline"
					icon="i-lucide-refresh-cw"
					title="Versi baru Majalengka Tech sudah tersedia"
					description="Muat ulang halaman supaya semua tombol dan menu tetap berfungsi."
					:actions="[
						{ label: 'Muat Ulang', color: 'primary', onClick: () => reload() },
						{ label: 'Nanti', color: 'neutral', variant: 'ghost', onClick: () => dismiss() }
					]"
					class="bg-default shadow-lg"
				/>
			</div>
		</SkewNotification>
	</UApp>
</template>
