<script setup lang="ts">
definePageMeta({
	layout: 'dashboard',
	middleware: [
		() => {
			const { user } = useUserSession()
			if (!user.value) {
				return navigateTo('/login?redirect=/kelola/laporan')
			}

			if ((user.value as { role?: string }).role !== 'admin') {
				return navigateTo('/dashboard')
			}
		}
	]
})

useSeoMeta({
	title: 'Laporan Konten',
	robots: 'noindex, nofollow'
})

interface ReportItem {
	id: number
	targetType: 'project' | 'comment'
	reason: string
	note: string | null
	status: 'baru' | 'selesai'
	createdAt: string
	resolvedAt: string | null
	commentId: number | null
	commentBody: string | null
	projectId: number | null
	projectTitle: string | null
	projectSlug: string | null
	ownerName: string | null
	ownerUsername: string | null
	reporterName: string | null
	reporterUsername: string | null
}

type StatusFilter = 'baru' | 'selesai'

const toast = useToast()
const status = ref<StatusFilter>('baru')
const statusItems = [
	{ label: 'Perlu ditinjau', value: 'baru' },
	{ label: 'Selesai', value: 'selesai' }
]

const { data, status: fetchStatus, error, refresh } = await useFetch<{ reports: ReportItem[] }>('/api/admin/reports', {
	key: 'admin-reports',
	query: computed(() => ({ status: status.value })),
	server: false
})

const reports = computed(() => data.value?.reports || [])

function reasonLabel(reason: string) {
	return REPORT_REASONS[reason as ReportReason] ?? reason
}

function targetLink(report: ReportItem) {
	if (!report.projectSlug) return undefined
	return report.targetType === 'comment' ? `/projek/${report.projectSlug}#judul-komentar` : `/projek/${report.projectSlug}`
}

async function afterChange() {
	await Promise.all([refresh(), refreshNuxtData('open-reports')])
}

function showError(title: string, err: unknown) {
	const errorResponse = err as { data?: { statusMessage?: string } }
	toast.add({ title, description: errorResponse.data?.statusMessage || 'Coba lagi sebentar.', color: 'error' })
}

const updatingId = ref<number | null>(null)

async function setStatus(report: ReportItem, next: StatusFilter) {
	updatingId.value = report.id
	try {
		const res = await $fetch<{ message: string }>(`/api/admin/reports/${report.id}`, {
			method: 'PATCH',
			body: { status: next }
		})
		toast.add({ title: res.message, color: 'success' })
		await afterChange()
	} catch (err: unknown) {
		showError('Status laporan belum berubah', err)
	} finally {
		updatingId.value = null
	}
}

// Menghapus konten ikut menghapus laporannya di server, jadi laporan itu hilang dari daftar.
const deleteTarget = ref<ReportItem | null>(null)
const deleteOpen = computed({
	get: () => Boolean(deleteTarget.value),
	set: (value: boolean) => {
		if (!value) deleteTarget.value = null
	}
})
const deleting = ref(false)

const deleteDescription = computed(() => {
	const target = deleteTarget.value
	if (!target) return undefined
	if (target.targetType === 'comment') {
		return `Komentar di ${target.projectTitle ?? 'proyek ini'} akan dihapus permanen.`
	}
	return `${target.projectTitle ?? 'Proyek ini'} milik ${target.ownerName ?? 'kreator'} akan dihapus permanen beserta gambar, apresiasi, dan komentarnya.`
})

async function deleteContent() {
	const target = deleteTarget.value
	if (!target?.projectId) return
	deleting.value = true
	try {
		const url = target.targetType === 'comment'
			? `/api/projects/${target.projectId}/comments/${target.commentId}`
			: `/api/projects/${target.projectId}`
		await $fetch(url, { method: 'DELETE' })
		deleteTarget.value = null
		toast.add({ title: target.targetType === 'comment' ? 'Komentar dihapus' : 'Proyek dihapus', color: 'success' })
		await afterChange()
	} catch (err: unknown) {
		showError('Konten belum terhapus', err)
	} finally {
		deleting.value = false
	}
}
</script>

