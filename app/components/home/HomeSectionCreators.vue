<script setup lang="ts">
export interface CreatorItem {
	id?: string
	name?: string
	username: string
	avatarUrl?: string | null
}

const props = defineProps<{
	creators?: CreatorItem[]
}>()

const start = ref(0)
const total = 6 * 4
const creatorsList = useState<CreatorItem[]>('creators-grid', () => [])
const intersecting = ref(false)
const containerRef = useTemplateRef<HTMLElement>('container')
let _creators: CreatorItem[] = []
let currentTimeout: ReturnType<typeof setTimeout> | null = null

useIntersectionObserver(containerRef, ([entry]) => {
	const isVisible = entry?.isIntersecting ?? false
	intersecting.value = isVisible
	if (isVisible) {
		if (_creators.length) {
			creatorsList.value = _creators
		}
		startTimer()
	} else {
		stopTimer()
	}
})

onMounted(async () => {
	if (props.creators && props.creators.length) {
		_creators = [...props.creators]
		creatorsList.value = _creators
		return
	}

	if (creatorsList.value.length) return

	try {
		const res = await $fetch<{ creators: CreatorItem[] }>('/api/creators', { query: { limit: 48 } })
		if (res?.creators?.length) {
			_creators = res.creators
			if (intersecting.value) {
				creatorsList.value = _creators
			}
		}
	} catch {
		// Abaikan error fetch background
	}
})

watch(() => props.creators, (newVal) => {
	if (newVal && newVal.length) {
		_creators = [...newVal]
		creatorsList.value = _creators
	}
}, { immediate: true })

onBeforeUnmount(stopTimer)

const $contributors = computed(() => {
	const list = creatorsList.value
	if (!list.length) {
		return Array.from({ length: total }).fill(null) as (CreatorItem | null)[]
	}

	// Jika jumlah kreator >= 24, gunakan window slice
	if (list.length >= total) {
		return list.slice(start.value, start.value + total)
	}

	// Jika jumlah kreator < 24, isi 24 slot berulang secara harmonis
	const filled: CreatorItem[] = []
	let index = 0
	while (filled.length < total) {
		filled.push(list[index % list.length]!)
		index++
	}
	return filled
})

function startTimer(ms = 5000) {
	stopTimer()
	if (creatorsList.value.length <= total) return
	currentTimeout = setTimeout(nextContributors, ms)
}

function stopTimer() {
	if (currentTimeout) {
		clearTimeout(currentTimeout)
		currentTimeout = null
	}
}

function nextContributors() {
	const newStart = (start.value + total >= creatorsList.value.length ? 0 : start.value + total)
	start.value = newStart
	startTimer()
}

function getInitial(name?: string, username?: string) {
	const val = (name || username || '').trim()
	if (!val) return '?'
	const parts = val.split(/\s+/)
	if (parts.length >= 2 && parts[0] && parts[1]) {
		return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
	}
	return val.slice(0, 2).toUpperCase()
}
</script>

<template>
	<div
		ref="container"
		class="grid grid-cols-6 gap-3 sm:gap-4 md:grid-cols-8 lg:grid-cols-6 xl:gap-5"
		@mouseenter="stopTimer()"
		@mouseleave="startTimer(2500)"
	>
		<div
			v-for="(creator, index) in $contributors"
			:key="index"
			class="relative pt-[100%]"
		>
			<Transition
				name="avatar"
				mode="out-in"
			>
				<NuxtLink
					v-if="creator"
					:key="`${creator.username}-${index}`"
					:to="`/${creator.username}`"
					class="absolute inset-0 flex transition-all hover:z-20"
					:style="{
						transitionDelay: `${((index % 8) + Math.floor(index / 8)) * 20}ms`
					}"
				>
					<UTooltip
						:text="creator.name || `@${creator.username}`"
						class="size-full"
					>
						<div class="relative size-full overflow-hidden rounded-xl border border-default/40 bg-muted shadow-xs transition duration-300 hover:border-primary/50 hover:shadow-md lg:hover:scale-125">
							<NuxtImg
								v-if="creator.avatarUrl"
								:src="creator.avatarUrl"
								width="80"
								height="80"
								format="auto"
								:alt="creator.name || creator.username"
								loading="lazy"
								class="size-full bg-muted object-cover"
							/>
							<div
								v-else
								class="flex size-full items-center justify-center bg-primary/10 font-bold text-xs text-primary transition select-none sm:text-sm"
							>
								{{ getInitial(creator.name, creator.username) }}
							</div>
						</div>
					</UTooltip>
				</NuxtLink>

				<!-- Placeholder item saat belum termuat -->
				<div
					v-else
					:key="`empty-${index}`"
					class="absolute inset-0 rounded-xl border border-default/20 bg-muted/40"
				/>
			</Transition>
		</div>
	</div>
</template>

<style scoped>
.avatar-enter-active,
.avatar-leave-active {
	transition: all 0.4s ease;
}

.avatar-enter-from,
.avatar-leave-to {
	opacity: 0.1;
	transform: scale(0.5);
}
</style>
