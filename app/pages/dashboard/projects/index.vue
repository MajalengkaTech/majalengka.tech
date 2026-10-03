<script setup lang="ts">
import type { ProjectItem } from '~/types/project'

definePageMeta({
	layout: 'dashboard'
})

useSeoMeta({
	title: 'Karya Saya',
	description: 'Kelola karya yang kamu pamerkan di Majalengka Tech'
})

const toast = useToast()
const search = ref('')
const deleteModalOpen = ref(false)
const projectToDelete = ref<number | null>(null)
const deleting = ref(false)

const { data: projectsData, status } = await useFetch('/api/projects?mine=true', {
	key: 'user-projects'
})

const projects = computed<ProjectItem[]>(() => (projectsData.value?.projects as ProjectItem[]) || [])

const filteredProjects = computed(() => {
	if (!search.value.trim()) return projects.value
	const q = search.value.toLowerCase().trim()
	return projects.value.filter(p =>
		p.title.toLowerCase().includes(q)
		|| p.description.toLowerCase().includes(q)
		|| (p.tags && p.tags.toLowerCase().includes(q))
	)
})

function confirmDelete(id: number) {
	projectToDelete.value = id
	deleteModalOpen.value = true
}

async function executeDelete() {
	if (!projectToDelete.value) return
	try {
		deleting.value = true
		await $fetch(`/api/projects/${projectToDelete.value}`, {
			method: 'DELETE'
		})
		toast.add({
			title: 'Karya dihapus',
			description: 'Karya sudah dihapus dari portofoliomu.',
			color: 'success'
		})
		deleteModalOpen.value = false
		projectToDelete.value = null
		await refreshNuxtData()
	} catch (err: unknown) {
		const errorResponse = err as { data?: { statusMessage?: string } }
		toast.add({
			title: 'Gagal Menghapus',
			description: errorResponse?.data?.statusMessage || 'Terjadi kesalahan saat menghapus projek.',
			color: 'error'
		})
	} finally {
		deleting.value = false
	}
}
</script>

<template>
	<div class="flex flex-col flex-1">
		<UDashboardNavbar
			title="Karya Saya"
			:ui="{ root: 'border-b border-default' }"
		>
			<template #leading>
				<UDashboardSidebarCollapse />
			</template>

			<template #right>
				<UButton
					icon="i-lucide-plus"
					color="primary"
					size="sm"
					aria-label="Pamerkan Karya Baru"
					to="/dashboard/projects/new"
				>
					<span class="hidden sm:inline">Pamerkan Karya Baru</span>
				</UButton>
			</template>
		</UDashboardNavbar>

		<div class="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-7xl w-full mx-auto flex-1">
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 class="text-xl font-bold text-highlighted">
						Semua karyamu
					</h1>
					<p class="text-xs text-muted">
						Kelola semua karya yang kamu buat: aplikasi, desain, library open-source, atau tool.
					</p>
				</div>

				<div class="w-full sm:w-72">
					<UInput
						v-model="search"
						placeholder="Cari judul, tag, deskripsi..."
						icon="i-lucide-search"
						class="w-full"
					/>
				</div>
			</div>

			<!-- Loading state -->
			<div
				v-if="status === 'pending'"
				class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10"
			>
				<USkeleton
					v-for="n in 3"
					:key="n"
					class="aspect-4/3 w-full rounded-xl"
				/>
			</div>

			<!-- Empty State -->
			<div
				v-else-if="filteredProjects.length === 0"
				class="rounded-2xl border border-dashed border-default p-12 text-center flex flex-col items-center justify-center gap-3 bg-muted/50 my-auto"
			>
				<div class="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
					<UIcon
						name="i-lucide-folder-git-2"
						class="w-7 h-7"
					/>
				</div>
				<h3 class="text-lg font-bold text-highlighted">
					{{ search ? 'Tidak ada karya yang cocok' : 'Belum ada karya' }}
				</h3>
				<p class="text-sm text-muted max-w-md">
					{{ search ? 'Coba kata kunci lain.' : 'Unggah karya pertamamu supaya bisa dilihat kreator Majalengka lainnya.' }}
				</p>
				<UButton
					v-if="!search"
					label="Pamerkan Karya Baru"
					icon="i-lucide-plus"
					color="primary"
					class="mt-3"
					to="/dashboard/projects/new"
				/>
			</div>

			<!-- Projects Grid -->
			<AnimeTransitionGroup
				v-else
				tag="div"
				enter-animation="mt-item"
				leave-animation="mt-item"
				move-animation="mt-item"
				class="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10"
			>
				<DashboardProjectCard
					v-for="p in filteredProjects"
					:key="p.id"
					:project="p"
					editable
					@delete="confirmDelete"
				/>
			</AnimeTransitionGroup>
		</div>

		<!-- Delete Confirmation Modal -->
		<UModal
			v-model:open="deleteModalOpen"
			title="Hapus karya ini?"
			description="Karya, gambar, apresiasi, dan komentarnya akan dihapus permanen."
		>
			<template #footer>
				<div class="flex items-center justify-end gap-3">
					<UButton
						label="Batal"
						color="neutral"
						variant="outline"
						@click="deleteModalOpen = false"
					/>
					<UButton
						label="Ya, Hapus"
						color="error"
						variant="solid"
						icon="i-lucide-trash-2"
						:loading="deleting"
						@click="executeDelete"
					/>
				</div>
			</template>
		</UModal>
	</div>
</template>
