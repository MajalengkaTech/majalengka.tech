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
			const role = (user.value as { role?: string })?.role
			const email = user.value?.email?.toLowerCase()

			if (!user.value) {
				return navigateTo('/login?redirect=/kelola')
			}

			if (role !== 'admin' && email !== 'dinarpermadi07@gmail.com') {
				return navigateTo('/dashboard')
			}
		}
	]
})

useSeoMeta({
	title: 'Konsol Manajemen Komunitas · Majalengka Tech',
	description: 'Ruang kendali administrator untuk mengelola akun dan data komunitas Majalengka Tech'
})

const { user: currentSessionUser } = useUserSession()
const toast = useToast()

const search = ref('')
const selectedRoleFilter = ref<'all' | 'admin' | 'user'>('all')

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
			title: 'Password Terlalu Pendek',
			description: 'Password baru minimal harus 8 karakter.',
			color: 'error'
		})
		return
	}

	if (newPassword.value !== confirmPassword.value) {
		toast.add({
			title: 'Password Tidak Cocok',
			description: 'Konfirmasi password harus sama dengan password baru.',
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
			title: 'Password Berhasil Diubah',
			description: `Password untuk ${selectedUserForPassword.value.email} telah berhasil diperbarui.`,
			color: 'success'
		})

		isPasswordModalOpen.value = false
		selectedUserForPassword.value = null
	} catch (err: unknown) {
		const errorResponse = err as { data?: { statusMessage?: string } }
		toast.add({
			title: 'Gagal Mengubah Password',
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
			title: 'Role Berhasil Diperbarui',
			description: `Hak akses ${selectedUserForRole.value.name || selectedUserForRole.value.email} kini menjadi ${selectedRole.value}.`,
			color: 'success'
		})

		isRoleModalOpen.value = false
		selectedUserForRole.value = null
		await refreshUsers()
	} catch (err: unknown) {
		const errorResponse = err as { data?: { statusMessage?: string } }
		toast.add({
			title: 'Gagal Mengubah Role',
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
			title: 'Akun Dihapus',
			description: `Akun ${selectedUserForDelete.value.name || selectedUserForDelete.value.email} telah dihapus permanen.`,
			color: 'success'
		})

		isDeleteModalOpen.value = false
		selectedUserForDelete.value = null
		await refreshUsers()
	} catch (err: unknown) {
		const errorResponse = err as { data?: { statusMessage?: string } }
		toast.add({
			title: 'Gagal Menghapus Akun',
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
			title: 'Gagal Memperbarui Status',
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
			title="Konsol Manajemen"
			:ui="{ root: 'border-b border-default' }"
		>
			<template #leading>
				<UDashboardSidebarCollapse />
			</template>

			<template #right>
				<UBadge
					color="primary"
					variant="subtle"
					class="gap-1.5 px-2.5 py-1"
				>
					<UIcon
						name="i-lucide-shield-alert"
						class="w-4 h-4"
					/>
					Mode Administrator
				</UBadge>
			</template>
		</UDashboardNavbar>

		<div class="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-7xl w-full mx-auto flex-1">
			<!-- Header Banner -->
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 class="text-2xl font-black text-highlighted tracking-tight">
						Ruang Kendali Data & Akun
					</h1>
					<p class="text-sm text-muted">
						Kelola akun developer, atur kata sandi, sesuaikan hak akses administrator, dan pantau aktivitas komunitas.
					</p>
				</div>

				<div class="flex items-center gap-2">
					<UButton
						icon="i-lucide-rotate-cw"
						label="Muat Ulang"
						color="neutral"
						variant="outline"
						size="sm"
						:loading="status === 'pending'"
						@click="() => refreshUsers()"
					/>
				</div>
			</div>

			<!-- Stats Grid -->
			<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
				<div class="p-4 rounded-xl border border-default bg-neutral-50/50 dark:bg-neutral-900/40 flex flex-col gap-1">
					<span class="text-xs font-semibold text-muted">Total Pengguna</span>
					<div class="flex items-baseline justify-between">
						<span class="text-2xl font-black text-highlighted">{{ totalUsers }}</span>
						<UIcon
							name="i-lucide-users"
							class="w-5 h-5 text-primary"
						/>
					</div>
				</div>

				<div class="p-4 rounded-xl border border-default bg-neutral-50/50 dark:bg-neutral-900/40 flex flex-col gap-1">
					<span class="text-xs font-semibold text-muted">Administrator</span>
					<div class="flex items-baseline justify-between">
						<span class="text-2xl font-black text-highlighted">{{ totalAdmins }}</span>
						<UIcon
							name="i-lucide-shield-check"
							class="w-5 h-5 text-emerald-500"
						/>
					</div>
				</div>

				<div class="p-4 rounded-xl border border-default bg-neutral-50/50 dark:bg-neutral-900/40 flex flex-col gap-1">
					<span class="text-xs font-semibold text-muted">Akun Aktif</span>
					<div class="flex items-baseline justify-between">
						<span class="text-2xl font-black text-highlighted">{{ totalActive }}</span>
						<UIcon
							name="i-lucide-user-check"
							class="w-5 h-5 text-blue-500"
						/>
					</div>
				</div>

				<div class="p-4 rounded-xl border border-default bg-neutral-50/50 dark:bg-neutral-900/40 flex flex-col gap-1">
					<span class="text-xs font-semibold text-muted">Total Projek Komunitas</span>
					<div class="flex items-baseline justify-between">
						<span class="text-2xl font-black text-highlighted">{{ totalProjects }}</span>
						<UIcon
							name="i-lucide-folder-git-2"
							class="w-5 h-5 text-amber-500"
						/>
					</div>
				</div>
			</div>

			<!-- Filter & Search Controls -->
			<div class="flex flex-col sm:flex-row items-center justify-between gap-3">
				<div class="flex items-center gap-1.5 w-full sm:w-auto">
					<UButton
						label="Semua Akun"
						size="xs"
						:variant="selectedRoleFilter === 'all' ? 'solid' : 'ghost'"
						:color="selectedRoleFilter === 'all' ? 'primary' : 'neutral'"
						@click="selectedRoleFilter = 'all'"
					/>
					<UButton
						label="Administrator"
						size="xs"
						:variant="selectedRoleFilter === 'admin' ? 'solid' : 'ghost'"
						:color="selectedRoleFilter === 'admin' ? 'primary' : 'neutral'"
						@click="selectedRoleFilter = 'admin'"
					/>
					<UButton
						label="Developer Biasa"
						size="xs"
						:variant="selectedRoleFilter === 'user' ? 'solid' : 'ghost'"
						:color="selectedRoleFilter === 'user' ? 'primary' : 'neutral'"
						@click="selectedRoleFilter = 'user'"
					/>
				</div>

				<div class="w-full sm:w-80">
					<UInput
						v-model="search"
						placeholder="Cari nama, email, username..."
						icon="i-lucide-search"
						class="w-full"
					/>
				</div>
			</div>

			<!-- Users Table -->
			<div class="rounded-xl border border-default bg-neutral-50/30 dark:bg-neutral-900/20 overflow-hidden">
				<div class="overflow-x-auto">
					<table class="w-full text-left text-sm">
						<thead class="bg-neutral-100/70 dark:bg-neutral-800/60 border-b border-default text-xs font-semibold text-muted uppercase tracking-wider">
							<tr>
								<th class="py-3 px-4">
									Pengguna
								</th>
								<th class="py-3 px-4">
									Role
								</th>
								<th class="py-3 px-4">
									Projek
								</th>
								<th class="py-3 px-4">
									Status
								</th>
								<th class="py-3 px-4">
									Terdaftar
								</th>
								<th class="py-3 px-4 text-right">
									Aksi Manajemen
								</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-default">
							<tr
								v-for="u in filteredUsers"
								:key="u.id"
								class="hover:bg-neutral-100/50 dark:hover:bg-neutral-800/40 transition-colors"
							>
								<!-- Pengguna Info -->
								<td class="py-3.5 px-4">
									<div class="flex items-center gap-3">
										<UAvatar
											:src="u.image || undefined"
											:alt="u.name || 'User'"
											size="md"
											class="border border-default shrink-0"
										/>
										<div class="flex flex-col min-w-0">
											<div class="flex items-center gap-1.5">
												<span class="font-semibold text-highlighted truncate max-w-xs">{{ u.name || 'Tanpa Nama' }}</span>
												<UBadge
													v-if="u.id === currentSessionUser?.id"
													color="primary"
													variant="subtle"
													size="xs"
												>
													Anda
												</UBadge>
											</div>
											<span class="text-xs text-muted truncate max-w-xs">{{ u.email }}</span>
										</div>
									</div>
								</td>

								<!-- Role -->
								<td class="py-3.5 px-4">
									<UBadge
										:color="u.role === 'admin' ? 'primary' : 'neutral'"
										:variant="u.role === 'admin' ? 'solid' : 'subtle'"
										class="gap-1 font-semibold"
										size="sm"
									>
										<UIcon
											:name="u.role === 'admin' ? 'i-lucide-shield-check' : 'i-lucide-user'"
											class="w-3.5 h-3.5"
										/>
										{{ u.role === 'admin' ? 'Admin' : 'User' }}
									</UBadge>
								</td>

								<!-- Projek Count -->
								<td class="py-3.5 px-4">
									<span class="font-medium text-highlighted">{{ u.projectCount }}</span>
									<span class="text-xs text-muted ml-1">projek</span>
								</td>

								<!-- Status -->
								<td class="py-3.5 px-4">
									<UBadge
										:color="u.banned ? 'error' : 'success'"
										variant="subtle"
										size="xs"
										class="gap-1"
									>
										<span
											class="w-1.5 h-1.5 rounded-full"
											:class="u.banned ? 'bg-red-500' : 'bg-emerald-500'"
										/>
										{{ u.banned ? 'Ditangguhkan' : 'Aktif' }}
									</UBadge>
								</td>

								<!-- Tanggal Bergabung -->
								<td class="py-3.5 px-4 text-xs text-muted whitespace-nowrap">
									{{ formatDate(u.createdAt) }}
								</td>

								<!-- Actions -->
								<td class="py-3.5 px-4 text-right whitespace-nowrap">
									<div class="flex items-center justify-end gap-1">
										<!-- Ubah Password -->
										<UButton
											icon="i-lucide-key-round"
											color="neutral"
											variant="ghost"
											size="xs"
											title="Ubah Password Pengguna"
											aria-label="Ubah Password Pengguna"
											@click="openPasswordModal(u)"
										/>

										<!-- Ubah Role -->
										<UButton
											icon="i-lucide-shield"
											color="neutral"
											variant="ghost"
											size="xs"
											title="Ubah Role (Hak Akses)"
											aria-label="Ubah Role"
											@click="openRoleModal(u)"
										/>

										<!-- Ban / Unban -->
										<UButton
											:icon="u.banned ? 'i-lucide-check-circle' : 'i-lucide-ban'"
											:color="u.banned ? 'success' : 'neutral'"
											variant="ghost"
											size="xs"
											:disabled="u.id === currentSessionUser?.id || u.email.toLowerCase() === 'dinarpermadi07@gmail.com'"
											:title="u.banned ? 'Pulihkan Akun' : 'Tangguhkan Akun'"
											:aria-label="u.banned ? 'Pulihkan Akun' : 'Tangguhkan Akun'"
											@click="handleToggleBan(u)"
										/>

										<!-- Hapus Akun -->
										<UButton
											icon="i-lucide-trash-2"
											color="error"
											variant="ghost"
											size="xs"
											:disabled="u.id === currentSessionUser?.id || u.email.toLowerCase() === 'dinarpermadi07@gmail.com'"
											title="Hapus Akun Pengguna"
											aria-label="Hapus Akun Pengguna"
											@click="openDeleteModal(u)"
										/>
									</div>
								</td>
							</tr>

							<!-- Empty Row -->
							<tr v-if="filteredUsers.length === 0">
								<td
									colspan="6"
									class="py-12 text-center text-muted"
								>
									<div class="flex flex-col items-center justify-center gap-2">
										<UIcon
											name="i-lucide-user-x"
											class="w-8 h-8 text-muted"
										/>
										<p class="font-medium text-highlighted">
											Tidak ada akun yang sesuai dengan pencarian.
										</p>
									</div>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</div>

		<!-- Modal Ubah Password -->
		<UModal
			v-model:open="isPasswordModalOpen"
			title="Ubah Kata Sandi Akun"
			:description="`Tetapkan password baru untuk ${selectedUserForPassword?.name || selectedUserForPassword?.email}`"
		>
			<template #body>
				<div class="flex flex-col gap-4 py-2">
					<div class="p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs flex items-center gap-3">
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
						label="Password Baru"
						required
						description="Minimal 8 karakter."
					>
						<div class="relative w-full">
							<UInput
								v-model="newPassword"
								:type="showNewPassword ? 'text' : 'password'"
								placeholder="Masukkan password baru..."
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
						label="Konfirmasi Password Baru"
						required
					>
						<UInput
							v-model="confirmPassword"
							:type="showNewPassword ? 'text' : 'password'"
							placeholder="Ulangi password baru..."
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
						label="Simpan Password"
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
			title="Ubah Peran Pengguna (Role)"
			:description="`Atur tingkat hak akses untuk ${selectedUserForRole?.name || selectedUserForRole?.email}`"
		>
			<template #body>
				<div class="flex flex-col gap-4 py-2">
					<div class="space-y-3">
						<label
							class="flex items-start gap-3 p-3 rounded-xl border border-default cursor-pointer transition-colors"
							:class="selectedRole === 'admin' ? 'border-primary bg-primary/5' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800'"
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
									Memiliki akses ke konsol manajemen ini, dapat mengelola akun pengguna lain, dan mengedit/menghapus projek komunitas.
								</span>
							</div>
						</label>

						<label
							class="flex items-start gap-3 p-3 rounded-xl border border-default cursor-pointer transition-colors"
							:class="selectedRole === 'user' ? 'border-primary bg-primary/5' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800'"
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
										class="w-4 h-4 text-neutral-500"
									/>
									Developer (Pengguna Biasa)
								</span>
								<span class="text-xs text-muted">
									Hanya dapat mengakses dashboard pribadi, mengunggah portofolio projek mereka sendiri, dan mengedit profil sendiri.
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
						label="Simpan Perubahan Role"
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
			title="Konfirmasi Hapus Akun"
			description="Tindakan ini permanen dan tidak dapat dibatalkan."
		>
			<template #body>
				<div class="flex flex-col gap-3 py-2">
					<div class="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400 flex items-start gap-2.5">
						<UIcon
							name="i-lucide-alert-triangle"
							class="w-5 h-5 shrink-0 mt-0.5"
						/>
						<div>
							Apakah Anda yakin ingin menghapus akun <strong>{{ selectedUserForDelete?.name || selectedUserForDelete?.email }}</strong>?
							Seluruh data portofolio projek miliknya ({{ selectedUserForDelete?.projectCount || 0 }} projek) dan riwayat sesi akan dihapus secara permanen dari basis data.
						</div>
					</div>
				</div>
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
