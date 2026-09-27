<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { ProjectImage, ProjectItem } from '~/types/project'

type EditableProject = ProjectItem & { images?: ProjectImage[] }

const props = defineProps<{
	project?: EditableProject | null
}>()

const emit = defineEmits<{
	saved: [project: { id: number, slug: string, isPublished: boolean }]
}>()

const MAX_GALLERY = 8

const toast = useToast()
const { user } = useUserSession()
const { uploadImage, isUploading } = useImageUpload()
const saving = ref(false)
const isEdit = computed(() => Boolean(props.project?.id))

const state = reactive({
	title: props.project?.title || '',
	tagline: props.project?.tagline || '',
	category: (props.project?.category as ProjectCategory | undefined) || undefined,
	description: props.project?.description || '',
	contribution: props.project?.contribution || '',
	thumbnailUrl: props.project?.thumbnailUrl || '',
	demoUrl: props.project?.demoUrl || '',
	designUrl: props.project?.designUrl || '',
	repoUrl: props.project?.repoUrl || '',
	tags: props.project?.tags || '',
	isPublished: props.project?.isPublished ?? true
})

const tagList = ref<string[]>(splitTags(state.tags))
watch(tagList, (list) => {
	state.tags = list.join(', ')
}, { deep: true })

const gallery = ref<{ url: string, alt: string }[]>((props.project?.images || []).map(image => ({ url: image.url, alt: image.alt || '' })))
const galleryUrlInput = ref('')

// Skema bersama membiarkan kategori opsional demi form lama; form ini mewajibkannya.
function validateCategory(value: { category?: string | null }) {
	return value.category ? [] : [{ name: 'category', message: 'Pilih kategori karya' }]
}

const categoryItems = Object.entries(PROJECT_CATEGORIES).map(([value, label]) => ({ value, label }))

const coverInput = ref<HTMLInputElement | null>(null)
const galleryInput = ref<HTMLInputElement | null>(null)

async function onCoverSelected(event: Event) {
	const input = event.target as HTMLInputElement
	const file = input.files?.[0]
	input.value = ''
	if (!file) return
	const url = await uploadImage(file)
	if (url) state.thumbnailUrl = url
}

async function onGallerySelected(event: Event) {
	const input = event.target as HTMLInputElement
	const files = Array.from(input.files || []).slice(0, MAX_GALLERY - gallery.value.length)
	input.value = ''
	for (const file of files) {
		const url = await uploadImage(file)
		if (url) gallery.value.push({ url, alt: '' })
	}
}

function addGalleryUrl() {
	const url = galleryUrlInput.value.trim()
	if (!/^https?:\/\//i.test(url)) {
		toast.add({ title: 'Link gambar belum valid', description: 'Tempel link yang diawali https://', color: 'error' })
		return
	}
	if (gallery.value.length >= MAX_GALLERY) return
	gallery.value.push({ url, alt: '' })
	galleryUrlInput.value = ''
}

function moveImage(index: number, delta: number) {
	const target = index + delta
	if (target < 0 || target >= gallery.value.length) return
	const list = [...gallery.value]
	const [item] = list.splice(index, 1)
	list.splice(target, 0, item!)
	gallery.value = list
}

function removeImage(index: number) {
	gallery.value.splice(index, 1)
}

const preview = computed<ProjectItem>(() => ({
	id: props.project?.id || 0,
	userId: (user.value as { id?: string } | null)?.id || '',
	title: state.title || 'Judul karyamu',
	slug: props.project?.slug || 'pratinjau',
	tagline: state.tagline || 'Tagline singkat muncul di sini',
	description: state.description,
	category: state.category || 'lainnya',
	thumbnailUrl: state.thumbnailUrl || gallery.value[0]?.url || null,
	createdAt: new Date()
}))

async function onSubmit(event: FormSubmitEvent<ProjectInput>) {
	try {
		saving.value = true
		const body = { ...event.data, tags: state.tags }
		const res = isEdit.value
			? await $fetch<{ project: { id: number, slug: string, isPublished: boolean } }>(`/api/projects/${props.project!.id}`, { method: 'PUT', body })
			: await $fetch<{ project: { id: number, slug: string, isPublished: boolean } }>('/api/projects', { method: 'POST', body })

		await $fetch(`/api/projects/${res.project.id}/images`, {
			method: 'PUT',
			body: { images: gallery.value.map(image => ({ url: image.url, alt: image.alt || null })) }
		})

		toast.add({
			title: isEdit.value ? 'Perubahan tersimpan' : 'Karya tersimpan',
			description: res.project.isPublished ? 'Karyamu sudah tampil di showcase.' : 'Karyamu tersimpan sebagai Draf.',
			color: 'success'
		})
		emit('saved', res.project)
	} catch (err: unknown) {
		const errorResponse = err as { data?: { statusMessage?: string } }
		toast.add({
			title: 'Karya belum tersimpan',
			description: errorResponse.data?.statusMessage || 'Periksa isian yang ditandai lalu simpan lagi.',
			color: 'error'
		})
	} finally {
		saving.value = false
	}
}
</script>

