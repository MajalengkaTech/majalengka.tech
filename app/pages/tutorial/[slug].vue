<script setup lang="ts">
interface TutorialDetail {
	id: number
	slug: string
	title: string
	summary: string | null
	body: string
	level: TutorialLevel
	tags: string | null
	status: TutorialStatus
	publishedAt: string | null
	updatedAt: string | null
	createdAt: string
	readingMinutes: number
	rendered: RenderedMarkdown
	author: { name: string, username: string | null, avatarUrl: string | null }
	project: { title: string | null, slug: string, tagline: string | null, thumbnailUrl: string | null } | null
}

const route = useRoute()
const slug = String(route.params.slug)

const { data, error } = await useFetch<{ tutorial: TutorialDetail }>(`/api/tutorials/slug/${slug}`)
if (error.value || !data.value) {
	throw createError({ statusCode: 404, statusMessage: 'Tutorial tidak ditemukan', fatal: true })
}

const tutorial = computed(() => data.value!.tutorial)
const tags = computed(() => splitTags(tutorial.value.tags))
const isPublished = computed(() => tutorial.value.status === 'terbit')
const authorUrl = computed(() => tutorial.value.author.username ? `/${tutorial.value.author.username.toLowerCase()}` : undefined)
const tocLinks = computed(() => tutorial.value.rendered.meta.toc?.links ?? [])

const seoDescription = computed(() => tutorial.value.summary || storyPlainText(tutorial.value.body))
const ogImage = tutorial.value.project?.thumbnailUrl || undefined

useSeoMeta({
	title: () => tutorial.value.title,
	description: seoDescription,
	ogDescription: seoDescription,
	ogType: 'article',
	ogImage,
	twitterCard: ogImage ? 'summary_large_image' : 'summary',
	articleAuthor: () => [tutorial.value.author.name],
	articlePublishedTime: () => tutorial.value.publishedAt || undefined,
	articleModifiedTime: () => tutorial.value.updatedAt || undefined,
	// Pratinjau tutorial yang belum terbit tidak boleh masuk indeks mesin pencari.
	robots: () => isPublished.value ? undefined : 'noindex, nofollow'
})

useSchemaOrg([
	{
		'@type': 'TechArticle',
		'headline': () => tutorial.value.title,
		'description': seoDescription,
		'url': () => `https://majalengka.tech/tutorial/${tutorial.value.slug}`,
		'image': ogImage,
		'proficiencyLevel': () => TUTORIAL_LEVELS[tutorial.value.level],
		'keywords': () => tags.value.join(', ') || undefined,
		'datePublished': () => tutorial.value.publishedAt || undefined,
		'dateModified': () => tutorial.value.updatedAt || tutorial.value.publishedAt || undefined,
		'author': {
			'@type': 'Person',
			'name': () => tutorial.value.author.name,
			'url': () => authorUrl.value ? `https://majalengka.tech${authorUrl.value}` : undefined
		}
	},
	defineBreadcrumb({
		itemListElement: [
			{ name: 'Tutorial', item: '/tutorial' },
			{ name: () => tutorial.value.title }
		]
	})
])
</script>

<template>
	<UContainer>
		<UPageHeader
			:title="tutorial.title"
			:description="tutorial.summary || undefined"
		>
			<template #headline>
				<UBadge
					:label="TUTORIAL_LEVELS[tutorial.level]"
					color="neutral"
					variant="subtle"
				/>
				<span class="text-muted">&middot;</span>
				<span class="text-muted">{{ tutorial.readingMinutes }} menit baca</span>
				<template v-if="tutorial.publishedAt">
					<span class="text-muted">&middot;</span>
					<time
						:datetime="tutorial.publishedAt"
						class="text-muted"
					>{{ formatTanggal(tutorial.publishedAt) }}</time>
				</template>
			</template>

			<div class="mt-4 flex flex-wrap items-center gap-3">
				<UUser
					:name="tutorial.author.name"
					:description="tutorial.author.username ? `@${tutorial.author.username}` : undefined"
					:avatar="{ src: avatarSrc(tutorial.author.avatarUrl), alt: tutorial.author.name }"
					:to="authorUrl"
					size="sm"
					class="me-2"
				/>
				<UButton
					v-for="tag in tags"
					:key="tag"
					:label="tag"
					:to="{ path: '/tutorial', query: { teknologi: tag } }"
					color="neutral"
					variant="outline"
					size="xs"
				/>
			</div>
		</UPageHeader>

		<UPage>
			<UPageBody>
				<UAlert
					v-if="!isPublished"
					color="warning"
					variant="subtle"
					icon="i-lucide-eye"
					title="Pratinjau, belum terbit"
					description="Halaman ini hanya terlihat oleh penulis, pengelola situs, dan peninjau sampai tutorialnya disetujui."
					class="mb-8"
				/>

				<MarkdownContent :value="tutorial.rendered" />

				<USeparator
					v-if="tutorial.project"
					label="Proyek dari tutorial ini"
					class="mt-12 mb-6"
				/>
				<UPageCard
					v-if="tutorial.project"
					:to="`/projek/${tutorial.project.slug}`"
					:title="tutorial.project.title || 'Proyek terkait'"
					:description="tutorial.project.tagline || undefined"
					icon="i-lucide-folder-git-2"
					orientation="horizontal"
					variant="subtle"
				>
					<NuxtImg
						v-if="tutorial.project.thumbnailUrl"
						:src="fileSrc(tutorial.project.thumbnailUrl)"
						alt=""
						class="aspect-video w-full rounded-md object-cover"
						sizes="320px"
						preset="sampul"
						loading="lazy"
					/>
				</UPageCard>
			</UPageBody>

			<template
				v-if="tocLinks.length > 1"
				#right
			>
				<UContentToc
					title="Daftar isi"
					:links="tocLinks"
					highlight
				/>
			</template>
		</UPage>
	</UContainer>
</template>
