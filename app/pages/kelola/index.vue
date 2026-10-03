<script setup lang="ts">
interface AdminUser {
	id: string
	name: string
	email: string
	emailVerified: boolean
	image?: string | null
	role?: string | null
	banned?: boolean | null
	banReason?: string | null
	bio?: string | null
	githubUsername?: string | null
	websiteUrl?: string | null
	createdAt: string | number | Date
	projectCount: number
}

definePageMeta({
	layout: 'dashboard',
	middleware: [
		() => {
			const { user } = useUserSession()
			if (!user.value) {
				return navigateTo('/login?redirect=/kelola')
			}

			if ((user.value as { role?: string }).role !== 'admin') {
				return navigateTo('/dashboard')
			}
		}
	]
})

useSeoMeta({
	title: 'Kelola Pengguna',
	description: 'Kelola akun kreator Majalengka Tech'
})

const { user: currentSessionUser } = useUserSession()
const toast = useToast()

const search = ref('')
const selectedRoleFilter = ref<'all' | 'admin' | 'user'>('all')
const roleFilterItems = [
	{ label: 'Semua', value: 'all' },
	{ label: 'Admin', value: 'admin' },
	{ label: 'Kreator', value: 'user' }
]

const { data: usersData, refresh: refreshUsers, status } = await useFetch<{ users: AdminUser[] }>('/api/admin/users', {
	key: 'admin-users-list'
})

const users = computed<AdminUser[]>(() => usersData.value?.users || [])

const filteredUsers = computed(() => {
	let list = users.value

	if (selectedRoleFilter.value !== 'all') {
		list = list.filter((u) => {
			if (selectedRoleFilter.value === 'admin') return u.role === 'admin'
			return u.role !== 'admin'
		})
	}

	if (search.value.trim()) {
		const q = search.value.toLowerCase().trim()
		list = list.filter(u =>
			(u.name && u.name.toLowerCase().includes(q))
			|| (u.email && u.email.toLowerCase().includes(q))
			|| (u.githubUsername && u.githubUsername.toLowerCase().includes(q))
		)
	}

	return list
})

const totalUsers = computed(() => users.value.length)
const totalAdmins = computed(() => users.value.filter(u => u.role === 'admin').length)
const totalActive = computed(() => users.value.filter(u => !u.banned).length)
const totalProjects = computed(() => users.value.reduce((acc, u) => acc + (u.projectCount || 0), 0))

// Password Modal State
const isPasswordModalOpen = ref(false)
const selectedUserForPassword = ref<AdminUser | null>(null)
const newPassword = ref('')
const confirmPassword = ref('')
const showNewPassword = ref(false)
const updatingPassword = ref(false)

function openPasswordModal(target: AdminUser) {
	selectedUserForPassword.value = target
	newPassword.value = ''
	confirmPassword.value = ''
	showNewPassword.value = false
	isPasswordModalOpen.value = true
}

async function handleSavePassword() {
	if (!selectedUserForPassword.value) return

	if (!newPassword.value || newPassword.value.length < 8) {
		toast.add({
			title: 'Kata sandi terlalu pendek',
			description: 'Kata sandi baru minimal 8 karakter.',
			color: 'error'
		})
		return
	}

	if (newPassword.value !== confirmPassword.value) {
		toast.add({
			title: 'Kata sandi tidak sama',
			description: 'Ketik ulang kata sandi baru persis sama.',
			color: 'error'
		})
		return
	}

	try {
		updatingPassword.value = true
		await $fetch('/api/admin/change-password', {
			method: 'POST',
			body: {
				userId: selectedUserForPassword.value.id,
				newPassword: newPassword.value
			}
		})

		toast.add({
			title: 'Kata sandi diganti',
			description: `Kata sandi untuk ${selectedUserForPassword.value.email} sudah diganti.`,
			color: 'success'
		})

		isPasswordModalOpen.value = false
		selectedUserForPassword.value = null
	} catch (err: unknown) {
		const errorResponse = err as { data?: { statusMessage?: string } }
		toast.add({
			title: 'Kata sandi belum diganti',
			description: errorResponse?.data?.statusMessage || 'Terjadi kesalahan sistem.',
			color: 'error'
		})
	} finally {
		updatingPassword.value = false
	}
}

