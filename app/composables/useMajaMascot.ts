// Perilaku maskot Maja, diadaptasi dari useNuxiIcon di nuxt.com: wajah mengikuti kursor dengan lerp, ekspresi
// berpindah dengan transisi pegas, kedip/kedipan sebelah/lirikan acak, tertidur bila didiamkan, dan easter egg
// (hover 4x, klik 2x/4x, ketik "maja" atau "hi"), tanpa animasi berputar. Squash & stretch memakai Web Animations API.
export type MajaMood = 'idle' | 'happy' | 'excited' | 'thinking' | 'surprised' | 'sleeping' | 'sad' | 'confused'

type LookDir = 'center' | 'left' | 'right' | 'up'
type MouthShape = 'default' | 'open' | 'O' | 'wavy' | 'flat' | 'wobble'

interface MoodVisual {
	showSmile: boolean
	showSquint?: boolean
	mouthShape: MouthShape
	eyeLeftScaleY: number
	eyeLeftScaleX: number
	eyeRightScaleY: number
	eyeRightScaleX: number
	eyeTranslateY: number
	eyeRightRotate?: number
	mouthScale: number
	mouthTY: number
	blinkEnabled: boolean
}

const PROXIMITY_RADIUS = 400
const LERP_FACTOR = 0.1
const MAX_OFFSET = 7

const LOOK_OFFSETS: Record<LookDir, { x: number, y: number }> = {
	center: { x: 0, y: 0 },
	left: { x: -6, y: 1 },
	right: { x: 6, y: 1 },
	up: { x: 0, y: -5 }
}

export const MAJA_PATHS = {
	smileLeft: 'M175 90 Q183 78 191 90',
	smileRight: 'M209 90 Q217 78 225 90',
	squintLeft: 'M177 79 L190 86 L177 93',
	squintRight: 'M223 79 L210 86 L223 93'
}

const MOUTH_PATHS: Record<MouthShape, string> = {
	default: 'M191 106 Q200 114 209 106',
	open: 'M188 103 Q200 103 212 103 Q210 120 200 120 Q190 120 188 103Z',
	O: 'M194 110 a6 7 0 1 0 12 0 a6 7 0 1 0 -12 0Z',
	wavy: 'M189 110 Q194.5 104 200 109 T211 108',
	flat: 'M193 109 L207 109',
	wobble: 'M192 110 Q196 105 200 109 Q204 113 208 108'
}

const MOUTH_STROKED: Record<MouthShape, boolean> = { default: true, open: false, O: false, wavy: true, flat: true, wobble: true }

