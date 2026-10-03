<script setup lang="ts">
import type { ProjectImage, ProjectItem } from '~/types/project'

definePageMeta({
	layout: 'dashboard'
})

useSeoMeta({
	title: 'Edit Proyek',
	description: 'Perbarui proyek di showcase Majalengka Tech'
})

const route = useRoute()
const { user } = useUserSession()

const { data, error } = await useFetch<{ project: ProjectItem & { images: ProjectImage[] } }>(() => `/api/projects/${route.params.id}`)

const project = computed(() => data.value?.project || null)
const currentUser = computed(() => user.value as { id?: string, role?: string } | null)
const isOwner = computed(() => !!project.value && project.value.userId === currentUser.value?.id)
const canEdit = computed(() => isOwner.value || currentUser.value?.role === 'admin')

if (error.value || !project.value) {
	throw createError({
		statusCode: 404,
		statusMessage: 'Proyek tidak ditemukan',
		fatal: true
	})
}

// Admin yang mengedit proyek orang lain kembali ke Kelola Proyek, bukan ke daftar proyeknya sendiri.
function onSaved(saved: { slug: string, isPublished: boolean }) {
	if (saved.isPublished) return navigateTo(`/projek/${saved.slug}`)
	return navigateTo(isOwner.value ? '/dashboard/projects' : '/kelola/proyek')
}
</script>

<template>
	<div class="flex flex-col flex-1">
		<UDashboardNavbar
			title="Edit Proyek"
			:ui="{ root: 'border-b border-default' }"
		>
			<template #leading>
				<UDashboardSidebarCollapse />
			</template>

			<template #right>
				<UButton
					v-if="project?.isPublished"
					:to="`/projek/${project.slug}`"
					label="Lihat Halaman Proyek"
					icon="i-lucide-external-link"
					color="neutral"
					variant="outline"
					size="sm"
				/>
			</template>
		</UDashboardNavbar>

		<div class="p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
			<UAlert
				v-if="!canEdit"
				color="error"
				variant="subtle"
				icon="i-lucide-lock"
				title="Kamu tidak bisa mengedit proyek ini"
				description="Hanya pemilik proyek atau admin yang boleh mengubahnya."
				:actions="[{ label: 'Kembali ke Proyek Saya', to: '/dashboard/projects', color: 'neutral', variant: 'outline' }]"
			/>
			<template v-else>
				<UAlert
					v-if="!isOwner"
					color="info"
					variant="subtle"
					icon="i-lucide-shield-check"
					title="Kamu mengedit sebagai admin"
					:description="`Proyek ini milik ${project?.author?.name || 'kreator lain'}. Perubahanmu langsung tampil di halaman proyeknya.`"
					class="mb-6"
				/>
				<ProjectForm
					:project="project"
					@saved="onSaved"
				/>
			</template>
		</div>
	</div>
</template>