// Role Modal State
const isRoleModalOpen = ref(false)
const selectedUserForRole = ref<AdminUser | null>(null)
const selectedRole = ref<'admin' | 'user'>('user')
const updatingRole = ref(false)

function openRoleModal(target: AdminUser) {
	selectedUserForRole.value = target
	selectedRole.value = target.role === 'admin' ? 'admin' : 'user'
	isRoleModalOpen.value = true
}

async function handleSaveRole() {
	if (!selectedUserForRole.value) return

	try {
		updatingRole.value = true
		await $fetch('/api/admin/set-role', {
			method: 'POST',
			body: {
				userId: selectedUserForRole.value.id,
				role: selectedRole.value
			}
		})

		toast.add({
			title: 'Peran akun diperbarui',
			description: `Hak akses ${selectedUserForRole.value.name || selectedUserForRole.value.email} kini menjadi ${selectedRole.value}.`,
			color: 'success'
		})

		isRoleModalOpen.value = false
		selectedUserForRole.value = null
		await refreshUsers()
	} catch (err: unknown) {
		const errorResponse = err as { data?: { statusMessage?: string } }
		toast.add({
			title: 'Peran akun belum berubah',
			description: errorResponse?.data?.statusMessage || 'Terjadi kesalahan sistem.',
			color: 'error'
		})
	} finally {
		updatingRole.value = false
	}
}

// Delete Modal State
const isDeleteModalOpen = ref(false)
const selectedUserForDelete = ref<AdminUser | null>(null)
const deletingUser = ref(false)

function openDeleteModal(target: AdminUser) {
	selectedUserForDelete.value = target
	isDeleteModalOpen.value = true
}

async function handleDeleteUser() {
	if (!selectedUserForDelete.value) return

	try {
		deletingUser.value = true
		await $fetch('/api/admin/user', {
			method: 'DELETE',
			body: {
				userId: selectedUserForDelete.value.id
			}
		})

		toast.add({
			title: 'Akun dihapus',
			description: `Akun ${selectedUserForDelete.value.name || selectedUserForDelete.value.email} sudah dihapus permanen.`,
			color: 'success'
		})

		isDeleteModalOpen.value = false
		selectedUserForDelete.value = null
		await refreshUsers()
	} catch (err: unknown) {
		const errorResponse = err as { data?: { statusMessage?: string } }
		toast.add({
			title: 'Akun belum terhapus',
			description: errorResponse?.data?.statusMessage || 'Terjadi kesalahan sistem.',
			color: 'error'
		})
	} finally {
		deletingUser.value = false
	}
}

// Ban / Unban
const updatingBan = ref(false)

async function handleToggleBan(target: AdminUser) {
	const newStatus = !target.banned
	const actionText = newStatus ? 'menangguhkan' : 'mengaktifkan kembali'

	try {
		updatingBan.value = true
		await $fetch('/api/admin/ban-user', {
			method: 'POST',
			body: {
				userId: target.id,
				banned: newStatus,
				banReason: newStatus ? 'Ditangguhkan oleh administrator via konsol' : null
			}
		})

		toast.add({
			title: newStatus ? 'Pengguna Ditangguhkan' : 'Pengguna Diaktifkan',
			description: `Berhasil ${actionText} akun ${target.name || target.email}.`,
			color: newStatus ? 'warning' : 'success'
		})

		await refreshUsers()
	} catch (err: unknown) {
		const errorResponse = err as { data?: { statusMessage?: string } }
		toast.add({
			title: 'Status akun belum berubah',
			description: errorResponse?.data?.statusMessage || 'Terjadi kesalahan.',
			color: 'error'
		})
	} finally {
		updatingBan.value = false
	}
}

function formatDate(dateVal: string | number | Date) {
	if (!dateVal) return '-'
	const d = new Date(dateVal)
	return d.toLocaleDateString('id-ID', {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	})
}
</script>