/* eslint-disable @stylistic/key-spacing, @stylistic/no-multi-spaces -- tabel supaya mudah dibandingkan */
const MOOD_VISUALS: Record<MajaMood, MoodVisual> = {
	idle:      { showSmile: false, eyeLeftScaleY: 1,    eyeLeftScaleX: 1,    eyeRightScaleY: 1,    eyeRightScaleX: 1,    eyeTranslateY: 0,  mouthShape: 'default', mouthScale: 1,    mouthTY: 0, blinkEnabled: true },
	happy:     { showSmile: true,  eyeLeftScaleY: 0.02, eyeLeftScaleX: 0.5,  eyeRightScaleY: 0.02, eyeRightScaleX: 0.5,  eyeTranslateY: -2, mouthShape: 'default', mouthScale: 1.3,  mouthTY: 1, blinkEnabled: false },
	excited:   { showSmile: false, eyeLeftScaleY: 1.1,  eyeLeftScaleX: 1.05, eyeRightScaleY: 1.1,  eyeRightScaleX: 1.05, eyeTranslateY: 0,  mouthShape: 'open',    mouthScale: 1.1,  mouthTY: 1, blinkEnabled: false },
	thinking:  { showSmile: false, eyeLeftScaleY: 0.55, eyeLeftScaleX: 0.9,  eyeRightScaleY: 0.55, eyeRightScaleX: 0.9,  eyeTranslateY: 0,  mouthShape: 'flat',    mouthScale: 0.7,  mouthTY: 1, blinkEnabled: false },
	sleeping:  { showSmile: false, eyeLeftScaleY: 0.12, eyeLeftScaleX: 1.1,  eyeRightScaleY: 0.12, eyeRightScaleX: 1.1,  eyeTranslateY: 2,  mouthShape: 'flat',    mouthScale: 0.5,  mouthTY: 1, blinkEnabled: false },
	surprised: { showSmile: false, eyeLeftScaleY: 1.18, eyeLeftScaleX: 1.08, eyeRightScaleY: 1.18, eyeRightScaleX: 1.08, eyeTranslateY: -2, mouthShape: 'O',       mouthScale: 1,    mouthTY: 1, blinkEnabled: false },
	sad:       { showSmile: false, showSquint: true, eyeLeftScaleY: 0.02, eyeLeftScaleX: 0.5, eyeRightScaleY: 0.02, eyeRightScaleX: 0.5, eyeTranslateY: 0, mouthShape: 'wobble', mouthScale: 1.1, mouthTY: 1, blinkEnabled: false },
	confused:  { showSmile: false, eyeLeftScaleY: 1.05, eyeLeftScaleX: 1,    eyeRightScaleY: 0.5,  eyeRightScaleX: 0.95, eyeTranslateY: 1,  eyeRightRotate: -10, mouthShape: 'wavy', mouthScale: 0.9, mouthTY: 1, blinkEnabled: false }
}
/* eslint-enable @stylistic/key-spacing, @stylistic/no-multi-spaces */

const SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)'

