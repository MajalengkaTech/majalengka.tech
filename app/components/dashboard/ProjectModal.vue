<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const props = defineProps<{
	open?: boolean
}>()

const emit = defineEmits<{
	'update:open': [value: boolean]
	'saved': []
}>()

const isOpen = computed({
	get: () => props.open ?? false,
	set: (val: boolean) => emit('update:open', val)
})

const toast = useToast()
const loading = ref(false)

const projectSchema = z.object({
	title: z.string().min(3, 'Judul minimal 3 karakter').max(120, 'Judul maksimal 120 karakter'),
	description: z.string().min(10, 'Deskripsi minimal 10 karakter').max(2000, 'Deskripsi maksimal 2000 karakter'),
	thumbnailUrl: z.string().url('URL thumbnail harus berupa link web valid (https://...)').or(z.literal('')).optional().nullable(),
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

// Sample thumbnail images for quick picking
const sampleThumbnails = [
	'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
	'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
	'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
	'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80'
]

function resetForm() {
	state.title = ''
	state.description = ''
	state.thumbnailUrl = ''
	state.repoUrl = ''
	state.demoUrl = ''
	state.tags = 'Nuxt, Vue, TypeScript'
	state.isPublished = true
}

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
			title: 'Projek Berhasil Ditambahkan',
			description: `Projek "${event.data.title}" telah berhasil disimpan ke portofolio Anda.`,
			color: 'success'
		})

		await refreshNuxtData()
		resetForm()
		isOpen.value = false
		emit('saved')
	} catch (err: unknown) {
		const errorResponse = err as { data?: { statusMessage?: string } }
		toast.add({
			title: 'Gagal Menyimpan Projek',
			description: errorResponse?.data?.statusMessage || 'Terjadi kendala saat menyimpan projek. Silakan periksa formulir.',
			color: 'error'
		})
	} finally {
		loading.value = false
	}
}
</script>

<template>
	<UModal
		v-model:open="isOpen"
		title="Tambah Projek Baru"
		description="Unggah karya, aplikasi, atau tools teknologi Anda untuk dipamerkan ke ekosistem Majalengka Tech."
		:ui="{
			content: 'sm:max-w-2xl'
		}"
	>
		<template #body>
			<UForm
				id="create-project-form"
				:schema="projectSchema"
				:state="state"
				class="space-y-4"
				@submit="onSubmit"
			>
				<UFormField
					label="Judul Projek"
					name="title"
					required
					help="Nama projek, library, atau platform yang Anda kembangkan."
				>
					<UInput
						v-model="state.title"
						placeholder="Misal: Portal Desa Digital Majalengka"
						class="w-full"
					/>
				</UFormField>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<UFormField
						label="Link Repositori (GitHub/GitLab)"
						name="repoUrl"
						help="Opsional, jika opensource"
					>
						<UInput
							v-model="state.repoUrl"
							placeholder="https://github.com/username/project"
							icon="i-lucide-git-fork"
							class="w-full"
						/>
					</UFormField>

					<UFormField
						label="Link Demo / Website Live"
						name="demoUrl"
						help="Opsional, link hasil jadi"
					>
						<UInput
							v-model="state.demoUrl"
							placeholder="https://projek-keren.com"
							icon="i-lucide-external-link"
							class="w-full"
						/>
					</UFormField>
				</div>

				<UFormField
					label="URL Thumbnail / Banner Projek"
					name="thumbnailUrl"
					help="Gunakan link gambar (JPG/PNG/WebP) atau pilih salah satu template di bawah."
				>
					<div class="space-y-2.5">
						<UInput
							v-model="state.thumbnailUrl"
							placeholder="https://images.unsplash.com/photo-..."
							icon="i-lucide-image"
							class="w-full"
						/>

						<div class="flex items-center gap-2">
							<span class="text-xs text-muted">Contoh gambar:</span>
							<div class="flex gap-2">
								<button
									v-for="(img, idx) in sampleThumbnails"
									:key="idx"
									type="button"
									class="relative w-12 h-7 rounded border overflow-hidden hover:opacity-80 transition-opacity focus-visible:outline-2 focus-visible:outline-primary"
									:class="state.thumbnailUrl === img ? 'border-primary ring-2 ring-primary/40' : 'border-default'"
									@click="state.thumbnailUrl = img"
								>
									<img
										:src="img"
										alt="Preset thumbnail"
										class="w-full h-full object-cover"
									>
								</button>
							</div>
						</div>

						<div
							v-if="state.thumbnailUrl"
							class="mt-2 relative w-full h-32 rounded-lg border border-default overflow-hidden bg-neutral-100 dark:bg-neutral-800"
						>
							<img
								:src="state.thumbnailUrl"
								alt="Preview thumbnail"
								class="w-full h-full object-cover"
							>
						</div>
					</div>
				</UFormField>

				<UFormField
					label="Deskripsi Lengkap Projek"
					name="description"
					required
					help="Jelaskan latar belakang, masalah yang diselesaikan, arsitektur, dan fitur unggulan."
				>
					<UTextarea
						v-model="state.description"
						placeholder="Tuliskan gambaran singkat bagaimana projek ini bekerja..."
						:rows="4"
						class="w-full"
					/>
				</UFormField>

				<UFormField
					label="Teknologi / Tag (Pisahkan dengan koma)"
					name="tags"
					help="Contoh: Nuxt 4, Vue 3, TailwindCSS, Drizzle ORM, TypeScript"
				>
					<UInput
						v-model="state.tags"
						placeholder="Nuxt, Vue, TypeScript"
						icon="i-lucide-tags"
						class="w-full"
					/>
				</UFormField>

				<div class="pt-2 border-t border-default flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-highlighted">
							Publikasikan Projek
						</p>
						<p class="text-xs text-muted">
							Jika aktif, projek akan langsung muncul di halaman Showcase publik.
						</p>
					</div>
					<USwitch
						v-model="state.isPublished"
						color="primary"
					/>
				</div>
			</UForm>
		</template>

		<template #footer>
			<div class="flex items-center justify-end gap-3 w-full">
				<UButton
					label="Batal"
					color="neutral"
					variant="outline"
					:disabled="loading"
					@click="isOpen = false"
				/>
				<UButton
					type="submit"
					form="create-project-form"
					label="Simpan Projek"
					icon="i-lucide-check"
					color="primary"
					:loading="loading"
				/>
			</div>
		</template>
	</UModal>
</template>
