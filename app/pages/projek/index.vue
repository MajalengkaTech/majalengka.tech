<script setup lang="ts">
import type { ProjectItem } from '~/types/project'

interface ShowcaseStats {
	totalProjects: number
	totalCreators: number
	categories: Partial<Record<ProjectCategory, number>>
}

useSeoMeta({
	title: 'Showcase Proyek',
	description: 'Proyek aplikasi, desain, dan teknologi buatan developer dan desainer Majalengka.'
})

defineOgImage('Saas', {
	headline: 'Showcase',
	title: 'Proyek Kreator Majalengka',
	description: 'Proyek aplikasi, desain, dan teknologi buatan developer dan desainer Majalengka.'
})

const route = useRoute()
const router = useRouter()

const categoryKeys = Object.keys(PROJECT_CATEGORIES) as ProjectCategory[]
const category = computed<ProjectCategory | undefined>(() => {
	const value = String(route.query.kategori || '')
	return categoryKeys.includes(value as ProjectCategory) ? value as ProjectCategory : undefined
})
const sort = computed<'terbaru' | 'populer'>(() => route.query.urut === 'populer' ? 'populer' : 'terbaru')
const search = ref(String(route.query.q || ''))

// Filter disimpan di URL supaya hasilnya bisa dibagikan dan tombol Back tetap bekerja.
function setQuery(patch: Record<string, string | undefined>) {
	const query = Object.fromEntries(
		Object.entries({ ...route.query, ...patch }).filter(([, value]) => Boolean(value))
	)
	router.replace({ query })
}

watchDebounced(search, (value) => {
	setQuery({ q: value.trim() || undefined })
}, { debounce: 300 })

const { data: statsData } = await useFetch<ShowcaseStats>('/api/projects/stats', { key: 'showcase-stats' })
const { data, status, error, refresh } = await useFetch<{ projects: ProjectItem[] }>('/api/projects', {
	key: 'showcase-projects',
	query: computed(() => ({ category: category.value, sort: sort.value, limit: 60 }))
})

const projects = computed(() => data.value?.projects || [])

// Sorotan memakai urutan populer dari server supaya tidak bergantung pada filter dan urutan yang sedang dipilih.
const { data: topData } = await useFetch<{ projects: ProjectItem[] }>('/api/projects', {
	key: 'showcase-top-liked',
	query: { sort: 'populer', limit: 1 }
})
const topProject = computed(() => {
	const project = topData.value?.projects[0]
	return project && (project.likeCount || 0) > 0 ? project : undefined
})
const filtered = computed(() => {
	const q = search.value.trim().toLowerCase()
	if (!q) return projects.value
	return projects.value.filter(project => [
		project.title,
		project.tagline,
		project.tags,
		project.author?.name,
		project.author?.username
	].some(value => value?.toLowerCase().includes(q)))
})

const chips = computed(() => {
	const counts = statsData.value?.categories || {}
	return categoryKeys
		.map(key => ({ key, label: PROJECT_CATEGORIES[key], total: counts[key] || 0 }))
		.filter(chip => chip.total > 0 || chip.key === category.value)
})

const sortItems = [
	{ label: 'Terbaru', value: 'terbaru' },
	{ label: 'Terpopuler', value: 'populer' }
]

const isFiltering = computed(() => Boolean(category.value || search.value.trim()))

function resetFilters() {
	search.value = ''
	setQuery({ kategori: undefined, q: undefined })
}
</script>