export function useMajaMascot(props: { mood?: MajaMood, interactive?: boolean }) {
	const svgEl = ref<SVGSVGElement>()
	const bodyEl = ref<SVGGElement>()
	const reducedMotion = usePreferredReducedMotion()
	const animate = computed(() => props.interactive !== false && reducedMotion.value !== 'reduce')

	const internalMood = ref<MajaMood>('idle')
	const isHovered = ref(false)
	const isInProximity = ref(false)
	const lookDir = ref<LookDir>('center')
	const isBlinking = ref(false)
	const isWinking = ref(false)
	const isEggPlaying = ref(false)

	const effectiveMood = computed<MajaMood>(() => {
		// Kaget saat dibangunkan tampil dulu sebelum ekspresi hover.
		if (internalMood.value === 'surprised' && !props.mood) return 'surprised'
		if (isHovered.value && animate.value) return 'excited'
		return props.mood ?? internalMood.value
	})

	function setInternalMood(mood: MajaMood, duration?: number) {
		internalMood.value = mood
		if (duration) {
			setTimeout(() => {
				if (internalMood.value === mood) internalMood.value = 'idle'
			}, duration)
		}
	}

	const rawOffset = reactive({ x: 0, y: 0 })
	const lerped = reactive({ x: 0, y: 0 })

	const targetOffset = computed(() => {
		const mood = effectiveMood.value
		if (mood === 'sleeping') return { x: 0, y: 2 }
		if (mood === 'thinking') return { x: 4, y: -4 }
		if (mood === 'surprised') return { x: 0, y: -4 }
		if (mood === 'excited') return { x: 0, y: -3 }
		if (mood === 'sad') return { x: 0, y: 2 }
		if (mood === 'confused') return { x: -3, y: -2 }
		const baseY = mood === 'happy' ? -2 : 0
		if (isInProximity.value) return { x: rawOffset.x, y: baseY + rawOffset.y }
		const look = LOOK_OFFSETS[lookDir.value]
		return { x: look.x, y: baseY + look.y }
	})

	const { resume: startLerp, pause: stopLerp } = useRafFn(() => {
		const target = targetOffset.value
		lerped.x += (target.x - lerped.x) * LERP_FACTOR
		lerped.y += (target.y - lerped.y) * LERP_FACTOR
	}, { immediate: false })

	const faceTransform = computed(() => {
		if (!animate.value) {
			const target = targetOffset.value
			return `translate(${target.x}px, ${target.y}px)`
		}
		return `translate(${lerped.x}px, ${lerped.y}px)`
	})

	const visual = computed(() => MOOD_VISUALS[effectiveMood.value])
	const smileOpacity = computed(() => visual.value.showSmile ? 1 : 0)
	const squintOpacity = computed(() => visual.value.showSquint ? 1 : 0)
	const mouthD = computed(() => MOUTH_PATHS[visual.value.mouthShape])
	const mouthStroked = computed(() => MOUTH_STROKED[visual.value.mouthShape])

	const eyeLeftTransform = computed(() => {
		const v = visual.value
		const scaleY = isWinking.value || isBlinking.value ? 0.05 : v.eyeLeftScaleY
		return `translateY(${v.eyeTranslateY}px) scale(${v.eyeLeftScaleX}, ${scaleY})`
	})
	const eyeRightTransform = computed(() => {
		const v = visual.value
		const scaleY = isBlinking.value ? 0.05 : v.eyeRightScaleY
		return `translateY(${v.eyeTranslateY}px) rotate(${v.eyeRightRotate ?? 0}deg) scale(${v.eyeRightScaleX}, ${scaleY})`
	})
	const eyeLeftTransition = computed(() => !animate.value ? 'none' : (isBlinking.value || isWinking.value) ? 'transform 0.06s ease' : `transform 0.4s ${SPRING}`)
	const eyeRightTransition = computed(() => !animate.value ? 'none' : isBlinking.value ? 'transform 0.06s ease 0.04s' : `transform 0.4s ${SPRING} 0.04s`)

	const mouthTransform = computed(() => {
		const v = visual.value
		let scale = v.mouthScale
		let ty = v.mouthTY
		let rotate = 0
		if (animate.value && isInProximity.value && effectiveMood.value !== 'sleeping' && effectiveMood.value !== 'thinking') {
			const proximity = Math.hypot(lerped.x, lerped.y) / MAX_OFFSET
			scale += proximity * 0.1
			ty += proximity
			rotate = lerped.x * 0.8
		}
		return `scale(${scale}) translateY(${ty}px) rotate(${rotate}deg)`
	})

	// Squash & stretch: rangkaian keyframe pada <g> badan, berurutan.
	async function play(steps: { frames: Keyframe | Keyframe[], duration: number, easing?: string }[]) {
		const el = bodyEl.value
		if (!el || isEggPlaying.value || !animate.value) return
		isEggPlaying.value = true
		try {
			for (const step of steps) {
				const frames = Array.isArray(step.frames) ? step.frames : [step.frames]
				const animation = el.animate(frames, { duration: step.duration * 1000, easing: step.easing ?? 'ease-out', fill: 'forwards' })
				await animation.finished
				animation.commitStyles()
				animation.cancel()
			}
		} catch {
			// Animasi dibatalkan karena komponen dilepas; tidak perlu ditangani.
		} finally {
			el.style.transform = ''
			isEggPlaying.value = false
		}
	}

	const t = (x = 1, y = 1, ty = 0, rotate = 0) => ({ transform: `translateY(${ty}px) rotate(${rotate}deg) scale(${x}, ${y})` })

	const doNudge = () => play([
		{ frames: t(1.04, 0.94, 2), duration: 0.1, easing: 'ease-in' },
		{ frames: t(0.96, 1.06, -8, 3), duration: 0.15 },
		{ frames: t(1.02, 0.98, 1, -2), duration: 0.12, easing: 'ease-in' },
		{ frames: t(), duration: 0.2, easing: SPRING }
	])
	const doDance = () => play([
		{ frames: t(1.06, 0.88, 4), duration: 0.08, easing: 'ease-in' },
		{ frames: t(0.9, 1.14, -16, 8), duration: 0.15 },
		{ frames: t(1.08, 0.9, 3), duration: 0.1, easing: 'ease-in' },
		{ frames: t(0.9, 1.14, -16, -8), duration: 0.15 },
		{ frames: t(1.08, 0.9, 3), duration: 0.1, easing: 'ease-in' },
		{ frames: t(), duration: 0.15, easing: SPRING }
	])
	const doWobble = () => play([
		{ frames: t(1, 1, -2, 18), duration: 0.06, easing: 'ease-in' },
		{ frames: t(1, 1, -2, -18), duration: 0.06, easing: 'ease-in' },
		{ frames: t(1, 1, -2, 12), duration: 0.06, easing: 'ease-in' },
		{ frames: t(1, 1, -2, -12), duration: 0.06, easing: 'ease-in' },
		{ frames: t(1, 1, -2, 6), duration: 0.06, easing: 'ease-in' },
		{ frames: t(), duration: 0.15, easing: SPRING }
	])
	const doDizzy = () => play([
		{ frames: [t(), t(1.04, 0.97, -3, -8), t(0.97, 1.03, -5, 12), t(1.03, 0.98, -2, -6), t(0.98, 1.02, -4, 8), t(1.01, 0.99, -1, -3), t()], duration: 0.8, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
	])

	const timers = new Set<ReturnType<typeof setTimeout>>()
	function later(fn: () => void, ms: number) {
		const id = setTimeout(() => {
			timers.delete(id)
			fn()
		}, ms)
		timers.add(id)
		return id
	}

	function scheduleLook() {
		later(() => {
			if ((effectiveMood.value === 'idle' || effectiveMood.value === 'happy') && !isInProximity.value) {
				const dirs: LookDir[] = ['center', 'center', 'left', 'right', 'up']
				lookDir.value = dirs[Math.floor(Math.random() * dirs.length)]!
				later(() => {
					lookDir.value = 'center'
				}, 600 + Math.random() * 500)
			}
			scheduleLook()
		}, 2000 + Math.random() * 3000)
	}

	function scheduleBlink() {
		later(() => {
			if (visual.value.blinkEnabled && !isWinking.value) {
				isBlinking.value = true
				later(() => (isBlinking.value = false), 110)
				if (Math.random() < 0.1) {
					later(() => {
						isBlinking.value = true
						later(() => (isBlinking.value = false), 80)
					}, 200)
				}
			}
			scheduleBlink()
		}, 2200 + Math.random() * 3800)
	}

	function scheduleWink() {
		later(() => {
			if (effectiveMood.value === 'idle' || effectiveMood.value === 'happy') {
				isWinking.value = true
				later(() => (isWinking.value = false), 250)
			}
			scheduleWink()
		}, 15000 + Math.random() * 10000)
	}

	let attentionTimer: ReturnType<typeof setTimeout> | undefined
	function scheduleAttention() {
		if (attentionTimer) clearTimeout(attentionTimer)
		attentionTimer = setTimeout(async () => {
			if (effectiveMood.value === 'idle' && !props.mood) await doNudge()
			scheduleAttention()
		}, 12000 + Math.random() * 8000)
	}

	let sleepTimer: ReturnType<typeof setTimeout> | undefined
	// Tertidur setelah 8 detik tanpa gerakan kursor (permintaan pemilik: diam lama berarti tidur).
	function resetSleepTimer() {
		if (sleepTimer) clearTimeout(sleepTimer)
		if (props.mood) return
		sleepTimer = setTimeout(() => {
			if (!isHovered.value && internalMood.value === 'idle' && !props.mood) setInternalMood('sleeping')
		}, 8000)
	}

	let lastX = 0
	let lastY = 0
	let pointerSpeed = 0
	function onPointerMove(event: PointerEvent) {
		pointerSpeed = Math.hypot(event.clientX - lastX, event.clientY - lastY)
		lastX = event.clientX
		lastY = event.clientY
		if (internalMood.value !== 'sleeping') resetSleepTimer()
		if (!svgEl.value || isHovered.value) return
		const rect = svgEl.value.getBoundingClientRect()
		const dx = event.clientX - (rect.left + rect.width / 2)
		const dy = event.clientY - (rect.top + rect.height / 2)
		const distance = Math.hypot(dx, dy)
		if (distance < PROXIMITY_RADIUS && distance > 1) {
			const strength = ((PROXIMITY_RADIUS - distance) / PROXIMITY_RADIUS) * MAX_OFFSET
			rawOffset.x = (dx / distance) * strength
			rawOffset.y = (dy / distance) * strength
			isInProximity.value = true
			if (internalMood.value === 'sleeping' && !props.mood) {
				setInternalMood('surprised', 1200)
				later(resetSleepTimer, 1300)
			}
			scheduleAttention()
		} else if (isInProximity.value) {
			isInProximity.value = false
			rawOffset.x = 0
			rawOffset.y = 0
			if (sleepTimer) clearTimeout(sleepTimer)
		}
	}

	const keyBuffer: string[] = []
	function onKeyDown(event: KeyboardEvent) {
		const target = event.target as HTMLElement | null
		if (!target || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
		keyBuffer.push(event.key.toLowerCase())
		if (keyBuffer.length > 5) keyBuffer.shift()
		const typed = keyBuffer.join('')
		const trigger = (fn: () => void) => {
			fn()
			keyBuffer.length = 0
		}
		if (typed.endsWith('maja')) trigger(doDance)
		else if (typed.endsWith('hi')) {
			setInternalMood('happy', 2000)
			trigger(doNudge)
		}
	}

	let clickCount = 0
	let clickReset: ReturnType<typeof setTimeout> | undefined
	function onClick(event: MouseEvent) {
		if (!animate.value) return
		clickCount++
		if (clickReset) clearTimeout(clickReset)
		clickReset = setTimeout(() => (clickCount = 0), 500)
		if (clickCount === 2) {
			isWinking.value = true
			later(() => (isWinking.value = false), 300)
		} else if (clickCount >= 4) {
			event.stopPropagation()
			doWobble()
			clickCount = 0
		}
	}

	let hoverCount = 0
	let hoverReset: ReturnType<typeof setTimeout> | undefined
	function onPointerEnter() {
		if (!animate.value) return
		// Dibangunkan dengan kaget, lalu lanjut bersemangat selama kursor di atasnya.
		if (internalMood.value === 'sleeping' && !props.mood) {
			setInternalMood('surprised', 700)
		}
		isHovered.value = true
		hoverCount++
		if (hoverReset) clearTimeout(hoverReset)
		hoverReset = setTimeout(() => (hoverCount = 0), 2000)
		if (hoverCount >= 4) {
			doDance()
			hoverCount = 0
		}
		scheduleAttention()
	}

	function onPointerLeave() {
		isHovered.value = false
		if (animate.value && pointerSpeed > 60 && Math.random() < 0.4) doDizzy()
	}

	let started = false
	function start() {
		if (started || !animate.value) return
		started = true
		window.addEventListener('pointermove', onPointerMove, { passive: true })
		window.addEventListener('keydown', onKeyDown)
		scheduleLook()
		scheduleBlink()
		scheduleWink()
		scheduleAttention()
		resetSleepTimer()
		startLerp()
	}

	onMounted(start)
	// Preferensi reduced motion bisa baru terbaca setelah mount.
	watch(animate, (value) => {
		if (value) start()
	})

	onBeforeUnmount(() => {
		window.removeEventListener('pointermove', onPointerMove)
		window.removeEventListener('keydown', onKeyDown)
		stopLerp()
		for (const id of timers) clearTimeout(id)
		timers.clear()
		for (const id of [attentionTimer, sleepTimer, clickReset, hoverReset]) {
			if (id) clearTimeout(id)
		}
	})

	return {
		svgEl,
		bodyEl,
		animate,
		effectiveMood,
		isEggPlaying,
		faceTransform,
		smileOpacity,
		squintOpacity,
		mouthD,
		mouthStroked,
		mouthTransform,
		eyeLeftTransform,
		eyeRightTransform,
		eyeLeftTransition,
		eyeRightTransition,
		onClick,
		onPointerEnter,
		onPointerLeave
	}
}
