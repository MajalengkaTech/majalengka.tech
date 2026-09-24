<script setup lang="ts">
import type { ProjectItem, ProjectReviewItem, ProjectReviewSummary } from '~/types/project'

const props = defineProps<{
	open?: boolean
	project: ProjectItem | null
}>()

const emit = defineEmits<{
	'update:open': [value: boolean]
	'reviewed': []
}>()

const isOpen = computed({
	get: () => props.open ?? false,
	set: (val: boolean) => emit('update:open', val)
})

const { loggedIn, user } = useUserSession()
const toast = useToast()

const reviews = ref<ProjectReviewItem[]>([])
const summary = ref<ProjectReviewSummary>({
	averageRating: 0,
	totalReviews: 0,
	distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
})
const userReview = ref<ProjectReviewItem | null>(null)

const loading = ref(false)
const submitting = ref(false)
const deleting = ref(false)
const errorMessage = ref<string | null>(null)

// Form state
const rating = ref<number>(5)
const comment = ref<string>('')
const activeTab = ref<'write' | 'list'>('write')

// Delete confirmation state
const confirmDeleteOpen = ref(false)
const pendingDeleteId = ref<number | undefined>(undefined)

const ratingLabels: Record<number, string> = {
	1: 'Perlu banyak perbaikan',
	2: 'Cukup baik',
	3: 'Bagus dan bermanfaat',
	4: 'Sangat bagus dan inspiratif',
	5: 'Luar biasa, sangat memukau!'
}

const activeRatingLabel = computed(() => ratingLabels[rating.value] || '')

async function fetchReviews() {
	if (!props.project?.id) return
	try {
		loading.value = true
		errorMessage.value = null

		const data = await $fetch<{
			summary: ProjectReviewSummary
			reviews: ProjectReviewItem[]
			userReview: ProjectReviewItem | null
		}>(`/api/projects/${props.project.id}/reviews`)

		summary.value = data.summary
		reviews.value = data.reviews
		userReview.value = data.userReview

		if (data.userReview) {
			rating.value = data.userReview.rating
			comment.value = data.userReview.comment || ''
		} else {
			rating.value = 5
			comment.value = ''
		}
	} catch (err: unknown) {
		const res = err as { data?: { statusMessage?: string } }
		errorMessage.value = res.data?.statusMessage || 'Gagal memuat ulasan projek'
	} finally {
		loading.value = false
	}
}

watch(() => props.open, (val) => {
	if (val && props.project) {
		activeTab.value = 'write'
		fetchReviews()
	}
})

watch(() => props.project?.id, (newId) => {
	if (props.open && newId) fetchReviews()
})

async function handleSubmit() {
	if (!props.project?.id || !loggedIn.value) return
	if (rating.value < 1 || rating.value > 5) {
		toast.add({
			title: 'Rating Tidak Valid',
			description: 'Silakan pilih rating antara 1 hingga 5 bintang.',
			color: 'error'
		})
		return
	}

	try {
		submitting.value = true
		const res = await $fetch<{ success: boolean, message: string }>(`/api/projects/${props.project.id}/reviews`, {
			method: 'POST',
			body: {
				rating: rating.value,
				comment: comment.value.trim() || null
			}
		})

		toast.add({ title: 'Ulasan Disimpan', description: res.message, color: 'success' })
		await fetchReviews()
		emit('reviewed')
	} catch (err: unknown) {
		const res = err as { data?: { statusMessage?: string } }
		toast.add({
			title: 'Gagal Menyimpan Ulasan',
			description: res.data?.statusMessage || 'Terjadi kesalahan saat mengirim ulasan.',
			color: 'error'
		})
	} finally {
		submitting.value = false
	}
}

function askDelete(reviewId?: number) {
	pendingDeleteId.value = reviewId
	confirmDeleteOpen.value = true
}

async function confirmDelete() {
	if (!props.project?.id) return

	try {
		deleting.value = true
		const reviewId = pendingDeleteId.value
		const url = reviewId
			? `/api/projects/${props.project.id}/reviews?reviewId=${reviewId}`
			: `/api/projects/${props.project.id}/reviews`

		const res = await $fetch<{ success: boolean, message: string }>(url, { method: 'DELETE' })

		toast.add({ title: 'Ulasan Dihapus', description: res.message, color: 'neutral' })

		rating.value = 5
		comment.value = ''
		await fetchReviews()
		emit('reviewed')
	} catch (err: unknown) {
		const res = err as { data?: { statusMessage?: string } }
		toast.add({
			title: 'Gagal Menghapus Ulasan',
			description: res.data?.statusMessage || 'Terjadi kesalahan saat menghapus ulasan.',
			color: 'error'
		})
	} finally {
		deleting.value = false
		confirmDeleteOpen.value = false
	}
}

