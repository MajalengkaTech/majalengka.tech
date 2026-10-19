<script setup lang="ts">
interface Creator {
	id: string
	name: string
	username: string | null
	avatarUrl: string | null
	creatorRole: string | null
	location: string | null
	openToWork: boolean
	githubUsername?: string | null
	websiteUrl?: string | null
	linkedinUrl?: string | null
	projectCount: number
	likeCount: number
	coverUrl: string | null
}

useSeoMeta({
	title: 'Kreator · Majalengka Tech',
	description: 'Daftar pengembang, desainer, dan talenta digital yang berkarya dan memamerkan proyeknya di Majalengka Tech.'
})

const { data: creatorData, status } = await useFetch<{ creators: Creator[] }>('/api/creators', {
	key: 'creators-list',
	query: { limit: 100 }
})

const creators = computed(() => creatorData.value?.creators || [])

// Kreator paling produktif: proyek terbit terbanyak; kalau seri, apresiasi terbanyak, lalu yang terakhir menerbitkan (urutan API).
const topCreator = computed(() => [...creators.value]
	.sort((a, b) => b.projectCount - a.projectCount || b.likeCount - a.likeCount)[0])

const roleLabel = (role: string | null) => role ? CREATOR_ROLES[role as CreatorRole] || role : null

// Load More Logic (Infinite Scroll)
const ITEMS_PER_PAGE = 12
const SCROLL_THRESHOLD = 450
const displayedCreators = ref<Creator[]>([])
const isLoading = ref(false)
const failedImages = ref<Record<string, boolean>>({})

// Pengguna tanpa username belum punya halaman profil, jadi kartunya tidak ditautkan.
const NuxtLink = resolveComponent('NuxtLink')
const profileLink = (creator: Creator) => creator.username ? `/${creator.username}` : undefined

function onImageError(id: string) {
	failedImages.value[id] = true
}

function getInitial(name?: string) {
	const val = (name || '').replace(/^@/, '').trim()
	if (!val) return '?'
	return val.slice(0, 2).toUpperCase()
}

const { y: scrollY } = useWindowScroll()

const loadMoreCreators = () => {
	if (isLoading.value) return

	const currentLength = displayedCreators.value.length
	if (currentLength >= creators.value.length) return

	isLoading.value = true

	setTimeout(() => {
		const nextItems = creators.value.slice(
			currentLength,
			currentLength + ITEMS_PER_PAGE
		)
		displayedCreators.value.push(...nextItems)
		isLoading.value = false
	}, 400)
}

const initializeCreators = () => {
	displayedCreators.value = creators.value.slice(0, ITEMS_PER_PAGE)
}

const debouncedLoadMore = useDebounceFn(loadMoreCreators, 100)

watch(scrollY, (y) => {
	if (typeof window !== 'undefined' && typeof document !== 'undefined') {
		if (window.innerHeight + y >= document.documentElement.scrollHeight - SCROLL_THRESHOLD) {
			debouncedLoadMore()
		}
	}
})

watch(creators, () => {
	isLoading.value = false
	displayedCreators.value = []
	initializeCreators()
}, { immediate: true })

// State elemen yang sudah terlihat di layar
const visibleItems = ref<Record<string, boolean>>({})

// Custom directive intersection-observer lokal tanpa perlu paket eksternal
const vIntersectionObserver = {
	mounted(el: HTMLElement) {
		if (typeof IntersectionObserver === 'undefined') {
			const id = el.getAttribute('data-id')
			if (id) visibleItems.value[id] = true
			return
		}
		const observer = new IntersectionObserver(([entry]) => {
			if (entry?.isIntersecting) {
				const id = el.getAttribute('data-id')
				if (id) {
					visibleItems.value[id] = true
				}
				observer.unobserve(el)
			}
		}, { threshold: 0.1 })
		observer.observe(el)
	}
}
</script>

