<script setup lang="ts">
import type { ProjectItem } from '~/types/project'

definePageMeta({
	layout: 'dashboard',
	middleware: 'auth'
})

useSeoMeta({
	title: 'Proyek Saya · Majalengka Tech',
	description: 'Kelola portofolio dan karya teknologi di Majalengka Tech'
})

const toast = useToast()
const search = ref('')
const isProjectModalOpen = ref(false)
const selectedProject = ref<ProjectItem | null>(null)
const deleteModalOpen = ref(false)
const projectToDelete = ref<number | null>(null)
const deleting = ref(false)

function openCreateModal() {
	selectedProject.value = null
	isProjectModalOpen.value = true
}

function openEditModal(project: ProjectItem) {
	selectedProject.value = project
	isProjectModalOpen.value = true
}

const { data: projectsData, refresh: refreshProjects, status } = await useFetch('/api/projects?mine=true', {
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
			title: 'Proyek Dihapus',
			description: 'Proyek berhasil dihapus dari daftar karyamu.',
			color: 'success'
		})
		deleteModalOpen.value = false
		projectToDelete.value = null
		await refreshNuxtData()
	} catch (err: unknown) {
		const errorResponse = err as { data?: { statusMessage?: string } }
		toast.add({
			title: 'Gagal Menghapus',
			description: errorResponse?.data?.statusMessage || 'Terjadi kendala saat menghapus proyek.',
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
			title="Proyek Saya"
			:ui="{ root: 'border-b border-default' }"
		>
			<template #leading>
				<UDashboardSidebarCollapse />
			</template>

			<template #right>
				<UButton
					label="Tambah Proyek Baru"
					icon="i-lucide-plus"
					color="primary"
					size="sm"
					@click="openCreateModal"
				/>
			</template>
		</UDashboardNavbar>

		<div class="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-7xl w-full mx-auto flex-1">
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 class="text-xl font-bold text-highlighted">
						Koleksi Proyek Saya
					</h1>
					<p class="text-xs text-muted">
						Kelola aplikasi, perkakas open source, atau eksperimen yang sudah kamu buat.
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

			<!-- Loading Skeleton -->
			<div
				v-if="status === 'pending'"
				class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
			>
				<div
					v-for="n in 3"
					:key="n"
					class="h-72 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse"
				/>
			</div>

			<!-- Empty State -->
			<div
				v-else-if="filteredProjects.length === 0"
				class="rounded-2xl border border-dashed border-default p-12 text-center flex flex-col items-center justify-center gap-3 bg-neutral-50/50 dark:bg-neutral-900/30 my-6"
			>
				<div class="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
					<UIcon
						name="i-lucide-folder-open"
						class="w-7 h-7"
					/>
				</div>
				<h3 class="text-base font-semibold text-highlighted">
					{{ search ? 'Tidak Ada Proyek yang Cocok' : 'Belum Ada Proyek' }}
				</h3>
				<p class="text-sm text-muted max-w-md">
					{{ search ? 'Coba cari dengan kata kunci lain.' : 'Yuk tambahkan proyek pertamamu biar bisa dicoba dan dilihat teman-teman komunitas!' }}
				</p>
				<UButton
					v-if="!search"
					label="Tambah Proyek Baru"
					icon="i-lucide-plus"
					color="primary"
					class="mt-3"
					@click="openCreateModal"
				/>
			</div>

			<!-- Projects Grid -->
			<div
				v-else
				class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
			>
				<DashboardProjectCard
					v-for="p in filteredProjects"
					:key="p.id"
					:project="p"
					editable
					@delete="confirmDelete"
					@edit="openEditModal"
				/>
			</div>
		</div>

		<!-- Delete Confirmation Modal -->
		<UModal
			v-model:open="deleteModalOpen"
			title="Hapus Proyek Ini?"
			description="Proyek yang dihapus tidak bisa dikembalikan lagi. Kamu yakin mau menghapusnya?"
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

		<!-- Create/Edit Project Modal -->
		<DashboardProjectModal
			v-model:open="isProjectModalOpen"
			:project="selectedProject"
			@saved="refreshProjects"
		/>
	</div>
</template>
