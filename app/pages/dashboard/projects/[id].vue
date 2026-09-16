<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
	layout: 'dashboard',
	middleware: 'auth'
})

useSeoMeta({
	title: 'Edit Projek · Majalengka Tech',
	description: 'Perbarui detail dan informasi projek'
})

const route = useRoute()
const toast = useToast()
const { user } = useUserSession()
const loading = ref(false)

const projectId = computed(() => route.params.id)

const { data: projectData, error } = await useFetch(`/api/projects/${projectId.value}`)

if (error.value || !projectData.value?.project) {
	throw createError({
		statusCode: 404,
		statusMessage: 'Projek tidak ditemukan'
	})
}

const projectSchema = z.object({
	title: z.string().min(3, 'Judul minimal 3 karakter').max(120, 'Judul maksimal 120 karakter'),
	description: z.string().min(10, 'Deskripsi minimal 10 karakter').max(2000, 'Deskripsi maksimal 2000 karakter'),
	thumbnailUrl: z.string().url('URL thumbnail tidak valid').or(z.literal('')).optional().nullable(),
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
	title: projectData.value.project.title,
	description: projectData.value.project.description,
	thumbnailUrl: projectData.value.project.thumbnailUrl || '',
	repoUrl: projectData.value.project.repoUrl || '',
	demoUrl: projectData.value.project.demoUrl || '',
	tags: projectData.value.project.tags || '',
	isPublished: Boolean(projectData.value.project.isPublished)
})

const previewProject = computed(() => ({
	id: Number(projectId.value),
	userId: Number(user.value?.id || 0),
	title: state.title || 'Judul Projek',
	slug: projectData.value?.project.slug || 'slug',
	description: state.description || 'Deskripsi projek...',
	thumbnailUrl: state.thumbnailUrl || null,
	repoUrl: state.repoUrl || null,
	demoUrl: state.demoUrl || null,
	tags: state.tags || null,
	isPublished: state.isPublished,
	createdAt: new Date(projectData.value?.project.createdAt || Date.now()),
	updatedAt: new Date(),
	author: {
		id: Number(user.value?.id || 0),
		name: user.value?.name || 'Developer',
		avatarUrl: user.value?.avatar || null,
		githubUsername: null
	}
}))

async function onSubmit(event: FormSubmitEvent<ProjectSchema>) {
	try {
		loading.value = true
		await $fetch(`/api/projects/${projectId.value}`, {
			method: 'PUT',
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
			title: 'Projek Berhasil Diperbarui',
			description: `Perubahan pada "${event.data.title}" telah disimpan.`,
			color: 'success'
		})

		await navigateTo('/dashboard/projects')
	} catch (err: unknown) {
		const errorResponse = err as { data?: { statusMessage?: string } }
		toast.add({
			title: 'Gagal Memperbarui',
			description: errorResponse?.data?.statusMessage || 'Terjadi kesalahan saat menyimpan perubahan.',
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
			title="Edit Projek"
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
				<!-- Form Column -->
				<div class="lg:col-span-7 flex flex-col gap-6">
					<UCard>
						<template #header>
							<div>
								<h2 class="text-base font-bold text-highlighted">
									Perbarui Projek
								</h2>
								<p class="text-xs text-muted">
									Ubah informasi projek, link repositori, dan demo.
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
							>
								<UInput
									v-model="state.title"
									placeholder="Judul projek"
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
									placeholder="https://example.com/cover.jpg"
									icon="i-lucide-image"
									class="w-full"
								/>
							</UFormField>

							<UFormField
								label="Deskripsi Lengkap Projek"
								name="description"
								required
							>
								<UTextarea
									v-model="state.description"
									placeholder="Deskripsi projek..."
									:rows="4"
									class="w-full"
								/>
							</UFormField>

							<div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
								<UFormField
									label="Tautan Repositori (GitHub/GitLab)"
									name="repoUrl"
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
								>
									<UInput
										v-model="state.demoUrl"
										placeholder="https://aplikasi.com"
										icon="i-lucide-globe"
										class="w-full"
									/>
								</UFormField>
							</div>

							<UFormField
								label="Tag Teknologi (Pisahkan dengan koma)"
								name="tags"
								description="Contoh: Nuxt, Tailwind CSS, TypeScript"
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

				<!-- Live Preview Column -->
				<div class="lg:col-span-5 lg:sticky lg:top-6 flex flex-col gap-4">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<UIcon
								name="i-lucide-eye"
								class="w-4 h-4 text-primary"
							/>
							<span class="text-xs font-bold uppercase tracking-wider text-muted">Pratinjau Langsung</span>
						</div>
						<UBadge
							color="neutral"
							variant="subtle"
							size="xs"
						>
							Tampilan Kartu
						</UBadge>
					</div>

					<DashboardProjectCard
						:project="previewProject"
						:editable="false"
					/>
				</div>
			</div>
		</div>
	</div>
</template>
