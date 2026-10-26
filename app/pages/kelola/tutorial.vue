<script setup lang="ts">
interface ReviewItem {
	id: number
	slug: string
	title: string
	summary: string | null
	level: TutorialLevel
	status: TutorialStatus
	reviewNote: string | null
	updatedAt: string | null
	publishedAt: string | null
	authorName: string | null
	authorUsername: string | null
	projectTitle: string | null
	isOwn: boolean
}

interface Reviewer {
	userId: string
	name: string | null
	username: string | null
	image: string | null
}

definePageMeta({
	layout: 'dashboard',
	middleware: [
		() => {
			const { user } = useUserSession()
			if (!user.value) return navigateTo('/login?redirect=/kelola/tutorial')
		}
	]
})
useSeoMeta({ title: 'Tinjau Tutorial', robots: 'noindex, nofollow' })

const toast = useToast()
const { user } = useUserSession()
const isAdmin = computed(() => (user.value as { role?: string } | null)?.role === 'admin')

type Tab = 'ditinjau' | 'terbit' | 'ditolak'
const tab = ref<Tab>('ditinjau')
const tabItems = [
	{ label: 'Menunggu', value: 'ditinjau' },
	{ label: 'Terbit', value: 'terbit' },
	{ label: 'Dikembalikan', value: 'ditolak' }
]

const { data, status, error, refresh } = await useFetch<{ tutorials: ReviewItem[] }>('/api/review/tutorials', {
	query: computed(() => ({ status: tab.value })),
	server: false
})
const items = computed(() => data.value?.tutorials ?? [])
const forbidden = computed(() => error.value?.statusCode === 403)

// Modal tinjauan: setujui (catatan opsional) atau kembalikan (catatan wajib, supaya penulis tahu apa yang diperbaiki).
const reviewTarget = ref<ReviewItem | null>(null)
const reviewAction = ref<'setujui' | 'tolak'>('setujui')
const reviewNote = ref('')
const reviewing = ref(false)
const reviewOpen = computed({
	get: () => Boolean(reviewTarget.value),
	set: (value: boolean) => {
		if (!value) reviewTarget.value = null
	}
})

function openReview(item: ReviewItem, action: 'setujui' | 'tolak') {
	reviewTarget.value = item
	reviewAction.value = action
	reviewNote.value = ''
}

async function submitReview() {
	const target = reviewTarget.value
	if (!target) return
	if (reviewAction.value === 'tolak' && !reviewNote.value.trim()) {
		toast.add({ title: 'Catatan belum diisi', description: 'Tulis apa yang perlu diperbaiki penulis.', color: 'warning' })
		return
	}
	reviewing.value = true
	try {
		const res = await $fetch<{ message: string }>(`/api/review/tutorials/${target.id}`, {
			method: 'POST',
			body: { action: reviewAction.value, note: reviewNote.value.trim() || null }
		})
		reviewTarget.value = null
		toast.add({ title: res.message, description: target.title, color: 'success' })
		await refresh()
	} catch (err: unknown) {
		const errorResponse = err as { data?: { statusMessage?: string } }
		toast.add({ title: 'Tinjauan belum tersimpan', description: errorResponse.data?.statusMessage || 'Coba lagi sebentar.', color: 'error' })
	} finally {
		reviewing.value = false
	}
}

// Kelola peninjau: khusus admin.
const { data: reviewerData, refresh: refreshReviewers, status: reviewersStatus } = useFetch<{ reviewers: Reviewer[] }>('/api/admin/tutorial-reviewers', {
	server: false,
	immediate: isAdmin.value
})
const reviewers = computed(() => reviewerData.value?.reviewers ?? [])
const newReviewer = ref('')
const addingReviewer = ref(false)
const removingId = ref<string | null>(null)

async function addReviewer() {
	if (!newReviewer.value.trim()) return
	addingReviewer.value = true
	try {
		const res = await $fetch<{ message: string }>('/api/admin/tutorial-reviewers', { method: 'POST', body: { username: newReviewer.value } })
		newReviewer.value = ''
		toast.add({ title: res.message, color: 'success' })
		await refreshReviewers()
	} catch (err: unknown) {
		const errorResponse = err as { data?: { statusMessage?: string } }
		toast.add({ title: 'Peninjau belum ditambahkan', description: errorResponse.data?.statusMessage || 'Coba lagi sebentar.', color: 'error' })
	} finally {
		addingReviewer.value = false
	}
}

