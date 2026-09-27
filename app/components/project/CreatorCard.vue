<script setup lang="ts">
import type { ProjectDetail } from '~/types/project'

const props = defineProps<{
	author: ProjectDetail['author']
}>()

const roleLabel = computed(() => {
	const role = props.author.creatorRole as CreatorRole | null | undefined
	return role ? CREATOR_ROLES[role] : null
})

const links = computed(() => [
	props.author.websiteUrl && { label: 'Portofolio', icon: 'i-lucide-globe', to: props.author.websiteUrl },
	props.author.designUrl && { label: 'Dribbble / Behance', icon: 'i-lucide-pen-tool', to: props.author.designUrl },
	props.author.githubUsername && { label: 'GitHub', icon: 'i-simple-icons-github', to: `https://github.com/${props.author.githubUsername}` },
	props.author.linkedinUrl && { label: 'LinkedIn', icon: 'i-simple-icons-linkedin', to: props.author.linkedinUrl }
].filter(Boolean) as { label: string, icon: string, to: string }[])
</script>

<template>
	<UCard
		variant="subtle"
		:ui="{ body: 'flex flex-col gap-4' }"
	>
		<div class="flex items-center gap-3">
			<UAvatar
				:src="author.avatarUrl || undefined"
				:alt="author.name"
				size="xl"
			/>
			<div class="min-w-0">
				<p class="truncate font-semibold text-highlighted">
					{{ author.name }}
				</p>
				<p
					v-if="author.username"
					class="truncate text-sm text-muted"
				>
					@{{ author.username }}
				</p>
			</div>
		</div>

		<div
			v-if="roleLabel || author.location || author.openToWork"
			class="flex flex-wrap gap-1.5"
		>
			<UBadge
				v-if="roleLabel"
				:label="roleLabel"
				color="neutral"
				variant="subtle"
			/>
			<UBadge
				v-if="author.location"
				:label="author.location"
				icon="i-lucide-map-pin"
				color="neutral"
				variant="outline"
			/>
			<UBadge
				v-if="author.openToWork"
				label="Terbuka untuk project"
				icon="i-lucide-briefcase"
				color="success"
				variant="subtle"
			/>
		</div>

		<p
			v-if="author.bio"
			class="text-sm text-muted whitespace-pre-line"
		>
			{{ author.bio }}
		</p>

		<UButton
			v-if="author.username"
			:to="`/@${author.username}`"
			label="Lihat Profil & Karya Lain"
			color="neutral"
			variant="outline"
			block
		/>

		<div
			v-if="links.length"
			class="flex flex-col gap-1"
		>
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
		</div>
	</UCard>
</template>
