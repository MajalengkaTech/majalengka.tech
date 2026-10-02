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

function show(index: number) {
	activeIndex.value = index
}

function step(delta: number) {
	const total = props.images.length
	if (total < 2) return
	activeIndex.value = (activeIndex.value + delta + total) % total
}
</script>

<template>
	<section
		aria-label="Galeri karya"
		class="flex flex-col gap-3"
	>
		<div
			v-if="activeImage"
			class="group relative overflow-hidden rounded-md border border-default bg-elevated"
			tabindex="0"
			aria-roledescription="galeri"
			:aria-label="`Gambar ${activeIndex + 1} dari ${images.length}. Pakai panah kiri dan kanan untuk berpindah.`"
			@keydown.left.prevent="step(-1)"
			@keydown.right.prevent="step(1)"
		>
			<NuxtImg
				:key="activeImage.url"
				:src="activeImage.url"
				:alt="activeImage.alt || `Tampilan ${title}`"
				class="aspect-video w-full object-contain"
				sizes="640px md:100vw lg:960px"
				preset="galeri"
				:loading="activeIndex === 0 ? 'eager' : 'lazy'"
				:fetchpriority="activeIndex === 0 ? 'high' : 'auto'"
				:preload="activeIndex === 0 ? { fetchPriority: 'high' } : false"
			/>

			<template v-if="images.length > 1">
				<UButton
					icon="i-lucide-chevron-left"
					color="neutral"
					variant="solid"
					size="lg"
					class="absolute top-1/2 left-3 -translate-y-1/2 opacity-90"
					aria-label="Gambar sebelumnya"
					@click="step(-1)"
				/>
				<UButton
					icon="i-lucide-chevron-right"
					color="neutral"
					variant="solid"
					size="lg"
					class="absolute top-1/2 right-3 -translate-y-1/2 opacity-90"
					aria-label="Gambar berikutnya"
					@click="step(1)"
				/>
				<span class="absolute right-3 bottom-3 rounded-sm bg-inverted/80 px-2 py-0.5 text-xs font-medium text-inverted tabular-nums">
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
				Kreatornya belum menambahkan gambar untuk karya ini.
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
					loading="lazy"
				/>
			</button>
		</div>
	</section>
</template>
