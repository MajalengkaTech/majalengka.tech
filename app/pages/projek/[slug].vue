<script setup lang="ts">
import type { ProjectDetail, ProjectItem } from '~/types/project'

const route = useRoute()
const slug = computed(() => String(route.params.slug))

const { data, error } = await useFetch<{ project: ProjectDetail }>(() => `/api/projects/slug/${slug.value}`, {
	key: `project-detail-${slug.value}`
})

if (error.value || !data.value?.project) {
	throw createError({
		statusCode: 404,
		statusMessage: 'Karya tidak ditemukan',
		fatal: true
	})
}

const project = computed(() => data.value!.project)
const { toggleLike, isPending } = useProjectLike()

// Thumbnail tampil pertama, lalu galeri; URL yang sama tidak diulang.
const images = computed(() => {
	const seen = new Set<string>()
	return [
		project.value.thumbnailUrl ? { url: project.value.thumbnailUrl, alt: `Tampilan utama ${project.value.title}` } : null,
		...project.value.images
	].filter((image): image is { url: string, alt: string | null } => {
		if (!image || seen.has(image.url)) return false
		seen.add(image.url)
		return true
	})
})

const tags = computed(() => splitTags(project.value.tags))
const category = computed(() => categoryLabel(project.value.category))
const storyParagraphs = computed(() => project.value.description.split(/\n{2,}/).map(p => p.trim()).filter(Boolean))

const links = computed(() => [
	project.value.demoUrl && { label: 'Coba Demo', icon: 'i-lucide-external-link', to: project.value.demoUrl, color: 'primary' as const, variant: 'solid' as const },
	project.value.designUrl && { label: 'Lihat Desain', icon: 'i-lucide-pen-tool', to: project.value.designUrl, color: 'neutral' as const, variant: 'outline' as const },
	project.value.repoUrl && { label: 'Lihat Kode', icon: 'i-simple-icons-github', to: project.value.repoUrl, color: 'neutral' as const, variant: 'outline' as const }
].filter(Boolean) as { label: string, icon: string, to: string, color: 'primary' | 'neutral', variant: 'solid' | 'outline' }[])

const { data: otherData } = await useFetch<{ projects: ProjectItem[] }>('/api/projects', {
	key: `project-others-${slug.value}`,
	query: { author: project.value.author.username || undefined, limit: 5 },
	immediate: Boolean(project.value.author.username)
})
const otherProjects = computed(() => (otherData.value?.projects || []).filter(p => p.id !== project.value.id).slice(0, 4))

const shareUrl = useRequestURL().origin + route.path
const { shareLink } = useShareLink()

function shareProject() {
	return shareLink({
		title: project.value.title,
		text: project.value.tagline || `Karya ${project.value.author.name} di Majalengka Tech`,
		url: shareUrl
	})
}

const breadcrumb = computed(() => [
	{ label: 'Showcase', to: '/projek' },
	{ label: category.value, to: `/projek?kategori=${project.value.category || 'lainnya'}` },
	{ label: project.value.title }
])

const seoDescription = computed(() => project.value.tagline || project.value.description.slice(0, 155))
useSeoMeta({
	title: () => `${project.value.title} oleh ${project.value.author.name}`,
	ogTitle: () => project.value.title,
	description: seoDescription,
	ogDescription: seoDescription
})

defineOgImage('Saas', {
	headline: category.value,
	title: project.value.title,
	description: `oleh ${project.value.author.name}`
})
</script>

