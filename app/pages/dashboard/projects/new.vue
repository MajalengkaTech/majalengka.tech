<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
	layout: 'dashboard'
})

useSeoMeta({
	title: 'Unggah Projek Baru · Majalengka Tech',
	description: 'Tambahkan karya dan projek baru ke showcase Majalengka Tech'
})

const toast = useToast()
const { user } = useUserSession()
const loading = ref(false)

const projectSchema = z.object({
	title: z.string().min(3, 'Judul minimal 3 karakter').max(120, 'Judul maksimal 120 karakter'),
	description: z.string().min(10, 'Deskripsi minimal 10 karakter').max(2000, 'Deskripsi maksimal 2000 karakter'),
	thumbnailUrl: z.string().refine(
		val => !val || val.startsWith('/') || /^https?:\/\//i.test(val),
		{ message: 'URL thumbnail harus berupa link web valid (https://...) atau file yang diunggah' }
	).optional().nullable(),
	repoUrl: z.string().url('URL repositori tidak valid').or(z.literal('')).optional().nullable(),
	demoUrl: z.string().url('URL demo tidak valid').or(z.literal('')).optional().nullable(),
	tags: z.string().max(200, 'Tag maksimal 200 karakter').optional().nullable(),
	isPublished: z.boolean().default(true)
})

type ProjectSchema = z.output<typeof projectSchema>

const state = reactive<{
	title: string
	description: string
	thumbnailUrl: string
	repoUrl: string
	demoUrl: string
	tags: string
	isPublished: boolean
}>({
	title: '',
	description: '',
	thumbnailUrl: '',
	repoUrl: '',
	demoUrl: '',
	tags: 'Nuxt, Vue, TypeScript',
	isPublished: true
})

// Sample template images for quick picking
const sampleThumbnails = [
	'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
	'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
	'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80'
]

const previewProject = computed(() => ({
	id: 0,
	userId: user.value?.id || '0',
	title: state.title || 'Judul Projek Anda',
	slug: 'preview-slug',
	description: state.description || 'Deskripsi projek Anda akan tampil di sini. Jelaskan solusi, fitur utama, dan keunggulan projek yang Anda kembangkan.',
	thumbnailUrl: state.thumbnailUrl || null,
	repoUrl: state.repoUrl || null,
	demoUrl: state.demoUrl || null,
	tags: state.tags || null,
	isPublished: state.isPublished,
	createdAt: new Date(),
	updatedAt: new Date(),
	author: {
		id: user.value?.id || '0',
		name: user.value?.name || 'Developer',
		avatarUrl: (user.value as { image?: string })?.image || null,
		githubUsername: null
	}
}))

