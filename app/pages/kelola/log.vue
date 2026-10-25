<script setup lang="ts">
import type { TableColumn, TableRow } from '@nuxt/ui'

definePageMeta({
	layout: 'dashboard',
	middleware: [
		() => {
			const { user } = useUserSession()
			if (!user.value) {
				return navigateTo('/login?redirect=/kelola/log')
			}

			if ((user.value as { role?: string }).role !== 'admin') {
				return navigateTo('/dashboard')
			}
		}
	]
})

useSeoMeta({
	title: 'Log Aktivitas',
	robots: 'noindex, nofollow'
})

type JenisFilter = 'semua' | 'gagal' | 'masuk' | 'perubahan'

interface LogItem {
	id: string
	timestamp: string
	level: string
	method: string | null
	path: string | null
	status: number | null
	durationMs: number | null
	user: { id?: string, username?: string | null } | null
	target: Record<string, unknown> | null
	ip: string | null
	country: string | null
	userAgent: string | null
	error: string | null
}

const search = ref('')
const searchQuery = refDebounced(search, 300)
const jenis = ref<JenisFilter>('semua')
const jenisItems = [
	{ label: 'Semua', value: 'semua' },
	{ label: 'Gagal', value: 'gagal' },
	{ label: 'Masuk & daftar', value: 'masuk' },
	{ label: 'Perubahan data', value: 'perubahan' }
]

const { data, status: fetchStatus, error, refresh } = await useFetch<{ logs: LogItem[], nextCursor: string | null }>('/api/admin/logs', {
	key: 'admin-logs',
	query: computed(() => ({ jenis: jenis.value, q: searchQuery.value.trim() || undefined })),
	server: false
})

const expanded = ref<Record<string, boolean>>({})

// Halaman berikutnya ditambahkan di bawah; filter baru mengosongkan tambahan ini.
const olderLogs = ref<LogItem[]>([])
const olderCursor = ref<string | null | undefined>(undefined)
const loadingMore = ref(false)
const loadMoreError = ref(false)
watch(data, () => {
	olderLogs.value = []
	olderCursor.value = undefined
	expanded.value = {}
})

const logs = computed(() => [...(data.value?.logs || []), ...olderLogs.value])
const nextCursor = computed(() => olderCursor.value === undefined ? data.value?.nextCursor ?? null : olderCursor.value)
const isFiltering = computed(() => Boolean(searchQuery.value.trim()) || jenis.value !== 'semua')
const forbidden = computed(() => (error.value as { statusCode?: number } | null)?.statusCode === 403)

async function loadMore() {
	if (!nextCursor.value) return
	loadingMore.value = true
	loadMoreError.value = false
	try {
		const res = await $fetch<{ logs: LogItem[], nextCursor: string | null }>('/api/admin/logs', {
			query: { jenis: jenis.value, q: searchQuery.value.trim() || undefined, sebelum: nextCursor.value }
		})
		olderLogs.value.push(...res.logs)
		olderCursor.value = res.nextCursor
	} catch {
		loadMoreError.value = true
	} finally {
		loadingMore.value = false
	}
}

