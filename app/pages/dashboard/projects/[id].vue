<script setup lang="ts">
import type { ProjectImage, ProjectItem } from '~/types/project'

definePageMeta({
	layout: 'dashboard'
})

useSeoMeta({
	title: 'Edit Karya',
	description: 'Perbarui karya di showcase Majalengka Tech'
})

const route = useRoute()
const { user } = useUserSession()

const { data, error } = await useFetch<{ project: ProjectItem & { images: ProjectImage[] } }>(() => `/api/projects/${route.params.id}`)

const project = computed(() => data.value?.project || null)
const currentUser = computed(() => user.value as { id?: string, role?: string } | null)
const canEdit = computed(() => !!project.value && (project.value.userId === currentUser.value?.id || currentUser.value?.role === 'admin'))

if (error.value || !project.value) {
	throw createError({
		statusCode: 404,
		statusMessage: 'Karya tidak ditemukan',
		fatal: true
	})
}

function onSaved(saved: { slug: string, isPublished: boolean }) {
	return navigateTo(saved.isPublished ? `/projek/${saved.slug}` : '/dashboard/projects')
}
</script>

<template>
	<div class="flex flex-col flex-1">
		<UDashboardNavbar
			title="Edit Karya"
			:ui="{ root: 'border-b border-default' }"
		>
			<template #leading>
				<UDashboardSidebarCollapse />
			</template>

			<template #right>
				<UButton
					v-if="project?.isPublished"
					:to="`/projek/${project.slug}`"
					label="Lihat Halaman Karya"
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
				title="Kamu tidak bisa mengedit karya ini"
				description="Hanya pemilik karya atau admin yang boleh mengubahnya."
				:actions="[{ label: 'Kembali ke Karya Saya', to: '/dashboard/projects', color: 'neutral', variant: 'outline' }]"
			/>
			<ProjectForm
				v-else
				:project="project"
				@saved="onSaved"
			/>
		</div>
	</div>
</template>
