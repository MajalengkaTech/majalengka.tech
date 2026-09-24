<script setup lang="ts">
const { data: page } = await useAsyncData('pricing', () => queryCollection('pricing').first())

const title = page.value?.seo?.title || page.value?.title
const description = page.value?.seo?.description || page.value?.description

useSeoMeta({
	title,
	ogTitle: title,
	description,
	ogDescription: description
})

defineOgImage('Saas', { title, description })
</script>

<template>
	<div v-if="page">
		<UPageHero
			:title="page.title"
			:description="page.description"
			:ui="{
				title: 'text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-balance',
				description: 'text-base sm:text-lg text-muted text-pretty max-w-2xl mx-auto'
			}"
		/>

		<UContainer>
			<UPricingPlans scale>
				<UPricingPlan
					v-for="(plan, index) in page.plans"
					:key="index"
					v-bind="plan"
					:price="plan.price.month"
					:billing-cycle="plan.billing_cycle"
				/>
			</UPricingPlans>
		</UContainer>

		<UPageSection>
			<UPageLogos>
				<UIcon
					v-for="icon in page.logos.icons"
					:key="icon"
					:name="icon"
					class="w-12 h-12 shrink-0 text-muted"
				/>
			</UPageLogos>
		</UPageSection>

		<UPageSection
			:title="page.faq.title"
			:description="page.faq.description"
		>
			<UAccordion
				:items="page.faq.items"
				:unmount-on-hide="false"
				:default-value="['0']"
				type="multiple"
				class="max-w-3xl mx-auto"
				:ui="{
					trigger: 'text-base text-highlighted',
					body: 'text-base text-muted'
				}"
			/>
		</UPageSection>
	</div>
</template>
