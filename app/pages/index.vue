<script setup lang="ts">
import type { ProjectItem } from '~/types/project'

interface CreatorSummary {
	id: string
	name: string
	username: string | null
	avatarUrl: string | null
	creatorRole: string | null
	location: string | null
	openToWork: boolean
	projectCount: number
	coverUrl: string | null
}

interface ShowcaseStats {
	totalProjects: number
	totalCreators: number
	categories: Partial<Record<ProjectCategory, number>>
}

const { data: page } = await useAsyncData('index', () => queryCollection('index').first())

const [stats$, featured$, latest$, creators$] = await Promise.all([
	useFetch<ShowcaseStats>('/api/projects/stats', { key: 'home-stats' }),
	useFetch<{ projects: ProjectItem[] }>('/api/projects', { key: 'home-featured', query: { featured: 1, limit: 4 } }),
	useFetch<{ projects: ProjectItem[] }>('/api/projects', { key: 'home-latest', query: { limit: 6 } }),
	useFetch<{ creators: CreatorSummary[] }>('/api/creators', { key: 'home-creators', query: { limit: 48 } })
])

const featured = computed(() => featured$.data.value?.projects || [])
const latest = computed(() => latest$.data.value?.projects || [])
const creators = computed(() => creators$.data.value?.creators || [])
const stats = computed(() => stats$.data.value || { totalProjects: 0, totalCreators: 0, categories: {} })

const isMounted = ref(false)
onMounted(() => {
	isMounted.value = true
})

// Tepat 5 proyek terbaru untuk carousel showcase
const showcaseProjects = computed(() => {
	const list = latest.value
	if (!list.length) return []
	if (list.length >= 5) return list.slice(0, 5)
	const filled: ProjectItem[] = []
	let index = 0
	while (filled.length < 5) {
		const item = list[index % list.length]
		if (item) filled.push(item)
		index++
	}
	return filled
})

// Mozaik hero hanya dari proyek asli yang punya gambar; kurang dari 3 berarti hero tampil tanpa mozaik.
const mosaic = computed(() => {
	const seen = new Set<number>()
	return [...featured.value, ...latest.value]
		.filter((project) => {
			if (!project.thumbnailUrl || seen.has(project.id)) return false
			seen.add(project.id)
			return true
		})
		.slice(0, 3)
})

const categories = computed(() => (Object.keys(PROJECT_CATEGORIES) as ProjectCategory[])
	.map(key => ({ key, label: PROJECT_CATEGORIES[key], total: stats.value.categories[key] || 0 }))
	.filter(category => category.total > 0))

// Judul hero dirender per kata di server; frasa dalam [..]{..} di konten menjadi sorotan bergaris bawah mangga.
const heroTitle = computed(() => {
	const raw = page.value?.title || ''
	const words = (text = '') => text.trim().split(/\s+/).filter(Boolean)
	const match = raw.match(/^(.*?)\[(.+?)\]\{[^}]*\}(.*)$/)
	return match
		? { before: words(match[1]), mark: words(match[2]), after: words(match[3]) }
		: { before: words(raw), mark: [], after: [] }
})

const hero = useTemplateRef('hero')

// Kartu di bawah layar muncul bertahap saat di-scroll, supaya grid panjang terbaca per baris.
useReveal(useTemplateRef<HTMLElement>('home'))

// Momen sambutan: Teks hero langsung tampil seketika (FCP instan), media hero diperhalus dengan transisi ringan.
onMounted(() => {
	const html = document.documentElement
	const root = (hero.value as { $el?: HTMLElement } | null)?.$el
	if (!root || !motionAllowed() || html.classList.contains('hero-seen')) return

	html.classList.add('hero-seen')
	try {
		sessionStorage.setItem('mt-hero-seen', '1')
	} catch {
		// Mode privat bisa menolak sessionStorage
	}

	const media = root.querySelector<HTMLElement>('[data-hero-media]')
	if (media) {
		media.animate([
			{ opacity: 0, transform: 'scale(0.98)' },
			{ opacity: 1, transform: 'scale(1)' }
		], {
			duration: 400,
			easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
		})
	}
})

const title = page.value?.seo?.title || page.value?.title
const description = page.value?.seo?.description || page.value?.description

useSeoMeta({
	titleTemplate: '',
	title,
	ogTitle: title,
	description,
	ogDescription: description
})

