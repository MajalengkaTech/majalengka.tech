<script setup lang="ts">
import type { ProjectDetail } from '~/types/project'

const props = defineProps<{
	author: ProjectDetail['author']
}>()

const roleLabel = computed(() => {
	const role = props.author.creatorRole as CreatorRole | null | undefined
	return role ? CREATOR_ROLES[role] : null
})

const links = computed(() => {
	const result: { label: string, icon: string, to: string }[] = []

	if (props.author.websiteUrl) {
		result.push({ label: 'Portofolio', icon: 'i-mage-globe', to: props.author.websiteUrl })
	}
	if (props.author.githubUsername) {
		result.push({ label: 'GitHub', icon: 'i-mage-github', to: `https://github.com/${props.author.githubUsername.replace(/^@/, '')}` })
	}

	const seenUrls = new Set(result.map(r => r.to))

	if (Array.isArray(props.author.socialLinks)) {
		for (const item of props.author.socialLinks) {
			if (item?.url && !seenUrls.has(item.url)) {
				const conf = getSocialPlatformConfig(item.platform)
				result.push({
					label: item.label || conf.label,
					icon: conf.icon,
					to: item.url
				})
				seenUrls.add(item.url)
			}
		}
	}

	if (props.author.designUrl && !seenUrls.has(props.author.designUrl)) {
		result.push({ label: 'Dribbble / Behance', icon: 'i-mage-dribbble', to: props.author.designUrl })
		seenUrls.add(props.author.designUrl)
	}

	if (props.author.linkedinUrl && !seenUrls.has(props.author.linkedinUrl)) {
		result.push({ label: 'LinkedIn', icon: 'i-mage-linkedin', to: props.author.linkedinUrl })
		seenUrls.add(props.author.linkedinUrl)
	}

	return result
})
</script>

<template>
	<UCard
		variant="subtle"
		:ui="{ body: 'flex flex-col gap-4' }"
	>
		<div class="flex items-center gap-3">
			<UAvatar
				:src="avatarSrc(author.avatarUrl)"
				:alt="author.username ? `@${author.username}` : author.name"
				size="xl"
			/>
			<div class="min-w-0">
				<p class="truncate font-semibold text-highlighted">
					{{ author.username ? `@${author.username}` : author.name }}
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
				label="Terbuka untuk kerja sama"
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
			:to="`/${author.username}`"
			label="Lihat Profil & Proyek Lain"
			color="neutral"
			variant="outline"
			block
		/>

		<div
			v-if="links.length"
			class="flex flex-col gap-1 min-w-0"
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
				class="justify-start truncate max-w-full"
				trailing-icon="i-lucide-arrow-up-right"
			/>
		</div>
	</UCard>
</template>
