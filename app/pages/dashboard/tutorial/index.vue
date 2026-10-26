<script setup lang="ts">
interface MyTutorial {
	id: number
	slug: string
	title: string
	level: TutorialLevel
	status: TutorialStatus
	reviewNote: string | null
	publishedAt: string | null
	updatedAt: string | null
	createdAt: string
	projectTitle: string | null
}

definePageMeta({ layout: 'dashboard' })
useSeoMeta({ title: 'Tutorial Saya', robots: 'noindex, nofollow' })

const toast = useToast()
const { data, status, error, refresh } = await useFetch<{ tutorials: MyTutorial[] }>('/api/tutorials/mine', { key: 'my-tutorials', server: false })
const tutorials = computed(() => data.value?.tutorials ?? [])

const STATUS_COLORS: Record<TutorialStatus, 'neutral' | 'warning' | 'success' | 'error'> = {
	draf: 'neutral',
	ditinjau: 'warning',
	terbit: 'success',
	ditolak: 'error'
}

const deleteTarget = ref<MyTutorial | null>(null)
const deleteOpen = computed({
	get: () => Boolean(deleteTarget.value),
	set: (value: boolean) => {
		if (!value) deleteTarget.value = null
	}
})
const deleting = ref(false)

async function deleteTutorial() {
	const target = deleteTarget.value
	if (!target) return
	deleting.value = true
	try {
		await $fetch(`/api/tutorials/${target.id}`, { method: 'DELETE' })
		deleteTarget.value = null
		toast.add({ title: 'Tutorial dihapus', description: target.title, color: 'success' })
		await refresh()
	} catch (err: unknown) {
		const errorResponse = err as { data?: { statusMessage?: string } }
		toast.add({ title: 'Tutorial belum terhapus', description: errorResponse.data?.statusMessage || 'Coba lagi sebentar.', color: 'error' })
	} finally {
		deleting.value = false
	}
}
</script>

<template>
	<UDashboardPanel
		id="dashboard-tutorial"
		:ui="{ body: 'p-0 sm:p-0 gap-0 sm:gap-0' }"
	>
		<template #header>
			<UDashboardNavbar
				title="Tutorial Saya"
				:ui="{ root: 'border-b border-default' }"
			>
				<template #leading>
					<UDashboardSidebarCollapse />
				</template>
				<template #right>
					<UButton
						label="Tulis Tutorial"
						icon="i-lucide-pen-line"
						to="/dashboard/tutorial/baru"
						size="sm"
					/>
				</template>
			</UDashboardNavbar>
		</template>

		<template #body>
			<div class="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
				<p class="text-sm text-muted">
					Tutorial terbit setelah disetujui peninjau. Kamu dapat notifikasi saat tutorialmu terbit atau perlu diperbaiki.
				</p>

				<div
					v-if="status === 'pending' && !tutorials.length"
					class="flex flex-col gap-3"
				>
					<USkeleton
						v-for="n in 3"
						:key="n"
						class="h-20 w-full"
					/>
				</div>

				<UAlert
					v-else-if="error"
					color="error"
					variant="subtle"
					icon="i-lucide-cloud-off"
					title="Daftar tutorial gagal dimuat"
					description="Server belum merespons. Coba muat ulang sebentar lagi."
					:actions="[{ label: 'Muat Ulang', icon: 'i-lucide-refresh-cw', color: 'error', variant: 'outline', onClick: () => refresh() }]"
				/>

				<UEmpty
					v-else-if="!tutorials.length"
					icon="i-lucide-book-open"
					title="Belum ada tutorial"
					description="Tulis langkah-langkah membuat salah satu proyekmu, atau keahlian yang ingin kamu bagikan."
					:actions="[{ label: 'Tulis Tutorial', icon: 'i-lucide-pen-line', to: '/dashboard/tutorial/baru' }]"
				/>

				<UPageCard
					v-else
					variant="subtle"
					:ui="{ container: 'p-0 sm:p-0 gap-y-0', wrapper: 'items-stretch' }"
				>
					<ul
						role="list"
						class="divide-y divide-default"
					>
						<li
							v-for="tutorial in tutorials"
							:key="tutorial.id"
							class="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-6"
						>
							<div class="min-w-0 flex-1">
								<div class="flex flex-wrap items-center gap-2">
									<UBadge
										:label="TUTORIAL_STATUS_LABELS[tutorial.status]"
										:color="STATUS_COLORS[tutorial.status]"
										variant="subtle"
										size="sm"
									/>
									<span class="text-xs text-muted">{{ TUTORIAL_LEVELS[tutorial.level] }}</span>
								</div>
								<p class="mt-1 truncate font-semibold text-highlighted">
									{{ tutorial.title }}
								</p>
								<p class="truncate text-sm text-muted">
									<template v-if="tutorial.projectTitle">
										Proyek: {{ tutorial.projectTitle }} ·
									</template>
									Diperbarui {{ formatTanggal(tutorial.updatedAt || tutorial.createdAt) }}
								</p>
								<p
									v-if="tutorial.status === 'ditolak' && tutorial.reviewNote"
									class="mt-1 text-sm text-default"
								>
									<span class="font-medium">Catatan peninjau:</span> {{ tutorial.reviewNote }}
								</p>
							</div>
							<div class="flex flex-wrap items-center gap-2 sm:justify-end">
								<UButton
									:label="tutorial.status === 'terbit' ? 'Lihat' : 'Pratinjau'"
									icon="i-lucide-eye"
									color="neutral"
									variant="ghost"
									size="sm"
									:to="`/tutorial/${tutorial.slug}`"
								/>
								<UButton
									label="Edit"
									icon="i-lucide-pencil"
									color="neutral"
									variant="outline"
									size="sm"
									:to="`/dashboard/tutorial/${tutorial.id}`"
								/>
								<UButton
									label="Hapus"
									icon="i-lucide-trash-2"
									color="error"
									variant="ghost"
									size="sm"
									@click="deleteTarget = tutorial"
								/>
							</div>
						</li>
					</ul>
				</UPageCard>
			</div>

			<UModal
				v-model:open="deleteOpen"
				title="Hapus tutorial ini?"
				:description="deleteTarget ? `${deleteTarget.title} akan dihapus permanen.` : undefined"
			>
				<template #footer>
					<div class="flex w-full justify-end gap-2">
						<UButton
							label="Batal"
							color="neutral"
							variant="outline"
							@click="deleteOpen = false"
						/>
						<UButton
							label="Ya, Hapus"
							icon="i-lucide-trash-2"
							color="error"
							:loading="deleting"
							@click="deleteTutorial"
						/>
					</div>
				</template>
			</UModal>
		</template>
	</UDashboardPanel>
</template>
