<script setup lang="ts">
import type { ProjectItem } from '~/types/project'

definePageMeta({
	layout: 'dashboard',
	middleware: [
		() => {
			const { user } = useUserSession()
			if (!user.value) {
				return navigateTo('/login?redirect=/kelola/proyek')
			}

			if ((user.value as { role?: string }).role !== 'admin') {
				return navigateTo('/dashboard')
			}
		}
	]
})

useSeoMeta({
	title: 'Kelola Proyek',
	robots: 'noindex, nofollow'
})

type StatusFilter = 'semua' | 'terbit' | 'draf'

const toast = useToast()
const search = ref('')
const searchQuery = refDebounced(search, 300)
const status = ref<StatusFilter>('semua')
const statusItems = [
	{ label: 'Semua', value: 'semua' },
	{ label: 'Terbit', value: 'terbit' },
	{ label: 'Draf', value: 'draf' }
]

const { data, status: fetchStatus, error, refresh } = await useFetch<{ projects: ProjectItem[] }>('/api/admin/projects', {
	key: 'admin-projects',
	query: computed(() => ({ q: searchQuery.value.trim() || undefined, status: status.value })),
	server: false
})

const projects = computed(() => data.value?.projects || [])
const isFiltering = computed(() => Boolean(searchQuery.value.trim()) || status.value !== 'semua')

const featuringId = ref<number | null>(null)

async function toggleFeatured(project: ProjectItem, featured: boolean) {
	featuringId.value = project.id
	const previous = project.isFeatured
	project.isFeatured = featured
	try {
		const res = await $fetch<{ message: string }>(`/api/admin/projects/${project.id}/feature`, {
			method: 'POST',
			body: { featured }
		})
		toast.add({ title: res.message, description: project.title, color: 'success' })
	} catch (err: unknown) {
		project.isFeatured = previous
		const errorResponse = err as { data?: { statusMessage?: string } }
		toast.add({ title: 'Pilihan Kurator belum berubah', description: errorResponse.data?.statusMessage || 'Coba lagi sebentar.', color: 'error' })
	} finally {
		featuringId.value = null
	}
}

const deleteTarget = ref<ProjectItem | null>(null)
const deleteOpen = computed({
	get: () => Boolean(deleteTarget.value),
	set: (value: boolean) => {
		if (!value) deleteTarget.value = null
	}
})
const deleting = ref(false)

async function deleteProject() {
	const target = deleteTarget.value
	if (!target) return
	deleting.value = true
	try {
		await $fetch(`/api/projects/${target.id}`, { method: 'DELETE' })
		deleteTarget.value = null
		toast.add({ title: 'Proyek dihapus', description: `${target.title} milik ${target.author?.name} sudah dihapus.`, color: 'success' })
		await refresh()
	} catch (err: unknown) {
		const errorResponse = err as { data?: { statusMessage?: string } }
		toast.add({ title: 'Proyek belum terhapus', description: errorResponse.data?.statusMessage || 'Coba lagi sebentar.', color: 'error' })
	} finally {
		deleting.value = false
	}
}
</script>

