<script setup lang="ts">
import type { CreatorCardData, CreatorCardInfo, CreatorProfile, ProjectItem } from '~/types/project'

const route = useRoute()
const { user } = useUserSession()
const username = computed(() => String(route.params.username).toLowerCase())

const { data, error } = await useFetch<{ creator: CreatorProfile, card: CreatorCardInfo | null, projects: ProjectItem[] }>(() => `/api/creators/${username.value}`, {
	key: `creator-${username.value}`
})

if (error.value || !data.value?.creator) {
	throw createError({
		statusCode: 404,
		statusMessage: 'Kreator tidak ditemukan',
		fatal: true
	})
}

const creator = computed(() => data.value!.creator)
const projects = computed(() => data.value?.projects || [])
const isMe = computed(() => (user.value as { id?: string } | null)?.id === creator.value.id)
const roleLabel = computed(() => creator.value.creatorRole ? CREATOR_ROLES[creator.value.creatorRole as CreatorRole] : null)
const skills = computed(() => splitTags(creator.value.skills))

const links = computed(() => [
	creator.value.websiteUrl && { label: 'Portofolio', icon: 'i-lucide-globe', to: creator.value.websiteUrl },
	creator.value.designUrl && { label: 'Dribbble / Behance', icon: 'i-lucide-pen-tool', to: creator.value.designUrl },
	creator.value.githubUsername && { label: 'GitHub', icon: 'i-simple-icons-github', to: `https://github.com/${creator.value.githubUsername}` },
	creator.value.linkedinUrl && { label: 'LinkedIn', icon: 'i-simple-icons-linkedin', to: creator.value.linkedinUrl }
].filter(Boolean) as { label: string, icon: string, to: string }[])

const cardData = computed<CreatorCardData>(() => ({
	name: creator.value.name,
	username: creator.value.username || username.value,
	avatarUrl: creator.value.avatarUrl,
	roleLabel: roleLabel.value,
	projectCount: creator.value.projectCount,
	likeCount: creator.value.likeCount,
	rank: creator.value.rank,
	totalCreators: creator.value.totalCreators
}))

const { busy: cardBusy, downloadCard, uploadCard } = useCreatorCard()
const toast = useToast()
const cardSyncFailed = ref(false)

async function onDownloadCard() {
	try {
		await downloadCard(cardData.value)
	} catch {
		toast.add({ title: 'Kartu belum bisa diunduh', description: 'Coba muat ulang halaman lalu unduh lagi.', color: 'error' })
	}
}

// Gambar pratinjau link dibuat di browser pemilik dan hanya diperbarui kalau angkanya berubah.
onMounted(async () => {
	if (!isMe.value) return
	const card = data.value?.card
	const changed = !card
		|| card.projectCount !== creator.value.projectCount
		|| card.likeCount !== creator.value.likeCount
		|| card.rank !== creator.value.rank
	if (!changed) return
	try {
		await uploadCard(cardData.value)
	} catch {
		cardSyncFailed.value = true
	}
})

const origin = useRequestURL().origin
const profileUrl = origin + route.path
const { shareLink } = useShareLink()

function shareProfile() {
	return shareLink({ title: `${creator.value.name} di Majalengka Tech`, url: profileUrl })
}

const seoDescription = computed(() => creator.value.bio
	|| [roleLabel.value, creator.value.location].filter(Boolean).join(' dari ')
	|| `Karya ${creator.value.name} di Majalengka Tech`)

const cardImage = data.value?.card ? origin + data.value.card.url : undefined

useSeoMeta({
	title: () => `${creator.value.name} (@${creator.value.username})`,
	description: seoDescription,
	ogDescription: seoDescription,
	ogImage: cardImage,
	ogImageWidth: cardImage ? 1200 : undefined,
	ogImageHeight: cardImage ? 630 : undefined,
	ogImageAlt: cardImage ? `Kartu kreator ${creator.value.name} di Majalengka Tech` : undefined,
	twitterCard: cardImage ? 'summary_large_image' : 'summary'
})
</script>

