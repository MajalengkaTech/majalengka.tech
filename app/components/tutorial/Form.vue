<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'

interface TutorialFormValue {
	id?: number
	title: string
	summary: string | null
	body: string
	level: TutorialLevel
	tags: string | null
	projectId: number | null
	status?: TutorialStatus
	reviewNote?: string | null
}

const props = defineProps<{ tutorial?: TutorialFormValue }>()
const emit = defineEmits<{ saved: [tutorial: { id: number, slug: string, status: TutorialStatus }] }>()

const toast = useToast()
const status = computed(() => props.tutorial?.status ?? 'draf')

const state = reactive({
	title: props.tutorial?.title ?? '',
	summary: props.tutorial?.summary ?? '',
	body: props.tutorial?.body ?? '',
	level: (props.tutorial?.level ?? 'pemula') as TutorialLevel,
	tags: props.tutorial?.tags ?? '',
	projectId: props.tutorial?.projectId ?? null as number | null
})

const tagList = ref<string[]>(splitTags(state.tags))
watch(tagList, (list) => {
	state.tags = [...new Set(list.map(tag => tag.trim()).filter(Boolean))].join(', ')
}, { deep: true })

const levelItems = Object.entries(TUTORIAL_LEVELS).map(([value, label]) => ({ label, value }))

// Hanya proyek milik sendiri yang bisa ditautkan; API memeriksa ulang kepemilikannya.
const { data: myProjects, status: projectsStatus } = useFetch<{ projects: { id: number, title: string }[] }>('/api/projects?mine=true', {
	key: 'tutorial-form-projects',
	server: false
})
const projectItems = computed(() => [
	{ label: 'Tidak ditautkan ke proyek', value: 0 },
	...(myProjects.value?.projects ?? []).map(project => ({ label: project.title, value: project.id }))
])
const projectValue = computed({
	get: () => state.projectId ?? 0,
	set: (value: number) => {
		state.projectId = value || null
	}
})

const saving = ref<false | 'draf' | 'kirim'>(false)
const snapshot = () => JSON.stringify(state)
const initialSnapshot = ref(snapshot())
const isDirty = computed(() => snapshot() !== initialSnapshot.value)

async function save(kirim: boolean) {
	saving.value = kirim ? 'kirim' : 'draf'
	try {
		// Kotak unggah gambar yang belum diisi tidak ikut tersimpan.
		const cleanBody = state.body.replace(/<div data-type="image-upload"><\/div>\s*/g, '').trim()
		const body = { ...state, body: cleanBody, summary: state.summary || null, tags: state.tags || null, kirim }
		const res = props.tutorial?.id
			? await $fetch<{ tutorial: { id: number, slug: string, status: TutorialStatus } }>(`/api/tutorials/${props.tutorial.id}`, { method: 'PUT', body })
			: await $fetch<{ tutorial: { id: number, slug: string, status: TutorialStatus } }>('/api/tutorials', { method: 'POST', body })
		initialSnapshot.value = snapshot()
		toast.add({
			title: res.tutorial.status === 'ditinjau' ? 'Tutorial dikirim untuk ditinjau' : 'Draf tersimpan',
			description: res.tutorial.status === 'ditinjau'
				? 'Peninjau akan membacanya. Kamu dapat notifikasi saat tutorialmu terbit atau perlu diperbaiki.'
				: 'Kamu bisa melanjutkannya kapan saja dari Tutorial Saya.',
			color: 'success'
		})
		emit('saved', res.tutorial)
	} catch (err: unknown) {
		const error = err as { data?: { statusMessage?: string } }
		toast.add({ title: 'Tutorial belum tersimpan', description: error.data?.statusMessage || 'Periksa isian yang ditandai, lalu simpan lagi.', color: 'error' })
	} finally {
		saving.value = false
	}
}

const previewOpen = ref(false)
const previewLoading = ref(false)
const previewError = ref('')
const preview = shallowRef<RenderedMarkdown | null>(null)

// Pratinjau dirender server dengan renderer halaman publik, supaya warna kode dan komponen sama dengan hasil terbit.
watch(previewOpen, async (open) => {
	if (!open) return
	previewLoading.value = true
	previewError.value = ''
	try {
		preview.value = await $fetch<RenderedMarkdown>('/api/markdown/preview', {
			method: 'POST',
			body: { markdown: state.body.replace(/<div data-type="image-upload"><\/div>\s*/g, ''), mode: 'tutorial' }
		})
	} catch (err: unknown) {
		const error = err as { data?: { statusMessage?: string } }
		previewError.value = error.data?.statusMessage || 'Pratinjau gagal dimuat. Tutup panel ini, lalu buka lagi.'
	} finally {
		previewLoading.value = false
	}
})

const submitKirim = ref(false)
function onSubmit(_event: FormSubmitEvent<TutorialInput>) {
	return save(submitKirim.value)
}

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
	if (!open && pendingLeave) answerLeave(false)
})
useEventListener('beforeunload', (event: BeforeUnloadEvent) => {
	if (!isDirty.value) return
	event.preventDefault()
	event.returnValue = ''
})
</script>

