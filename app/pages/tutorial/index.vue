<script setup lang="ts">
interface TutorialCard {
	id: number
	slug: string
	title: string
	summary: string | null
	level: TutorialLevel
	tags: string | null
	publishedAt: string | null
	readingMinutes: number
	author: { name: string, username: string | null, avatarUrl: string | null }
	project: { title: string | null, slug: string } | null
}

useSeoMeta({
	title: 'Tutorial',
	description: 'Tutorial dari kreator Majalengka: langkah-langkah membuat aplikasi, website, dan desain, termasuk cerita di balik proyek mereka.'
})
useSchemaOrg([defineWebPage({ '@type': 'CollectionPage' })])

const route = useRoute()
const router = useRouter()

const level = computed({
	get: () => (typeof route.query.level === 'string' && route.query.level in TUTORIAL_LEVELS ? route.query.level : 'semua'),
	set: (value: string) => router.replace({ query: { ...route.query, level: value === 'semua' ? undefined : value } })
})
const tech = computed(() => typeof route.query.teknologi === 'string' ? route.query.teknologi.slice(0, 40) : undefined)

const levelItems = [
	{ label: 'Semua tingkat', value: 'semua' },
	...Object.entries(TUTORIAL_LEVELS).map(([value, label]) => ({ label, value }))
]

const { data, status, error, refresh } = await useFetch<{ tutorials: TutorialCard[] }>('/api/tutorials', {
	query: computed(() => ({ level: level.value === 'semua' ? undefined : level.value, teknologi: tech.value, limit: 60 }))
})

const tutorials = computed(() => data.value?.tutorials ?? [])
const isFiltering = computed(() => level.value !== 'semua' || Boolean(tech.value))

function clearFilters() {
	router.replace({ query: {} })
}
</script>

<template>
	<UContainer>
		<UPageHeader
			title="Tutorial"
			description="Langkah-langkah membuat aplikasi, website, dan desain dari kreator Majalengka. Banyak yang ditulis langsung dari proses membuat proyek mereka."
			class="py-[50px]"
		>
			<template #links>
				<UButton
					label="Tulis Tutorial"
					icon="i-lucide-pen-line"
					to="/dashboard/tutorial/baru"
				/>
			</template>
		</UPageHeader>

		<UPageBody>
			<div class="mb-8 flex flex-wrap items-center gap-3">
				<USelect
					v-model="level"
					:items="levelItems"
					icon="i-lucide-signal"
					class="w-full sm:w-56"
					aria-label="Saring tingkat kesulitan"
				/>
				<UBadge
					v-if="tech"
					color="neutral"
					variant="outline"
					size="lg"
				>
					Teknologi: {{ tech }}
					<UButton
						icon="i-lucide-x"
						color="neutral"
						variant="link"
						size="xs"
						:aria-label="`Hapus saringan ${tech}`"
						:to="{ query: { ...route.query, teknologi: undefined } }"
					/>
				</UBadge>
			</div>

			<div
				v-if="status === 'pending' && !tutorials.length"
				class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
			>
				<USkeleton
					v-for="n in 6"
					:key="n"
					class="h-40 w-full"
				/>
			</div>

			<UAlert
				v-else-if="error"
				color="error"
				variant="subtle"
				icon="i-lucide-cloud-off"
				title="Tutorial gagal dimuat"
				description="Server belum merespons. Coba muat ulang sebentar lagi."
				:actions="[{ label: 'Muat Ulang', icon: 'i-lucide-refresh-cw', color: 'error', variant: 'outline', onClick: () => refresh() }]"
			/>

			<UEmpty
				v-else-if="!tutorials.length"
				icon="i-lucide-book-open"
				:title="isFiltering ? 'Tidak ada tutorial yang cocok' : 'Belum ada tutorial yang terbit'"
				:description="isFiltering ? 'Coba tingkat kesulitan atau teknologi lain.' : 'Jadilah yang pertama: tulis langkah-langkah membuat proyekmu, lalu kirim untuk ditinjau.'"
				:actions="isFiltering
					? [{ label: 'Hapus Saringan', icon: 'i-lucide-x', color: 'neutral', variant: 'outline', onClick: clearFilters }]
					: [{ label: 'Tulis Tutorial', icon: 'i-lucide-pen-line', to: '/dashboard/tutorial/baru' }]"
			/>

			<UBlogPosts v-else>
				<UBlogPost
					v-for="tutorial in tutorials"
					:key="tutorial.id"
					:to="`/tutorial/${tutorial.slug}`"
					:title="tutorial.title"
					:description="tutorial.summary || undefined"
					:date="tutorial.publishedAt ? formatTanggal(tutorial.publishedAt) : undefined"
					:badge="{ label: `${TUTORIAL_LEVELS[tutorial.level]} · ${tutorial.readingMinutes} menit`, color: 'neutral', variant: 'subtle' }"
					:authors="[{ name: tutorial.author.name, avatar: tutorial.author.avatarUrl ? { src: avatarSrc(tutorial.author.avatarUrl), alt: '' } : undefined }]"
					variant="outline"
					:ui="{ description: 'line-clamp-2' }"
				/>
			</UBlogPosts>
		</UPageBody>
	</UContainer>
</template>