<template>
	<UDashboardPanel
		id="kelola-laporan"
		:ui="{ body: 'p-0 sm:p-0 gap-0 sm:gap-0' }"
	>
		<template #header>
			<UDashboardNavbar
				title="Laporan Konten"
				:ui="{ root: 'border-b border-default' }"
			>
				<template #leading>
					<UDashboardSidebarCollapse />
				</template>
			</UDashboardNavbar>
			<UDashboardToolbar :ui="{ root: 'flex-wrap gap-y-2 py-2' }">
				<template #left>
					<UTabs
						v-model="status"
						:items="statusItems"
						:content="false"
						size="sm"
						aria-label="Filter status laporan"
					/>
				</template>
				<template #right>
					<p
						class="text-sm whitespace-nowrap text-muted"
						aria-live="polite"
					>
						{{ reports.length }} laporan
					</p>
				</template>
			</UDashboardToolbar>
		</template>

		<template #body>
			<div class="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
				<p class="text-sm text-muted">
					Laporan proyek dan komentar dari pengguna. Nama pelapor hanya terlihat di sini, tidak ditampilkan ke pemilik konten.
				</p>

				<div
					v-if="fetchStatus === 'pending' && !reports.length"
					class="flex flex-col gap-3"
				>
					<USkeleton
						v-for="n in 3"
						:key="n"
						class="h-28 w-full"
					/>
				</div>

				<UAlert
					v-else-if="error"
					color="error"
					variant="subtle"
					icon="i-lucide-cloud-off"
					title="Daftar laporan gagal dimuat"
					description="Server belum merespons. Coba muat ulang sebentar lagi."
					:actions="[{ label: 'Muat Ulang', icon: 'i-lucide-refresh-cw', color: 'error', variant: 'outline', onClick: () => refresh() }]"
				/>

				<UEmpty
					v-else-if="!reports.length"
					:icon="status === 'baru' ? 'i-lucide-shield-check' : 'i-lucide-archive'"
					:title="status === 'baru' ? 'Tidak ada laporan yang perlu ditinjau' : 'Belum ada laporan yang selesai'"
					:description="status === 'baru' ? 'Laporan baru dari pengguna akan muncul di sini.' : 'Laporan yang kamu tandai selesai akan tersimpan di sini.'"
				/>

				<ul
					v-else
					class="flex flex-col divide-y divide-default rounded-md border border-default"
				>
					<li
						v-for="report in reports"
						:key="report.id"
						class="flex flex-col gap-3 p-4 lg:flex-row lg:items-start"
					>
						<div class="flex min-w-0 flex-1 flex-col gap-2">
							<div class="flex flex-wrap items-center gap-1.5">
								<UBadge
									:label="report.targetType === 'comment' ? 'Komentar' : 'Proyek'"
									:icon="report.targetType === 'comment' ? 'i-lucide-message-circle' : 'i-lucide-folder'"
									color="neutral"
									variant="outline"
									size="sm"
								/>
								<UBadge
									:label="reasonLabel(report.reason)"
									color="warning"
									variant="subtle"
									size="sm"
								/>
								<time
									:datetime="report.createdAt"
									class="text-xs text-muted"
								>{{ waktuRelatif(report.createdAt) }}</time>
							</div>

							<p class="min-w-0 text-sm">
								<NuxtLink
									v-if="targetLink(report)"
									:to="targetLink(report)"
									target="_blank"
									class="rounded-sm font-semibold text-highlighted outline-primary/25 hover:text-primary focus-visible:outline-3"
								>
									{{ report.projectTitle }}
								</NuxtLink>
								<span
									v-else
									class="text-muted"
								>Proyek sudah dihapus</span>
								<span
									v-if="report.ownerName"
									class="text-muted"
								> · oleh {{ report.ownerName }}<template v-if="report.ownerUsername"> (@{{ report.ownerUsername }})</template></span>
							</p>

							<blockquote
								v-if="report.targetType === 'comment'"
								class="border-l-2 border-default pl-3 text-sm wrap-break-word whitespace-pre-line text-default"
							>
								{{ report.commentBody ?? 'Komentar sudah dihapus.' }}
							</blockquote>

							<p
								v-if="report.note"
								class="text-sm wrap-break-word text-default"
							>
								<span class="font-medium">Catatan pelapor:</span> {{ report.note }}
							</p>

							<p class="text-xs text-muted">
								Dilaporkan oleh {{ report.reporterName ?? 'akun yang sudah dihapus' }}<template v-if="report.reporterUsername">
									(@{{ report.reporterUsername }})
								</template>
								<template v-if="report.resolvedAt">
									· selesai {{ formatTanggal(report.resolvedAt) }}
								</template>
							</p>
						</div>

						<div class="flex flex-wrap items-center gap-2 lg:justify-end">
							<UButton
								v-if="report.status === 'baru'"
								icon="i-lucide-check"
								label="Tandai Selesai"
								color="neutral"
								variant="outline"
								size="sm"
								:loading="updatingId === report.id"
								@click="setStatus(report, 'selesai')"
							/>
							<UButton
								v-else
								icon="i-lucide-rotate-ccw"
								label="Buka Lagi"
								color="neutral"
								variant="outline"
								size="sm"
								:loading="updatingId === report.id"
								@click="setStatus(report, 'baru')"
							/>
							<UButton
								v-if="report.projectId && (report.targetType === 'project' || report.commentBody !== null)"
								icon="i-lucide-trash-2"
								:label="report.targetType === 'comment' ? 'Hapus Komentar' : 'Hapus Proyek'"
								color="error"
								variant="ghost"
								size="sm"
								@click="deleteTarget = report"
							/>
						</div>
					</li>
				</ul>
			</div>

			<UModal
				v-model:open="deleteOpen"
				:title="deleteTarget?.targetType === 'comment' ? 'Hapus komentar ini?' : 'Hapus proyek ini?'"
				:description="deleteDescription"
			>
				<template #footer>
					<div class="flex w-full justify-end gap-2">
						<UButton
							label="Batal"
							color="neutral"
							variant="outline"
							@click="deleteOpen = false"
						/>
						<UButton
							label="Ya, Hapus"
							icon="i-lucide-trash-2"
							color="error"
							:loading="deleting"
							@click="deleteContent"
						/>
					</div>
				</template>
			</UModal>
		</template>
	</UDashboardPanel>
</template>
