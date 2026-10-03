<script setup lang="ts">
import type { ProjectItem } from '~/types/project'

const { data: page } = await useAsyncData('tentang', () => queryCollection('tentang').first())

if (!page.value) {
	throw createError({ statusCode: 404, statusMessage: 'Halaman tidak ditemukan', fatal: true })
}

useSeoMeta({
	title: page.value.seo?.title || page.value.title,
	description: page.value.seo?.description || page.value.description,
	ogDescription: page.value.seo?.description || page.value.description
})

defineOgImage('Saas', {
	headline: 'Tentang',
	title: page.value.title,
	description: page.value.description
})

// Gambar di bagian cerita diambil dari proyek yang sudah terbit, bukan foto stok; tanpa proyek bergambar, bagian itu cukup teks.
const { data: projectsData } = await useFetch<{ projects: ProjectItem[] }>('/api/projects', {
	key: 'tentang-projects',
	query: { limit: 8 }
})
const mosaic = computed(() => (projectsData.value?.projects || []).filter(project => project.thumbnailUrl).slice(0, 4))

useReveal(useTemplateRef<HTMLElement>('about'))
</script>

<template>
	<div
		v-if="page"
		ref="about"
	>
		<UPageHero
			:headline="page.hero.headline"
			:title="page.title"
			:description="page.description"
			:links="page.hero.links"
			orientation="horizontal"
			:ui="{
				container: 'py-12 sm:py-16 lg:py-20 gap-10 lg:gap-14',
				description: 'text-base sm:text-lg text-muted text-pretty'
			}"
		>
			<UPageCard
				variant="subtle"
				class="rounded-lg"
			>
				<HeroIllustration class="h-auto w-full" />
			</UPageCard>
		</UPageHero>

		<USeparator />

		<UPageSection
			:title="page.story.title"
			:description="page.story.description"
			:features="page.story.items"
			:orientation="mosaic.length ? 'horizontal' : 'vertical'"
			reverse
			:ui="{ container: 'py-12 sm:py-16 lg:py-20' }"
		>
			<div
				v-if="mosaic.length"
				class="grid grid-cols-2 gap-3 sm:gap-4"
			>
				<NuxtLink
					v-for="project in mosaic"
					:key="project.id"
					:to="`/projek/${project.slug}`"
					:aria-label="`${project.title} oleh ${project.author?.name}`"
					data-reveal
					class="group relative block aspect-4/3 overflow-hidden rounded-lg bg-elevated outline-primary/40 outline-offset-2 focus-visible:outline-3"
				>
					<NuxtImg
						:src="project.thumbnailUrl!"
						alt=""
						class="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
						sizes="320px"
						preset="sampul"
						loading="lazy"
					/>
				</NuxtLink>
			</div>
		</UPageSection>

		<USeparator />

		<UPageSection
			:title="page.features.title"
			:description="page.features.description"
			:ui="{ container: 'py-12 sm:py-16 lg:py-20' }"
		>
			<!-- Spotlight Nuxt UI: tepi kartu menyala mengikuti kursor, hanya saat diarahkan (permintaan pemilik). -->
			<UPageGrid>
				<UPageCard
					v-for="item in page.features.items"
					:key="item.title"
					:title="item.title"
					:description="item.description"
					:icon="item.icon"
					variant="outline"
					spotlight
					spotlight-color="primary"
					data-reveal
				/>
			</UPageGrid>
		</UPageSection>

		<USeparator />

		<UContainer class="py-12 sm:py-16">
			<UPageCTA
				:title="page.cta.title"
				:description="page.cta.description"
				:links="page.cta.links"
				variant="subtle"
			/>
		</UContainer>
	</div>
</template>
