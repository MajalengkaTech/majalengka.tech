<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { CreatorProfile } from '~/types/project'
import type { SocialLinkItem } from '~~/shared/utils/profile-schema'

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
	creatorRole: string | null
	location: string | null
	skills: string | null
	openToWork: boolean
	githubUsername: string | null
	websiteUrl: string | null
	designUrl: string | null
	linkedinUrl: string | null
	socialLinks?: SocialLinkItem[] | null
}

interface EditableSocialLink extends SocialLinkItem {
	_id: string
}

const toast = useToast()
const route = useRoute()
const { fetchSession: refreshSession } = useUserSession()
const { uploadImage, isUploading: isUploadingAvatar } = useImageUpload(undefined, { folder: 'avatar' })
const avatarFileInput = useTemplateRef<HTMLInputElement>('avatarFileInput')

function triggerAvatarUpload() {
	avatarFileInput.value?.click()
}

async function onAvatarFileChange(e: Event) {
	const target = e.target as HTMLInputElement
	const file = target.files?.[0]
	if (!file) return
	const url = await uploadImage(file)
	if (url) {
		state.avatarUrl = url
	}
	target.value = ''
}

const { data: profileData, refresh: refreshProfile } = await useFetch<{ user: PrivateProfile }>('/api/user/profile')

const loading = ref(false)
const savedUsername = computed(() => profileData.value?.user?.username || null)
const isNewAccount = computed(() => !savedUsername.value || route.query.setup === 'username')

const state = reactive({
	name: '',
	username: '',
	avatarUrl: '',
	bio: '',
	creatorRole: undefined as string | undefined,
	location: '',
	skills: '',
	openToWork: false,
	githubUsername: '',
	websiteUrl: '',
	designUrl: '',
	linkedinUrl: '',
	socialLinks: [] as EditableSocialLink[]
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

	const list: EditableSocialLink[] = Array.isArray(u.socialLinks)
		? u.socialLinks.map(item => ({
				_id: Math.random().toString(36).slice(2, 9),
				platform: item.platform || 'custom',
				url: item.url || '',
				label: item.label || getSocialPlatformConfig(item.platform).label
			}))
		: []
	if (u.designUrl && !list.some(l => l.url === u.designUrl)) {
		list.push({ _id: Math.random().toString(36).slice(2, 9), platform: 'dribbble', url: u.designUrl, label: 'Dribbble / Behance' })
	}
	if (u.linkedinUrl && !list.some(l => l.url === u.linkedinUrl)) {
		list.push({ _id: Math.random().toString(36).slice(2, 9), platform: 'linkedin', url: u.linkedinUrl, label: 'LinkedIn' })
	}
	state.socialLinks = list
}, { immediate: true })

const focusKey = ref<string>()

// Platform yang sudah dipakai ditandai disabled di menu (kecuali "custom")
const usedPlatforms = computed(() => new Set(state.socialLinks.map(l => l.platform)))
const socialPlatformMenuItems = computed(() => [
	SOCIAL_PLATFORMS
		.filter(p => p.id !== 'website' && p.id !== 'github')
		.map((p) => {
			const isUsed = p.id !== 'custom' && usedPlatforms.value.has(p.id)
			return {
				label: isUsed ? `${p.label} (sudah)` : p.label,
				icon: p.icon,
				disabled: isUsed,
				onSelect: () => {
					setTimeout(() => addSocialLink(p.id), 50)
				}
			}
		})
])

function addSocialLink(platformId = 'custom') {
	const platform = getSocialPlatformConfig(platformId)
	const newId = Math.random().toString(36).slice(2, 9)
	state.socialLinks.push({
		_id: newId,
		platform: platform.id,
		url: '',
		label: platform.label
	})
	nextTick(() => {
		focusKey.value = newId
	})
}

function removeSocialLink(index: number) {
	const [removed] = state.socialLinks.splice(index, 1)
	// Kolom lama (designUrl/linkedinUrl) ikut dikosongkan, kalau tidak tautannya muncul lagi setelah simpan
	if (removed?.url && removed.url === state.designUrl) state.designUrl = ''
	if (removed?.url && removed.url === state.linkedinUrl) state.linkedinUrl = ''
}

function onSocialUrlBlur(item: SocialLinkItem) {
	if (!item.url) return
	item.url = normalizeSocialUrl(item.url, item.platform)
	const detected = detectSocialPlatform(item.url, item.platform)
	if (detected.id !== 'custom' && item.platform === 'custom') {
		item.platform = detected.id
		item.label = detected.label
	}
}

