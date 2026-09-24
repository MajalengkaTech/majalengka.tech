<script setup lang="ts">
import type { ProjectItem } from '~/types/project'

useSeoMeta({
	title: 'Showcase Projek Komunitas · Majalengka Tech',
	description: 'Jelajahi karya teknologi, pustaka open-source, dan inovasi aplikasi yang dibangun oleh komunitas developer Majalengka.'
})

defineOgImage('Saas', {
	headline: 'Showcase Developer',
	title: 'Showcase Projek Komunitas',
	description: 'Jelajahi karya teknologi, pustaka open-source, dan inovasi aplikasi yang dibangun oleh komunitas developer Majalengka.'
})

const search = ref('')
const selectedTag = ref<string | null>(null)

const { data, status, refresh } = await useFetch('/api/projects', {
	key: 'showcase-projects'
})

const projects = computed<ProjectItem[]>(() => (data.value?.projects as ProjectItem[]) || [])

onMounted(() => {
	if (!projects.value.length) refresh()
})

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

const tagOptions = computed(() =>
	allTags.value.map(t => ({ label: t, value: t }))
)

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

const isFiltering = computed(() => !!search.value.trim() || !!selectedTag.value)

const { loggedIn } = useUserSession()
const toast = useToast()

const selectedProjectForReview = ref<ProjectItem | null>(null)
const isReviewModalOpen = ref(false)

function handleOpenReview(project: ProjectItem) {
	selectedProjectForReview.value = project
	isReviewModalOpen.value = true
}

function handleReviewed() {
	refresh()
}

async function handleQuickRate({ project, rating }: { project: ProjectItem, rating: number }) {
	if (!loggedIn.value) {
		toast.add({
			title: 'Login Diperlukan',
			description: 'Silakan masuk terlebih dahulu untuk memberikan rating bintang.',
			color: 'warning',
			actions: [{ label: 'Masuk', to: '/login' }]
		})
		return
	}

	// Optimistic local update untuk respon instan
	const target = projects.value.find(p => p.id === project.id)
	const previousRating = target?.currentUserRating
	const previousAvg = target?.averageRating
	const previousCount = target?.reviewCount

	if (target) {
		const hadPrevious = typeof target.currentUserRating === 'number'
		const prevScore = target.currentUserRating || 0
		target.currentUserRating = rating

		const prevCount = target.reviewCount || 0
		const prevAvg = target.averageRating || 0
		if (hadPrevious) {
			const totalScore = (prevAvg * prevCount) - prevScore + rating
			target.averageRating = Number((totalScore / prevCount).toFixed(1))
		} else {
			const newCount = prevCount + 1
			const totalScore = (prevAvg * prevCount) + rating
			target.reviewCount = newCount
			target.averageRating = Number((totalScore / newCount).toFixed(1))
		}
	}

	try {
		const res = await $fetch<{ success: boolean, message: string }>(`/api/projects/${project.id}/reviews`, {
			method: 'POST',
			body: { rating, comment: null }
		})

		toast.add({
			title: 'Rating Tersimpan',
			description: res.message || `Rating ${rating} bintang berhasil disimpan untuk ${project.title}`,
			color: 'success'
		})
		// Sinkronisasi data latar belakang
		refresh()
	} catch (err: unknown) {
		// Rollback jika terjadi kesalahan jaringan
		if (target) {
			target.currentUserRating = previousRating
			target.averageRating = previousAvg
			target.reviewCount = previousCount
		}
		const res = err as { data?: { statusMessage?: string } }
		toast.add({
			title: 'Gagal Menyimpan Rating',
			description: res.data?.statusMessage || 'Terjadi kesalahan saat menyimpan rating.',
			color: 'error'
		})
	}
}

function resetFilters() {
	search.value = ''
	selectedTag.value = null
}
</script>

<template>
	<div>
		<UPageHero
			headline="Karya & Inovasi Lokal"
			title="Showcase Projek Komunitas"
			description="Koleksi aplikasi dan inovasi open-source developer Majalengka. Beri apresiasi rating bintang dan dukung karya lokal."
			:links="[
				{ label: 'Pamerkan Projek', icon: 'i-lucide-folder-plus', color: 'primary', to: '/dashboard/projects/new' },
				{ label: 'Gabung Komunitas', icon: 'i-lucide-user-plus', color: 'neutral', variant: 'subtle', to: '/signup' }
			]"
			:ui="{
				title: 'text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-balance',
				description: 'text-base sm:text-lg text-muted text-pretty max-w-xl mx-auto'
			}"
		/>

		<UContainer class="pb-16">
			<!-- Search & Filter Controls Toolbar -->
			<div class="mb-8 p-3 sm:p-4 rounded-2xl bg-elevated/40 border border-default/70 backdrop-blur-sm shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
				<div class="flex-1 flex flex-col sm:flex-row items-center gap-2.5">
					<UFieldGroup class="w-full sm:flex-1">
						<UInput
							v-model="search"
							placeholder="Cari nama projek, deskripsi, teknologi..."
							icon="i-lucide-search"
							class="w-full"
						/>
						<UButton
							icon="i-lucide-rotate-cw"
							color="neutral"
							variant="subtle"
							:loading="status === 'pending'"
							aria-label="Segarkan data projek"
							@click="() => refresh()"
						/>
					</UFieldGroup>

					<USelectMenu
						v-if="allTags.length > 0"
						v-model="selectedTag"
						:items="tagOptions"
						value-key="value"
						placeholder="Semua Tag Kategori"
						icon="i-lucide-tag"
						:clear="true"
						class="w-full sm:w-56"
					/>
				</div>

				<div class="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-default/40 text-xs sm:text-sm text-muted shrink-0">
					<span>
						Menampilkan <strong class="text-highlighted">{{ filteredProjects.length }}</strong> dari {{ projects.length }} karya
					</span>
					<UButton
						v-if="isFiltering"
						label="Reset Filter"
						icon="i-lucide-x"
						size="xs"
						color="neutral"
						variant="subtle"
						@click="resetFilters"
					/>
				</div>
			</div>

			<!-- Loading Skeleton -->
			<div
				v-if="status === 'pending'"
				class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
			>
				<USkeleton
					v-for="n in 6"
					:key="n"
					class="h-72 w-full rounded-xl"
				/>
			</div>

			<!-- Empty State -->
			<UEmpty
				v-else-if="filteredProjects.length === 0"
				icon="i-lucide-folder-search"
				class="max-w-xl mx-auto my-8"
				:title="isFiltering ? 'Tidak Ada Projek yang Sesuai' : 'Belum Ada Projek Terdaftar'"
				:description="isFiltering ? 'Coba gunakan kata kunci atau tag lain.' : 'Jadilah yang pertama menginspirasi developer lainnya di Majalengka!'"
				:actions="isFiltering ? [{ label: 'Reset Filter', icon: 'i-lucide-x', color: 'neutral', variant: 'subtle', onClick: resetFilters }] : []"
			/>

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
					@review="handleOpenReview"
					@quick-rate="handleQuickRate"
				/>
			</div>
		</UContainer>

		<ProjectReviewModal
			v-model:open="isReviewModalOpen"
			:project="selectedProjectForReview"
			@reviewed="handleReviewed"
		/>
	</div>
</template>
