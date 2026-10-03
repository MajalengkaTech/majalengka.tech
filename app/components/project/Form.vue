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
const { uploadImage, isUploading } = useImageUpload(() => props.project?.id)
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
	return value.category ? [] : [{ name: 'category', message: 'Pilih kategori proyek' }]
}

const categoryItems = Object.entries(PROJECT_CATEGORIES).map(([value, label]) => ({ value, label }))

// UFileUpload hanya dipakai untuk memilih atau menarik file; gambar langsung diunggah dan ditampilkan di pratinjau sendiri.
async function onCoverSelected(file: File | null | undefined) {
	if (!file) return
	const url = await uploadImage(file)
	if (url) state.thumbnailUrl = url
}

async function onGallerySelected(files: File[] | null | undefined) {
	const list = (files || []).slice(0, MAX_GALLERY - gallery.value.length)
	for (const file of list) {
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
	title: state.title || 'Judul proyekmu',
	slug: props.project?.slug || 'pratinjau',
	tagline: state.tagline || 'Tagline singkat muncul di sini',
	description: state.description,
	category: state.category || 'lainnya',
	thumbnailUrl: state.thumbnailUrl || gallery.value[0]?.url || null,
	createdAt: new Date()
}))

// Cerita proyek bisa panjang, jadi meninggalkan form yang sudah diubah perlu konfirmasi dulu.
const snapshot = () => JSON.stringify({ state, gallery: gallery.value })
const initialSnapshot = ref(snapshot())
const isDirty = computed(() => snapshot() !== initialSnapshot.value)
const leaveOpen = ref(false)
let pendingLeave: ((leave: boolean) => void) | null = null

onBeforeRouteLeave(() => {
	if (!isDirty.value || saving.value) return true
	leaveOpen.value = true
	return new Promise<boolean>((resolve) => {
		pendingLeave = resolve
	})
})

function answerLeave(leave: boolean) {
	leaveOpen.value = false
	pendingLeave?.(leave)
	pendingLeave = null
}

watch(leaveOpen, (open) => {
	// Menutup modal lewat Esc atau klik di luar sama dengan memilih tetap di halaman.
	if (!open && pendingLeave) answerLeave(false)
})

