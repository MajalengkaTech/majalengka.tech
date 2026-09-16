<script setup lang="ts">
const colorMode = useColorMode()

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
	htmlAttrs: {
		lang: 'id'
	}
})

useSeoMeta({
	titleTemplate: '%s · Majalengka Tech',
	twitterCard: 'summary_large_image'
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
	'inisiatif': 'i-lucide-rocket',
	'design-system': 'i-lucide-palette',
	'open-knowledge-format': 'i-lucide-brain'
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

const { data: blogPosts } = useLazyAsyncData('search-posts', () => queryCollection('posts').all(), {
	server: false
})
const { data: projectsData } = useLazyFetch('/api/projects')

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

	if (blogPosts.value && blogPosts.value.length > 0) {
		groups.push({
			id: 'blog',
			label: 'Blog & Artikel Komunitas',
			items: blogPosts.value.map(post => ({
				id: `blog-${post.path}`,
				label: post.title,
				description: post.description || 'Artikel dan wawasan komunitas Majalengka Tech',
				icon: 'i-lucide-newspaper',
				to: post.path,
				suffix: post.badge?.label || 'Blog'
			}))
		})
	}

	const projects = (projectsData.value?.projects as Array<{
		id: number
		title: string
		description: string
		tags?: string | null
		author?: { name?: string | null }
	}>) || []

	if (projects.length > 0) {
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
				placeholder="Cari dokumentasi, artikel blog, dan showcase projek..."
			/>
		</ClientOnly>
	</UApp>
</template>
