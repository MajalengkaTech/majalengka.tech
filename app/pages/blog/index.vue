<script setup lang="ts">
const { data: page } = await useAsyncData('blog', () => queryCollection('blog').first())
const { data: posts } = await useAsyncData('posts', () => queryCollection('posts').all())

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
	<UContainer>
		<UPageHeader
			v-bind="page"
			class="py-[50px]"
		/>

		<UPageBody>
			<UEmpty
				v-if="!posts?.length"
				icon="i-lucide-newspaper"
				title="Belum ada tulisan"
				description="Belum ada tulisan yang terbit. Sementara itu, lihat karya-karya di showcase."
				:actions="[{ label: 'Lihat Showcase', icon: 'i-lucide-layout-grid', to: '/projek' }]"
			/>
			<UBlogPosts v-else>
				<UBlogPost
					v-for="(post, index) in posts"
					:key="index"
					:to="post.path"
					:title="post.title"
					:description="post.description"
					:image="post.image"
					:date="new Date(post.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })"
					:authors="post.authors"
					:badge="post.badge"
					:orientation="index === 0 ? 'horizontal' : 'vertical'"
					:class="[index === 0 && 'col-span-full']"
					variant="naked"
					:ui="{
						description: 'line-clamp-2'
					}"
				/>
			</UBlogPosts>
		</UPageBody>
	</UContainer>
</template>
