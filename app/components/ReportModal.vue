<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { z } from 'zod'

const props = defineProps<{
	targetType: 'project' | 'comment'
	projectId: number
	commentId?: number
}>()

const open = defineModel<boolean>('open', { default: false })

const toast = useToast()
const loading = ref(false)
const state = reactive<{ reason?: ReportReason, note: string }>({ reason: undefined, note: '' })

const reasonItems = Object.entries(REPORT_REASONS).map(([value, label]) => ({ value, label }))
const subject = computed(() => props.targetType === 'comment' ? 'komentar ini' : 'proyek ini')

watch(open, (isOpen) => {
	if (isOpen) {
		state.reason = undefined
		state.note = ''
	}
})

async function onSubmit(event: FormSubmitEvent<z.output<typeof reportFormSchema>>) {
	loading.value = true
	try {
		const res = await $fetch<{ message: string }>('/api/reports', {
			method: 'POST',
			body: {
				targetType: props.targetType,
				projectId: props.projectId,
				commentId: props.commentId ?? null,
				reason: event.data.reason,
				note: event.data.note || null
			}
		})
		toast.add({ title: 'Laporan terkirim', description: res.message, color: 'success', icon: 'i-lucide-check' })
		open.value = false
	} catch (err: unknown) {
		const error = err as { data?: { statusMessage?: string } }
		toast.add({ title: 'Laporan belum terkirim', description: error.data?.statusMessage || 'Periksa koneksimu, lalu kirim lagi.', color: 'error' })
	} finally {
		loading.value = false
	}
}
</script>

<template>
	<UModal
		v-model:open="open"
		:title="`Laporkan ${subject}`"
		description="Pengelola situs akan meninjau laporanmu. Identitasmu tidak ditampilkan ke pemilik konten."
	>
		<template #body>
			<UForm
				id="form-laporan"
				:schema="reportFormSchema"
				:state="state"
				class="flex flex-col gap-4"
				@submit="onSubmit"
			>
				<UFormField
					label="Alasan"
					name="reason"
					required
				>
					<URadioGroup
						v-model="state.reason"
						:items="reasonItems"
						value-key="value"
					/>
				</UFormField>
				<UFormField
					label="Catatan"
					name="note"
					hint="Opsional"
					:help="`${state.note.length}/500`"
				>
					<UTextarea
						v-model="state.note"
						:rows="3"
						:maxlength="500"
						autoresize
						placeholder="Ceritakan singkat apa yang bermasalah, misalnya tautan ke proyek aslinya."
						class="w-full"
					/>
				</UFormField>
			</UForm>
		</template>

		<template #footer>
			<div class="flex w-full justify-end gap-2">
				<UButton
					label="Batal"
					color="neutral"
					variant="ghost"
					@click="open = false"
				/>
				<UButton
					type="submit"
					form="form-laporan"
					label="Kirim Laporan"
					icon="i-lucide-flag"
					color="error"
					:loading="loading"
				/>
			</div>
		</template>
	</UModal>
</template>
