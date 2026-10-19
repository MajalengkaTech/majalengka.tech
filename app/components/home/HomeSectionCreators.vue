<script setup lang="ts">
export interface CreatorItem {
	id?: string
	name?: string
	username: string | null
	avatarUrl?: string | null
}

const props = defineProps<{
	creators?: CreatorItem[]
}>()

const start = ref(0)
const total = 6 * 4
const creatorsList = useState<CreatorItem[]>('creators-grid', () => [])
const failedImages = ref<Record<string, boolean>>({})
const intersecting = ref(false)
const containerRef = useTemplateRef<HTMLElement>('container')
let _creators: CreatorItem[] = []
let currentTimeout: ReturnType<typeof setTimeout> | null = null

// Pengguna tanpa username belum punya halaman profil, jadi avatarnya tidak ditautkan.
const NuxtLink = resolveComponent('NuxtLink')
const creatorKey = (creator: CreatorItem) => creator.id || creator.username || ''
const creatorLabel = (creator: CreatorItem) => creator.username ? `@${creator.username}` : (creator.name || 'Kreator')

function onImageError(key: string) {
	failedImages.value[key] = true
}

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
		const res = await $fetch<{ creators: CreatorItem[] }>('/api/creators', { query: { limit: 100 } })
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
	if (!creatorsList.value.length) {
		return []
	}
	return creatorsList.value.slice(start.value, start.value + total)
})

function startTimer(ms = 5000) {
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
</script>

<template>
	<div
		ref="container"
		class="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-6 gap-4 sm:gap-8 lg:gap-6 xl:gap-8 xl:p-8"
		@mouseenter="stopTimer()"
		@mouseleave="startTimer(2500)"
	>
		<div
			v-for="(creator, index) in $contributors"
			:key="index"
			class="pt-[100%] relative"
		>
			<Transition
				name="avatar"
				mode="out-in"
			>
				<component
					:is="creator.username ? NuxtLink : 'div'"
					v-if="creator"
					:key="creatorKey(creator)"
					:to="creator.username ? `/${creator.username}` : undefined"
					class="absolute inset-0 flex transition-all hover:z-20"
					:style="{
						transitionDelay: `${((index % 8) + Math.floor(index / 8)) * 20}ms`
					}"
				>
					<UTooltip
						:text="creatorLabel(creator)"
						class="w-full"
					>
						<NuxtImg
							v-if="creator.avatarUrl && !failedImages[creatorKey(creator)]"
							:src="creator.avatarUrl"
							height="80"
							width="80"
							format="auto"
							:alt="creatorLabel(creator)"
							loading="lazy"
							:title="creatorLabel(creator)"
							class="rounded-xl w-full h-full object-cover transition lg:hover:scale-125 bg-muted"
							@error="onImageError(creatorKey(creator))"
						/>
						<!-- Fallback default icon user jika foto kosong atau gagal dimuat -->
						<div
							v-else
							class="rounded-xl w-full h-full flex items-center justify-center transition lg:hover:scale-125 bg-muted text-muted select-none"
						>
							<UIcon
								name="i-lucide-user"
								class="size-6 text-muted"
							/>
						</div>
					</UTooltip>
				</component>
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