<template>
	<UForm
		:schema="tutorialInputSchema"
		:state="state"
		class="flex flex-col gap-6"
		@submit="onSubmit"
	>
		<UAlert
			v-if="status === 'ditolak' && tutorial?.reviewNote"
			color="warning"
			variant="subtle"
			icon="i-lucide-message-square-warning"
			title="Catatan dari peninjau"
			:description="tutorial.reviewNote"
		/>
		<UAlert
			v-else-if="status === 'terbit'"
			color="info"
			variant="subtle"
			icon="i-lucide-info"
			title="Tutorial ini sudah terbit"
			description="Perubahan yang kamu simpan akan ditinjau ulang. Selama ditinjau, tutorial tidak tampil di halaman publik."
		/>

		<UCard>
			<div class="flex flex-col gap-5">
				<UFormField
					label="Judul"
					name="title"
					required
					:hint="`${state.title.length}/120`"
				>
					<UInput
						v-model="state.title"
						:maxlength="120"
						placeholder="Misalnya: Membuat crawler website offline dengan Rust dan Tauri"
						class="w-full"
					/>
				</UFormField>

				<UFormField
					label="Ringkasan"
					name="summary"
					description="Satu atau dua kalimat. Tampil di daftar tutorial dan hasil pencarian Google."
					:hint="`${(state.summary || '').length}/200`"
				>
					<UTextarea
						v-model="state.summary"
						:maxlength="200"
						:rows="2"
						autoresize
						placeholder="Apa yang akan bisa dibuat pembaca setelah mengikuti tutorial ini?"
						class="w-full"
					/>
				</UFormField>

				<div class="grid gap-5 sm:grid-cols-2">
					<UFormField
						label="Tingkat kesulitan"
						name="level"
						required
					>
						<USelect
							v-model="state.level"
							:items="levelItems"
							class="w-full"
						/>
					</UFormField>

					<UFormField
						label="Proyek terkait"
						name="projectId"
						description="Tautkan kalau tutorial ini menceritakan cara membuat salah satu proyekmu."
					>
						<USelect
							v-model="projectValue"
							:items="projectItems"
							:loading="projectsStatus === 'pending'"
							class="w-full"
						/>
					</UFormField>
				</div>

				<UFormField
					label="Teknologi"
					name="tags"
					description="Pisahkan dengan koma atau tekan Enter. Maksimal 10."
				>
					<UInputTags
						v-model="tagList"
						placeholder="Nuxt, Rust, Figma..."
						delimiter=","
						add-on-paste
						add-on-blur
						class="w-full"
					/>
				</UFormField>

				<UFormField
					label="Isi tutorial"
					name="body"
					required
					description="Ketik / untuk menyisipkan subjudul, gambar, tabel, atau blok kode. Pakai Subjudul untuk tiap langkah supaya pembaca dapat daftar isi."
					:hint="`${state.body.length}/30000`"
				>
					<EditorRich
						v-model="state.body"
						image-folder="tutorial"
						components
						placeholder="Tulis langkah-langkahnya, atau ketik / untuk menyisipkan subjudul, kode, tab, atau video..."
					/>
				</UFormField>
			</div>
		</UCard>

		<div class="flex flex-wrap justify-end gap-2">
			<UButton
				label="Pratinjau"
				icon="i-lucide-eye"
				color="neutral"
				variant="ghost"
				:disabled="!state.body.trim()"
				@click="previewOpen = true"
			/>
			<UButton
				type="submit"
				label="Simpan Draf"
				icon="i-lucide-save"
				color="neutral"
				variant="outline"
				:loading="saving === 'draf'"
				:disabled="Boolean(saving)"
				@click="submitKirim = false"
			/>
			<UButton
				type="submit"
				label="Kirim untuk Ditinjau"
				icon="i-lucide-send"
				:loading="saving === 'kirim'"
				:disabled="Boolean(saving)"
				@click="submitKirim = true"
			/>
		</div>

		<USlideover
			v-model:open="previewOpen"
			:title="state.title || 'Pratinjau tutorial'"
			description="Tampilan isi tutorial seperti yang akan dilihat pembaca."
			:ui="{ content: 'sm:max-w-3xl' }"
		>
			<template #body>
				<div
					v-if="previewLoading"
					class="flex flex-col gap-3"
				>
					<USkeleton class="h-6 w-2/3" />
					<USkeleton class="h-4 w-full" />
					<USkeleton class="h-4 w-5/6" />
					<USkeleton class="h-32 w-full" />
				</div>
				<UAlert
					v-else-if="previewError"
					color="error"
					variant="subtle"
					icon="i-lucide-circle-alert"
					title="Pratinjau belum bisa ditampilkan"
					:description="previewError"
				/>
				<p
					v-else-if="!preview?.nodes.length"
					class="text-muted"
				>
					Isi tutorialnya masih kosong. Tulis langkah pertama di editor, lalu buka pratinjau lagi.
				</p>
				<MarkdownContent
					v-else
					:value="preview"
				/>
			</template>
		</USlideover>

		<UModal
			v-model:open="leaveOpen"
			title="Tinggalkan halaman ini?"
			description="Perubahan pada tutorialmu belum disimpan dan akan hilang."
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
	</UForm>
</template>
