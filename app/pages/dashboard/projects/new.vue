<script setup lang="ts">
definePageMeta({
	layout: 'dashboard'
})

useSeoMeta({
	title: 'Pamerkan Proyek',
	description: 'Tambahkan proyek baru ke showcase Majalengka Tech'
})

function onSaved(project: { slug: string, isPublished: boolean }) {
	return navigateTo(project.isPublished ? `/projek/${project.slug}` : '/dashboard/projects')
}
</script>

<template>
	<UDashboardPanel
		id="dashboard-proyek-baru"
		:ui="{ body: 'p-0 sm:p-0 gap-0 sm:gap-0' }"
	>
		<template #header>
			<UDashboardNavbar
				title="Pamerkan Proyek"
				:ui="{ root: 'border-b border-default' }"
			>
				<template #leading>
					<UDashboardSidebarCollapse />
				</template>
			</UDashboardNavbar>
		</template>

		<template #body>
			<div class="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
				<p class="text-sm text-muted">
					Isi detail proyekmu. Kamu bisa menyimpannya sebagai Draf dulu sebelum menerbitkannya. Butuh contoh? Baca <ULink
						to="/docs/getting-started/pamerkan-karya"
						class="font-medium text-primary"
					>panduan memamerkan proyek</ULink>.
				</p>
				<ProjectForm @saved="onSaved" />
			</div>
		</template>
	</UDashboardPanel>
</template>