const skillTags = computed<string[]>({
	get: () => (state.skills ? state.skills.split(',').map(s => s.trim()).filter(Boolean) : []),
	set: (v) => {
		state.skills = v.join(', ')
	}
})

// Tiga pilihan baku, ditambah peran yang sudah tersimpan atau baru diketik sendiri.
const customRoles = ref<string[]>([])
const roleItems = computed(() => {
	const items: { value: string, label: string }[] = Object.entries(CREATOR_ROLES).map(([value, label]) => ({ value, label }))
	for (const role of [state.creatorRole, ...customRoles.value]) {
		if (role && !items.some(item => item.value === role)) items.push({ value: role, label: role })
	}
	return items
})

function addCustomRole(role: string) {
	const clean = role.trim().replace(/\s+/g, ' ').slice(0, 40)
	if (!clean) return
	if (!customRoles.value.includes(clean)) customRoles.value.push(clean)
	state.creatorRole = clean
}

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

// Tombol berganti "Tersimpan" dengan centang yang membesar sesaat, konfirmasi di tempat yang sedang dilihat pengguna.
const justSaved = ref(false)
const saveButton = useTemplateRef<{ $el?: HTMLElement }>('saveButton')
let savedTimer: ReturnType<typeof setTimeout> | undefined

async function confirmSaved() {
	justSaved.value = true
	clearTimeout(savedTimer)
	savedTimer = setTimeout(() => {
		justSaved.value = false
	}, 1800)
	if (!motionAllowed()) return
	await nextTick()
	const icon = saveButton.value?.$el?.querySelector<HTMLElement>('[data-slot="leadingIcon"]')
	if (icon) {
		const anim = icon.animate([
			{ transform: 'scale(0.6)' },
			{ transform: 'scale(1.2)' },
			{ transform: 'scale(1)' }
		], {
			duration: 360,
			easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
		})
		anim.onfinish = () => icon.style.removeProperty('transform')
	}
}

onBeforeUnmount(() => clearTimeout(savedTimer))

