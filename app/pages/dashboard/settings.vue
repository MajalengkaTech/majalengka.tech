<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
	layout: 'dashboard',
	middleware: 'auth'
})

useSeoMeta({
	title: 'Edit Profil · Majalengka Tech',
	description: 'Pengaturan dan pembaruan data profil developer'
})

const toast = useToast()
const { fetch: refreshSession } = useUserSession()

const { data: profileData, refresh: refreshProfile } = await useFetch('/api/user/profile')

const loading = ref(false)

const profileSchema = z.object({
	name: z.string().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter'),
	bio: z.string().max(500, 'Bio maksimal 500 karakter').optional().nullable(),
	avatarUrl: z.string().url('URL avatar tidak valid').or(z.literal('')).optional().nullable(),
	githubUsername: z.string().max(50, 'Username GitHub maksimal 50 karakter').optional().nullable(),
	websiteUrl: z.string().url('URL website harus berawalan https:// atau http://').or(z.literal('')).optional().nullable()
})

type ProfileSchema = z.output<typeof profileSchema>

const state = reactive<{
	name: string
	bio: string
	avatarUrl: string
	githubUsername: string
	websiteUrl: string
}>({
	name: '',
	bio: '',
	avatarUrl: '',
	githubUsername: '',
	websiteUrl: ''
})

watch(() => profileData.value?.user, (u) => {
	if (u) {
		state.name = u.name || ''
		state.bio = u.bio || ''
		state.avatarUrl = u.avatarUrl || ''
		state.githubUsername = u.githubUsername || ''
		state.websiteUrl = u.websiteUrl || ''
	}
}, { immediate: true })

function generateAvatar() {
	const seed = encodeURIComponent(state.name || 'developer')
	state.avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`
}

async function onSubmit(event: FormSubmitEvent<ProfileSchema>) {
	try {
		loading.value = true
		await $fetch('/api/user/profile', {
			method: 'PATCH',
			body: {
				name: event.data.name,
				bio: event.data.bio,
				avatarUrl: event.data.avatarUrl,
				githubUsername: event.data.githubUsername,
				websiteUrl: event.data.websiteUrl
			}
		})

		await refreshSession()
		await refreshProfile()

		toast.add({
			title: 'Profil Berhasil Diperbarui',
			description: 'Data profil Anda telah berhasil disimpan.',
			color: 'success'
		})
	} catch (err: unknown) {
		const errorResponse = err as { data?: { statusMessage?: string } }
		toast.add({
			title: 'Gagal Menyimpan',
			description: errorResponse?.data?.statusMessage || 'Terjadi kesalahan saat memperbarui profil.',
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
			title="Pengaturan Profil"
			:ui="{ root: 'border-b border-default' }"
		>
			<template #leading>
				<UDashboardSidebarCollapse />
			</template>
		</UDashboardNavbar>

		<div class="p-4 sm:p-6 lg:p-8 max-w-4xl w-full mx-auto flex flex-col gap-6">
			<UCard>
				<template #header>
					<div>
						<h2 class="text-base font-bold text-highlighted">
							Data Profil Pengembang
						</h2>
						<p class="text-xs text-muted">
							Informasi ini akan ditampilkan pada karya showcase dan direktori komunitas Majalengka Tech.
						</p>
					</div>
				</template>

				<UForm
					:schema="profileSchema"
					:state="state"
					class="space-y-6"
					@submit="onSubmit"
				>
					<!-- Avatar preview & field -->
					<div class="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/40 border border-default">
						<UAvatar
							:src="state.avatarUrl || profileData?.user?.avatarUrl || undefined"
							:alt="state.name || 'User'"
							size="3xl"
							class="ring-2 ring-primary/40 shadow-sm"
						/>
						<div class="flex flex-col gap-2 flex-1">
							<div class="flex items-center gap-2">
								<span class="text-sm font-semibold text-highlighted">Foto Profil / Avatar</span>
								<UBadge
									v-if="profileData?.user?.provider"
									color="neutral"
									variant="subtle"
									size="xs"
								>
									Login via {{ profileData.user.provider }}
								</UBadge>
							</div>
							<p class="text-xs text-muted">
								Gunakan URL foto Anda sendiri atau buat avatar acak dengan satu klik.
							</p>
							<div class="flex items-center gap-2 mt-1">
								<UButton
									label="Acak Avatar"
									icon="i-lucide-shuffle"
									color="neutral"
									variant="outline"
									size="xs"
									@click="generateAvatar"
								/>
								<UButton
									v-if="state.avatarUrl"
									label="Reset"
									color="neutral"
									variant="ghost"
									size="xs"
									@click="state.avatarUrl = ''"
								/>
							</div>
						</div>
					</div>

					<UFormField
						label="URL Avatar Kustom"
						name="avatarUrl"
						description="Tautan langsung ke gambar avatar (opsional)."
					>
						<UInput
							v-model="state.avatarUrl"
							placeholder="https://example.com/foto-profil.jpg"
							icon="i-lucide-image"
							class="w-full"
						/>
					</UFormField>

					<div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
						<UFormField
							label="Nama Lengkap / Panggilan"
							name="name"
							required
						>
							<UInput
								v-model="state.name"
								placeholder="Nama Anda"
								icon="i-lucide-user"
								class="w-full"
							/>
						</UFormField>

						<UFormField
							label="Email Akun"
							name="email"
							description="Email yang terhubung dengan akun Anda."
						>
							<UInput
								:model-value="profileData?.user?.email || ''"
								disabled
								icon="i-lucide-mail"
								class="w-full opacity-75"
							/>
						</UFormField>
					</div>

					<UFormField
						label="Bio Singkat / Tentang Anda"
						name="bio"
						description="Tulis ringkasan singkat tentang keahlian, teknologi favorit, atau ketertarikan Anda."
					>
						<UTextarea
							v-model="state.bio"
							placeholder="Contoh: Frontend Developer yang menyukai Vue, Nuxt, dan UI/UX design. Berbasis di Majalengka."
							:rows="3"
							class="w-full"
						/>
					</UFormField>

					<div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
						<UFormField
							label="Username GitHub"
							name="githubUsername"
							description="Tanpa tanda @, contoh: 'narr07'."
						>
							<UInput
								v-model="state.githubUsername"
								placeholder="username-github"
								icon="i-simple-icons-github"
								class="w-full"
							/>
						</UFormField>

						<UFormField
							label="Website / Portofolio Pribadi"
							name="websiteUrl"
							description="Tautan lengkap dengan https://"
						>
							<UInput
								v-model="state.websiteUrl"
								placeholder="https://portfolio-anda.com"
								icon="i-lucide-globe"
								class="w-full"
							/>
						</UFormField>
					</div>

					<div class="flex items-center justify-end gap-3 pt-4 border-t border-default">
						<UButton
							label="Simpan Perubahan"
							type="submit"
							color="primary"
							icon="i-lucide-save"
							:loading="loading"
						/>
					</div>
				</UForm>
			</UCard>
		</div>
	</div>
</template>
