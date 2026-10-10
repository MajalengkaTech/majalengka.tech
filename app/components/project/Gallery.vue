<script setup lang="ts">
import type { ProjectImage } from '~/types/project'

const props = defineProps<{
	images: ProjectImage[]
	title: string
}>()

const activeIndex = ref(0)
const activeImage = computed(() => props.images[activeIndex.value] || props.images[0])

watch(() => props.images.length, () => {
	activeIndex.value = 0
})

const mainImage = useTemplateRef<{ $el?: HTMLElement }>('mainImage')

// Gambar baru masuk dengan fade singkat supaya pergantian terasa bersambung, bukan meloncat.
watch(activeIndex, async () => {
	if (!motionAllowed()) return
	await nextTick()
	const image = mainImage.value?.$el
	if (!image) return
	const anim = image.animate([
		{ opacity: 0, transform: 'scale(1.01)' },
		{ opacity: 1, transform: 'scale(1)' }
	], {
		duration: 300,
		easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
	})
	anim.onfinish = () => {
		image.style.removeProperty('opacity')
		image.style.removeProperty('transform')
	}
})

function show(index: number) {
	if (activeIndex.value === index) return
	activeIndex.value = index
}

function step(delta: number) {
	const total = props.images.length
	if (total < 2) return
	activeIndex.value = (activeIndex.value + delta + total) % total
}

// Prefetch seluruh gambar galeri di background agar perpindahan gambar instan tanpa jeda
onMounted(() => {
	if (import.meta.client && props.images.length > 1) {
		props.images.forEach((img, i) => {
			if (i === 0) return
			const prefetch = new Image()
			prefetch.src = img.url
		})
	}
})

// === Fitur Zoom (Lightbox) ===
const isZoomOpen = ref(false)
const isZoomedIn = ref(false)

function openZoom() {
	isZoomedIn.value = false
	isZoomOpen.value = true
}

function closeZoom() {
	isZoomOpen.value = false
	isZoomedIn.value = false
}

function toggleZoomScale() {
	isZoomedIn.value = !isZoomedIn.value
}

// Navigasi keyboard saat zoom terbuka
onKeyStroke('Escape', (e) => {
	if (isZoomOpen.value) {
		e.preventDefault()
		closeZoom()
	}
})

onKeyStroke('ArrowLeft', (e) => {
	if (isZoomOpen.value) {
		e.preventDefault()
		step(-1)
	}
})

onKeyStroke('ArrowRight', (e) => {
	if (isZoomOpen.value) {
		e.preventDefault()
		step(1)
	}
})
</script>

