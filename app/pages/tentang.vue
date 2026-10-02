<script setup lang="ts">
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
</script>

<template>
	<div v-if="page">
		<UPageHeader
			:title="page.title"
			:description="page.description"
			:ui="{ root: 'border-none', container: 'py-10 sm:py-14', description: 'max-w-3xl text-pretty' }"
			class="mx-auto max-w-(--ui-container) px-4 sm:px-6 lg:px-8"
		/>

		<UPageSection
			:title="page.features.title"
			:description="page.features.description"
			:ui="{ container: 'py-10 sm:py-14 lg:py-16' }"
		>
			<ul class="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
				<li
					v-for="item in page.features.items"
					:key="item.title"
					class="flex flex-col gap-2 border-t border-default pt-4"
				>
					<div class="flex items-center gap-2">
						<UIcon
							:name="item.icon"
							class="size-5 text-primary"
						/>
						<h3 class="font-semibold text-highlighted">
							{{ item.title }}
						</h3>
					</div>
					<p class="text-sm/6 text-muted">
						{{ item.description }}
					</p>
				</li>
			</ul>
		</UPageSection>

		<USeparator />

		<UPageCTA
			:title="page.cta.title"
			:description="page.cta.description"
			:links="page.cta.links"
			variant="naked"
		/>
	</div>
</template>
