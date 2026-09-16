<script setup lang="ts">
const { data: page } = await useAsyncData('index', () => queryCollection('index').first())

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
				container: 'pt-4 pb-12 sm:pt-6 sm:pb-16 lg:pt-8 lg:pb-16 gap-8 lg:gap-12'
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

			<div class="relative flex items-center justify-center lg:justify-end">
				<div class="w-full max-w-lg lg:max-w-xl xl:max-w-2xl">
					<HeroIllustration />
				</div>
			</div>
		</UPageHero>

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
	</div>
</template>