async function onSubmit(event: FormSubmitEvent<ProfileInput>) {
	try {
		loading.value = true
		const cleanSocialLinks = state.socialLinks
			.filter(item => item && item.url?.trim())
			.map(item => ({
				platform: item.platform || 'custom',
				url: normalizeSocialUrl(item.url, item.platform),
				label: item.label?.trim() || getSocialPlatformConfig(item.platform).label
			}))

		await $fetch('/api/user/profile', {
			method: 'PATCH',
			body: {
				...event.data,
				socialLinks: cleanSocialLinks,
				creatorRole: event.data.creatorRole || null
			}
		})

		await refreshSession()
		await refreshProfile()
		confirmSaved()

		if (isNewAccount.value) {
			toast.add({
				title: 'Profilmu sudah aktif',
				description: `Selamat datang, @${state.username}. Sekarang kamu bisa memamerkan proyek pertamamu.`,
				color: 'success'
			})
			await navigateTo('/dashboard')
			return
		}

		toast.add({
			title: 'Profil tersimpan',
			description: savedUsername.value ? `Profil publikmu ada di majalengka.tech/${savedUsername.value}` : 'Isi username supaya profil publikmu bisa dibuka.',
			color: 'success'
		})

		// Sinkronisasi kartu profil baru/terbaru di latar belakang
		if (savedUsername.value) {
			const { uploadCard } = useCreatorCard()
			$fetch<{ creator: CreatorProfile }>(`/api/creators/${savedUsername.value}`).then((res) => {
				if (!res?.creator) return
				const c = res.creator
				uploadCard({
					name: c.name,
					username: c.username || savedUsername.value!,
					avatarUrl: c.avatarUrl,
					roleLabel: creatorRoleLabel(c.creatorRole),
					projectCount: c.projectCount,
					likeCount: c.likeCount,
					rank: c.rank,
					totalCreators: c.totalCreators
				}).catch(() => {})
			}).catch(() => {})
		}
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
	<UDashboardPanel
		id="dashboard-profil"
		:ui="{ body: 'p-0 sm:p-0 gap-0 sm:gap-0' }"
	>
		<template #header>
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
		</template>

		<template #body>
			<UForm
				:schema="profileInputSchema"
				:state="state"
				class="flex w-full max-w-6xl flex-1 flex-col mx-auto"
				@submit="onSubmit"
			>
				<div class="flex flex-col gap-4 p-4 sm:p-6">
					<UAlert
						v-if="!savedUsername"
						title="Pilih username-mu dulu"
						description="Username menjadi alamat profil publikmu. Isi dulu sebelum memamerkan proyek."
						color="warning"
						variant="subtle"
						icon="i-lucide-alert-circle"
					/>

					<EmailVerifyAlert />

					<div class="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
						<!-- Kolom kiri: Identitas -->
						<UCard :ui="{ header: 'px-4 py-3 sm:px-4', body: 'p-4 sm:p-4' }">
							<template #header>
								<h2 class="text-sm font-bold text-highlighted">
									Identitas
								</h2>
							</template>

							<div class="flex flex-col gap-4">
								<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
									<div class="relative group shrink-0 self-start sm:self-center">
										<UAvatar
											:src="state.avatarUrl || undefined"
											:alt="state.username || state.name || 'Kreator'"
											size="3xl"
											class="ring-2 ring-default"
										/>
										<button
											type="button"
											class="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-50 cursor-pointer"
											:disabled="isUploadingAvatar"
											:aria-label="isUploadingAvatar ? 'Sedang mengunggah...' : 'Ganti foto profil'"
											title="Klik untuk unggah foto"
											@click="triggerAvatarUpload"
										>
											<UIcon
												:name="isUploadingAvatar ? 'i-lucide-loader-2' : 'i-lucide-camera'"
												:class="{ 'animate-spin': isUploadingAvatar }"
												class="size-6"
											/>
										</button>
									</div>

									<div class="flex flex-1 flex-col gap-2">
										<input
											ref="avatarFileInput"
											type="file"
											accept="image/png,image/jpeg,image/webp,image/gif"
											class="hidden"
											@change="onAvatarFileChange"
										>
										<div class="flex flex-wrap items-center gap-2">
											<UButton
												type="button"
												label="Unggah Foto"
												icon="i-lucide-upload"
												size="xs"
												color="neutral"
												variant="outline"
												:loading="isUploadingAvatar"
												@click="triggerAvatarUpload"
											/>
											<UButton
												v-if="state.avatarUrl"
												type="button"
												label="Hapus Foto"
												icon="i-lucide-trash-2"
												size="xs"
												color="error"
												variant="ghost"
												@click="state.avatarUrl = ''"
											/>
										</div>
										<UFormField
											label="Link foto profil"
											name="avatarUrl"
											help="Unggah foto atau tempel link-nya. Kalau dikosongkan, profilmu memakai inisial nama."
											class="w-full"
										>
											<UInput
												v-model="state.avatarUrl"
												placeholder="https://... atau unggah foto"
												icon="i-lucide-image"
												class="w-full"
											/>
										</UFormField>
									</div>
								</div>

								<UFormField
									label="Nama Akun"
									name="name"
									required
									help="Hanya untuk keperluan akunmu."
								>
									<UInput
										v-model="state.name"
										placeholder="Nama akun"
										class="w-full"
									/>
								</UFormField>

								<UFormField
									label="Username"
									name="username"
									required
									:help="state.username ? `majalengka.tech/${state.username.toLowerCase()}` : 'Menjadi alamat profil publikmu.'"
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
										class="mt-1.5 flex items-center gap-1 text-sm empty:hidden"
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

								<UFormField
									label="Email akun"
									help="Tidak ditampilkan di profil publik."
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

						<!-- Kolom kanan: Tentang kamu -->
						<UCard :ui="{ header: 'px-4 py-3 sm:px-4', body: 'p-4 sm:p-4' }">
							<template #header>
								<h2 class="text-sm font-bold text-highlighted">
									Tentang kamu
								</h2>
							</template>

							<div class="flex flex-col gap-4">
								<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<UFormField
										label="Peran"
										name="creatorRole"
										help="Tidak ada yang cocok? Ketik peranmu, lalu pilih Buat."
									>
										<USelectMenu
											v-model="state.creatorRole"
											:items="roleItems"
											value-key="value"
											create-item
											placeholder="Pilih atau ketik peranmu"
											:search-input="{ placeholder: 'Cari atau ketik peran lain' }"
											class="w-full"
											@create="addCustomRole"
										/>
									</UFormField>
									<UFormField
										label="Lokasi / kampus"
										name="location"
									>
										<UInput
											v-model="state.location"
											placeholder="Kec. Talaga atau UNMA"
											icon="i-lucide-map-pin"
											class="w-full"
										/>
									</UFormField>
								</div>

								<UFormField
									label="Bio"
									name="bio"
									:help="`${state.bio.length}/500 karakter`"
								>
									<UTextarea
										v-model="state.bio"
										placeholder="Ceritakan singkat apa yang kamu kerjakan."
										:rows="3"
										autoresize
										:maxrows="6"
										class="w-full"
									/>
								</UFormField>

								<UFormField
									label="Skill"
									name="skills"
									:help="`${skillTags.length}/10 skill · tekan Enter atau koma untuk menambah`"
								>
									<UInputTags
										v-model="skillTags"
										placeholder="Figma, Nuxt, Laravel"
										icon="i-lucide-wrench"
										:max="10"
										:max-length="30"
										delimiter=","
										add-on-paste
										add-on-blur
										class="w-full"
									/>
								</UFormField>

								<USwitch
									v-model="state.openToWork"
									label="Terbuka untuk kerja sama"
									description="Munculkan badge di profilmu supaya UMKM atau perekrut tahu kamu menerima tawaran."
								/>
							</div>
						</UCard>
					</div>

					<!-- Tautan -->
					<UCard :ui="{ header: 'px-4 py-3 sm:px-4', body: 'p-4 sm:p-4' }">
						<template #header>
							<div class="flex items-center justify-between gap-2">
								<div class="flex items-baseline gap-2">
									<h2 class="text-sm font-bold text-highlighted">
										Tautan
									</h2>
									<p class="text-xs text-muted">
										Semua opsional.
									</p>
								</div>
								<UDropdownMenu
									:items="socialPlatformMenuItems"
									:content="{ align: 'end' }"
									:ui="{ content: 'w-56 max-h-72' }"
								>
									<UButton
										label="Tambah"
										icon="i-lucide-plus"
										size="xs"
										color="neutral"
										variant="subtle"
									/>
								</UDropdownMenu>
							</div>
						</template>

						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
							<UFormField
								label="Website / Portofolio"
								name="websiteUrl"
							>
								<UInput
									v-model="state.websiteUrl"
									placeholder="https://..."
									icon="i-mage-globe"
									class="w-full"
								/>
							</UFormField>

							<UFormField
								label="GitHub"
								name="githubUsername"
							>
								<UInput
									v-model="state.githubUsername"
									placeholder="username (tanpa @)"
									icon="i-mage-github"
									class="w-full"
								/>
							</UFormField>

							<UFormField
								v-for="(item, idx) in state.socialLinks"
								:key="item._id"
								:label="item.platform === 'custom' ? 'Tautan lainnya' : item.label"
								:name="`socialLinks.${idx}.url`"
							>
								<UFieldGroup class="w-full">
									<UInput
										v-if="item.platform === 'custom'"
										v-model="item.label"
										placeholder="Nama"
										aria-label="Nama tautan"
										class="w-28 shrink-0"
									/>
									<UInput
										v-model="item.url"
										:icon="getSocialPlatformConfig(item.platform).icon"
										:placeholder="getSocialPlatformConfig(item.platform).placeholder"
										:autofocus="focusKey === item._id"
										class="flex-1"
										@blur="onSocialUrlBlur(item)"
									>
										<template #trailing>
											<UButton
												icon="i-lucide-x"
												color="neutral"
												variant="link"
												size="xs"
												:aria-label="`Hapus tautan ${item.label}`"
												@click.stop.prevent="removeSocialLink(idx)"
											/>
										</template>
									</UInput>
								</UFieldGroup>
							</UFormField>
						</div>

						<p
							v-if="!state.socialLinks.length"
							class="mt-4 text-xs text-muted"
						>
							Mau menambahkan Instagram, X, LinkedIn, Dribbble, YouTube, atau lainnya? Klik <b>Tambah</b> di kanan atas.
						</p>
					</UCard>
				</div>

				<!-- Bar simpan: selalu terlihat -->
				<div class="sticky bottom-0 z-10 mt-auto flex items-center justify-end gap-3 border-t border-default bg-default/90 px-4 py-3 backdrop-blur sm:px-6">
					<p
						v-if="usernameBlocked"
						class="me-auto text-sm text-error"
					>
						Username belum bisa dipakai.
					</p>
					<UButton
						ref="saveButton"
						:label="justSaved ? 'Tersimpan' : 'Simpan Profil'"
						type="submit"
						:icon="justSaved ? 'i-lucide-check' : 'i-lucide-save'"
						:color="justSaved ? 'success' : 'primary'"
						:loading="loading"
						:disabled="usernameBlocked || checkingUsername"
					/>
				</div>
			</UForm>
		</template>
	</UDashboardPanel>
</template>