<template>
	<UContainer class="flex flex-col gap-10 py-8 sm:py-12">
		<header class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
			<div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
				<UAvatar
					:src="creator.avatarUrl || undefined"
					:alt="creator.name"
					class="size-24 text-3xl sm:size-28"
				/>
				<div class="flex min-w-0 flex-col gap-2">
					<h1 class="text-3xl font-bold tracking-tight text-balance text-highlighted sm:text-4xl">
						{{ creator.name }}
					</h1>
					<p class="text-muted">
						@{{ creator.username }}
					</p>
					<div
						v-if="roleLabel || creator.location || creator.openToWork"
						class="flex flex-wrap gap-1.5 pt-1"
					>
						<UBadge
							v-if="roleLabel"
							:label="roleLabel"
							color="primary"
							variant="subtle"
						/>
						<UBadge
							v-if="creator.location"
							:label="creator.location"
							icon="i-lucide-map-pin"
							color="neutral"
							variant="outline"
						/>
						<UBadge
							v-if="creator.openToWork"
							label="Terbuka untuk project"
							icon="i-lucide-briefcase"
							color="success"
							variant="subtle"
						/>
					</div>
				</div>
			</div>

			<div
				v-if="isMe"
				class="flex flex-wrap gap-2 lg:justify-end"
			>
				<UButton
					to="/dashboard/settings"
					label="Edit Profil"
					icon="i-lucide-pencil"
					color="neutral"
					variant="outline"
				/>
			</div>
		</header>

		<section
			aria-label="Kartu kreator"
			class="flex flex-col gap-3"
		>
			<CreatorStatsCard :data="cardData" />
			<div class="flex flex-wrap items-center gap-2">
				<UButton
					label="Unduh Kartu"
					icon="i-lucide-download"
					color="neutral"
					variant="outline"
					:loading="cardBusy"
					@click="onDownloadCard"
				/>
				<UButton
					label="Bagikan Profil"
					icon="i-lucide-share-2"
					color="neutral"
					variant="ghost"
					@click="shareProfile"
				/>
				<p
					v-if="isMe && cardSyncFailed"
					class="text-sm text-muted"
				>
					Gambar pratinjau link belum bisa diperbarui. Kartu di halaman ini tetap memakai angka terbaru.
				</p>
			</div>
		</section>

		<div class="grid gap-10 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-12">
			<aside class="flex flex-col gap-6">
				<section
					v-if="creator.bio"
					aria-labelledby="judul-bio"
					class="flex flex-col gap-2"
				>
					<h2
						id="judul-bio"
						class="text-sm font-semibold text-highlighted"
					>
						Tentang
					</h2>
					<p class="text-sm/6 text-default whitespace-pre-line">
						{{ creator.bio }}
					</p>
				</section>

				<section
					v-if="skills.length"
					aria-labelledby="judul-skill"
					class="flex flex-col gap-2"
				>
					<h2
						id="judul-skill"
						class="text-sm font-semibold text-highlighted"
					>
						Skill
					</h2>
					<div class="flex flex-wrap gap-1.5">
						<UBadge
							v-for="skill in skills"
							:key="skill"
							:label="skill"
							color="neutral"
							variant="outline"
						/>
					</div>
				</section>

				<section
					v-if="links.length"
					aria-labelledby="judul-tautan"
					class="flex flex-col gap-1"
				>
					<h2
						id="judul-tautan"
						class="mb-1 text-sm font-semibold text-highlighted"
					>
						Tautan
					</h2>
					<UButton
						v-for="link in links"
						:key="link.to"
						:label="link.label"
						:icon="link.icon"
						:to="link.to"
						target="_blank"
						rel="noopener"
						color="neutral"
						variant="ghost"
						size="sm"
						class="justify-start"
						trailing-icon="i-lucide-arrow-up-right"
					/>
				</section>

				<p class="text-xs text-muted">
					Bergabung sejak {{ formatTanggal(creator.createdAt) }}
				</p>
			</aside>

			<section
				aria-labelledby="judul-karya"
				class="flex min-w-0 flex-col gap-5"
			>
				<h2
					id="judul-karya"
					class="text-xl font-bold text-highlighted"
				>
					Karya
				</h2>

				<UEmpty
					v-if="!projects.length"
					icon="i-lucide-folder-open"
					:title="isMe ? 'Karya pertamamu belum dipamerkan' : 'Belum ada karya yang dipublikasikan'"
					:description="isMe ? 'Unggah satu karya, lalu bagikan profil ini ke teman atau calon klien.' : `${creator.name} belum menerbitkan karya di Majalengka Tech.`"
					:actions="isMe ? [{ label: 'Pamerkan Karya', icon: 'i-lucide-folder-plus', to: '/dashboard/projects/new' }] : []"
				/>

				<div
					v-else
					class="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 xl:grid-cols-3"
				>
					<div
						v-for="project in projects"
						:key="project.id"
						class="flex flex-col gap-2"
					>
						<ProjectMiniCard :project="project" />
						<div class="flex items-center gap-3 text-xs text-muted">
							<span
								v-if="project.isFeatured"
								class="inline-flex items-center gap-1 rounded-sm bg-mango-100 px-1.5 py-0.5 font-semibold text-mango-900 dark:bg-mango-400/15 dark:text-mango-300"
							>
								<UIcon
									name="i-lucide-award"
									class="size-3"
								/>
								Pilihan Kurator
							</span>
							<span class="inline-flex items-center gap-1">
								<UIcon
									name="i-tabler-heart"
									class="size-3.5"
								/>
								{{ project.likeCount || 0 }}
							</span>
							<span class="inline-flex items-center gap-1">
								<UIcon
									name="i-lucide-message-circle"
									class="size-3.5"
								/>
								{{ project.commentCount || 0 }}
							</span>
						</div>
					</div>
				</div>
			</section>
		</div>
	</UContainer>
</template>