async function removeReviewer(reviewer: Reviewer) {
	removingId.value = reviewer.userId
	try {
		await $fetch(`/api/admin/tutorial-reviewers/${reviewer.userId}`, { method: 'DELETE' })
		toast.add({ title: 'Peninjau dilepas', description: reviewer.username ? `@${reviewer.username}` : reviewer.name || '', color: 'success' })
		await refreshReviewers()
	} catch (err: unknown) {
		const errorResponse = err as { data?: { statusMessage?: string } }
		toast.add({ title: 'Peninjau belum dilepas', description: errorResponse.data?.statusMessage || 'Coba lagi sebentar.', color: 'error' })
	} finally {
		removingId.value = null
	}
}
</script>

<template>
	<UDashboardPanel
		id="kelola-tutorial"
		:ui="{ body: 'p-0 sm:p-0 gap-0 sm:gap-0' }"
	>
		<template #header>
			<UDashboardNavbar
				title="Tinjau Tutorial"
				:ui="{ root: 'border-b border-default' }"
			>
				<template #leading>
					<UDashboardSidebarCollapse />
				</template>
			</UDashboardNavbar>
			<UDashboardToolbar :ui="{ root: 'flex-wrap gap-y-2 py-2' }">
				<template #left>
					<UTabs
						v-model="tab"
						:items="tabItems"
						:content="false"
						size="sm"
						aria-label="Saring status tutorial"
					/>
				</template>
				<template #right>
					<p
						class="text-sm whitespace-nowrap text-muted"
						aria-live="polite"
					>
						{{ items.length }} tutorial
					</p>
				</template>
			</UDashboardToolbar>
		</template>

		<template #body>
			<div class="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
				<UAlert
					v-if="forbidden"
					color="neutral"
					variant="subtle"
					icon="i-lucide-lock"
					title="Halaman ini khusus peninjau tutorial"
					description="Pengelola situs bisa menjadikanmu peninjau. Sementara itu, kamu tetap bisa menulis tutorial sendiri."
					:actions="[{ label: 'Tutorial Saya', to: '/dashboard/tutorial', color: 'neutral', variant: 'outline' }]"
				/>

				<template v-else>
					<p class="text-sm text-muted">
						Baca pratinjaunya dulu, lalu setujui supaya terbit, atau kembalikan dengan catatan perbaikan. Tutorial milikmu sendiri ditinjau peninjau lain.
					</p>

					<div
						v-if="status === 'pending' && !items.length"
						class="flex flex-col gap-3"
					>
						<USkeleton
							v-for="n in 3"
							:key="n"
							class="h-20 w-full"
						/>
					</div>

					<UAlert
						v-else-if="error"
						color="error"
						variant="subtle"
						icon="i-lucide-cloud-off"
						title="Daftar tinjauan gagal dimuat"
						description="Server belum merespons. Coba muat ulang sebentar lagi."
						:actions="[{ label: 'Muat Ulang', icon: 'i-lucide-refresh-cw', color: 'error', variant: 'outline', onClick: () => refresh() }]"
					/>

					<UEmpty
						v-else-if="!items.length"
						:icon="tab === 'ditinjau' ? 'i-lucide-inbox' : 'i-lucide-archive'"
						:title="tab === 'ditinjau' ? 'Tidak ada tutorial yang menunggu tinjauan' : 'Belum ada tutorial di sini'"
						:description="tab === 'ditinjau' ? 'Tutorial yang dikirim penulis akan muncul di sini.' : 'Tutorial yang sudah kamu tinjau akan tersimpan di tab ini.'"
					/>

					<UPageCard
						v-else
						variant="subtle"
						:ui="{ container: 'p-0 sm:p-0 gap-y-0', wrapper: 'items-stretch' }"
					>
						<ul
							role="list"
							class="divide-y divide-default"
						>
							<li
								v-for="item in items"
								:key="item.id"
								class="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center sm:px-6"
							>
								<div class="min-w-0 flex-1">
									<p class="truncate font-semibold text-highlighted">
										{{ item.title }}
									</p>
									<p class="truncate text-sm text-muted">
										oleh {{ item.authorUsername ? `@${item.authorUsername}` : item.authorName }} · {{ TUTORIAL_LEVELS[item.level] }}
										<template v-if="item.projectTitle">
											· Proyek: {{ item.projectTitle }}
										</template>
										· {{ formatTanggal(item.updatedAt || item.publishedAt) }}
									</p>
									<p
										v-if="item.reviewNote"
										class="mt-1 text-sm text-default"
									>
										<span class="font-medium">Catatan:</span> {{ item.reviewNote }}
									</p>
								</div>
								<div class="flex flex-wrap items-center gap-2 lg:justify-end">
									<UButton
										label="Pratinjau"
										icon="i-lucide-eye"
										color="neutral"
										variant="outline"
										size="sm"
										:to="`/tutorial/${item.slug}`"
										target="_blank"
									/>
									<template v-if="tab === 'ditinjau'">
										<UTooltip
											:text="item.isOwn ? 'Tutorialmu sendiri ditinjau peninjau lain' : 'Terbitkan tutorial ini'"
										>
											<UButton
												label="Setujui"
												icon="i-lucide-check"
												size="sm"
												:disabled="item.isOwn"
												@click="openReview(item, 'setujui')"
											/>
										</UTooltip>
										<UButton
											label="Kembalikan"
											icon="i-lucide-undo-2"
											color="error"
											variant="ghost"
											size="sm"
											:disabled="item.isOwn"
											@click="openReview(item, 'tolak')"
										/>
									</template>
								</div>
							</li>
						</ul>
					</UPageCard>

					<UPageCard
						v-if="isAdmin"
						title="Peninjau tutorial"
						description="Selain admin, kreator di daftar ini juga bisa menyetujui atau mengembalikan tutorial."
						variant="subtle"
						class="mt-4"
					>
						<UForm
							:state="{ username: newReviewer }"
							class="flex flex-col gap-2 sm:flex-row"
							@submit="addReviewer"
						>
							<UInput
								v-model="newReviewer"
								icon="i-lucide-at-sign"
								placeholder="username kreator"
								aria-label="Username kreator yang dijadikan peninjau"
								class="w-full sm:w-72"
							/>
							<UButton
								type="submit"
								label="Jadikan Peninjau"
								icon="i-lucide-user-plus"
								:loading="addingReviewer"
								:disabled="!newReviewer.trim()"
							/>
						</UForm>

						<USkeleton
							v-if="reviewersStatus === 'pending' && !reviewers.length"
							class="h-12 w-full"
						/>
						<p
							v-else-if="!reviewers.length"
							class="text-sm text-muted"
						>
							Belum ada peninjau selain admin.
						</p>
						<ul
							v-else
							role="list"
							class="flex flex-col divide-y divide-default"
						>
							<li
								v-for="reviewer in reviewers"
								:key="reviewer.userId"
								class="flex items-center gap-3 py-2"
							>
								<UAvatar
									:src="avatarSrc(reviewer.image)"
									:alt="reviewer.name || ''"
									size="sm"
								/>
								<span class="min-w-0 flex-1 truncate text-sm text-highlighted">
									{{ reviewer.username ? `@${reviewer.username}` : reviewer.name }}
								</span>
								<UButton
									label="Lepas"
									color="error"
									variant="ghost"
									size="xs"
									:loading="removingId === reviewer.userId"
									@click="removeReviewer(reviewer)"
								/>
							</li>
						</ul>
					</UPageCard>
				</template>
			</div>

			<UModal
				v-model:open="reviewOpen"
				:title="reviewAction === 'setujui' ? 'Terbitkan tutorial ini?' : 'Kembalikan ke penulis?'"
				:description="reviewTarget ? reviewTarget.title : undefined"
			>
				<template #body>
					<UFormField
						:label="reviewAction === 'setujui' ? 'Catatan untuk penulis' : 'Apa yang perlu diperbaiki?'"
						:hint="reviewAction === 'setujui' ? 'Opsional' : 'Wajib'"
					>
						<UTextarea
							v-model="reviewNote"
							:rows="3"
							:maxlength="1000"
							autoresize
							:placeholder="reviewAction === 'setujui' ? 'Misalnya: Langkahnya jelas, terima kasih.' : 'Misalnya: Tambahkan cara memasang Rust sebelum langkah 2.'"
							class="w-full"
						/>
					</UFormField>
				</template>
				<template #footer>
					<div class="flex w-full justify-end gap-2">
						<UButton
							label="Batal"
							color="neutral"
							variant="outline"
							@click="reviewOpen = false"
						/>
						<UButton
							:label="reviewAction === 'setujui' ? 'Ya, Terbitkan' : 'Kembalikan'"
							:icon="reviewAction === 'setujui' ? 'i-lucide-check' : 'i-lucide-undo-2'"
							:color="reviewAction === 'setujui' ? 'primary' : 'error'"
							:loading="reviewing"
							@click="submitReview"
						/>
					</div>
				</template>
			</UModal>
		</template>
	</UDashboardPanel>
</template>
