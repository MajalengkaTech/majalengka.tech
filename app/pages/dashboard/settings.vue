<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
	layout: 'dashboard'
})

useSeoMeta({
	title: 'Edit Profil',
	description: 'Atur profil kreator yang tampil di halaman publikmu'
})

interface PrivateProfile {
	name: string
	email: string
	avatarUrl: string | null
	username: string | null
	bio: string | null
	creatorRole: CreatorRole | null
	location: string | null
	skills: string | null
	openToWork: boolean
	githubUsername: string | null
	websiteUrl: string | null
	designUrl: string | null
	linkedinUrl: string | null
}

const toast = useToast()
const { fetchSession: refreshSession } = useUserSession()

const { data: profileData, refresh: refreshProfile } = await useFetch<{ user: PrivateProfile }>('/api/user/profile')

const loading = ref(false)
const savedUsername = computed(() => profileData.value?.user?.username || null)

const state = reactive({
	name: '',
	username: '',
	avatarUrl: '',
	bio: '',
	creatorRole: undefined as CreatorRole | undefined,
	location: '',
	skills: '',
	openToWork: false,
	githubUsername: '',
	websiteUrl: '',
	designUrl: '',
	linkedinUrl: ''
})

watch(() => profileData.value?.user, (u) => {
	if (!u) return
	state.name = u.name || ''
	state.username = u.username || ''
	state.avatarUrl = u.avatarUrl || ''
	state.bio = u.bio || ''
	state.creatorRole = u.creatorRole || undefined
	state.location = u.location || ''
	state.skills = u.skills || ''
	state.openToWork = Boolean(u.openToWork)
	state.githubUsername = u.githubUsername || ''
	state.websiteUrl = u.websiteUrl || ''
	state.designUrl = u.designUrl || ''
	state.linkedinUrl = u.linkedinUrl || ''
}, { immediate: true })

const roleItems = Object.entries(CREATOR_ROLES).map(([value, label]) => ({ value, label }))

interface UsernameStatus {
	available: boolean
	username: string
	message: string
}

const usernameStatus = ref<UsernameStatus | null>(null)
const checkingUsername = ref(false)

// Dicek saat berhenti mengetik; server tetap memeriksa ulang saat profil disimpan.
watchDebounced(() => state.username, async (value) => {
	const username = value.trim().toLowerCase()
	if (!username || username === savedUsername.value) {
		usernameStatus.value = null
		return
	}
	checkingUsername.value = true
	try {
		usernameStatus.value = await $fetch<UsernameStatus>('/api/user/username-check', { query: { username } })
	} catch {
		usernameStatus.value = null
	} finally {
		checkingUsername.value = false
	}
}, { debounce: 400 })

const usernameBlocked = computed(() => usernameStatus.value?.available === false)

async function onSubmit(event: FormSubmitEvent<ProfileInput>) {
	try {
		loading.value = true
		await $fetch('/api/user/profile', {
			method: 'PATCH',
			body: {
				...event.data,
				creatorRole: event.data.creatorRole || null
			}
		})

		await refreshSession()
		await refreshProfile()

		toast.add({
			title: 'Profil tersimpan',
			description: savedUsername.value ? `Profil publikmu ada di majalengka.tech/${savedUsername.value}` : 'Isi username supaya profil publikmu bisa dibuka.',
			color: 'success'
		})
	} catch (err: unknown) {
		const errorResponse = err as { data?: { statusMessage?: string } }
		toast.add({
			title: 'Profil belum tersimpan',
			description: errorResponse?.data?.statusMessage || 'Periksa isian yang ditandai lalu simpan lagi.',
			color: 'error'
		})
	} finally {
		loading.value = false
	}
}
</script>

