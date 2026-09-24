<script setup lang="ts">
import type { ProjectItem } from '~/types/project'

const { data: page } = await useAsyncData('index', () => queryCollection('index').first())

const { data: projectsData, refresh: refreshProjects } = await useFetch('/api/projects', {
	key: 'home-featured-projects'
})

const featuredProjects = computed<ProjectItem[]>(() => {
	const list = (projectsData.value?.projects as ProjectItem[]) || []
	return list.slice(0, 3)
})

const { loggedIn } = useUserSession()
const toast = useToast()

const selectedProjectForReview = ref<ProjectItem | null>(null)
const isReviewModalOpen = ref(false)

function handleOpenReview(project: ProjectItem) {
	selectedProjectForReview.value = project
	isReviewModalOpen.value = true
}

function handleReviewed() {
	refreshProjects()
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

	const target = featuredProjects.value.find(p => p.id === project.id)
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
		refreshProjects()
	} catch (err: unknown) {
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
	headline: 'Komunitas Teknologi',
	title,
	description
})
</script>

<template>
	<div v-if="page">
		<UPageHero
			:title="page.title"
			:description="page.description"
			:links="page.hero.links"
			orientation="horizontal"
			:ui="{
				container: 'pt-4 pb-12 sm:pt-6 sm:pb-16 lg:pt-8 lg:pb-16 gap-8 lg:gap-12',
				title: 'text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-balance',
				description: 'text-base sm:text-lg text-muted text-pretty max-w-lg'
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

			<div class="relative flex items-center justify-center">
				<div class="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-md xl:max-w-lg flex items-center justify-center">
					<HeroIllustration class="w-full h-auto max-h-[260px] sm:max-h-[450px]  object-contain drop-shadow-sm" />
				</div>
			</div>
		</UPageHero>

		<!-- Featured Community Projects Showcase Section -->
		<UPageSection
			v-if="featuredProjects.length > 0"
			headline="Showcase Komunitas"
			title="Karya & Inovasi Developer Lokal"
			description="Kumpulan aplikasi, tools open source, dan kreasi teknologi yang dibangun oleh para developer Majalengka. Coba langsung dan beri apresiasi rating bintang."
			:ui="{
				container: 'py-10 sm:py-14'
			}"
		>
			<template #links>
				<UButton
					label="Lihat Semua Projek"
					icon="i-lucide-arrow-right"
					trailing
					to="/projek"
					color="primary"
					variant="subtle"
					size="sm"
				/>
			</template>

			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
				<DashboardProjectCard
					v-for="p in featuredProjects"
					:id="'home-project-' + p.id"
					:key="p.id"
					:project="p"
					:editable="false"
					@review="handleOpenReview"
					@quick-rate="handleQuickRate"
				/>
			</div>
		</UPageSection>

		<UPageSection
			v-for="(section, index) in page.sections"
			:key="index"
			:orientation="section.orientation"
			:reverse="section.reverse"
		>
			<template
				v-if="section.headline"
				#headline
			>
				<UBadge
					:label="section.headline"
					color="primary"
					variant="subtle"
					size="sm"
					class="mb-2"
				/>
			</template>

			<template #title>
				<MDC
					v-if="section.title"
					:value="section.title"
					unwrap="p"
				/>
			</template>

			<template #description>
				<MDC
					v-if="section.description"
					:value="section.description"
					unwrap="p"
				/>
			</template>

			<template #features>
				<UPageFeature
					v-for="(feature, fIndex) in section.features"
					:key="fIndex"
					as="li"
					:icon="feature.icon"
					:description="feature.description"
				>
					<template #title>
						<div class="inline-flex items-center gap-2">
							<span>{{ feature.title }}</span>
							<UBadge
								v-if="feature.badge || feature.status"
								:label="feature.badge || feature.status"
								color="neutral"
								variant="subtle"
								size="xs"
								class="rounded font-medium text-xs"
							/>
						</div>
					</template>
				</UPageFeature>
			</template>

			<NuxtImg
				v-if="section.image"
				:src="typeof section.image === 'string' ? section.image : section.image.src"
				:alt="(typeof section.image === 'object' ? section.image.alt : '') || section.title"
				class="h-auto w-full rounded-xl border border-neutral-200 object-contain shadow-sm dark:border-neutral-800"
			/>
			<ImagePlaceholder v-else />
		</UPageSection>

		<UPageSection
			:title="page.features.title"
			:description="page.features.description"
		>
			<UPageGrid>
				<UPageCard
					v-for="(item, index) in page.features.items"
					:key="index"
					v-bind="item"
					spotlight
				/>
			</UPageGrid>
		</UPageSection>

		<UPageSection
			id="testimonials"
			:headline="page.testimonials.headline"
			:title="page.testimonials.title"
			:description="page.testimonials.description"
		>
			<UPageColumns class="xl:columns-4">
				<UPageCard
					v-for="(testimonial, index) in page.testimonials.items"
					:key="index"
					variant="subtle"
					:description="testimonial.quote"
					:ui="{ description: 'before:content-[open-quote] after:content-[close-quote]' }"
				>
					<template #footer>
						<UUser
							v-bind="testimonial.user"
							size="lg"
						/>
					</template>
				</UPageCard>
			</UPageColumns>
		</UPageSection>

		<USeparator />

		<UPageCTA
			v-bind="page.cta"
			variant="naked"
			class="overflow-hidden"
		>
			<LazyStarsBg />
		</UPageCTA>

		<ProjectReviewModal
			v-model:open="isReviewModalOpen"
			:project="selectedProjectForReview"
			@reviewed="handleReviewed"
		/>
	</div>
</template>