// Nama aksi dibaca dari method dan path, karena itulah yang tersimpan di setiap baris log.
const ACTIONS: [string, RegExp, string][] = [
	['POST', /^\/api\/auth\/sign-in/, 'Masuk'],
	['POST', /^\/api\/auth\/sign-up/, 'Mendaftar'],
	['POST', /^\/api\/auth\/sign-out/, 'Keluar'],
	['POST', /^\/api\/auth\/request-password-reset/, 'Minta reset kata sandi'],
	['POST', /^\/api\/auth\/reset-password/, 'Reset kata sandi'],
	['POST', /^\/api\/auth\/send-verification-email/, 'Minta email verifikasi'],
	['POST', /^\/api\/reports$/, 'Melaporkan konten'],
	['POST', /^\/api\/notifications\/read$/, 'Membaca notifikasi'],
	['PATCH', /^\/api\/admin\/reports\/\d+$/, 'Admin: status laporan'],
	['POST', /^\/api\/projects$/, 'Membuat proyek'],
	['PUT', /^\/api\/projects\/\d+\/images$/, 'Mengubah galeri proyek'],
	['PUT', /^\/api\/projects\/\d+$/, 'Mengubah proyek'],
	['DELETE', /^\/api\/projects\/\d+\/comments\/\d+$/, 'Menghapus komentar'],
	['DELETE', /^\/api\/projects\/\d+$/, 'Menghapus proyek'],
	['POST', /^\/api\/projects\/\d+\/comments$/, 'Menulis komentar'],
	['POST', /^\/api\/projects\/\d+\/like$/, 'Apresiasi proyek'],
	['POST', /^\/api\/upload/, 'Mengunggah gambar'],
	['PATCH', /^\/api\/user\/profile$/, 'Mengubah profil'],
	['POST', /^\/api\/user\/card/, 'Memperbarui kartu kreator'],
	['POST', /^\/api\/admin\/ban-user$/, 'Admin: status akun'],
	['POST', /^\/api\/admin\/set-role$/, 'Admin: peran akun'],
	['POST', /^\/api\/admin\/change-password$/, 'Admin: ganti kata sandi'],
	['DELETE', /^\/api\/admin\/user$/, 'Admin: hapus akun'],
	['POST', /^\/api\/admin\/projects\/\d+\/feature$/, 'Admin: Pilihan Kurator']
]

function actionLabel(log: LogItem) {
	const path = (log.path || '').split('?')[0] || ''
	const match = ACTIONS.find(([method, pattern]) => method === log.method && pattern.test(path))
	return match?.[2] ?? `${log.method ?? ''} ${path}`.trim()
}

// Warna dari status HTTP: evlog menandai penolakan biasa (401, 403) sebagai level error, padahal itu bukan kerusakan.
function statusColor(log: LogItem) {
	if (log.status === null) return log.level === 'error' || log.level === 'fatal' ? 'error' as const : 'neutral' as const
	if (log.status >= 500) return 'error' as const
	if (log.status >= 400) return 'warning' as const
	return 'success' as const
}

function targetText(target: LogItem['target']) {
	if (!target) return ''
	if (target.name) return `sasaran: ${target.name}`
	if (target.title) return `proyek: ${target.title}`
	if (target.projectId) return `proyek #${target.projectId}`
	return ''
}

// User agent dipendekkan jadi nama browser dan sistem operasi supaya baris log tetap terbaca.
function deviceText(userAgent: string | null) {
	if (!userAgent) return ''
	const browser = /Edg\//.test(userAgent) ? 'Edge' : /Chrome\//.test(userAgent) ? 'Chrome' : /Firefox\//.test(userAgent) ? 'Firefox' : /Safari\//.test(userAgent) ? 'Safari' : /curl|bot|spider|python|go-http/i.test(userAgent) ? 'Bot/skrip' : 'Lainnya'
	const os = /Android/.test(userAgent) ? 'Android' : /iPhone|iPad/.test(userAgent) ? 'iOS' : /Windows/.test(userAgent) ? 'Windows' : /Mac OS/.test(userAgent) ? 'macOS' : /Linux/.test(userAgent) ? 'Linux' : ''
	return os ? `${browser} di ${os}` : browser
}

// Untuk log, jam sampai detik lebih penting daripada tanggal saja.
const fullTimeFormatter = new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeStyle: 'medium' })
function waktuLengkap(value: string) {
	return fullTimeFormatter.format(new Date(value))
}

function userText(log: LogItem) {
	if (log.user?.username) return `@${log.user.username}`
	if (log.user?.id) return `akun ${log.user.id.slice(0, 6)}…`
	return 'Tanpa akun'
}

// Tabel
const columns: TableColumn<LogItem>[] = [
	{ id: 'expand', meta: { class: { th: 'w-10', td: 'w-10' } } },
	{ accessorKey: 'status', header: 'Status', meta: { class: { td: 'w-24' } } },
	{ id: 'aksi', header: 'Aksi', meta: { class: { td: 'whitespace-normal' } } },
	// Di layar sempit Pengguna dan IP disembunyikan supaya tabel tidak menggeser ke samping; isinya ada di detail baris.
	{ id: 'pengguna', header: 'Pengguna', meta: { class: { th: 'hidden md:table-cell', td: 'hidden md:table-cell' } } },
	{ id: 'ip', header: 'IP', meta: { class: { th: 'hidden lg:table-cell', td: 'hidden lg:table-cell' } } },
	// Di ponsel waktu pindah ke bawah nama aksi (lihat slot aksi), supaya tabel muat tanpa digeser.
	{ accessorKey: 'timestamp', header: 'Waktu', meta: { class: { th: 'hidden sm:table-cell text-right', td: 'hidden sm:table-cell text-right' } } }
]

