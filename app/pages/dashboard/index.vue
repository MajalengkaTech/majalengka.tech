<script setup lang="ts">
import type { ProjectItem } from '~/types/project'

definePageMeta({
	layout: 'dashboard'
})

useSeoMeta({
	title: 'Dashboard Kreator',
	description: 'Ringkasan profil dan proyekmu di Majalengka Tech'
})

const { user } = useUserSession()

const { data: profileData, refresh: refreshProfile } = await useFetch('/api/user/profile')
const { data: projectsData, error: projectsError, refresh: refreshProjects, status: projectsStatus } = await useFetch('/api/projects?mine=true', {
	key: 'user-projects'
})

const projects = computed<ProjectItem[]>(() => (projectsData.value?.projects as ProjectItem[]) || [])
const projectCount = computed(() => projects.value.length)

// Persentase = isian profil kreator yang sudah terisi dari 8 isian penting, tanpa nilai dasar.
const profileCompletion = computed(() => {
	const u = profileData.value?.user
	if (!u) return 0
	const filled = [
		u.name,
		u.username,
		u.creatorRole,
		u.bio,
		u.avatarUrl,
		u.location,
		u.skills,
		u.websiteUrl || u.designUrl || u.githubUsername || u.linkedinUrl
	].filter(Boolean).length
	return Math.round((filled / 8) * 100)
})

const toast = useToast()
const deleteModalOpen = ref(false)
const projectToDelete = ref<number | null>(null)
const deleting = ref(false)

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
			title: 'Proyek dihapus',
			description: 'Proyek sudah dihapus dari portofoliomu.',
			color: 'success'
		})
		deleteModalOpen.value = false
		projectToDelete.value = null
		await refreshNuxtData()
		await refreshProfile()
	} catch (err: unknown) {
		const errorResponse = err as { data?: { statusMessage?: string } }
		toast.add({
			title: 'Proyek belum terhapus',
			description: errorResponse?.data?.statusMessage || 'Proyek belum terhapus. Coba lagi sebentar.',
			color: 'error'
		})
	} finally {
		deleting.value = false
	}
}

// Bilah terisi dari 0 setelah dashboard tampil, supaya mata tertuju ke profil yang belum lengkap.
const shownCompletion = ref(0)
onMounted(() => {
	if (!motionAllowed()) {
		shownCompletion.value = profileCompletion.value
		return
	}
	requestAnimationFrame(() => {
		shownCompletion.value = profileCompletion.value
	})
})
watch(profileCompletion, (value) => {
	shownCompletion.value = value
})
</script>

<template>
	<div class="flex flex-col flex-1">
		<UDashboardNavbar
			title="Ringkasan Kreator"
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
					aria-label="Pamerkan Proyek"
					to="/dashboard/projects/new"
				>
					<span class="hidden sm:inline">Pamerkan Proyek</span>
				</UButton>
			</template>
		</UDashboardNavbar>

		<div class="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-7xl w-full mx-auto">
			<!-- Welcome Banner -->
			<div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 p-6 sm:p-8">
				<div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
					<div class="flex items-center gap-4">
						<UAvatar
							:src="profileData?.user?.avatarUrl || (user as { image?: string })?.image || undefined"
							:alt="user?.name || 'Kreator'"
							size="3xl"
							class="ring-2 ring-primary/40 shadow-md"
						/>
						<div>
							<div class="flex items-center gap-2">
								<h1 class="text-xl sm:text-2xl font-bold text-highlighted">
									Halo, {{ profileData?.user?.name || user?.name || 'Kreator' }}
								</h1>
								<UBadge
									color="primary"
									variant="subtle"
									size="xs"
								>
									{{ profileData?.user?.role === 'admin' ? 'Admin' : 'Kreator' }}
								</UBadge>
							</div>
							<p class="text-sm text-muted mt-1 max-w-xl">
								{{ profileData?.user?.bio || 'Bio kamu belum diisi. Tulis satu atau dua kalimat tentang apa yang kamu buat lewat Edit Profil.' }}
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
							icon="i-lucide-layout-grid"
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
						<span class="text-sm font-medium text-muted">Total Proyek</span>
						<UIcon
							name="i-lucide-folder-git-2"
							class="w-5 h-5 text-primary"
						/>
					</div>
					<div class="mt-2 text-3xl font-bold text-highlighted">
						{{ projectCount }}
					</div>
					<span class="text-xs text-muted mt-1 block">Termasuk yang masih draf</span>
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
					<UProgress
						:model-value="shownCompletion"
						size="sm"
						class="mt-2"
						:aria-label="`Profil ${profileCompletion}% lengkap`"
					/>
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
							Proyek terbarumu
						</h2>
						<p class="text-xs text-muted">
							Proyek yang sudah kamu unggah, baik yang terbit maupun yang masih draf
						</p>
					</div>

					<UButton
						v-if="projects.length > 0"
						label="Kelola Semua Proyek"
						trailing-icon="i-lucide-arrow-right"
						color="neutral"
						variant="ghost"
						size="xs"
						to="/dashboard/projects"
					/>
				</div>

				<UAlert
					v-if="projectsError"
					color="error"
					variant="subtle"
					icon="i-lucide-cloud-off"
					title="Daftar proyekmu gagal dimuat"
					description="Server belum merespons. Proyekmu tetap aman, coba muat ulang sebentar lagi."
					:actions="[{ label: 'Muat Ulang', icon: 'i-lucide-refresh-cw', color: 'error', variant: 'outline', loading: projectsStatus === 'pending', onClick: () => refreshProjects() }]"
				/>
				<UEmpty
					v-else-if="projects.length === 0"
					icon="i-lucide-folder-plus"
					title="Belum ada proyek"
					description="Kamu belum mengunggah proyek. Pamerkan aplikasi, desain, atau tool buatanmu supaya bisa dilihat kreator lain."
					variant="outline"
					:actions="[{ label: 'Pamerkan Proyekmu', icon: 'i-lucide-plus', to: '/dashboard/projects/new' }]"
				/>

				<AnimeTransitionGroup
					v-else
					tag="div"
					enter-animation="mt-item"
					leave-animation="mt-item"
					move-animation="mt-item"
					class="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10"
				>
					<DashboardProjectCard
						v-for="p in projects.slice(0, 3)"
						:key="p.id"
						:project="p"
						editable
						@delete="confirmDelete"
					/>
				</AnimeTransitionGroup>
			</div>
		</div>

		<UModal
			v-model:open="deleteModalOpen"
			title="Hapus proyek ini?"
			description="Proyek, gambar, apresiasi, dan komentarnya akan dihapus permanen."
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
						icon="i-lucide-trash-2"
						:loading="deleting"
						@click="executeDelete"
					/>
				</div>
			</template>
		</UModal>
	</div>
</template>