<template>
	<UContainer class="flex flex-col gap-8 py-8 sm:py-12">
		<header class="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
			<div class="flex max-w-2xl flex-col gap-3">
				<h1 class="text-3xl font-bold tracking-tight text-highlighted sm:text-4xl lg:text-5xl">
					Showcase
				</h1>
				<p class="text-base text-pretty text-muted sm:text-lg">
					Proyek developer dan desainer Majalengka.
					<template v-if="statsData?.totalProjects">
						Saat ini ada {{ statsData.totalProjects }} proyek dari {{ statsData.totalCreators }} kreator.
					</template>
				</p>
			</div>
			<UButton
				label="Pamerkan Proyekmu"
				icon="i-lucide-folder-plus"
				to="/dashboard/projects/new"
				size="lg"
				class="self-start sm:self-auto"
			/>
		</header>

		<ProjectSpotlight
			v-if="topProject && !isFiltering"
			:project="topProject"
		/>

		<div class="flex flex-col gap-4 border-y border-default py-4">
			<nav
				aria-label="Filter kategori"
				class="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"
			>
				<ul class="flex w-max gap-2 sm:w-auto sm:flex-wrap">
					<li>
						<UButton
							class="shrink-0 whitespace-nowrap px-3.5 py-1.5 font-medium transition"
							:class="!category ? 'filter-chip-active shadow-xs' : 'text-muted hover:text-highlighted'"
							color="neutral"
							variant="outline"
							:aria-current="!category ? 'page' : undefined"
							@click="setQuery({ kategori: undefined })"
						>
							Semua
						</UButton>
					</li>
					<li
						v-for="chip in chips"
						:key="chip.key"
					>
						<UButton
							class="shrink-0 whitespace-nowrap px-3.5 py-1.5 gap-1.5 font-medium transition"
							:class="category === chip.key ? 'filter-chip-active shadow-xs' : 'text-muted hover:text-highlighted'"
							color="neutral"
							variant="outline"
							:aria-current="category === chip.key ? 'page' : undefined"
							@click="setQuery({ kategori: chip.key })"
						>
							<span>{{ chip.label }}</span>
							<span
								class="text-xs tabular-nums"
								:class="category === chip.key ? 'text-white/85' : 'text-muted'"
							>{{ chip.total }}</span>
						</UButton>
					</li>
				</ul>
			</nav>

			<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
				<UInput
					v-model="search"
					leading-icon="i-lucide-search"
					placeholder="Cari judul, teknologi, atau nama kreator"
					size="md"
					class="w-full sm:max-w-sm"
					:ui="{
						base: '!ps-9'
					}"
					aria-label="Cari proyek"
				/>
				<!-- Dua pilihan urutan langsung terlihat; penanda aktif bergeser saat diganti. -->
				<UTabs
					:model-value="sort"
					:items="sortItems"
					:content="false"
					size="sm"
					class="w-full sm:w-auto"
					:ui="{
						list: 'bg-muted/40 border border-default/60'
					}"
					aria-label="Urutkan proyek"
					@update:model-value="(value: string | number) => setQuery({ urut: value === 'populer' ? 'populer' : undefined })"
				/>
				<p
					class="text-sm text-muted sm:ml-auto"
					aria-live="polite"
				>
					<AnimeTransition
						enter-animation="mt-count"
						leave-animation="mt-count"
						mode="out-in"
					>
						<span
							:key="filtered.length"
							class="inline-block tabular-nums"
						>{{ filtered.length }}</span>
					</AnimeTransition> proyek
				</p>
			</div>
		</div>

		<div
			v-if="status === 'pending' && !projects.length"
			class="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3"
		>
			<USkeleton
				v-for="n in 6"
				:key="n"
				class="aspect-video w-full rounded-xl"
			/>
		</div>

		<UAlert
			v-else-if="error"
			color="error"
			variant="subtle"
			icon="i-lucide-triangle-alert"
			title="Proyek gagal dimuat"
			description="Server tidak merespons. Coba muat ulang sebentar lagi."
			:actions="[{ label: 'Coba Lagi', color: 'error', variant: 'outline', onClick: () => refresh() }]"
		/>

		<UEmpty
			v-else-if="!filtered.length"
			icon="i-lucide-folder-search"
			:title="isFiltering ? 'Tidak ada proyek yang cocok' : 'Belum ada proyek yang terbit'"
			:description="isFiltering ? 'Coba kategori lain atau kata kunci yang berbeda.' : 'Belum ada proyek yang tampil di sini. Proyekmu bisa jadi yang pertama.'"
			:actions="isFiltering
				? [{ label: 'Hapus Filter', icon: 'i-lucide-x', color: 'neutral', variant: 'outline', onClick: resetFilters }]
				: [{ label: 'Pamerkan Proyekmu', icon: 'i-lucide-folder-plus', to: '/dashboard/projects/new' }]"
		/>

		<!-- Saat filter berubah: kartu yang tersisa bergeser ke posisi barunya, yang hilang memudar, yang baru masuk. -->
		<AnimeTransitionGroup
			v-else
			ref="grid"
			tag="div"
			enter-animation="mt-item"
			leave-animation="mt-item"
			move-animation="mt-item"
			class="relative grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3"
		>
			<DashboardProjectCard
				v-for="project in filtered"
				:key="project.id"
				:project="project"
			/>
		</AnimeTransitionGroup>
	</UContainer>
</template>