// Beri warna latar tipis pada baris yang gagal.
const meta = {
	class: {
		tr: (row: TableRow<LogItem>) => {
			const color = statusColor(row.original)
			if (color === 'error') return 'bg-error/5'
			if (color === 'warning') return 'bg-warning/5'
			return ''
		}
	}
}
</script>

<template>
	<UDashboardPanel
		id="kelola-log"
		:ui="{ body: 'p-0 sm:p-0 gap-0 sm:gap-0' }"
	>
		<template #header>
			<UDashboardNavbar
				title="Log Aktivitas"
				:ui="{ root: 'border-b border-default' }"
			>
				<template #leading>
					<UDashboardSidebarCollapse />
				</template>
				<template #right>
					<UButton
						v-if="!forbidden"
						icon="i-lucide-refresh-cw"
						color="neutral"
						variant="ghost"
						aria-label="Muat ulang log"
						:loading="fetchStatus === 'pending'"
						@click="() => refresh()"
					/>
				</template>
			</UDashboardNavbar>
			<UDashboardToolbar
				v-if="!forbidden"
				:ui="{ root: 'flex-wrap gap-y-2 py-2' }"
			>
				<template #left>
					<UInput
						v-model="search"
						icon="i-lucide-search"
						placeholder="Cari alamat, username, atau IP"
						class="w-full sm:w-72"
						aria-label="Cari log"
					/>
				</template>
				<template #right>
					<UTabs
						v-model="jenis"
						:items="jenisItems"
						:content="false"
						size="sm"
						aria-label="Filter jenis log"
					/>
				</template>
			</UDashboardToolbar>
		</template>

		<template #body>
			<div class="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-4 sm:p-6 lg:p-8">
				<p class="text-sm text-muted">
					Catatan login, pendaftaran, perubahan data, dan error selama 14 hari terakhir. Kunjungan biasa yang berhasil tidak dicatat.
				</p>

				<UEmpty
					v-if="forbidden"
					icon="i-lucide-lock"
					title="Khusus Super Admin"
					description="Log aktivitas memuat IP dan perangkat semua pengunjung, jadi hanya akun yang terdaftar di NUXT_SUPER_ADMIN_IDS yang bisa membukanya."
				/>

				<UAlert
					v-else-if="error"
					color="error"
					variant="subtle"
					icon="i-lucide-cloud-off"
					title="Log gagal dimuat"
					description="Server belum merespons. Coba muat ulang sebentar lagi."
					:actions="[{ label: 'Muat Ulang', icon: 'i-lucide-refresh-cw', color: 'error', variant: 'outline', onClick: () => refresh() }]"
				/>

				<div
					v-else
					class="overflow-hidden rounded-lg border border-default"
				>
					<UTable
						v-model:expanded="expanded"
						:data="logs"
						:columns="columns"
						:meta="meta"
						:get-row-id="(row: LogItem) => row.id"
						:loading="fetchStatus === 'pending'"
						:ui="{ tr: 'data-[expanded=true]:bg-elevated/50' }"
						class="max-h-[70vh]"
						sticky
					>
						<!-- Tanpa slot ini tabel menampilkan keadaan kosong selama data masih dimuat. -->
						<template #loading>
							<p class="py-6 text-center text-sm text-muted">
								Memuat log aktivitas...
							</p>
						</template>

						<template #empty>
							<UEmpty
								icon="i-lucide-scroll-text"
								:title="isFiltering ? 'Tidak ada log yang cocok' : 'Belum ada aktivitas tercatat'"
								:description="isFiltering ? 'Coba kata kunci lain atau ganti filter jenis.' : 'Log muncul di sini setelah ada yang masuk, mendaftar, mengubah data, atau mendapat error.'"
							/>
						</template>

						<template #expand-cell="{ row }">
							<UButton
								color="neutral"
								variant="ghost"
								size="xs"
								square
								icon="i-lucide-chevron-down"
								:aria-label="row.getIsExpanded() ? 'Tutup detail' : 'Lihat detail'"
								:aria-expanded="row.getIsExpanded()"
								:ui="{ leadingIcon: ['transition-transform', row.getIsExpanded() ? 'rotate-180' : ''] }"
								@click="row.toggleExpanded()"
							/>
						</template>

						<template #status-cell="{ row }">
							<UBadge
								:label="row.original.status ? String(row.original.status) : row.original.level"
								:color="statusColor(row.original)"
								variant="subtle"
								size="sm"
							/>
						</template>

						<template #aksi-cell="{ row }">
							<p class="font-medium text-highlighted">
								{{ actionLabel(row.original) }}
							</p>
							<p
								v-if="targetText(row.original.target)"
								class="text-xs text-muted"
							>
								{{ targetText(row.original.target) }}
							</p>
							<time
								:datetime="row.original.timestamp"
								class="text-xs text-muted tabular-nums sm:hidden"
							>
								{{ waktuRelatif(row.original.timestamp) }}
							</time>
						</template>

						<template #pengguna-cell="{ row }">
							<span class="text-default">{{ userText(row.original) }}</span>
						</template>

						<template #ip-cell="{ row }">
							<span
								v-if="row.original.ip"
								class="font-mono text-xs"
							>
								{{ row.original.ip }}<template v-if="row.original.country"> ({{ row.original.country }})</template>
							</span>
							<span
								v-else
								class="text-muted"
							>-</span>
						</template>

						<template #timestamp-cell="{ row }">
							<time
								:datetime="row.original.timestamp"
								:title="waktuLengkap(row.original.timestamp)"
								class="text-xs text-muted tabular-nums"
							>
								{{ waktuRelatif(row.original.timestamp) }}
							</time>
						</template>

						<template #expanded="{ row }">
							<div class="space-y-3 p-2 text-sm">
								<p
									v-if="row.original.error"
									class="rounded-md bg-error/10 p-3 text-error"
								>
									{{ row.original.error }}
								</p>
								<dl class="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
									<div class="md:hidden">
										<dt class="text-xs text-muted">
											Pengguna
										</dt>
										<dd>{{ userText(row.original) }}</dd>
									</div>
									<div
										v-if="row.original.ip"
										class="lg:hidden"
									>
										<dt class="text-xs text-muted">
											IP
										</dt>
										<dd class="font-mono text-xs">
											{{ row.original.ip }}<template v-if="row.original.country">
												({{ row.original.country }})
											</template>
										</dd>
									</div>
									<div>
										<dt class="text-xs text-muted">
											Permintaan
										</dt>
										<dd class="break-all font-mono text-xs">
											{{ row.original.method }} {{ row.original.path }}
										</dd>
									</div>
									<div v-if="row.original.durationMs !== null">
										<dt class="text-xs text-muted">
											Durasi
										</dt>
										<dd>{{ row.original.durationMs }} ms</dd>
									</div>
									<div v-if="row.original.userAgent">
										<dt class="text-xs text-muted">
											Perangkat
										</dt>
										<dd>{{ deviceText(row.original.userAgent) }}</dd>
									</div>
									<div>
										<dt class="text-xs text-muted">
											Waktu lengkap
										</dt>
										<dd>{{ waktuLengkap(row.original.timestamp) }}</dd>
									</div>
								</dl>
							</div>
						</template>
					</UTable>
				</div>

				<UAlert
					v-if="loadMoreError"
					color="error"
					variant="subtle"
					icon="i-lucide-cloud-off"
					title="Log lama gagal dimuat"
					description="Server belum merespons. Coba lagi sebentar."
				/>
				<div
					v-if="nextCursor"
					class="flex justify-center"
				>
					<UButton
						label="Muat Log Lebih Lama"
						color="neutral"
						variant="outline"
						icon="i-lucide-chevrons-down"
						:loading="loadingMore"
						@click="loadMore"
					/>
				</div>
			</div>
		</template>
	</UDashboardPanel>
</template>
