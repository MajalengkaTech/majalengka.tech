<script setup lang="ts">
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

const [{ data: statsData }, { data: featuredData }, { data: latestData }, { data: creatorsData }] = await Promise.all([
	useFetch<ShowcaseStats>('/api/projects/stats', { key: 'home-stats' }),
	useFetch<{ projects: ProjectItem[] }>('/api/projects', { key: 'home-featured', query: { featured: 1, limit: 4 } }),
	useFetch<{ projects: ProjectItem[] }>('/api/projects', { key: 'home-latest', query: { limit: 6 } }),
	useFetch<{ creators: CreatorSummary[] }>('/api/creators', { key: 'home-creators', query: { limit: 8 } })
])

const featured = computed(() => featuredData.value?.projects || [])
const latest = computed(() => latestData.value?.projects || [])
const creators = computed(() => creatorsData.value?.creators || [])
const stats = computed(() => statsData.value || { totalProjects: 0, totalCreators: 0, categories: {} })

// Mozaik hero hanya dari karya asli yang punya gambar; kurang dari 3 berarti hero tampil tanpa mozaik.
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
	headline: 'Etalase Karya',
	title: 'Majalengka Tech',
	description
})
</script>

<template>
	<div v-if="page">
		<UPageHero
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
				<MDC
					:value="page.title"
					unwrap="p"
				/>
			</template>

			<template
				v-if="stats.totalProjects > 0"
				#headline
			>
				<span class="text-sm font-medium text-muted">
					{{ stats.totalProjects }} karya dari {{ stats.totalCreators }} kreator
				</span>
			</template>

			<div
				v-if="mosaic.length === 3"
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
						sizes="50vw lg:320px"
						format="webp"
						:loading="index === 0 ? 'eager' : 'lazy'"
					/>
				</NuxtLink>
			</div>
			<div
				v-else
				class="flex items-center justify-center"
			>
				<HeroIllustration class="h-auto max-h-65 w-full max-w-md object-contain sm:max-h-105" />
			</div>
		</UPageHero>

		<UPageSection
			v-if="featured.length"
			:ui="{ container: 'py-12 sm:py-16' }"
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
				Karya yang layak kamu buka lebih dulu
			</template>
			<template #description>
				Dipilih kurator Majalengka Tech karena ceritanya kuat dan tampilannya rapi.
			</template>

			<div class="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2">
				<DashboardProjectCard
					v-for="project in featured"
					:key="project.id"
					:project="project"
				/>
			</div>
		</UPageSection>

		<UPageSection :ui="{ container: 'py-12 sm:py-16' }">
			<template #title>
				Karya terbaru
			</template>
			<template #description>
				Baru saja diterbitkan developer dan desainer Majalengka.
			</template>
			<template
				v-if="latest.length"
				#links
			>
				<UButton
					label="Lihat Semua Karya"
					icon="i-lucide-arrow-right"
					trailing
					to="/projek"
					color="neutral"
					variant="outline"
				/>
			</template>

			<div
				v-if="latest.length"
				class="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3"
			>
				<DashboardProjectCard
					v-for="project in latest"
					:key="project.id"
					:project="project"
				/>
			</div>
			<UEmpty
				v-else
				icon="i-lucide-folder-open"
				title="Belum ada karya yang terbit"
				description="Etalase ini baru dibuka. Karyamu bisa jadi yang pertama tampil di sini."
				:actions="[{ label: 'Pamerkan Karyamu', icon: 'i-lucide-folder-plus', to: '/dashboard/projects/new' }]"
			/>
		</UPageSection>

		<UPageSection
			v-if="categories.length"
			:ui="{ container: 'py-12 sm:py-16' }"
		>
			<template #title>
				Jelajahi per kategori
			</template>

			<ul class="flex flex-wrap gap-2">
				<li
					v-for="category in categories"
					:key="category.key"
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
			:ui="{ container: 'py-12 sm:py-16' }"
		>
			<template #title>
				Kreator di balik karya
			</template>
			<template #description>
				Kenali orangnya, lihat karya lainnya, dan temukan yang terbuka untuk project.
			</template>

			<ul class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<li
					v-for="creator in creators"
					:key="creator.id"
				>
					<NuxtLink
						:to="`/@${creator.username}`"
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
								{{ creator.projectCount }} karya
							</p>
							<p
								v-if="creator.openToWork"
								class="mt-1 text-xs font-medium text-success"
							>
								Terbuka untuk project
							</p>
						</div>
					</NuxtLink>
				</li>
			</ul>
		</UPageSection>

		<USeparator />

		<UPageCTA
			title="Punya karya yang ingin dipamerkan?"
			description="Unggah tangkapan layar, ceritakan prosesnya, lalu bagikan satu alamat portofolio ke teman, klien, atau perekrut."
			:links="[
				{ label: 'Pamerkan Karyamu', icon: 'i-lucide-folder-plus', to: '/dashboard/projects/new', size: 'lg' },
				{ label: 'Tentang Majalengka Tech', to: '/tentang', color: 'neutral', variant: 'ghost', size: 'lg' }
			]"
			variant="naked"
		/>
	</div>
</template>
