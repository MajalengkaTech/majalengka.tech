<script setup lang="ts">
const props = defineProps<{
	username: string
}>()

const open = defineModel<boolean>('open', { default: false })
const toast = useToast()

const origin = useRequestURL().origin
const profileUrl = computed(() => `${origin}/@${props.username}`)
const cardUrl = computed(() => `${origin}/api/creators/${props.username}/card.png`)
const cardSvgUrl = computed(() => `${origin}/api/creators/${props.username}/card.svg`)

const markdown = computed(() => `[![Kartu Kreator @${props.username}](${cardUrl.value})](${profileUrl.value})`)
const htmlCode = computed(() => `<a href="${profileUrl.value}"><img src="${cardUrl.value}" alt="Kartu Kreator @${props.username}" width="600" /></a>`)

const activeTab = ref<'markdown' | 'html' | 'link'>('markdown')

async function copyText(text: string, title: string) {
	try {
		await navigator.clipboard.writeText(text)
		toast.add({
			title,
			description: 'Siap ditempel di profil GitHub atau website kamu.',
			color: 'success',
			icon: 'i-lucide-check'
		})
	} catch {
		toast.add({
			title: 'Teks belum tersalin',
			description: 'Browser menolak akses salin. Pilih teksnya, lalu salin secara manual.',
			color: 'error'
		})
	}
}

function downloadImage() {
	const a = document.createElement('a')
	a.href = cardUrl.value
	a.download = `kartu-${props.username}-majalengka-tech.png`
	a.target = '_blank'
	a.click()
}
</script>

<template>
	<UModal
		v-model:open="open"
		title="Pasang kartu di README GitHub"
		description="Tempel kode ini di README profil GitHub-mu. Angka proyek dan apresiasi di kartu ikut berubah setiap kali ada yang baru."
		:ui="{ content: 'sm:max-w-2xl' }"
	>
		<template #body>
			<div class="flex flex-col gap-5">
				<!-- Pratinjau Kartu Server Langsung -->
				<div class="relative overflow-hidden rounded-xl border border-neutral-800 bg-[#000033] shadow-md">
					<img
						:src="cardUrl"
						:alt="`Kartu Kreator @${username}`"
						width="1200"
						height="630"
						class="w-full aspect-[1200/630] object-cover"
						loading="lazy"
					>
				</div>

				<!-- Pilihan Tab Format -->
				<div class="flex gap-2 border-b border-neutral-800 pb-2">
					<UButton
						label="Markdown (README GitHub)"
						size="sm"
						:color="activeTab === 'markdown' ? 'primary' : 'neutral'"
						:variant="activeTab === 'markdown' ? 'solid' : 'ghost'"
						@click="activeTab = 'markdown'"
					/>
					<UButton
						label="HTML"
						size="sm"
						:color="activeTab === 'html' ? 'primary' : 'neutral'"
						:variant="activeTab === 'html' ? 'solid' : 'ghost'"
						@click="activeTab = 'html'"
					/>
					<UButton
						label="Link langsung"
						size="sm"
						:color="activeTab === 'link' ? 'primary' : 'neutral'"
						:variant="activeTab === 'link' ? 'solid' : 'ghost'"
						@click="activeTab = 'link'"
					/>
				</div>

				<!-- Kotak Kode -->
				<div
					v-if="activeTab === 'markdown'"
					class="flex flex-col gap-2"
				>
					<UTextarea
						:model-value="markdown"
						readonly
						:rows="3"
						class="font-mono text-xs"
					/>
					<div class="flex items-center justify-between gap-2">
						<ULink
							to="https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile/customizing-your-profile/managing-your-profile-readme"
							target="_blank"
							class="text-xs text-muted hover:underline flex items-center gap-1"
						>
							<UIcon
								name="i-lucide-external-link"
								class="size-3.5"
							/>
							Cara membuat README profil GitHub
						</ULink>
						<UButton
							label="Salin Markdown"
							icon="i-lucide-copy"
							size="sm"
							color="primary"
							@click="copyText(markdown, 'Kode Markdown tersalin')"
						/>
					</div>
				</div>

				<div
					v-else-if="activeTab === 'html'"
					class="flex flex-col gap-2"
				>
					<UTextarea
						:model-value="htmlCode"
						readonly
						:rows="3"
						class="font-mono text-xs"
					/>
					<div class="flex justify-end">
						<UButton
							label="Salin HTML"
							icon="i-lucide-copy"
							size="sm"
							color="primary"
							@click="copyText(htmlCode, 'Kode HTML tersalin')"
						/>
					</div>
				</div>

				<div
					v-else
					class="flex flex-col gap-3"
				>
					<div class="flex flex-col gap-1">
						<span class="text-xs text-muted">PNG, cocok untuk media sosial dan pratinjau link:</span>
						<div class="flex items-center gap-2">
							<UInput
								:model-value="cardUrl"
								readonly
								class="flex-1 font-mono text-xs"
							/>
							<UButton
								icon="i-lucide-copy"
								size="sm"
								color="neutral"
								variant="outline"
								@click="copyText(cardUrl, 'Link PNG tersalin')"
							/>
						</div>
					</div>
					<div class="flex flex-col gap-1">
						<span class="text-xs text-muted">SVG, tetap tajam di layar beresolusi tinggi:</span>
						<div class="flex items-center gap-2">
							<UInput
								:model-value="cardSvgUrl"
								readonly
								class="flex-1 font-mono text-xs"
							/>
							<UButton
								icon="i-lucide-copy"
								size="sm"
								color="neutral"
								variant="outline"
								@click="copyText(cardSvgUrl, 'Link SVG tersalin')"
							/>
						</div>
					</div>
				</div>

				<!-- Tombol Aksi Bawah -->
				<div class="flex flex-wrap items-center justify-between border-t border-neutral-800 pt-4 gap-2">
					<UButton
						label="Unduh PNG"
						icon="i-lucide-download"
						color="neutral"
						variant="outline"
						size="sm"
						@click="downloadImage"
					/>
					<UButton
						label="Tutup"
						color="neutral"
						variant="ghost"
						size="sm"
						@click="open = false"
					/>
				</div>
			</div>
		</template>
	</UModal>
</template>
