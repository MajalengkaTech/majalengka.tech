<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })
useSeoMeta({ title: 'Edit Tutorial', robots: 'noindex, nofollow' })

const route = useRoute()
const { data, error, refresh, status } = await useFetch<{ tutorial: {
	id: number
	slug: string
	title: string
	summary: string | null
	body: string
	level: TutorialLevel
	tags: string | null
	projectId: number | null
	status: TutorialStatus
	reviewNote: string | null
} }>(() => `/api/tutorials/${route.params.id}`, { server: false })

const errorMessage = computed(() => (error.value?.data as { statusMessage?: string } | undefined)?.statusMessage || 'Server belum merespons. Coba muat ulang.')

function onSaved() {
	return navigateTo('/dashboard/tutorial')
}
</script>

<template>
	<UDashboardPanel
		id="dashboard-tutorial-edit"
		:ui="{ body: 'p-0 sm:p-0 gap-0 sm:gap-0' }"
	>
		<template #header>
			<UDashboardNavbar
				title="Edit Tutorial"
				:ui="{ root: 'border-b border-default' }"
			>
				<template #leading>
					<UDashboardSidebarCollapse />
				</template>
				<template #right>
					<UButton
						v-if="data?.tutorial"
						:label="data.tutorial.status === 'terbit' ? 'Lihat Tutorial' : 'Pratinjau'"
						icon="i-lucide-external-link"
						color="neutral"
						variant="outline"
						size="sm"
						:to="`/tutorial/${data.tutorial.slug}`"
					/>
				</template>
			</UDashboardNavbar>
		</template>

		<template #body>
			<div class="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
				<USkeleton
					v-if="status === 'pending' && !data"
					class="h-96 w-full"
				/>
				<UAlert
					v-else-if="error"
					color="error"
					variant="subtle"
					icon="i-lucide-file-x"
					title="Tutorial tidak bisa dibuka"
					:description="errorMessage"
					:actions="[
						{ label: 'Muat Ulang', icon: 'i-lucide-refresh-cw', color: 'error', variant: 'outline', onClick: () => refresh() },
						{ label: 'Kembali ke Tutorial Saya', color: 'neutral', variant: 'ghost', to: '/dashboard/tutorial' }
					]"
				/>
				<TutorialForm
					v-else-if="data?.tutorial"
					:tutorial="data.tutorial"
					@saved="onSaved"
				/>
			</div>
		</template>
	</UDashboardPanel>
</template>
