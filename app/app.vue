<script setup lang="ts">
const colorMode = useColorMode()

const color = computed(() => colorMode.value === 'dark' ? '#020618' : 'white')

const isDark = computed(() => colorMode.value === 'dark')
const faviconSvg = computed(() => isDark.value ? '/favicon-dark.svg' : '/favicon-light.svg')
const faviconApple = computed(() => isDark.value ? '/darklogo.png' : '/lightlogo.png')

useHead({
	meta: [
		{ charset: 'utf-8' },
		{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
		{ key: 'theme-color', name: 'theme-color', content: color }
	],
	link: [
		{
			key: 'favicon-light',
			rel: 'icon',
			type: 'image/svg+xml',
			href: '/favicon-light.svg',
			media: '(prefers-color-scheme: light)'
		},
		{
			key: 'favicon-dark',
			rel: 'icon',
			type: 'image/svg+xml',
			href: '/favicon-dark.svg',
			media: '(prefers-color-scheme: dark)'
		},
		{
			key: 'favicon-dynamic',
			rel: 'icon',
			type: 'image/svg+xml',
			href: faviconSvg
		},
		{
			key: 'favicon-ico',
			rel: 'alternate icon',
			type: 'image/x-icon',
			href: '/favicon.ico'
		},
		{
			key: 'apple-touch-icon',
			rel: 'apple-touch-icon',
			href: faviconApple
		}
	],
	htmlAttrs: {
		lang: 'id'
	}
})

useSeoMeta({
	titleTemplate: '%s · Majalengka Tech',
	twitterCard: 'summary_large_image'
})

const { data: navigation } = await useAsyncData('navigation', () => queryCollectionNavigation('docs'), {
	transform: data => data.find(item => item.path === '/docs')?.children || []
})
const { data: files } = useLazyAsyncData('search', () => queryCollectionSearchSections('docs'), {
	server: false
})

const { data: blogPosts } = useLazyAsyncData('search-posts', () => queryCollection('posts').all(), {
	server: false
})
const { data: projectsData } = useLazyFetch('/api/projects')

const searchTerm = ref('')

// Limit docs navigation when search term is empty to keep initial view under 10 items
const filteredNavigation = computed(() => {
	if (!navigation.value) return []
	if (searchTerm.value.trim()) return navigation.value
	return navigation.value.slice(0, 3)
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
	const q = searchTerm.value.trim()

	if (blogPosts.value && blogPosts.value.length > 0) {
		const posts = q ? blogPosts.value : blogPosts.value.slice(0, 2)
		groups.push({
			id: 'blog',
			label: 'Blog & Artikel Komunitas',
			items: posts.map(post => ({
				id: `blog-${post.path}`,
				label: post.title,
				description: post.description || 'Artikel dan wawasan komunitas Majalengka Tech',
				icon: 'i-lucide-newspaper',
				to: post.path,
				suffix: post.badge?.label || 'Blog'
			}))
		})
	}

	const allProjects = (projectsData.value?.projects as Array<{
		id: number
		title: string
		description: string
		tags?: string | null
		author?: { name?: string | null }
	}>) || []

	if (allProjects.length > 0) {
		const projects = q ? allProjects : allProjects.slice(0, 2)
		groups.push({
			id: 'projects',
			label: 'Showcase Projek Developer',
			items: projects.map(p => ({
				id: `project-${p.id}`,
				label: p.title,
				description: p.description,
				icon: 'i-lucide-folder-git-2',
				to: `/projek#project-${p.id}`,
				suffix: p.tags?.split(',')[0]?.trim() || p.author?.name || 'Showcase'
			}))
		})
	}

	return groups
})

provide('navigation', navigation)
</script>

<template>
	<UApp>
		<NuxtLoadingIndicator />

		<NuxtLayout>
			<NuxtPage />
		</NuxtLayout>

		<ClientOnly>
			<LazyUContentSearch
				v-model:search-term="searchTerm"
				:files="files"
				:navigation="filteredNavigation"
				:groups="searchGroups"
				:links="navLinks"
				:color-mode="false"
				:fuse="{ resultLimit: 10 }"
				placeholder="Cari dokumentasi, artikel blog, dan showcase projek..."
			/>
		</ClientOnly>
	</UApp>
</template>