<template>
	<UContainer class="py-8 sm:py-12">
		<UPageHero
			title="Kreator Majalengka"
			description="Daftar pengembang, desainer, dan talenta digital yang berkarya dan memamerkan proyeknya di Majalengka Tech."
			:ui="{ container: '!pb-10 !pt-6 text-center' }"
		/>

		<section
			v-if="topCreator"
			aria-labelledby="kreator-teratas"
			class="rounded-2xl border border-default bg-elevated/50 p-6 sm:p-8"
		>
			<div class="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
				<component
					:is="topCreator.username ? NuxtLink : 'div'"
					:to="profileLink(topCreator)"
					class="shrink-0"
				>
					<img
						v-if="topCreator.avatarUrl && !failedImages[topCreator.id]"
						:src="avatarSrc(topCreator.avatarUrl, 320)"
						:alt="topCreator.name"
						class="size-28 rounded-full bg-muted object-cover ring-4 ring-primary/30 sm:size-32"
						@error="onImageError(topCreator.id)"
					>
					<div
						v-else
						class="flex size-28 select-none items-center justify-center rounded-full bg-primary/10 text-3xl font-bold text-primary ring-4 ring-primary/30 sm:size-32"
					>
						{{ getInitial(topCreator.name) }}
					</div>
				</component>

				<div class="min-w-0 flex-1">
					<UBadge
						label="Kreator paling produktif"
						icon="i-lucide-trophy"
						color="primary"
						variant="subtle"
					/>
					<h2
						id="kreator-teratas"
						class="mt-3 truncate text-2xl font-bold text-highlighted sm:text-3xl"
					>
						{{ topCreator.name }}
					</h2>
					<p
						v-if="roleLabel(topCreator.creatorRole) || topCreator.location"
						class="mt-1 text-muted"
					>
						{{ [roleLabel(topCreator.creatorRole), topCreator.location].filter(Boolean).join(' · ') }}
					</p>
					<div class="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted sm:justify-start">
						<span><strong class="text-lg tabular-nums text-highlighted">{{ topCreator.projectCount }}</strong> proyek terbit</span>
						<span><strong class="text-lg tabular-nums text-highlighted">{{ topCreator.likeCount }}</strong> apresiasi diterima</span>
					</div>
				</div>

				<UButton
					v-if="topCreator.username"
					:to="profileLink(topCreator)"
					label="Lihat Profil"
					trailing-icon="i-lucide-arrow-right"
					class="shrink-0"
				/>
				<UBadge
					v-else
					label="Belum punya username"
					icon="i-lucide-user-x"
					color="neutral"
					variant="outline"
					class="shrink-0"
				/>
			</div>
		</section>

		<!-- Grid Daftar Kreator -->
		<div
			v-if="displayedCreators.length"
			class="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-6 py-8"
		>
			<div
				v-for="(creator, index) in displayedCreators"
				:key="creator.id"
				v-intersection-observer
				:data-id="'creator-' + index"
				class="transition-all duration-700 ease-out h-full"
				:class="visibleItems['creator-' + index] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'"
				:style="{ transitionDelay: `${(index % 6) * 80}ms` }"
			>
				<UCard
					class="flex flex-col h-full transition-shadow"
					:class="creator.username
						? 'group hover:ring-2 hover:ring-primary/50 dark:hover:shadow-primary/10 hover:shadow-xl'
						: 'opacity-70'"
					:aria-disabled="creator.username ? undefined : 'true'"
					:ui="{ body: 'flex-1 flex flex-col', footer: 'mt-auto' }"
				>
					<div class="flex flex-col items-center gap-4 text-center">
						<div class="relative pt-4">
							<component
								:is="creator.username ? NuxtLink : 'div'"
								:to="profileLink(creator)"
							>
								<!-- Jika ada gambar dan tidak error, tampilkan foto -->
								<img
									v-if="creator.avatarUrl && !failedImages[creator.id]"
									class="size-24 md:size-28 rounded-full ring-4 ring-muted transition-transform duration-300 group-hover:scale-110 object-cover bg-muted"
									:src="avatarSrc(creator.avatarUrl)"
									:alt="creator.name"
									loading="lazy"
									@error="onImageError(creator.id)"
								>
								<!-- Fallback: Gunakan Inisial jika foto kosong atau gagal load -->
								<div
									v-else
									class="size-24 md:size-28 rounded-full ring-4 ring-muted transition-transform duration-300 group-hover:scale-110 flex items-center justify-center bg-primary/10 text-primary font-bold text-xl md:text-2xl select-none"
								>
									{{ getInitial(creator.name) }}
								</div>
							</component>
						</div>

						<div class="min-w-0 w-full px-2">
							<component
								:is="creator.username ? NuxtLink : 'div'"
								:to="profileLink(creator)"
								:class="{ 'hover:underline': creator.username }"
							>
								<h3 class="font-bold text-lg text-highlighted truncate">
									{{ creator.name }}
								</h3>
							</component>
							<div class="mt-2 flex flex-wrap items-center justify-center gap-1.5">
								<UBadge
									v-if="creator.creatorRole"
									:label="roleLabel(creator.creatorRole)!"
									size="xs"
									color="neutral"
									variant="subtle"
								/>
								<UBadge
									v-if="creator.projectCount"
									:label="`${creator.projectCount} Proyek`"
									size="xs"
									color="primary"
									variant="soft"
								/>
								<UBadge
									v-if="!creator.username"
									label="Belum punya username"
									icon="i-lucide-user-x"
									size="xs"
									color="neutral"
									variant="outline"
								/>
							</div>
						</div>
					</div>

					<template
						v-if="creator.username"
						#footer
					>
						<div class="flex justify-center items-center gap-1">
							<UButton
								v-if="creator.githubUsername"
								:to="`https://github.com/${creator.githubUsername}`"
								target="_blank"
								icon="i-mage-github"
								color="neutral"
								variant="ghost"
								size="sm"
								aria-label="GitHub"
							/>
							<UButton
								v-if="creator.linkedinUrl"
								:to="creator.linkedinUrl"
								target="_blank"
								icon="i-mage-linkedin"
								color="neutral"
								variant="ghost"
								size="sm"
								aria-label="LinkedIn"
							/>
							<UButton
								v-if="creator.websiteUrl"
								:to="creator.websiteUrl"
								target="_blank"
								icon="i-mage-globe"
								color="neutral"
								variant="ghost"
								size="sm"
								aria-label="Website"
							/>
							<UButton
								v-if="creator.username"
								:to="profileLink(creator)"
								icon="i-lucide-arrow-right"
								color="neutral"
								variant="ghost"
								size="sm"
								aria-label="Lihat Profil"
							/>
						</div>
					</template>
				</UCard>
			</div>

			<!-- Skeleton Loading Effect saat Infinite Scroll -->
			<template v-if="isLoading">
				<div
					v-for="n in 4"
					:key="'skeleton-' + n"
					class="flex flex-col h-full"
				>
					<UCard
						class="flex flex-col h-full ring-1 ring-default"
						:ui="{ body: 'flex-1 flex flex-col', footer: 'mt-auto' }"
					>
						<div class="flex flex-col items-center gap-4 text-center">
							<div class="relative pt-4">
								<USkeleton class="size-24 md:size-28 rounded-full" />
							</div>
							<div class="w-full flex flex-col items-center gap-2 mt-2">
								<USkeleton class="h-6 w-3/4" />
								<USkeleton class="h-4 w-1/2" />
							</div>
						</div>

						<template #footer>
							<div class="flex justify-center items-center gap-2">
								<USkeleton class="size-8 rounded-md" />
								<USkeleton class="size-8 rounded-md" />
							</div>
						</template>
					</UCard>
				</div>
			</template>
		</div>

		<!-- Kosong State jika belum ada kreator -->
		<div
			v-else-if="status !== 'pending'"
			class="text-center py-16"
		>
			<UIcon
				name="i-lucide-users"
				class="size-12 mx-auto text-muted mb-4"
			/>
			<h3 class="text-lg font-semibold text-highlighted">
				Belum ada kreator
			</h3>
			<p class="text-sm text-muted mt-1">
				Jadilah yang pertama memamerkan karyamu di Majalengka Tech.
			</p>
			<UButton
				to="/dashboard/projects/new"
				class="mt-4"
				color="primary"
				icon="i-lucide-folder-plus"
			>
				Pamerkan Proyekmu
			</UButton>
		</div>

		<!-- Tombol Load More Fallback -->
		<div
			v-if="displayedCreators.length < creators.length"
			class="flex justify-center mt-12 pb-12"
		>
			<UButton
				v-if="!isLoading"
				label="Tampilkan Lebih Banyak"
				variant="soft"
				color="primary"
				size="lg"
				icon="i-lucide-chevron-down"
				@click="loadMoreCreators"
			/>
		</div>
	</UContainer>
</template>