// Menutup tab atau memuat ulang tidak lewat router, jadi memakai peringatan bawaan browser.
useEventListener('beforeunload', (event: BeforeUnloadEvent) => {
	if (!isDirty.value) return
	event.preventDefault()
	event.returnValue = ''
})

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

		initialSnapshot.value = snapshot()
		toast.add({
			title: isEdit.value ? 'Perubahan tersimpan' : 'Proyek tersimpan',
			description: res.project.isPublished ? 'Proyekmu sudah tampil di showcase.' : 'Proyekmu tersimpan sebagai Draf.',
			color: 'success'
		})
		emit('saved', res.project)
	} catch (err: unknown) {
		const errorResponse = err as { data?: { statusMessage?: string } }
		toast.add({
			title: 'Proyek belum tersimpan',
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
						Tentang proyek
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
							placeholder="Nama proyekmu"
							class="w-full"
						/>
					</UFormField>

					<UFormField
						label="Tagline"
						name="tagline"
						description="Satu kalimat yang menjelaskan proyek ini. Tampil di kartu showcase."
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
						label="Cerita di balik proyek"
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
						Pakai tangkapan layar atau desain asli proyekmu, bukan gambar stok.
					</p>
				</template>

				<div class="flex flex-col gap-6">
					<UFormField
						label="Gambar sampul"
						name="thumbnailUrl"
						description="Tampil di kartu showcase dan sebagai gambar pertama di halaman proyek."
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
									preset="sampul"
								/>
							</div>
							<UFileUpload
								:model-value="null"
								icon="i-lucide-image-up"
								:label="isUploading ? 'Mengunggah gambar...' : 'Tarik gambar ke sini, atau klik untuk memilih'"
								description="JPG, PNG, WebP, atau GIF, maksimal 8 MB"
								accept="image/png,image/jpeg,image/webp,image/gif"
								:preview="false"
								:disabled="isUploading"
								reset
								class="w-full"
								:ui="{ base: 'min-h-28' }"
								@update:model-value="onCoverSelected"
							/>
							<div class="flex flex-col gap-2 sm:flex-row">
								<UInput
									v-model="state.thumbnailUrl"
									placeholder="atau tempel link https://"
									class="flex-1"
									aria-label="Link gambar sampul"
								/>
								<UButton
									v-if="state.thumbnailUrl"
									label="Hapus Sampul"
									color="neutral"
									variant="ghost"
									@click="state.thumbnailUrl = ''"
								/>
							</div>
						</div>
					</UFormField>

					<div class="flex flex-col gap-3">
						<div class="flex items-baseline justify-between gap-2">
							<p class="text-sm font-medium text-default">
								Galeri
							</p>
							<span class="text-xs text-muted tabular-nums">{{ gallery.length }}/{{ MAX_GALLERY }}</span>
						</div>

						<!-- Saat gambar dinaikkan, diturunkan, ditambah, atau dihapus, gambar lain bergeser supaya urutannya mudah diikuti. -->
						<AnimeTransitionGroup
							v-show="gallery.length"
							tag="ol"
							enter-animation="mt-item"
							leave-animation="mt-item"
							move-animation="mt-item"
							class="relative flex flex-col gap-3"
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
									preset="sampul"
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
						</AnimeTransitionGroup>

						<p
							v-if="!gallery.length"
							class="text-sm text-muted"
						>
							Tambahkan beberapa tangkapan layar atau detail desain supaya pengunjung bisa melihat proyekmu lebih utuh.
						</p>

						<template v-if="gallery.length < MAX_GALLERY">
							<UFileUpload
								:model-value="null"
								multiple
								icon="i-lucide-images"
								:label="isUploading ? 'Mengunggah gambar...' : 'Tarik beberapa gambar ke sini, atau klik untuk memilih'"
								:description="`Masih bisa ${MAX_GALLERY - gallery.length} gambar lagi`"
								accept="image/png,image/jpeg,image/webp,image/gif"
								:preview="false"
								:disabled="isUploading"
								reset
								class="w-full"
								:ui="{ base: 'min-h-24' }"
								@update:model-value="onGallerySelected"
							/>
							<div class="flex flex-col gap-2 sm:flex-row">
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
						</template>
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

				<!-- Disusun ke bawah: di tiga kolom, label dan link panjang terpotong atau turun ke dua baris. -->
				<div class="flex flex-col gap-4">
					<UFormField
						label="Demo"
						name="demoUrl"
						hint="Situs atau aplikasi yang bisa dicoba"
					>
						<UInput
							v-model="state.demoUrl"
							placeholder="https://proyekmu.com"
							icon="i-lucide-external-link"
							class="w-full"
						/>
					</UFormField>
					<UFormField
						label="Desain"
						name="designUrl"
						hint="Figma atau Behance"
					>
						<UInput
							v-model="state.designUrl"
							placeholder="https://figma.com/..."
							icon="i-lucide-pen-tool"
							class="w-full"
						/>
					</UFormField>
					<UFormField
						label="Kode sumber"
						name="repoUrl"
						hint="GitHub atau GitLab"
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
				<template #header>
					<h2 class="text-base font-bold text-highlighted">
						Publikasi
					</h2>
				</template>

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
						description="Matikan untuk menyimpan sebagai Draf. Draf hanya bisa dilihat olehmu dan pengelola situs."
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
					:label="isEdit ? 'Simpan Perubahan' : (state.isPublished ? 'Terbitkan Proyek' : 'Simpan Draf')"
					icon="i-lucide-save"
					:loading="saving"
					:disabled="saving || isUploading"
				/>
			</div>
		</div>

		<UModal
			v-model:open="leaveOpen"
			title="Tinggalkan halaman ini?"
			description="Perubahanmu belum disimpan dan akan hilang kalau kamu pergi sekarang."
		>
			<template #footer>
				<div class="flex w-full justify-end gap-2">
					<UButton
						label="Tetap di Sini"
						color="neutral"
						variant="outline"
						@click="answerLeave(false)"
					/>
					<UButton
						label="Tinggalkan"
						color="error"
						@click="answerLeave(true)"
					/>
				</div>
			</template>
		</UModal>

		<aside class="flex flex-col gap-3 lg:sticky lg:top-6 lg:self-start">
			<p class="text-sm font-medium text-muted">
				Pratinjau kartu
			</p>
			<div inert>
				<ProjectMiniCard :project="preview" />
			</div>
			<p class="text-xs text-muted">
				Begini tampilan proyekmu di showcase dan di profilmu.
			</p>
		</aside>
	</UForm>
</template>