<template>
	<div class="flex flex-col flex-1">
		<UDashboardNavbar
			title="Edit Profil"
			:ui="{ root: 'border-b border-default' }"
		>
			<template #leading>
				<UDashboardSidebarCollapse />
			</template>

			<template #right>
				<UButton
					v-if="savedUsername"
					:to="`/${savedUsername}`"
					label="Lihat Profil Publik"
					icon="i-lucide-external-link"
					color="neutral"
					variant="outline"
					size="sm"
				/>
			</template>
		</UDashboardNavbar>

		<UForm
			:schema="profileInputSchema"
			:state="state"
			class="p-4 sm:p-6 lg:p-8 max-w-3xl w-full mx-auto flex flex-col gap-6"
			@submit="onSubmit"
		>
			<UCard>
				<template #header>
					<h2 class="text-base font-bold text-highlighted">
						Identitas
					</h2>
					<p class="text-sm text-muted">
						Nama dan username tampil di setiap karyamu.
					</p>
				</template>

				<div class="flex flex-col gap-5">
					<div class="flex items-center gap-4">
						<UAvatar
							:src="state.avatarUrl || undefined"
							:alt="state.name || 'Kreator'"
							size="3xl"
						/>
						<p class="text-sm text-muted">
							Tanpa foto, avatarmu memakai inisial nama. Login lewat Google atau GitHub otomatis memakai foto akunnya.
						</p>
					</div>

					<div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
						<UFormField
							label="Nama"
							name="name"
							required
						>
							<UInput
								v-model="state.name"
								placeholder="Nama yang ingin ditampilkan"
								class="w-full"
							/>
						</UFormField>

						<UFormField
							label="Username"
							name="username"
							:description="state.username ? `Profilmu: majalengka.tech/${state.username.toLowerCase()}` : 'Dipakai untuk alamat profil publikmu.'"
						>
							<UInput
								v-model="state.username"
								placeholder="nama-kamu"
								class="w-full"
								:loading="checkingUsername"
								:ui="{ leading: 'pointer-events-none' }"
								aria-describedby="status-username"
							>
								<template #leading>
									<span class="text-sm text-muted">@</span>
								</template>
							</UInput>
							<p
								id="status-username"
								class="mt-1.5 flex items-center gap-1 text-sm"
								:class="usernameStatus?.available ? 'text-success' : 'text-error'"
								aria-live="polite"
							>
								<AnimeTransition
									enter-animation="mt-status"
									leave-animation="mt-status"
									mode="out-in"
								>
									<span
										v-if="usernameStatus"
										:key="usernameStatus.message"
										class="flex items-center gap-1"
									>
										<UIcon
											:name="usernameStatus.available ? 'i-lucide-circle-check' : 'i-lucide-circle-x'"
											class="size-4 shrink-0"
										/>
										{{ usernameStatus.message }}
									</span>
								</AnimeTransition>
							</p>
						</UFormField>
					</div>

					<UFormField
						label="URL foto profil"
						name="avatarUrl"
						description="Opsional. Tautan langsung ke gambar, diawali https://"
					>
						<UInput
							v-model="state.avatarUrl"
							placeholder="https://..."
							icon="i-lucide-image"
							class="w-full"
						/>
					</UFormField>

					<UFormField
						label="Email akun"
						description="Tidak ditampilkan di profil publik."
					>
						<UInput
							:model-value="profileData?.user?.email || ''"
							disabled
							icon="i-lucide-mail"
							class="w-full"
						/>
					</UFormField>
				</div>
			</UCard>

			<UCard>
				<template #header>
					<h2 class="text-base font-bold text-highlighted">
						Tentang kamu
					</h2>
					<p class="text-sm text-muted">
						Bantu pengunjung, UMKM, dan perekrut mengenal keahlianmu.
					</p>
				</template>

				<div class="flex flex-col gap-5">
					<div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
						<UFormField
							label="Peran"
							name="creatorRole"
						>
							<USelect
								v-model="state.creatorRole"
								:items="roleItems"
								placeholder="Pilih peranmu"
								class="w-full"
							/>
						</UFormField>

						<UFormField
							label="Lokasi atau kampus"
							name="location"
						>
							<UInput
								v-model="state.location"
								placeholder="Contoh: Kec. Talaga atau UNMA"
								icon="i-lucide-map-pin"
								class="w-full"
							/>
						</UFormField>
					</div>

					<UFormField
						label="Bio"
						name="bio"
						description="Maksimal 500 karakter."
					>
						<UTextarea
							v-model="state.bio"
							placeholder="Ceritakan singkat apa yang kamu kerjakan dan apa yang sedang kamu pelajari."
							:rows="3"
							autoresize
							class="w-full"
						/>
					</UFormField>

					<UFormField
						label="Skill"
						name="skills"
						description="Pisahkan dengan koma."
					>
						<UInput
							v-model="state.skills"
							placeholder="Figma, Nuxt, Laravel, Ilustrasi"
							icon="i-lucide-wrench"
							class="w-full"
						/>
					</UFormField>

					<USwitch
						v-model="state.openToWork"
						label="Terbuka untuk project"
						description="Tampilkan badge di profil supaya UMKM atau perekrut tahu kamu bisa diajak kerja sama."
					/>
				</div>
			</UCard>

			<UCard>
				<template #header>
					<h2 class="text-base font-bold text-highlighted">
						Tautan
					</h2>
					<p class="text-sm text-muted">
						Semua opsional. Isi yang memang kamu pakai.
					</p>
				</template>

				<div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
					<UFormField
						label="Website atau portofolio"
						name="websiteUrl"
					>
						<UInput
							v-model="state.websiteUrl"
							placeholder="https://..."
							icon="i-lucide-globe"
							class="w-full"
						/>
					</UFormField>

					<UFormField
						label="Dribbble atau Behance"
						name="designUrl"
					>
						<UInput
							v-model="state.designUrl"
							placeholder="https://dribbble.com/..."
							icon="i-lucide-pen-tool"
							class="w-full"
						/>
					</UFormField>

					<UFormField
						label="Username GitHub"
						name="githubUsername"
					>
						<UInput
							v-model="state.githubUsername"
							placeholder="tanpa @"
							icon="i-simple-icons-github"
							class="w-full"
						/>
					</UFormField>

					<UFormField
						label="LinkedIn"
						name="linkedinUrl"
					>
						<UInput
							v-model="state.linkedinUrl"
							placeholder="https://linkedin.com/in/..."
							icon="i-simple-icons-linkedin"
							class="w-full"
						/>
					</UFormField>
				</div>
			</UCard>

			<div class="flex justify-end">
				<UButton
					label="Simpan Profil"
					type="submit"
					icon="i-lucide-save"
					:loading="loading"
					:disabled="usernameBlocked || checkingUsername"
				/>
			</div>
		</UForm>
	</div>
</template>
