<script setup lang="ts">
import type { ProjectItem } from '~/types/project'

interface ShowcaseStats {
	totalProjects: number
	totalCreators: number
	categories: Partial<Record<ProjectCategory, number>>
}

useSeoMeta({
	title: 'Showcase Karya',
	description: 'Karya aplikasi, desain, dan teknologi buatan developer dan desainer Majalengka.'
})

defineOgImage('Saas', {
	headline: 'Showcase',
	title: 'Karya Kreator Majalengka',
	description: 'Karya aplikasi, desain, dan teknologi buatan developer dan desainer Majalengka.'
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
					Karya developer dan desainer Majalengka.
					<template v-if="statsData?.totalProjects">
						Saat ini ada {{ statsData.totalProjects }} karya dari {{ statsData.totalCreators }} kreator.
					</template>
				</p>
			</div>
			<UButton
				label="Pamerkan Karyamu"
				icon="i-lucide-folder-plus"
				to="/dashboard/projects/new"
				size="lg"
				class="self-start sm:self-auto"
			/>
		</header>

		<div class="flex flex-col gap-4 border-y border-default py-4">
			<nav
				aria-label="Filter kategori"
				class="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"
			>
				<ul class="flex w-max gap-2 sm:w-auto sm:flex-wrap">
					<li>
						<UButton
							label="Semua"
							class="whitespace-nowrap"
							:color="!category ? 'primary' : 'neutral'"
							:variant="!category ? 'solid' : 'outline'"
							:aria-current="!category ? 'page' : undefined"
							@click="setQuery({ kategori: undefined })"
						/>
					</li>
					<li
						v-for="chip in chips"
						:key="chip.key"
					>
						<UButton
							class="whitespace-nowrap"
							:color="category === chip.key ? 'primary' : 'neutral'"
							:variant="category === chip.key ? 'solid' : 'outline'"
							:aria-current="category === chip.key ? 'page' : undefined"
							@click="setQuery({ kategori: chip.key })"
						>
							{{ chip.label }}
							<span class="tabular-nums opacity-70">{{ chip.total }}</span>
						</UButton>
					</li>
				</ul>
			</nav>

			<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
				<UInput
					v-model="search"
					icon="i-lucide-search"
					placeholder="Cari judul, teknologi, atau nama kreator"
					class="w-full sm:max-w-sm"
					aria-label="Cari karya"
				/>
				<USelect
					:model-value="sort"
					:items="sortItems"
					class="w-full sm:w-44"
					aria-label="Urutkan karya"
					@update:model-value="(value: string) => setQuery({ urut: value === 'populer' ? 'populer' : undefined })"
				/>
				<p
					class="text-sm text-muted sm:ml-auto"
					aria-live="polite"
				>
					{{ filtered.length }} karya
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
				class="aspect-4/3 w-full rounded-xl"
			/>
		</div>

		<UAlert
			v-else-if="error"
			color="error"
			variant="subtle"
			icon="i-lucide-triangle-alert"
			title="Karya gagal dimuat"
			description="Server tidak merespons. Coba muat ulang sebentar lagi."
			:actions="[{ label: 'Coba Lagi', color: 'error', variant: 'outline', onClick: () => refresh() }]"
		/>

		<UEmpty
			v-else-if="!filtered.length"
			icon="i-lucide-folder-search"
			:title="isFiltering ? 'Tidak ada karya yang cocok' : 'Belum ada karya yang terbit'"
			:description="isFiltering ? 'Coba kategori lain atau kata kunci yang berbeda.' : 'Etalase ini baru dibuka. Karyamu bisa jadi yang pertama tampil di sini.'"
			:actions="isFiltering
				? [{ label: 'Hapus Filter', icon: 'i-lucide-x', color: 'neutral', variant: 'outline', onClick: resetFilters }]
				: [{ label: 'Pamerkan Karyamu', icon: 'i-lucide-folder-plus', to: '/dashboard/projects/new' }]"
		/>

		<div
			v-else
			class="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3"
		>
			<DashboardProjectCard
				v-for="project in filtered"
				:key="project.id"
				:project="project"
			/>
		</div>
	</UContainer>
</template>
