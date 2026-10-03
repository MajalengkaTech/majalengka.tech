<script setup lang="ts">
import { animate, stagger } from 'animejs'
import type { ProjectItem } from '~/types/project'

interface CreatorSummary {
	id: string
	name: string
	username: string
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
	useFetch<{ creators: CreatorSummary[] }>('/api/creators', { key: 'home-creators', query: { limit: 8 } })
])

const featured = computed(() => featured$.data.value?.projects || [])
const latest = computed(() => latest$.data.value?.projects || [])
const creators = computed(() => creators$.data.value?.creators || [])
const stats = computed(() => stats$.data.value || { totalProjects: 0, totalCreators: 0, categories: {} })

// Satu fetch gagal sudah cukup membuat beranda tidak lengkap, jadi pengunjung perlu tahu bahwa ini error, bukan halaman yang memang kosong.
const loadFailed = computed(() => [stats$, featured$, latest$, creators$].some(request => request.error.value))
const retrying = ref(false)

async function retryLoad() {
	retrying.value = true
	await Promise.all([stats$, featured$, latest$, creators$].map(request => request.refresh()))
	retrying.value = false
}

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

// Momen sambutan: judul naik per kata, lalu deskripsi, tombol, dan proyek. Hanya sekali per sesi supaya tidak mengulang di setiap kunjungan beranda.
onMounted(() => {
	const html = document.documentElement
	const root = (hero.value as { $el?: HTMLElement } | null)?.$el
	if (!root || !motionAllowed() || html.classList.contains('hero-seen')) return

	const finish = () => {
		try {
			sessionStorage.setItem('mt-hero-seen', '1')
		} catch {
			// Mode privat bisa menolak sessionStorage; hero cukup diputar lagi di kunjungan berikutnya.
		}
		html.classList.add('hero-seen')
		root.querySelectorAll<HTMLElement>('[data-hero-word], [data-slot="headline"], [data-slot="description"], [data-slot="links"], [data-hero-media]').forEach((el) => {
			el.style.removeProperty('opacity')
			el.style.removeProperty('transform')
		})
	}

	html.classList.add('hero-play')
	const words = root.querySelectorAll<HTMLElement>('[data-hero-word]')
	const support = root.querySelectorAll<HTMLElement>('[data-slot="headline"], [data-slot="description"], [data-slot="links"]')
	const media = root.querySelector<HTMLElement>('[data-hero-media]')

	animate(words, { translateY: ['110%', '0%'], duration: 850, delay: stagger(70), ease: 'out(4)' })
	animate(support, { opacity: [0, 1], translateY: [16, 0], duration: 600, delay: stagger(110, { start: 380 }), ease: 'out(3)' })
	if (media) {
		animate(media, { opacity: [0, 1], scale: [0.97, 1], duration: 900, delay: 450, ease: 'out(3)', onComplete: finish })
	} else {
		setTimeout(finish, 1100)
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
				<template
					v-for="(word, index) in heroTitle.before"
					:key="`b${index}`"
				>
					<span class="-mb-[0.12em] inline-block overflow-hidden pb-[0.12em] align-top"><span
						data-hero-word
						class="inline-block"
					>{{ word }}</span></span>{{ ' ' }}
				</template>
				<span
					v-if="heroTitle.mark.length"
					data-hero-mark
					class="text-primary"
				>
					<template
						v-for="(word, index) in heroTitle.mark"
						:key="`m${index}`"
					>
						<span class="-mb-[0.12em] inline-block overflow-hidden pb-[0.12em] align-top"><span
							data-hero-word
							class="inline-block"
						>{{ word }}</span></span>{{ index < heroTitle.mark.length - 1 ? ' ' : '' }}
					</template>
				</span>
				<template
					v-for="(word, index) in heroTitle.after"
					:key="`a${index}`"
				>
					{{ ' ' }}<span class="-mb-[0.12em] inline-block overflow-hidden pb-[0.12em] align-top"><span
						data-hero-word
						class="inline-block"
					>{{ word }}</span></span>
				</template>
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
						:src="project.thumbnailUrl!"
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

		<UPageSection :ui="{ container: 'py-12 sm:py-16 lg:py-20' }">
			<template #title>
				Proyek terbaru
			</template>
			<template #description>
				Baru saja diterbitkan developer dan desainer Majalengka.
			</template>
			<template
				v-if="latest.length"
				#links
			>
				<UButton
					label="Lihat Semua Proyek"
					icon="i-lucide-arrow-right"
					trailing
					to="/projek"
					color="neutral"
					variant="outline"
				/>
			</template>

			<UAlert
				v-if="loadFailed"
				color="error"
				variant="subtle"
				icon="i-lucide-cloud-off"
				title="Sebagian isi beranda gagal dimuat"
				description="Server belum merespons, jadi proyek atau kreator di halaman ini mungkin belum lengkap. Coba muat ulang sebentar lagi."
				:actions="[{ label: 'Muat Ulang', icon: 'i-lucide-refresh-cw', color: 'error', variant: 'outline', loading: retrying, onClick: retryLoad }]"
				:class="{ 'mb-10': latest.length }"
			/>
			<div
				v-if="latest.length"
				class="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3"
			>
				<DashboardProjectCard
					v-for="project in latest"
					:key="project.id"
					:project="project"
					data-reveal
				/>
			</div>
			<UEmpty
				v-else-if="!loadFailed"
				icon="i-lucide-folder-open"
				title="Belum ada proyek yang terbit"
				description="Belum ada proyek yang tampil di sini. Proyekmu bisa jadi yang pertama."
				:actions="[{ label: 'Pamerkan Proyekmu', icon: 'i-lucide-folder-plus', to: '/dashboard/projects/new' }]"
			/>
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
			:ui="{ container: 'py-12 sm:py-16 lg:py-20' }"
		>
			<template #title>
				Kreator di balik proyek
			</template>
			<template #description>
				Kenali orangnya, lihat proyek lainnya, dan temukan yang terbuka untuk kerja sama.
			</template>

			<ul class="flex flex-wrap justify-center gap-4">
				<li
					v-for="creator in creators"
					:key="creator.id"
					data-reveal
					class="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.75rem)]"
				>
					<NuxtLink
						:to="`/${creator.username}`"
						class="flex h-full items-center gap-3 rounded-md border border-default p-4 outline-primary/25 transition-colors hover:border-primary/40 focus-visible:outline-3"
					>
						<UAvatar
							:src="creator.avatarUrl || undefined"
							:alt="creator.name"
							size="lg"
						/>
						<div class="min-w-0">
							<p class="truncate font-semibold text-highlighted">
								{{ creator.name }}
							</p>
							<p class="truncate text-sm text-muted">
								{{ creator.creatorRole ? CREATOR_ROLES[creator.creatorRole as CreatorRole] : `@${creator.username}` }}
								<span aria-hidden="true">·</span>
								{{ creator.projectCount }} proyek
							</p>
							<p
								v-if="creator.openToWork"
								class="mt-1 text-xs font-medium text-success"
							>
								Terbuka untuk kerja sama
							</p>
						</div>
					</NuxtLink>
				</li>
			</ul>
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