<template>
	<UContainer class="flex flex-col gap-8 py-6 sm:gap-10 sm:py-10">
		<UBreadcrumb :items="breadcrumb" />

		<UAlert
			v-if="!project.isPublished"
			color="warning"
			variant="subtle"
			icon="i-lucide-eye-off"
			title="Karya ini masih Draf"
			description="Hanya kamu dan admin yang bisa melihat halaman ini. Terbitkan dari dashboard kalau sudah siap dipamerkan."
			:actions="[{ label: 'Edit Karya', to: `/dashboard/projects/${project.id}`, color: 'warning', variant: 'outline' }]"
		/>

		<header class="flex flex-col gap-5">
			<div class="flex flex-wrap items-center gap-2">
				<UBadge
					:label="category"
					color="primary"
					variant="subtle"
				/>
				<span
					v-if="project.isFeatured"
					class="inline-flex items-center gap-1 rounded-sm bg-mango-100 px-2 py-0.5 text-xs font-semibold text-mango-900 dark:bg-mango-400/15 dark:text-mango-300"
				>
					<UIcon
						name="i-lucide-award"
						class="size-3.5"
					/>
					Pilihan Kurator
				</span>
			</div>

			<div class="flex flex-col gap-3">
				<h1 class="text-3xl font-bold tracking-tight text-balance text-highlighted sm:text-4xl lg:text-5xl">
					{{ project.title }}
				</h1>
				<p
					v-if="project.tagline"
					class="max-w-3xl text-lg text-pretty text-muted sm:text-xl"
				>
					{{ project.tagline }}
				</p>
			</div>

			<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<div class="flex items-center gap-3">
					<UAvatar
						:src="project.author.avatarUrl || undefined"
						:alt="project.author.name"
						size="md"
					/>
					<p class="text-sm text-muted">
						oleh
						<NuxtLink
							v-if="project.author.username"
							:to="`/@${project.author.username}`"
							class="rounded-sm font-semibold text-highlighted outline-primary/25 hover:text-primary focus-visible:outline-3"
						>{{ project.author.name }}</NuxtLink>
						<span
							v-else
							class="font-semibold text-highlighted"
						>{{ project.author.name }}</span>
						<span aria-hidden="true"> · </span>
						<time :datetime="new Date(project.createdAt).toISOString()">{{ formatTanggal(project.createdAt) }}</time>
					</p>
				</div>

				<div class="flex flex-wrap items-center gap-2">
					<UButton
						v-if="!project.isOwner"
						:icon="project.likedByMe ? 'i-tabler-heart-filled' : 'i-tabler-heart'"
						:label="project.likeCount ? `${project.likeCount} Apresiasi` : 'Beri Apresiasi'"
						:color="project.likedByMe ? 'primary' : 'neutral'"
						:variant="project.likedByMe ? 'solid' : 'outline'"
						:aria-pressed="project.likedByMe"
						:loading="isPending(project.id)"
						@click="toggleLike(project)"
					/>
					<span
						v-else
						class="inline-flex items-center gap-1.5 px-1 text-sm text-muted"
					>
						<UIcon
							name="i-tabler-heart"
							class="size-4"
						/>
						{{ project.likeCount || 0 }} apresiasi
					</span>
					<UButton
						v-for="link in links"
						:key="link.to"
						:label="link.label"
						:icon="link.icon"
						:to="link.to"
						target="_blank"
						rel="noopener"
						:color="link.color"
						:variant="link.variant"
					/>
					<UButton
						icon="i-lucide-share-2"
						label="Bagikan"
						color="neutral"
						variant="ghost"
						@click="shareProject"
					/>
					<UButton
						v-if="project.isOwner"
						icon="i-lucide-pencil"
						label="Edit"
						color="neutral"
						variant="ghost"
						:to="`/dashboard/projects/${project.id}`"
					/>
				</div>
			</div>
		</header>

		<ProjectGallery
			:images="images"
			:title="project.title"
		/>

		<div class="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">
			<article class="flex min-w-0 flex-col gap-8">
				<section
					aria-labelledby="judul-cerita"
					class="flex flex-col gap-4"
				>
					<h2
						id="judul-cerita"
						class="text-xl font-bold text-highlighted"
					>
						Cerita di balik karya
					</h2>
					<div class="flex max-w-prose flex-col gap-4 text-base/7 text-default">
						<p
							v-for="(paragraph, index) in storyParagraphs"
							:key="index"
							class="whitespace-pre-line break-words"
						>
							{{ paragraph }}
						</p>
					</div>
				</section>

				<dl
					v-if="project.contribution || tags.length"
					class="grid gap-6 border-t border-default pt-6 sm:grid-cols-2"
				>
					<div v-if="project.contribution">
						<dt class="text-sm font-medium text-muted">
							Peran kreator
						</dt>
						<dd class="mt-1 text-highlighted">
							{{ project.contribution }}
						</dd>
					</div>
					<div v-if="tags.length">
						<dt class="text-sm font-medium text-muted">
							Dibuat dengan
						</dt>
						<dd class="mt-2 flex flex-wrap gap-1.5">
							<UBadge
								v-for="tag in tags"
								:key="tag"
								:label="tag"
								color="neutral"
								variant="outline"
							/>
						</dd>
					</div>
				</dl>

				<ProjectComments
					:project-id="project.id"
					:project-owner-id="project.userId"
					class="border-t border-default pt-8"
				/>
			</article>

			<aside class="flex flex-col gap-6 lg:sticky lg:top-(--ui-header-height) lg:self-start lg:pt-2">
				<ProjectCreatorCard :author="project.author" />
			</aside>
		</div>

		<section
			v-if="otherProjects.length"
			aria-labelledby="judul-karya-lain"
			class="flex flex-col gap-5 border-t border-default pt-8"
		>
			<h2
				id="judul-karya-lain"
				class="text-xl font-bold text-highlighted"
			>
				Karya lain dari {{ project.author.name }}
			</h2>
			<div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
				<ProjectMiniCard
					v-for="item in otherProjects"
					:key="item.id"
					:project="item"
				/>
			</div>
		</section>
	</UContainer>
</template>