<template>
	<!-- Lebar mengikuti tinggi layar supaya gambar utama dan thumbnail muat tanpa menggulir di laptop. -->
	<section
		aria-label="Galeri proyek"
		class="mx-auto flex w-full max-w-[min(100%,64rem,calc((100svh-12rem)*16/9))] flex-col gap-3"
	>
		<div
			v-if="activeImage"
			class="group relative overflow-hidden rounded-md border border-default bg-elevated select-none"
			tabindex="0"
			aria-roledescription="galeri"
			:aria-label="`Gambar ${activeIndex + 1} dari ${images.length}. Klik untuk memperbesar.`"
			@keydown.left.prevent="step(-1)"
			@keydown.right.prevent="step(1)"
		>
			<NuxtImg
				ref="mainImage"
				:key="activeImage.url"
				:src="activeImage.url"
				:alt="activeImage.alt || `Tampilan ${title}`"
				class="aspect-video w-full object-contain cursor-zoom-in transition-transform duration-300 group-hover:scale-[1.01]"
				sizes="640px sm:768px md:960px lg:1024px"
				preset="galeri"
				placeholder
				:loading="activeIndex === 0 ? 'eager' : 'lazy'"
				:fetchpriority="activeIndex === 0 ? 'high' : 'auto'"
				:preload="activeIndex === 0 ? { fetchPriority: 'high' } : false"
				@click="openZoom"
			/>

			<!-- Tombol indikator Zoom di pojok gambar utama -->
			<button
				type="button"
				class="absolute top-3 right-3 z-20 inline-flex items-center gap-1.5 rounded-md bg-black/60 px-2.5 py-1 text-xs font-medium text-white shadow-sm backdrop-blur-sm transition-opacity duration-200 opacity-80 hover:opacity-100 cursor-pointer focus-visible:outline-2 focus-visible:outline-white"
				aria-label="Perbesar gambar"
				@click.stop="openZoom"
			>
				<UIcon
					name="i-lucide-zoom-in"
					class="size-3.5"
				/>
				<span>Perbesar</span>
			</button>

			<template v-if="images.length > 1">
				<UButton
					icon="i-lucide-chevron-left"
					color="neutral"
					variant="solid"
					size="lg"
					class="absolute top-1/2 left-3 -translate-y-1/2 opacity-90 z-20"
					aria-label="Gambar sebelumnya"
					@click.stop="step(-1)"
				/>
				<UButton
					icon="i-lucide-chevron-right"
					color="neutral"
					variant="solid"
					size="lg"
					class="absolute top-1/2 right-3 -translate-y-1/2 opacity-90 z-20"
					aria-label="Gambar berikutnya"
					@click.stop="step(1)"
				/>
				<span class="absolute right-3 bottom-3 rounded-sm bg-inverted/80 px-2 py-0.5 text-xs font-medium text-inverted tabular-nums z-20">
					{{ activeIndex + 1 }} / {{ images.length }}
				</span>
			</template>
		</div>

		<div
			v-else
			class="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-default bg-elevated px-6 text-center"
		>
			<UIcon
				name="i-lucide-image-off"
				class="size-8 text-muted"
			/>
			<p class="text-sm text-muted">
				Kreatornya belum menambahkan gambar untuk proyek ini.
			</p>
		</div>

		<div
			v-if="images.length > 1"
			class="flex gap-2 overflow-x-auto pb-1"
		>
			<button
				v-for="(image, index) in images"
				:key="image.url"
				type="button"
				class="relative aspect-video w-24 shrink-0 overflow-hidden rounded-sm border-2 outline-primary/25 transition-colors focus-visible:outline-3 sm:w-28"
				:class="index === activeIndex ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'"
				:aria-label="`Tampilkan gambar ${index + 1}`"
				:aria-pressed="index === activeIndex"
				@click="show(index)"
			>
				<NuxtImg
					:src="image.url"
					alt=""
					class="size-full object-cover"
					sizes="112px"
					preset="sampul"
					placeholder
					loading="lazy"
				/>
			</button>
		</div>

		<!-- Modal Lightbox / Zoom Fullscreen -->
		<Teleport to="body">
			<Transition
				enter-active-class="transition duration-200 ease-out"
				enter-from-class="opacity-0"
				enter-to-class="opacity-100"
				leave-active-class="transition duration-150 ease-in"
				leave-from-class="opacity-100"
				leave-to-class="opacity-0"
			>
				<div
					v-if="isZoomOpen && activeImage"
					class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4 backdrop-blur-md"
					role="dialog"
					aria-modal="true"
					:aria-label="`Perbesar tampilan ${title}`"
					@click="closeZoom"
				>
					<!-- Tombol Tutup di pojok kanan atas -->
					<div class="absolute top-4 right-4 z-50 flex items-center gap-2">
						<button
							type="button"
							class="inline-flex size-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white"
							:aria-label="isZoomedIn ? 'Perkecil zoom' : 'Perbesar detail'"
							@click.stop="toggleZoomScale"
						>
							<UIcon
								:name="isZoomedIn ? 'i-lucide-zoom-out' : 'i-lucide-zoom-in'"
								class="size-5"
							/>
						</button>
						<button
							type="button"
							class="inline-flex size-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white"
							aria-label="Tutup pratinjau"
							@click.stop="closeZoom"
						>
							<UIcon
								name="i-lucide-x"
								class="size-5"
							/>
						</button>
					</div>

					<!-- Kontainer Gambar Zoom -->
					<div
						class="relative flex max-h-[85vh] max-w-[95vw] items-center justify-center overflow-auto"
						@click.stop
					>
						<img
							:src="activeImage.url"
							:alt="activeImage.alt || title"
							class="max-h-[85vh] max-w-[95vw] rounded-md object-contain transition-transform duration-300 select-none shadow-2xl"
							:class="isZoomedIn ? 'scale-150 cursor-zoom-out' : 'scale-100 cursor-zoom-in'"
							@click="toggleZoomScale"
						>

						<!-- Tombol navigasi prev & next di dalam modal zoom -->
						<template v-if="images.length > 1">
							<button
								type="button"
								class="absolute top-1/2 left-2 -translate-y-1/2 inline-flex size-11 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-white"
								aria-label="Gambar sebelumnya"
								@click.stop="step(-1)"
							>
								<UIcon
									name="i-lucide-chevron-left"
									class="size-6"
								/>
							</button>
							<button
								type="button"
								class="absolute top-1/2 right-2 -translate-y-1/2 inline-flex size-11 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-white"
								aria-label="Gambar berikutnya"
								@click.stop="step(1)"
							>
								<UIcon
									name="i-lucide-chevron-right"
									class="size-6"
								/>
							</button>
						</template>
					</div>

					<!-- Keterangan & Indikator di bagian bawah modal -->
					<div
						class="absolute bottom-4 flex flex-col items-center gap-1 text-center"
						@click.stop
					>
						<p
							v-if="activeImage?.alt"
							class="max-w-xl text-sm font-medium text-white/90"
						>
							{{ activeImage?.alt }}
						</p>
						<span
							v-if="images.length > 1"
							class="rounded-full bg-white/10 px-3 py-0.5 text-xs font-medium text-white/80 tabular-nums backdrop-blur-sm"
						>
							{{ activeIndex + 1 }} dari {{ images.length }}
						</span>
					</div>
				</div>
			</Transition>
		</Teleport>
	</section>
</template>
