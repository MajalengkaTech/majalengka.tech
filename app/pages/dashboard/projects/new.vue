<script setup lang="ts">
definePageMeta({
	layout: 'dashboard'
})

useSeoMeta({
	title: 'Pamerkan Karya',
	description: 'Tambahkan karya baru ke showcase Majalengka Tech'
})

function onSaved(project: { slug: string, isPublished: boolean }) {
	return navigateTo(project.isPublished ? `/projek/${project.slug}` : '/dashboard/projects')
}
</script>

<template>
	<div class="flex flex-col flex-1">
		<UDashboardNavbar
			title="Pamerkan Karya"
			:ui="{ root: 'border-b border-default' }"
		>
			<template #leading>
				<UDashboardSidebarCollapse />
			</template>
		</UDashboardNavbar>

		<div class="p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
			<ProjectForm @saved="onSaved" />
		</div>
	</div>
</template>