async function onSubmit(event: FormSubmitEvent<ProjectSchema>) {
	try {
		loading.value = true
		await $fetch('/api/projects', {
			method: 'POST',
			body: {
				title: event.data.title,
				description: event.data.description,
				thumbnailUrl: event.data.thumbnailUrl,
				repoUrl: event.data.repoUrl,
				demoUrl: event.data.demoUrl,
				tags: event.data.tags,
				isPublished: event.data.isPublished
			}
		})

		toast.add({
			title: 'Projek Berhasil Diunggah',
			description: `Projek "${event.data.title}" telah ditambahkan ke portofolio.`,
			color: 'success'
		})

		await refreshNuxtData()
		await navigateTo('/dashboard/projects')
	} catch (err: unknown) {
		const errorResponse = err as { data?: { statusMessage?: string } }
		toast.add({
			title: 'Gagal Mengunggah Projek',
			description: errorResponse?.data?.statusMessage || 'Terjadi kesalahan saat menyimpan projek.',
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
			title="Unggah Projek Baru"
			:ui="{ root: 'border-b border-default' }"
		>
			<template #leading>
				<UButton
					icon="i-lucide-arrow-left"
					color="neutral"
					variant="ghost"
					to="/dashboard/projects"
					size="sm"
					class="mr-2"
				/>
				<UDashboardSidebarCollapse />
			</template>

			<template #right>
				<UButton
					label="Batal"
					color="neutral"
					variant="ghost"
					to="/dashboard/projects"
					size="sm"
				/>
			</template>
		</UDashboardNavbar>

		<div class="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				<!-- Form Editor Column -->
				<div class="lg:col-span-7 flex flex-col gap-6">
					<UCard>
						<template #header>
							<div>
								<h2 class="text-base font-bold text-highlighted">
									Detail Projek
								</h2>
								<p class="text-xs text-muted">
									Isi informasi lengkap tentang projek, repositori, dan demo aplikasi Anda.
								</p>
							</div>
						</template>

						<UForm
							:schema="projectSchema"
							:state="state"
							class="space-y-5"
							@submit="onSubmit"
						>
							<UFormField
								label="Nama / Judul Projek"
								name="title"
								required
								description="Gunakan nama yang jelas dan menarik."
							>
								<UInput
									v-model="state.title"
									placeholder="Contoh: Majalengka Weather Radar"
									icon="i-lucide-box"
									class="w-full"
								/>
							</UFormField>

							<UFormField
								label="URL Foto Thumbnail / Cover"
								name="thumbnailUrl"
								description="Tautan gambar landscape (rasio 16:9 disarankan)."
							>
								<UInput
									v-model="state.thumbnailUrl"
									placeholder="https://example.com/cover-projek.jpg"
									icon="i-lucide-image"
									class="w-full"
								/>
								<div class="flex items-center gap-2 mt-2">
									<span class="text-xs text-muted">Contoh gambar cepat:</span>
									<UButton
										v-for="(img, idx) in sampleThumbnails"
										:key="idx"
										:label="`Contoh ${idx + 1}`"
										color="neutral"
										variant="subtle"
										size="xs"
										@click="state.thumbnailUrl = img"
									/>
								</div>
							</UFormField>

							<UFormField
								label="Deskripsi Lengkap Projek"
								name="description"
								required
								description="Jelaskan masalah yang diselesaikan, arsitektur, dan cara kerja aplikasi."
							>
								<UTextarea
									v-model="state.description"
									placeholder="Tuliskan latar belakang, fitur unggulan, dan teknologi yang digunakan..."
									:rows="4"
									class="w-full"
								/>
							</UFormField>

							<div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
								<UFormField
									label="Tautan Repositori (GitHub/GitLab)"
									name="repoUrl"
									description="Tautan source code open-source."
								>
									<UInput
										v-model="state.repoUrl"
										placeholder="https://github.com/user/repo"
										icon="i-simple-icons-github"
										class="w-full"
									/>
								</UFormField>

								<UFormField
									label="Tautan Live Demo / Website"
									name="demoUrl"
									description="Tautan web aplikasi yang sudah aktif."
								>
									<UInput
										v-model="state.demoUrl"
										placeholder="https://aplikasi-saya.com"
										icon="i-lucide-globe"
										class="w-full"
									/>
								</UFormField>
							</div>

							<UFormField
								label="Tag Teknologi (Pisahkan dengan koma)"
								name="tags"
								description="Contoh: Nuxt, Tailwind CSS, TypeScript, SQLite, Cloudflare"
							>
								<UInput
									v-model="state.tags"
									placeholder="Nuxt, Vue, PostgreSQL"
									icon="i-lucide-tags"
									class="w-full"
								/>
							</UFormField>

							<div class="flex items-center justify-between p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/40 border border-default">
								<div class="flex flex-col">
									<span class="text-sm font-semibold text-highlighted">Status Publikasi</span>
									<span class="text-xs text-muted">Tampilkan projek ini di etalase publik Majalengka Tech.</span>
								</div>
								<USwitch v-model="state.isPublished" />
							</div>

							<div class="flex items-center justify-end gap-3 pt-4 border-t border-default">
								<UButton
									label="Batal"
									color="neutral"
									variant="ghost"
									to="/dashboard/projects"
								/>
								<UButton
									label="Publikasikan Projek"
									type="submit"
									color="primary"
									icon="i-lucide-rocket"
									:loading="loading"
								/>
							</div>
						</UForm>
					</UCard>
				</div>

				<!-- Live Preview Column (Sticky) -->
				<div class="lg:col-span-5 lg:sticky lg:top-6 flex flex-col gap-4">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<UIcon
								name="i-lucide-eye"
								class="w-4 h-4 text-primary"
							/>
							<span class="text-xs font-bold uppercase tracking-wider text-muted">Pratinjau Langsung (Live Preview)</span>
						</div>
						<UBadge
							color="neutral"
							variant="subtle"
							size="xs"
						>
							Tampilan Kartu
						</UBadge>
					</div>

					<p class="text-xs text-muted">
						Berikut adalah tampilan kartu projek Anda yang akan terlihat di etalase showcase komunitas:
					</p>

					<DashboardProjectCard
						:project="previewProject"
						:editable="false"
					/>
				</div>
			</div>
		</div>
	</div>
</template>