<template>
	<div class="flex flex-col flex-1">
		<UDashboardNavbar
			title="Kelola Pengguna"
			:ui="{ root: 'border-b border-default' }"
		>
			<template #leading>
				<UDashboardSidebarCollapse />
			</template>

			<template #right>
				<UButton
					icon="i-lucide-rotate-cw"
					label="Muat Ulang"
					color="neutral"
					variant="outline"
					size="sm"
					:loading="status === 'pending'"
					@click="() => refreshUsers()"
				/>
			</template>
		</UDashboardNavbar>

		<!-- Cari dan filter punya tempat tetap di bawah navbar, sama dengan Kelola Proyek. -->
		<UDashboardToolbar :ui="{ root: 'flex-wrap gap-y-2 py-2' }">
			<template #left>
				<UInput
					v-model="search"
					placeholder="Cari nama, email, atau username"
					icon="i-lucide-search"
					class="w-full sm:w-72"
					aria-label="Cari akun"
				/>
			</template>
			<template #right>
				<UTabs
					:model-value="selectedRoleFilter"
					:items="roleFilterItems"
					:content="false"
					size="sm"
					aria-label="Filter peran akun"
					@update:model-value="(value: string | number) => selectedRoleFilter = value === 'admin' || value === 'user' ? value : 'all'"
				/>
				<p
					class="text-sm whitespace-nowrap text-muted"
					aria-live="polite"
				>
					{{ filteredUsers.length }} akun
				</p>
			</template>
		</UDashboardToolbar>

		<div class="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-7xl w-full mx-auto flex-1">
			<p class="text-sm text-muted">
				Ganti kata sandi, atur peran admin, tangguhkan, atau hapus akun kreator.
			</p>

			<!-- Stats Grid -->
			<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
				<div class="p-4 rounded-xl border border-default bg-muted flex flex-col gap-1">
					<span class="text-xs font-semibold text-muted">Total Pengguna</span>
					<div class="flex items-baseline justify-between">
						<span class="text-2xl font-black text-highlighted">{{ totalUsers }}</span>
						<UIcon
							name="i-lucide-users"
							class="w-5 h-5 text-primary"
						/>
					</div>
				</div>

				<div class="p-4 rounded-xl border border-default bg-muted flex flex-col gap-1">
					<span class="text-xs font-semibold text-muted">Administrator</span>
					<div class="flex items-baseline justify-between">
						<span class="text-2xl font-black text-highlighted">{{ totalAdmins }}</span>
						<UIcon
							name="i-lucide-shield-check"
							class="w-5 h-5 text-success"
						/>
					</div>
				</div>

				<div class="p-4 rounded-xl border border-default bg-muted flex flex-col gap-1">
					<span class="text-xs font-semibold text-muted">Akun Aktif</span>
					<div class="flex items-baseline justify-between">
						<span class="text-2xl font-black text-highlighted">{{ totalActive }}</span>
						<UIcon
							name="i-lucide-user-check"
							class="w-5 h-5 text-primary"
						/>
					</div>
				</div>

				<div class="p-4 rounded-xl border border-default bg-muted flex flex-col gap-1">
					<span class="text-xs font-semibold text-muted">Total Proyek Komunitas</span>
					<div class="flex items-baseline justify-between">
						<span class="text-2xl font-black text-highlighted">{{ totalProjects }}</span>
						<UIcon
							name="i-lucide-folder-git-2"
							class="w-5 h-5 text-warning"
						/>
					</div>
				</div>
			</div>

			<UEmpty
				v-if="filteredUsers.length === 0"
				icon="i-lucide-user-x"
				title="Tidak ada akun yang cocok"
				description="Coba kata kunci lain atau ganti filter peran."
			/>

			<!-- Pola sama dengan Kelola Proyek: baris yang tersisa merapat, yang hilang memudar, yang baru masuk. -->
			<AnimeTransitionGroup
				v-else
				tag="ul"
				enter-animation="mt-item"
				leave-animation="mt-item"
				move-animation="mt-item"
				class="relative flex flex-col divide-y divide-default rounded-md border border-default"
			>
				<li
					v-for="u in filteredUsers"
					:key="u.id"
					class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
				>
					<div class="flex min-w-0 flex-1 items-center gap-3">
						<UAvatar
							:src="u.image || undefined"
							:alt="u.name || 'Kreator'"
							size="md"
							class="shrink-0"
						/>
						<div class="min-w-0">
							<div class="flex items-center gap-1.5">
								<span class="truncate font-semibold text-highlighted">{{ u.name || 'Tanpa nama' }}</span>
								<UBadge
									v-if="u.id === currentSessionUser?.id"
									label="Kamu"
									color="primary"
									variant="subtle"
									size="sm"
								/>
							</div>
							<p class="truncate text-sm text-muted">
								{{ u.email }} · {{ u.projectCount }} proyek · bergabung {{ formatDate(u.createdAt) }}
							</p>
							<div class="mt-1 flex flex-wrap gap-1.5">
								<UBadge
									:label="u.role === 'admin' ? 'Admin' : 'Kreator'"
									:icon="u.role === 'admin' ? 'i-lucide-shield-check' : 'i-lucide-user'"
									:color="u.role === 'admin' ? 'primary' : 'neutral'"
									variant="subtle"
									size="sm"
								/>
								<UBadge
									:label="u.banned ? 'Ditangguhkan' : 'Aktif'"
									:color="u.banned ? 'error' : 'success'"
									variant="subtle"
									size="sm"
								/>
							</div>
						</div>
					</div>

					<div class="flex flex-wrap items-center gap-1 sm:justify-end">
						<UButton
							icon="i-lucide-key-round"
							color="neutral"
							variant="ghost"
							size="sm"
							aria-label="Ganti Kata Sandi"
							title="Ganti Kata Sandi"
							@click="openPasswordModal(u)"
						/>
						<UButton
							icon="i-lucide-shield"
							color="neutral"
							variant="ghost"
							size="sm"
							aria-label="Ubah Peran"
							title="Ubah Peran"
							@click="openRoleModal(u)"
						/>
						<UButton
							:icon="u.banned ? 'i-lucide-check-circle' : 'i-lucide-ban'"
							:color="u.banned ? 'success' : 'neutral'"
							variant="ghost"
							size="sm"
							:disabled="u.id === currentSessionUser?.id"
							:aria-label="u.banned ? 'Pulihkan Akun' : 'Tangguhkan Akun'"
							:title="u.banned ? 'Pulihkan Akun' : 'Tangguhkan Akun'"
							@click="handleToggleBan(u)"
						/>
						<UButton
							icon="i-lucide-trash-2"
							color="error"
							variant="ghost"
							size="sm"
							:disabled="u.id === currentSessionUser?.id"
							aria-label="Hapus Akun"
							title="Hapus Akun"
							@click="openDeleteModal(u)"
						/>
					</div>
				</li>
			</AnimeTransitionGroup>
		</div>

		<!-- Modal Ubah Password -->
		<UModal
			v-model:open="isPasswordModalOpen"
			title="Ganti kata sandi akun"
			:description="`Buat kata sandi baru untuk ${selectedUserForPassword?.name || selectedUserForPassword?.email}`"
		>
			<template #body>
				<div class="flex flex-col gap-4 py-2">
					<div class="p-3 rounded-lg bg-elevated text-xs flex items-center gap-3">
						<UAvatar
							:src="selectedUserForPassword?.image || undefined"
							:alt="selectedUserForPassword?.name || 'User'"
							size="sm"
						/>
						<div class="flex flex-col">
							<span class="font-semibold text-highlighted">{{ selectedUserForPassword?.name }}</span>
							<span class="text-muted">{{ selectedUserForPassword?.email }}</span>
						</div>
					</div>

					<UFormField
						label="Kata Sandi Baru"
						required
						description="Minimal 8 karakter."
					>
						<div class="relative w-full">
							<UInput
								v-model="newPassword"
								:type="showNewPassword ? 'text' : 'password'"
								placeholder="Minimal 8 karakter"
								icon="i-lucide-lock"
								class="w-full"
							/>
							<button
								type="button"
								class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-highlighted focus:outline-none"
								@click="showNewPassword = !showNewPassword"
							>
								<UIcon
									:name="showNewPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
									class="w-4 h-4"
								/>
							</button>
						</div>
					</UFormField>

					<UFormField
						label="Ulangi Kata Sandi Baru"
						required
					>
						<UInput
							v-model="confirmPassword"
							:type="showNewPassword ? 'text' : 'password'"
							placeholder="Ketik ulang kata sandi baru"
							icon="i-lucide-check"
							class="w-full"
						/>
					</UFormField>
				</div>
			</template>

			<template #footer>
				<div class="flex items-center justify-end gap-2 w-full">
					<UButton
						label="Batal"
						color="neutral"
						variant="outline"
						@click="isPasswordModalOpen = false"
					/>
					<UButton
						label="Simpan Kata Sandi"
						color="primary"
						icon="i-lucide-save"
						:loading="updatingPassword"
						@click="handleSavePassword"
					/>
				</div>
			</template>
		</UModal>

		<!-- Modal Ubah Role -->
		<UModal
			v-model:open="isRoleModalOpen"
			title="Ubah peran akun"
			:description="`Pilih peran untuk ${selectedUserForRole?.name || selectedUserForRole?.email}`"
		>
			<template #body>
				<div class="flex flex-col gap-4 py-2">
					<div class="space-y-3">
						<label
							class="flex items-start gap-3 p-3 rounded-xl border border-default cursor-pointer transition-colors"
							:class="selectedRole === 'admin' ? 'border-primary bg-primary/5' : 'hover:bg-elevated'"
						>
							<input
								v-model="selectedRole"
								type="radio"
								value="admin"
								class="mt-1 text-primary focus:ring-primary"
							>
							<div class="flex flex-col">
								<span class="font-bold text-highlighted flex items-center gap-1.5">
									<UIcon
										name="i-lucide-shield-check"
										class="w-4 h-4 text-primary"
									/>
									Administrator
								</span>
								<span class="text-xs text-muted">
									Bisa membuka halaman Kelola, mengatur akun lain, serta mengedit dan menghapus proyek siapa pun.
								</span>
							</div>
						</label>

						<label
							class="flex items-start gap-3 p-3 rounded-xl border border-default cursor-pointer transition-colors"
							:class="selectedRole === 'user' ? 'border-primary bg-primary/5' : 'hover:bg-elevated'"
						>
							<input
								v-model="selectedRole"
								type="radio"
								value="user"
								class="mt-1 text-primary focus:ring-primary"
							>
							<div class="flex flex-col">
								<span class="font-bold text-highlighted flex items-center gap-1.5">
									<UIcon
										name="i-lucide-user"
										class="w-4 h-4 text-muted"
									/>
									Kreator
								</span>
								<span class="text-xs text-muted">
									Mengelola proyek dan profilnya sendiri lewat dashboard.
								</span>
							</div>
						</label>
					</div>
				</div>
			</template>

			<template #footer>
				<div class="flex items-center justify-end gap-2 w-full">
					<UButton
						label="Batal"
						color="neutral"
						variant="outline"
						@click="isRoleModalOpen = false"
					/>
					<UButton
						label="Simpan Peran"
						color="primary"
						:loading="updatingRole"
						@click="handleSaveRole"
					/>
				</div>
			</template>
		</UModal>

		<!-- Modal Konfirmasi Hapus Akun -->
		<UModal
			v-model:open="isDeleteModalOpen"
			title="Hapus akun ini?"
			description="Data yang dihapus tidak bisa dikembalikan."
		>
			<template #body>
				<UAlert
					color="error"
					variant="subtle"
					icon="i-lucide-triangle-alert"
					:title="`Hapus akun ${selectedUserForDelete?.name || selectedUserForDelete?.email}?`"
					:description="`${selectedUserForDelete?.projectCount || 0} proyek miliknya ikut terhapus, beserta gambar, komentar, apresiasi, kartu kreator, dan sesi login. Data ini tidak bisa dikembalikan.`"
				/>
			</template>

			<template #footer>
				<div class="flex items-center justify-end gap-2 w-full">
					<UButton
						label="Batal"
						color="neutral"
						variant="outline"
						@click="isDeleteModalOpen = false"
					/>
					<UButton
						label="Ya, Hapus Akun"
						color="error"
						variant="solid"
						icon="i-lucide-trash-2"
						:loading="deletingUser"
						@click="handleDeleteUser"
					/>
				</div>
			</template>
		</UModal>
	</div>
</template>