function formatDate(date: string | Date | undefined) {
	if (!date) return ''
	try {
		return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date))
	} catch {
		return ''
	}
}

function calculatePercentage(count: number, total: number) {
	if (!total) return 0
	return Math.round((count / total) * 100)
}
</script>

<template>
	<UModal
		v-model:open="isOpen"
		title="Ulasan & Rating Komunitas"
		:description="project ? `Projek: ${project.title}` : undefined"
		scrollable
		:ui="{ content: 'sm:max-w-2xl' }"
	>
		<template #body>
			<div
				v-if="loading"
				class="space-y-6"
			>
				<USkeleton class="h-28 w-full rounded-xl" />
				<USkeleton class="h-36 w-full rounded-xl" />
				<USkeleton class="h-44 w-full rounded-xl" />
			</div>

			<UAlert
				v-else-if="errorMessage"
				color="error"
				variant="subtle"
				icon="i-lucide-alert-circle"
				:title="errorMessage"
				:actions="[{ label: 'Coba Lagi', icon: 'i-lucide-rotate-cw', color: 'error', variant: 'subtle', onClick: fetchReviews }]"
			/>

			<div
				v-else
				class="space-y-5"
			>
				<!-- Score Summary -->
				<div class="rounded-xl border border-default p-4 sm:p-5 bg-elevated/40">
					<div class="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
						<div class="sm:col-span-4 flex flex-col items-center justify-center text-center sm:border-r border-default/70 sm:pr-4">
							<div class="text-4xl sm:text-5xl font-extrabold text-highlighted tracking-tight">
								{{ summary.totalReviews > 0 ? summary.averageRating.toFixed(1) : '0.0' }}
							</div>
							<UInputRating
								:model-value="Math.round(summary.averageRating)"
								icon="i-tabler-star-filled"
								empty-icon="i-tabler-star"
								readonly
								size="sm"
								class="my-2"
							/>
							<span class="text-xs text-muted">{{ summary.totalReviews }} ulasan komunitas</span>
						</div>

						<div class="sm:col-span-8 space-y-1.5">
							<div
								v-for="s in [5, 4, 3, 2, 1]"
								:key="s"
								class="flex items-center gap-2 text-xs"
							>
								<div class="flex items-center gap-1 w-12 text-muted font-medium">
									<span>{{ s }}</span>
									<UIcon
										name="i-lucide-star"
										class="w-3 h-3 text-amber-500 fill-amber-500"
									/>
								</div>
								<div class="flex-1 h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
									<div
										class="h-full bg-amber-500 rounded-full transition-all duration-300"
										:style="{ width: `${calculatePercentage(summary.distribution[s] || 0, summary.totalReviews)}%` }"
									/>
								</div>
								<span class="w-8 text-right text-muted tabular-nums">{{ summary.distribution[s] || 0 }}</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Tabs: Write vs List -->
				<UTabs
					v-model="activeTab"
					:items="[
						{ label: userReview ? 'Ubah Ulasan' : 'Tulis Ulasan', value: 'write', icon: 'i-lucide-pencil' },
						{ label: `Semua Ulasan (${reviews.length})`, value: 'list', icon: 'i-lucide-messages-square' }
					]"
				/>

				<!-- Write tab -->
				<div v-if="activeTab === 'write'">
					<div
						v-if="loggedIn"
						class="rounded-xl border border-default p-4 sm:p-5 space-y-4"
					>
						<div
							v-if="userReview"
							class="text-xs text-muted"
						>
							Terakhir diubah: {{ formatDate(userReview.updatedAt || userReview.createdAt) }}
						</div>

						<div class="space-y-2">
							<label class="block text-xs font-medium text-muted">Pilih Rating Bintang</label>
							<div class="flex items-center gap-2">
								<UInputRating
									v-model="rating"
									icon="i-tabler-star-filled"
									empty-icon="i-tabler-star"
									hoverable
									size="xl"
								/>
								<span
									v-if="activeRatingLabel"
									class="text-xs font-semibold text-highlighted"
								>{{ activeRatingLabel }}</span>
							</div>
						</div>

						<UFormField label="Ulasan Singkat (Opsional)">
							<template #hint>
								{{ comment.length }}/1000
							</template>
							<UTextarea
								v-model="comment"
								placeholder="Ceritakan pengalaman Anda, fitur favorit, atau saran pengembangan projek ini..."
								:rows="3"
								maxlength="1000"
								class="w-full"
							/>
						</UFormField>

						<div class="flex items-center justify-between gap-3 pt-2 border-t border-default/50">
							<UButton
								v-if="userReview"
								label="Hapus Ulasan"
								icon="i-lucide-trash-2"
								color="error"
								variant="ghost"
								size="sm"
								@click="askDelete()"
							/>
							<div
								v-else
								class="flex-1"
							/>

							<UButton
								:label="userReview ? 'Simpan Perubahan' : 'Kirim Ulasan'"
								icon="i-lucide-check-circle-2"
								color="primary"
								size="sm"
								:loading="submitting"
								@click="handleSubmit"
							/>
						</div>
					</div>

					<div
						v-else
						class="text-center py-6 space-y-3"
					>
						<div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
							<UIcon
								name="i-lucide-log-in"
								class="w-5 h-5"
							/>
						</div>
						<div class="max-w-md mx-auto">
							<h4 class="text-sm font-bold text-highlighted mb-1">
								Ingin Memberikan Rating atau Ulasan?
							</h4>
							<p class="text-xs text-muted leading-relaxed mb-4">
								Masuk dengan akun Majalengka Tech Anda untuk memberikan apresiasi bintang dan umpan balik langsung kepada pengembang projek.
							</p>
							<UButton
								label="Masuk Sekarang"
								icon="i-lucide-log-in"
								color="primary"
								to="/login"
								size="sm"
							/>
						</div>
					</div>
				</div>

				<!-- List tab -->
				<div
					v-else
					class="space-y-3"
				>
					<div
						v-if="reviews.length === 0"
						class="rounded-xl border border-dashed border-default p-8 text-center space-y-2"
					>
						<UIcon
							name="i-lucide-star-off"
							class="w-8 h-8 text-muted mx-auto opacity-50"
						/>
						<p class="text-sm font-semibold text-highlighted">
							Belum Ada Ulasan
						</p>
						<p class="text-xs text-muted max-w-sm mx-auto">
							Jadilah orang pertama yang memberikan bintang dan ulasan bermanfaat untuk pengembang projek ini.
						</p>
					</div>

					<div
						v-else
						class="space-y-3"
					>
						<div
							v-for="r in reviews"
							:key="r.id"
							class="p-4 rounded-xl border border-default/70 space-y-2.5"
						>
							<div class="flex items-start justify-between gap-3">
								<div class="flex items-center gap-2.5">
									<UAvatar
										:src="r.author?.avatarUrl || undefined"
										:alt="r.author?.name"
										size="sm"
									/>
									<div>
										<div class="flex items-center gap-1.5">
											<span class="text-xs font-bold text-highlighted">{{ r.author?.name }}</span>
											<UBadge
												v-if="r.author?.role === 'admin'"
												color="primary"
												variant="subtle"
												size="xs"
											>
												Admin
											</UBadge>
										</div>
										<span class="text-[11px] text-muted block">{{ formatDate(r.createdAt) }}</span>
									</div>
								</div>

								<div class="flex items-center gap-2">
									<UInputRating
										:model-value="r.rating"
										icon="i-tabler-star-filled"
										empty-icon="i-tabler-star"
										readonly
										size="xs"
									/>
									<UButton
										v-if="loggedIn && (user?.id === r.userId || (user as { role?: string })?.role === 'admin')"
										icon="i-lucide-trash-2"
										color="error"
										variant="ghost"
										size="xs"
										aria-label="Hapus ulasan ini"
										@click="askDelete(r.id)"
									/>
								</div>
							</div>

							<p
								v-if="r.comment"
								class="text-xs text-muted leading-relaxed pt-1"
							>
								{{ r.comment }}
							</p>
						</div>
					</div>
				</div>
			</div>
		</template>

		<template #footer>
			<div class="flex items-center justify-end w-full">
				<UButton
					label="Tutup"
					color="neutral"
					variant="subtle"
					size="sm"
					@click="isOpen = false"
				/>
			</div>
		</template>
	</UModal>

	<!-- Confirm delete modal -->
	<UModal
		v-model:open="confirmDeleteOpen"
		title="Hapus Ulasan?"
		description="Tindakan ini tidak dapat dibatalkan."
		:ui="{ content: 'sm:max-w-sm' }"
	>
		<template #footer>
			<div class="flex items-center justify-end gap-2 w-full">
				<UButton
					label="Batal"
					color="neutral"
					variant="subtle"
					size="sm"
					@click="confirmDeleteOpen = false"
				/>
				<UButton
					label="Hapus"
					color="error"
					size="sm"
					:loading="deleting"
					@click="confirmDelete"
				/>
			</div>
		</template>
	</UModal>
</template>
