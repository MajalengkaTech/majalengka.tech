<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })
useSeoMeta({ title: 'Tulis Tutorial', robots: 'noindex, nofollow' })

function onSaved() {
	return navigateTo('/dashboard/tutorial')
}
</script>

<template>
	<UDashboardPanel
		id="dashboard-tutorial-baru"
		:ui="{ body: 'p-0 sm:p-0 gap-0 sm:gap-0' }"
	>
		<template #header>
			<UDashboardNavbar
				title="Tulis Tutorial"
				:ui="{ root: 'border-b border-default' }"
			>
				<template #leading>
					<UDashboardSidebarCollapse />
				</template>
			</UDashboardNavbar>
		</template>

		<template #body>
			<div class="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
				<p class="text-sm text-muted">
					Simpan sebagai draf kapan saja. Kalau sudah siap, kirim untuk ditinjau. Tutorial terbit setelah disetujui peninjau.
				</p>
				<TutorialForm @saved="onSaved" />
			</div>
		</template>
	</UDashboardPanel>
</template>