defineOgImage('Saas', {
	headline: 'Proyek Kreator Majalengka',
	title: 'Majalengka Tech',
	description
})
</script>

<template>
	<div
		v-if="page"
		ref="home"
	>
		<UPageHero
			ref="hero"
			data-hero
			:description="page.description"
			:links="page.hero.links"
			orientation="horizontal"
			:ui="{
				container: 'pt-6 pb-12 sm:pt-10 sm:pb-16 lg:py-20 gap-10 lg:gap-14',
				title: 'text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance',
				description: 'text-base sm:text-lg text-muted text-pretty max-w-xl'
			}"
		>
			<template #top>
				<HeroBackground />
			</template>

			<template #title>
				<span>{{ heroTitle.before.join(' ') }}</span>
				{{ heroTitle.before.length ? ' ' : '' }}
				<span
					v-if="heroTitle.mark.length"
					class="text-primary"
				>{{ heroTitle.mark.join(' ') }}</span>
				{{ heroTitle.after.length ? ' ' : '' }}
				<span>{{ heroTitle.after.join(' ') }}</span>
			</template>

			<template
				v-if="stats.totalProjects > 0"
				#headline
			>
				<span class="text-sm font-medium text-muted">
					{{ stats.totalProjects }} proyek dari {{ stats.totalCreators }} kreator
				</span>
			</template>

			<div
				v-if="mosaic.length === 3"
				data-hero-media
				class="grid grid-cols-2 grid-rows-2 gap-3 sm:gap-4"
			>
				<NuxtLink
					v-for="(project, index) in mosaic"
					:key="project.id"
					:to="`/projek/${project.slug}`"
					class="group relative block overflow-hidden rounded-xl bg-elevated outline-primary/40 outline-offset-2 focus-visible:outline-3"
					:class="index === 0 ? 'row-span-2' : 'aspect-4/3'"
					:aria-label="`${project.title} oleh ${project.author?.name}`"
				>
					<NuxtImg
						:src="fileSrc(project.thumbnailUrl!)"
						alt=""
						class="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
						sizes="320px"
						preset="sampul"
						:loading="index === 0 ? 'eager' : 'lazy'"
						:preload="index === 0 ? { fetchPriority: 'high' } : false"
					/>
				</NuxtLink>
			</div>
			<div
				v-else
				data-hero-media
				class="flex items-center justify-center"
			>
				<HeroIllustration class="h-auto max-h-65 w-full max-w-md object-contain sm:max-h-105" />
			</div>
		</UPageHero>

		<UPageSection
			v-if="featured.length"
			:orientation="featured.length === 1 ? 'horizontal' : 'vertical'"
			:ui="{ container: 'py-12 sm:py-16 lg:py-20' }"
		>
			<template #headline>
				<span class="inline-flex items-center gap-1.5 rounded-sm bg-mango-100 px-2 py-0.5 text-sm font-semibold text-mango-900">
					<UIcon
						name="i-lucide-award"
						class="size-4"
					/>
					Pilihan Kurator
				</span>
			</template>
			<template #title>
				Proyek yang layak kamu buka lebih dulu
			</template>
			<template #description>
				Dipilih kurator Majalengka Tech karena ceritanya kuat dan tampilannya rapi.
			</template>

			<div
				class="grid grid-cols-1 gap-x-8 gap-y-12"
				:class="{ 'md:grid-cols-2': featured.length > 1 }"
			>
				<DashboardProjectCard
					v-for="project in featured"
					:key="project.id"
					:project="project"
					data-reveal
				/>
			</div>
		</UPageSection>

		<UPageSection
			id="showcaseData"
			headline="Showcase Proyek"
			title="Aplikasi & Produk Digital Buatan Developer Majalengka"
			:links="[{
				label: 'Lihat Semua Proyek',
				to: '/projek',
				color: 'neutral',
				size: 'md'
			}]"
			class="overflow-hidden border-x border-t border-default"
			:ui="{
				container: 'relative !flex !flex-col items-center text-center py-12 sm:py-16 lg:py-20 gap-8 lg:gap-10',
				wrapper: 'w-full flex flex-col items-center text-center max-w-2xl mx-auto',
				headline: 'justify-center font-semibold text-primary mb-2',
				title: 'text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-center max-w-2xl mx-auto',
				footer: 'mt-6 flex justify-center w-full',
				links: 'justify-center'
			}"
		>
			<div
				aria-hidden="true"
				class="absolute inset-0 z-[-1] mx-4 block border-x border-default sm:mx-6 lg:mx-8"
			/>
			<UCarousel
				v-slot="{ item }"
				loop
				dots
				wheel-gestures
				arrows
				:autoplay="{ delay: 3000 }"
				:items="showcaseProjects"
				:active="isMounted"
				class="w-full min-w-0"
				:ui="{
					root: 'w-full min-w-0',
					viewport: 'overflow-hidden w-full',
					item: 'showcase-carousel-item',
					container: 'py-2',
					arrows: 'hidden 2xl:block'
				}"
			>
				<UPageCard
					:to="`/projek/${item.slug}`"
					orientation="vertical"
					variant="subtle"
					class="group w-full rounded-none sm:rounded-lg"
					:ui="{
						root: 'bg-elevated/50 ring-1 ring-default hover:bg-elevated hover:ring-primary/40 transition duration-200',
						container: 'flex flex-col p-2 sm:p-4 gap-2',
						title: 'flex items-center gap-1 font-semibold text-highlighted'
					}"
				>
					<template #title>
						<span>
							{{ item.title }}
						</span>
						<UIcon
							name="i-lucide-arrow-up-right"
							class="text-primary opacity-0 transition-opacity duration-150 ease-in-out group-hover:opacity-100"
						/>
					</template>
					<NuxtImg
						:src="fileSrc(item.thumbnailUrl) || '/og-default.png'"
						:alt="item.title"
						width="646"
						height="363"
						sizes="587px sm:445px lg:646px"
						format="webp"
						class="aspect-video w-full rounded-none border border-default object-cover sm:rounded-lg"
						loading="lazy"
					/>
				</UPageCard>
			</UCarousel>
		</UPageSection>

		<UPageSection
			v-if="categories.length"
			:ui="{ container: 'py-12 sm:py-16 lg:py-20' }"
		>
			<template #title>
				Jelajahi per kategori
			</template>

			<ul class="flex flex-wrap justify-center gap-2">
				<li
					v-for="category in categories"
					:key="category.key"
					data-reveal
				>
					<UButton
						:to="`/projek?kategori=${category.key}`"
						color="neutral"
						variant="outline"
						size="lg"
					>
						{{ category.label }}
						<span class="text-muted tabular-nums">{{ category.total }}</span>
					</UButton>
				</li>
			</ul>
		</UPageSection>

		<UPageSection
			v-if="creators.length"
			title="Dibangun oleh talenta digital Majalengka"
			description="Ratusan pengembang, desainer, dan kreator lokal memamerkan karyanya di sini. Terhubung, berbagi inspirasi, dan mulai berkolaborasi."
			orientation="horizontal"
			reverse
			:ui="{
				root: 'border-t border-default bg-linear-to-b from-muted/30 dark:from-muted/20 to-default',
				container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24',
				title: 'text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-highlighted',
				description: 'text-base sm:text-lg text-muted mt-4 max-w-xl'
			}"
		>
			<template #links>
				<div class="mt-6 flex flex-wrap items-center gap-3">
					<UButton
						to="/kreator"
						color="neutral"
						size="lg"
						icon="i-lucide-users"
					>
						Jelajahi Kreator
					</UButton>
					<UButton
						to="https://github.com/majalengkatech"
						target="_blank"
						color="neutral"
						variant="ghost"
						size="lg"
						icon="i-simple-icons-github"
						aria-label="GitHub Majalengka Tech"
					/>
					<UButton
						to="/dashboard/projects/new"
						color="neutral"
						variant="ghost"
						size="lg"
						icon="i-lucide-folder-plus"
						aria-label="Pamerkan Proyekmu"
					/>
				</div>
			</template>

			<div class="w-full max-w-lg lg:max-w-none mx-auto">
				<HomeSectionCreators :creators="creators" />
			</div>
		</UPageSection>

		<USeparator />

		<UPageCTA
			title="Punya proyek yang ingin dipamerkan?"
			description="Unggah tangkapan layar, ceritakan prosesnya, lalu bagikan satu alamat portofolio ke teman, klien, atau perekrut."
			:links="[
				{ label: 'Pamerkan Proyekmu', icon: 'i-lucide-folder-plus', to: '/dashboard/projects/new', size: 'lg' },
				{ label: 'Tentang Majalengka Tech', to: '/tentang', color: 'neutral', variant: 'ghost', size: 'lg' }
			]"
			variant="naked"
		/>
	</div>
</template>
