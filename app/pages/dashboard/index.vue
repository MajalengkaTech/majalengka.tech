<script setup lang="ts">
import type { ProjectItem } from '~/types/project'

definePageMeta({
	layout: 'dashboard',
	middleware: 'auth'
})

useSeoMeta({
	title: 'Dashboard Developer · Majalengka Tech',
	description: 'Kelola profil developer dan showcase projek Majalengka Tech'
})

const { user } = useUserSession()

const isProjectModalOpen = ref(false)
const selectedProject = ref<ProjectItem | null>(null)

function openCreateModal() {
	selectedProject.value = null
	isProjectModalOpen.value = true
}

function openEditModal(project: ProjectItem) {
	selectedProject.value = project
	isProjectModalOpen.value = true
}

const { data: profileData, refresh: refreshProfile } = await useFetch('/api/user/profile')
const { data: projectsData, refresh: refreshProjects } = await useFetch('/api/projects?mine=true', {
	key: 'user-projects'
})

const projects = computed<ProjectItem[]>(() => (projectsData.value?.projects as ProjectItem[]) || [])
const projectCount = computed(() => projects.value.length)

const profileCompletion = computed(() => {
	const u = profileData.value?.user
	if (!u) return 50
	let score = 30
	if (u.name) score += 20
	if (u.bio) score += 20
	if (u.avatarUrl) score += 10
	if (u.githubUsername) score += 10
	if (u.websiteUrl) score += 10
	return Math.min(score, 100)
})

async function handleDeleteProject(id: number) {
	try {
		await $fetch(`/api/projects/${id}`, {
			method: 'DELETE'
		})
		await refreshNuxtData()
		await refreshProfile()
	} catch (err: unknown) {
		console.error('Failed to delete project:', err)
	}
}
</script>

<template>
	<div class="flex flex-col flex-1">
		<UDashboardNavbar
			title="Ringkasan Developer"
			:ui="{ root: 'border-b border-default' }"
		>
			<template #leading>
				<UDashboardSidebarCollapse />
			</template>

			<template #right>
				<UButton
					label="Tambah Projek"
					icon="i-lucide-plus"
					color="primary"
					size="sm"
					@click="openCreateModal"
				/>
			</template>
		</UDashboardNavbar>

		<div class="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-7xl w-full mx-auto">
			<!-- Welcome Banner -->
			<div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 p-6 sm:p-8">
				<div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
					<div class="flex items-center gap-4">
						<UAvatar
							:src="profileData?.user?.avatarUrl || user?.avatar || undefined"
							:alt="user?.name || 'Developer'"
							size="3xl"
							class="ring-2 ring-primary/40 shadow-md"
						/>
						<div>
							<div class="flex items-center gap-2">
								<h1 class="text-xl sm:text-2xl font-bold text-highlighted">
									Halo, {{ profileData?.user?.name || user?.name || 'Developer' }}! 👋
								</h1>
								<UBadge
									color="primary"
									variant="subtle"
									size="xs"
								>
									{{ profileData?.user?.role || 'Member' }}
								</UBadge>
							</div>
							<p class="text-sm text-muted mt-1 max-w-xl">
								{{ profileData?.user?.bio || 'Selamat datang di ekosistem Majalengka Tech. Bangun inovasi, unggah portofolio karyamu, dan berkolaborasi bersama developer lainnya.' }}
							</p>
						</div>
					</div>

					<div class="flex items-center gap-2.5 shrink-0">
						<UButton
							label="Edit Profil"
							icon="i-lucide-user-pen"
							color="neutral"
							variant="outline"
							to="/dashboard/settings"
						/>
						<UButton
							label="Lihat Showcase"
							icon="i-lucide-sparkles"
							color="primary"
							variant="solid"
							to="/projek"
						/>
					</div>
				</div>
			</div>

			<!-- Stats Grid -->
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<UCard class="p-4">
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium text-muted">Total Projek</span>
						<UIcon
							name="i-lucide-folder-git-2"
							class="w-5 h-5 text-primary"
						/>
					</div>
					<div class="mt-2 text-3xl font-bold text-highlighted">
						{{ projectCount }}
					</div>
					<span class="text-xs text-muted mt-1 block">Projek yang telah diunggah</span>
				</UCard>

				<UCard class="p-4">
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium text-muted">Kelengkapan Profil</span>
						<UIcon
							name="i-lucide-badge-check"
							class="w-5 h-5 text-success"
						/>
					</div>
					<div class="mt-2 text-3xl font-bold text-highlighted">
						{{ profileCompletion }}%
					</div>
					<div class="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-1.5 mt-2 overflow-hidden">
						<div
							class="bg-primary h-1.5 rounded-full transition-all duration-500"
							:style="{ width: `${profileCompletion}%` }"
						/>
					</div>
				</UCard>

				<UCard class="p-4">
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium text-muted">Akun GitHub</span>
						<UIcon
							name="i-simple-icons-github"
							class="w-5 h-5 text-highlighted"
						/>
					</div>
					<div class="mt-2 text-lg font-bold text-highlighted truncate">
						{{ profileData?.user?.githubUsername ? `@${profileData.user.githubUsername}` : 'Belum dihubungkan' }}
					</div>
					<NuxtLink
						to="/dashboard/settings"
						class="text-xs text-primary hover:underline mt-1 inline-block"
					>
						{{ profileData?.user?.githubUsername ? 'Ubah tautan' : 'Hubungkan sekarang' }}
					</NuxtLink>
				</UCard>
			</div>

			<!-- Recent Projects Section -->
			<div class="flex flex-col gap-4">
				<div class="flex items-center justify-between">
					<div>
						<h2 class="text-lg font-bold text-highlighted">
							Projek Terbaru Saya
						</h2>
						<p class="text-xs text-muted">
							Daftar karya dan portofolio teknologi yang telah Anda publikasikan
						</p>
					</div>

					<UButton
						v-if="projects.length > 0"
						label="Lihat Semua"
						trailing-icon="i-lucide-arrow-right"
						color="neutral"
						variant="ghost"
						size="xs"
						to="/dashboard/projects"
					/>
				</div>

				<div
					v-if="projects.length === 0"
					class="rounded-xl border border-dashed border-default p-8 text-center flex flex-col items-center justify-center gap-3 bg-neutral-50/50 dark:bg-neutral-900/30"
				>
					<div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
						<UIcon
							name="i-lucide-folder-plus"
							class="w-6 h-6"
						/>
					</div>
					<h3 class="font-semibold text-highlighted">
						Belum Ada Projek
					</h3>
					<p class="text-sm text-muted max-w-md">
						Anda belum mengunggah projek apapun ke ekosistem Majalengka Tech. Bagikan aplikasi atau tool buatan Anda kepada komunitas!
					</p>
					<UButton
						label="Unggah Projek Pertama"
						icon="i-lucide-plus"
						color="primary"
						class="mt-2"
						@click="openCreateModal"
					/>
				</div>

				<div
					v-else
					class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
				>
					<DashboardProjectCard
						v-for="p in projects.slice(0, 3)"
						:key="p.id"
						:project="p"
						editable
						@delete="handleDeleteProject"
						@edit="openEditModal"
					/>
				</div>
			</div>
		</div>

		<!-- Modal Tambah/Edit Projek -->
		<DashboardProjectModal
			v-model:open="isProjectModalOpen"
			:project="selectedProject"
			@saved="refreshProjects"
		/>
	</div>
</template>
