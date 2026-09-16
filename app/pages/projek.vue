<script setup lang="ts">
import type { ProjectItem } from '~/types/project'

useSeoMeta({
	title: 'Showcase Projek Komunitas · Majalengka Tech',
	description: 'Jelajahi karya teknologi, pustaka open-source, dan inovasi aplikasi yang dibangun oleh komunitas developer Majalengka.'
})

const search = ref('')
const selectedTag = ref<string | null>(null)

const { data, status } = await useFetch('/api/projects')

const projects = computed<ProjectItem[]>(() => (data.value?.projects as ProjectItem[]) || [])

const allTags = computed(() => {
	const set = new Set<string>()
	for (const p of projects.value) {
		if (p.tags) {
			p.tags.split(',').forEach((t) => {
				const trimmed = t.trim()
				if (trimmed) set.add(trimmed)
			})
		}
	}
	return Array.from(set).slice(0, 10)
})

const filteredProjects = computed(() => {
	let list = projects.value
	if (selectedTag.value) {
		list = list.filter(p => p.tags && p.tags.toLowerCase().includes(selectedTag.value!.toLowerCase()))
	}
	if (search.value.trim()) {
		const q = search.value.toLowerCase().trim()
		list = list.filter(p =>
			p.title.toLowerCase().includes(q)
			|| p.description.toLowerCase().includes(q)
			|| (p.tags && p.tags.toLowerCase().includes(q))
			|| (p.author?.name && p.author.name.toLowerCase().includes(q))
		)
	}
	return list
})
</script>

<template>
	<div>
		<UContainer class="py-12 sm:py-16">
			<!-- Header -->
			<div class="flex flex-col items-center text-center max-w-3xl mx-auto mb-12">
				<UBadge
					color="primary"
					variant="subtle"
					class="mb-3"
				>
					Karya & Inovasi Lokal
				</UBadge>

				<h1 class="text-3xl sm:text-5xl font-extrabold tracking-tight text-highlighted mb-4">
					Showcase Projek Komunitas
				</h1>

				<p class="text-base sm:text-lg text-muted max-w-2xl leading-relaxed mb-6">
					Kumpulan aplikasi, tools, dan inisiatif open-source karya para developer Majalengka. Dibuat dengan passion untuk memajukan talenta teknologi lokal.
				</p>

				<div class="flex flex-wrap items-center justify-center gap-3">
					<UButton
						label="Unggah Projek Anda"
						icon="i-lucide-plus-circle"
						color="primary"
						to="/dashboard/projects/new"
						size="md"
					/>
					<UButton
						label="Gabung Komunitas"
						variant="outline"
						color="neutral"
						to="/signup"
						size="md"
					/>
				</div>
			</div>

			<!-- Search & Filter Controls -->
			<div class="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
				<div class="w-full sm:w-80">
					<UInput
						v-model="search"
						placeholder="Cari projek, developer, teknologi..."
						icon="i-lucide-search"
						class="w-full"
					/>
				</div>

				<div
					v-if="allTags.length > 0"
					class="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0"
				>
					<UButton
						label="Semua"
						size="xs"
						:variant="selectedTag === null ? 'solid' : 'ghost'"
						:color="selectedTag === null ? 'primary' : 'neutral'"
						@click="selectedTag = null"
					/>
					<UButton
						v-for="tag in allTags"
						:key="tag"
						:label="tag"
						size="xs"
						:variant="selectedTag === tag ? 'solid' : 'ghost'"
						:color="selectedTag === tag ? 'primary' : 'neutral'"
						@click="selectedTag = selectedTag === tag ? null : tag"
					/>
				</div>
			</div>

			<!-- Loading Skeleton -->
			<div
				v-if="status === 'pending'"
				class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
			>
				<div
					v-for="n in 6"
					:key="n"
					class="h-72 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse"
				/>
			</div>

			<!-- Empty State -->
			<div
				v-else-if="filteredProjects.length === 0"
				class="rounded-2xl border border-dashed border-default p-12 text-center flex flex-col items-center justify-center gap-4 bg-neutral-50/50 dark:bg-neutral-900/30 max-w-xl mx-auto my-8"
			>
				<div class="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
					<UIcon
						name="i-lucide-folder-search"
						class="w-7 h-7"
					/>
				</div>
				<h3 class="text-lg font-bold text-highlighted">
					{{ search || selectedTag ? 'Tidak Ada Projek yang Sesuai' : 'Belum Ada Projek Terdaftar' }}
				</h3>
				<p class="text-sm text-muted">
					{{ search || selectedTag ? 'Coba gunakan kata kunci atau tag lain.' : 'Jadilah yang pertama mengunggah karya Anda dan menginspirasi developer lainnya di Majalengka!' }}
				</p>
				<UButton
					label="Unggah Sekarang"
					icon="i-lucide-plus"
					color="primary"
					to="/dashboard/projects/new"
					class="mt-2"
				/>
			</div>

			<!-- Projects Grid -->
			<div
				v-else
				class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
			>
				<DashboardProjectCard
					v-for="p in filteredProjects"
					:id="'project-' + p.id"
					:key="p.id"
					:project="p"
					:editable="false"
				/>
			</div>
		</UContainer>
	</div>
</template>