<template>
	<div class="flex flex-1 flex-col">
		<UDashboardNavbar
			title="Kelola Proyek"
			:ui="{ root: 'border-b border-default' }"
		>
			<template #leading>
				<UDashboardSidebarCollapse />
			</template>
		</UDashboardNavbar>

		<!-- Cari dan filter punya tempat tetap di bawah navbar, terpisah dari daftar. -->
		<UDashboardToolbar :ui="{ root: 'flex-wrap gap-y-2 py-2' }">
			<template #left>
				<UInput
					v-model="search"
					icon="i-lucide-search"
					placeholder="Cari judul atau nama kreator"
					class="w-full sm:w-72"
					aria-label="Cari proyek"
				/>
			</template>
			<template #right>
				<UTabs
					v-model="status"
					:items="statusItems"
					:content="false"
					size="sm"
					aria-label="Filter status proyek"
				/>
				<p
					class="text-sm whitespace-nowrap text-muted"
					aria-live="polite"
				>
					{{ projects.length }} proyek
				</p>
			</template>
		</UDashboardToolbar>

		<div class="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
			<p class="text-sm text-muted">
				Semua proyek yang masuk, termasuk Draf. Kamu bisa mengedit, menghapus, dan memilih proyek untuk Pilihan Kurator.
			</p>

			<div
				v-if="fetchStatus === 'pending' && !projects.length"
				class="flex flex-col gap-3"
			>
				<USkeleton
					v-for="n in 4"
					:key="n"
					class="h-20 w-full"
				/>
			</div>

			<UAlert
				v-else-if="error"
				color="error"
				variant="subtle"
				icon="i-lucide-cloud-off"
				title="Daftar proyek gagal dimuat"
				description="Server belum merespons. Coba muat ulang sebentar lagi."
				:actions="[{ label: 'Muat Ulang', icon: 'i-lucide-refresh-cw', color: 'error', variant: 'outline', onClick: () => refresh() }]"
			/>

			<UEmpty
				v-else-if="!projects.length"
				icon="i-lucide-folder-search"
				:title="isFiltering ? 'Tidak ada proyek yang cocok' : 'Belum ada proyek yang masuk'"
				:description="isFiltering ? 'Coba kata kunci lain atau ganti filter status.' : 'Proyek yang diunggah kreator akan muncul di sini, termasuk yang masih Draf.'"
			/>

			<AnimeTransitionGroup
				v-else
				tag="ul"
				enter-animation="mt-item"
				leave-animation="mt-item"
				move-animation="mt-item"
				class="relative flex flex-col divide-y divide-default rounded-md border border-default"
			>
				<li
					v-for="project in projects"
					:key="project.id"
					class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
				>
					<div class="flex min-w-0 flex-1 items-center gap-3">
						<div class="aspect-4/3 w-20 shrink-0 overflow-hidden rounded-sm bg-elevated">
							<NuxtImg
								v-if="project.thumbnailUrl"
								:src="project.thumbnailUrl"
								alt=""
								class="size-full object-cover"
								sizes="80px"
								preset="sampul"
								loading="lazy"
							/>
						</div>
						<div class="min-w-0">
							<NuxtLink
								:to="`/projek/${project.slug}`"
								class="block truncate rounded-sm font-semibold text-highlighted outline-primary/25 hover:text-primary focus-visible:outline-3"
							>
								{{ project.title }}
							</NuxtLink>
							<p class="truncate text-sm text-muted">
								oleh {{ project.author?.name }}<template v-if="project.author?.username">
									· @{{ project.author.username }}
								</template>
								· {{ formatTanggal(project.createdAt) }}
							</p>
							<div class="mt-1 flex flex-wrap gap-1.5">
								<UBadge
									:label="project.isPublished ? 'Terbit' : 'Draf'"
									:color="project.isPublished ? 'success' : 'neutral'"
									variant="subtle"
									size="sm"
								/>
								<UBadge
									:label="categoryLabel(project.category)"
									color="neutral"
									variant="outline"
									size="sm"
								/>
								<!-- Bentuknya sama dengan penanda Pilihan Kurator di kartu dan profil, supaya terbaca tanpa melihat sakelarnya. -->
								<span
									v-if="project.isFeatured"
									class="inline-flex items-center gap-1 rounded-sm bg-mango-100 px-1.5 py-0.5 text-xs font-semibold text-mango-900 dark:bg-mango-400/15 dark:text-mango-300"
								>
									<UIcon
										name="i-lucide-award"
										class="size-3"
									/>
									Pilihan Kurator
								</span>
							</div>
						</div>
					</div>

					<div class="flex flex-wrap items-center gap-2 sm:justify-end">
						<USwitch
							:model-value="Boolean(project.isFeatured)"
							:disabled="!project.isPublished || featuringId === project.id"
							:loading="featuringId === project.id"
							label="Pilihan Kurator"
							:description="project.isPublished ? undefined : 'Terbitkan dulu'"
							size="sm"
							@update:model-value="(value: boolean) => toggleFeatured(project, value)"
						/>
						<UButton
							icon="i-lucide-pencil"
							label="Edit"
							color="neutral"
							variant="outline"
							size="sm"
							:to="`/dashboard/projects/${project.id}`"
						/>
						<UButton
							icon="i-lucide-trash-2"
							label="Hapus"
							color="error"
							variant="ghost"
							size="sm"
							@click="deleteTarget = project"
						/>
					</div>
				</li>
			</AnimeTransitionGroup>
		</div>

		<UModal
			v-model:open="deleteOpen"
			title="Hapus proyek ini?"
			:description="deleteTarget ? `${deleteTarget.title} milik ${deleteTarget.author?.name} akan dihapus permanen beserta gambar, apresiasi, dan komentarnya.` : undefined"
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
						@click="deleteProject"
					/>
				</div>
			</template>
		</UModal>
	</div>
</template>