<template>
	<UForm
		:schema="projectInputSchema"
		:validate="validateCategory"
		:state="state"
		class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]"
		@submit="onSubmit"
	>
		<div class="flex min-w-0 flex-col gap-6">
			<UCard>
				<template #header>
					<h2 class="text-base font-bold text-highlighted">
						Tentang karya
					</h2>
				</template>

				<div class="flex flex-col gap-5">
					<UFormField
						label="Judul"
						name="title"
						required
					>
						<UInput
							v-model="state.title"
							placeholder="Nama karyamu"
							class="w-full"
						/>
					</UFormField>

					<UFormField
						label="Tagline"
						name="tagline"
						description="Satu kalimat yang menjelaskan karya ini. Tampil di kartu showcase."
						:hint="`${state.tagline.length}/140`"
					>
						<UInput
							v-model="state.tagline"
							placeholder="Contoh: Aplikasi kasir ringan untuk warung di Majalengka"
							:maxlength="140"
							class="w-full"
						/>
					</UFormField>

					<div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
						<UFormField
							label="Kategori"
							name="category"
							required
						>
							<USelect
								v-model="state.category"
								:items="categoryItems"
								placeholder="Pilih kategori"
								class="w-full"
							/>
						</UFormField>

						<UFormField
							label="Peranmu"
							name="contribution"
						>
							<UInput
								v-model="state.contribution"
								placeholder="Contoh: UI/UX dan frontend"
								class="w-full"
							/>
						</UFormField>
					</div>

					<UFormField
						label="Cerita di balik karya"
						name="description"
						required
						description="Masalah apa yang diselesaikan, bagaimana prosesnya, dan apa yang kamu pelajari. Pisahkan paragraf dengan baris kosong."
						:hint="`${state.description.length}/5000`"
					>
						<UTextarea
							v-model="state.description"
							:rows="6"
							autoresize
							:maxrows="20"
							class="w-full"
						/>
					</UFormField>
				</div>
			</UCard>

			<UCard>
				<template #header>
					<h2 class="text-base font-bold text-highlighted">
						Gambar
					</h2>
					<p class="text-sm text-muted">
						Pakai tangkapan layar atau desain asli karyamu. JPG, PNG, WebP, atau GIF, maksimal 8 MB.
					</p>
				</template>

				<div class="flex flex-col gap-6">
					<UFormField
						label="Gambar sampul"
						name="thumbnailUrl"
						description="Tampil di kartu showcase dan sebagai gambar pertama di halaman karya."
					>
						<div class="flex flex-col gap-3">
							<div
								v-if="state.thumbnailUrl"
								class="relative aspect-video w-full max-w-md overflow-hidden rounded-md border border-default bg-elevated"
							>
								<NuxtImg
									:src="state.thumbnailUrl"
									alt="Pratinjau gambar sampul"
									class="size-full object-cover"
									sizes="448px"
								/>
							</div>
							<div class="flex flex-col gap-2 sm:flex-row">
								<UButton
									label="Unggah Sampul"
									icon="i-lucide-upload"
									color="neutral"
									variant="outline"
									:loading="isUploading"
									@click="coverInput?.click()"
								/>
								<UInput
									v-model="state.thumbnailUrl"
									placeholder="atau tempel link https://"
									class="flex-1"
								/>
								<UButton
									v-if="state.thumbnailUrl"
									label="Hapus"
									color="neutral"
									variant="ghost"
									@click="state.thumbnailUrl = ''"
								/>
							</div>
							<input
								ref="coverInput"
								type="file"
								accept="image/png,image/jpeg,image/webp,image/gif"
								class="hidden"
								@change="onCoverSelected"
							>
						</div>
					</UFormField>

					<div class="flex flex-col gap-3">
						<div class="flex items-baseline justify-between gap-2">
							<p class="text-sm font-medium text-default">
								Galeri
							</p>
							<span class="text-xs text-muted tabular-nums">{{ gallery.length }}/{{ MAX_GALLERY }}</span>
						</div>

						<ol
							v-if="gallery.length"
							class="flex flex-col gap-3"
						>
							<li
								v-for="(image, index) in gallery"
								:key="image.url"
								class="flex flex-col gap-3 rounded-md border border-default p-3 sm:flex-row sm:items-center"
							>
								<NuxtImg
									:src="image.url"
									:alt="image.alt || `Gambar galeri ${index + 1}`"
									class="aspect-video w-full rounded-sm object-cover sm:w-32"
									sizes="128px"
								/>
								<UInput
									v-model="image.alt"
									:placeholder="`Keterangan gambar ${index + 1}, untuk pembaca layar`"
									class="flex-1"
									:aria-label="`Keterangan gambar ${index + 1}`"
								/>
								<div class="flex gap-1">
									<UButton
										icon="i-lucide-arrow-up"
										color="neutral"
										variant="ghost"
										:disabled="index === 0"
										:aria-label="`Naikkan gambar ${index + 1}`"
										@click="moveImage(index, -1)"
									/>
									<UButton
										icon="i-lucide-arrow-down"
										color="neutral"
										variant="ghost"
										:disabled="index === gallery.length - 1"
										:aria-label="`Turunkan gambar ${index + 1}`"
										@click="moveImage(index, 1)"
									/>
									<UButton
										icon="i-lucide-trash-2"
										color="error"
										variant="ghost"
										:aria-label="`Hapus gambar ${index + 1}`"
										@click="removeImage(index)"
									/>
								</div>
							</li>
						</ol>

						<p
							v-else
							class="text-sm text-muted"
						>
							Tambahkan beberapa tangkapan layar atau detail desain supaya pengunjung bisa melihat karyamu lebih utuh.
						</p>

						<div
							v-if="gallery.length < MAX_GALLERY"
							class="flex flex-col gap-2 sm:flex-row"
						>
							<UButton
								label="Unggah Gambar"
								icon="i-lucide-images"
								color="neutral"
								variant="outline"
								:loading="isUploading"
								@click="galleryInput?.click()"
							/>
							<UInput
								v-model="galleryUrlInput"
								placeholder="atau tempel link https://"
								class="flex-1"
								aria-label="Link gambar galeri"
								@keydown.enter.prevent="addGalleryUrl"
							/>
							<UButton
								label="Tambah"
								color="neutral"
								variant="ghost"
								:disabled="!galleryUrlInput.trim()"
								@click="addGalleryUrl"
							/>
						</div>
						<input
							ref="galleryInput"
							type="file"
							multiple
							accept="image/png,image/jpeg,image/webp,image/gif"
							class="hidden"
							@change="onGallerySelected"
						>
					</div>
				</div>
			</UCard>

			<UCard>
				<template #header>
					<h2 class="text-base font-bold text-highlighted">
						Tautan
					</h2>
					<p class="text-sm text-muted">
						Isi yang ada saja. Tombolnya hanya muncul untuk tautan yang terisi.
					</p>
				</template>

				<div class="grid grid-cols-1 gap-5 sm:grid-cols-3">
					<UFormField
						label="Demo"
						name="demoUrl"
					>
						<UInput
							v-model="state.demoUrl"
							placeholder="https://..."
							icon="i-lucide-external-link"
							class="w-full"
						/>
					</UFormField>
					<UFormField
						label="Desain (Figma, Behance)"
						name="designUrl"
					>
						<UInput
							v-model="state.designUrl"
							placeholder="https://..."
							icon="i-lucide-pen-tool"
							class="w-full"
						/>
					</UFormField>
					<UFormField
						label="Kode sumber"
						name="repoUrl"
					>
						<UInput
							v-model="state.repoUrl"
							placeholder="https://github.com/..."
							icon="i-simple-icons-github"
							class="w-full"
						/>
					</UFormField>
				</div>
			</UCard>

			<UCard>
				<div class="flex flex-col gap-5">
					<UFormField
						label="Dibuat dengan"
						name="tags"
						description="Teknologi atau alat yang kamu pakai. Tekan Enter setelah tiap item."
					>
						<UInputTags
							v-model="tagList"
							placeholder="Nuxt, Figma, Laravel..."
							class="w-full"
						/>
					</UFormField>

					<USwitch
						v-model="state.isPublished"
						label="Terbitkan di showcase"
						description="Matikan untuk menyimpan sebagai Draf. Draf hanya bisa dilihat olehmu."
					/>
				</div>
			</UCard>

			<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
				<UButton
					label="Batal"
					color="neutral"
					variant="ghost"
					to="/dashboard/projects"
				/>
				<UButton
					type="submit"
					:label="isEdit ? 'Simpan Perubahan' : (state.isPublished ? 'Terbitkan Karya' : 'Simpan Draf')"
					icon="i-lucide-save"
					:loading="saving"
					:disabled="isUploading"
				/>
			</div>
		</div>

		<aside class="flex flex-col gap-3 lg:sticky lg:top-6 lg:self-start">
			<p class="text-sm font-medium text-muted">
				Pratinjau kartu
			</p>
			<div inert>
				<ProjectMiniCard :project="preview" />
			</div>
			<p class="text-xs text-muted">
				Begini tampilan karyamu di showcase dan di profilmu.
			</p>
		</aside>
	</UForm>
</template>
