<script setup lang="ts">
// Maskot asisten AI Majalengka Tech: pusaran di ujung gelombang logo menjadi kepala, wajahnya di dalam pusaran.
// Satu warna (currentColor), jadi ikut warna teks: pakai class seperti `text-primary`. Perilakunya di useMajaMascot.
const props = withDefaults(defineProps<{
	// Kosong berarti Maja mengatur ekspresinya sendiri (melirik, tertidur, kaget).
	mood?: MajaMood
	// `head` untuk ikon kecil (chat, tombol), `full` dengan ekor gelombang untuk ukuran besar.
	variant?: 'full' | 'head'
	interactive?: boolean
	label?: string
}>(), {
	mood: undefined,
	variant: 'full',
	interactive: true,
	label: 'Maja, asisten Majalengka Tech'
})

const {
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
} = useMajaMascot(props)

const viewBox = computed(() => props.variant === 'head' ? '130 22 140 140' : '-10 -10 320 220')
const bodyPath = computed(() => props.variant === 'head'
	? 'M146 112 A58 58 0 1 1 200 150 C186 150 174 147 164 143'
	: 'M146 112 A58 58 0 1 1 200 150 C160 150 124 128 84 138 C54 146 32 164 12 182')
const fade = computed(() => animate.value ? 'opacity 0.3s ease' : 'none')
</script>

<template>
	<svg
		ref="svgEl"
		:viewBox="viewBox"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		role="img"
		:aria-label="label"
		:data-mood="effectiveMood"
		:data-animate="animate && !isEggPlaying ? '' : undefined"
		style="overflow: visible"
		@click="onClick"
		@pointerenter="onPointerEnter"
		@pointerleave="onPointerLeave"
	>
		<g
			ref="bodyEl"
			data-part="body"
		>
			<path
				:d="bodyPath"
				stroke="currentColor"
				stroke-width="24"
				stroke-linecap="round"
			/>
			<path
				v-if="variant === 'full'"
				d="M40 196 C80 176 120 186 160 190 C190 193 214 186 232 172"
				stroke="currentColor"
				stroke-width="12"
				stroke-linecap="round"
				opacity="0.55"
			/>

			<g :style="{ transform: faceTransform }">
				<ellipse
					data-part="eye"
					cx="183"
					cy="86"
					rx="7"
					ry="10"
					fill="currentColor"
					:style="{ transform: eyeLeftTransform, transition: eyeLeftTransition }"
				/>
				<ellipse
					data-part="eye"
					cx="217"
					cy="86"
					rx="7"
					ry="10"
					fill="currentColor"
					:style="{ transform: eyeRightTransform, transition: eyeRightTransition }"
				/>
				<path
					v-for="d in [MAJA_PATHS.smileLeft, MAJA_PATHS.smileRight]"
					:key="d"
					:d="d"
					stroke="currentColor"
					stroke-width="6"
					stroke-linecap="round"
					:style="{ opacity: smileOpacity, transition: fade }"
				/>
				<path
					v-for="d in [MAJA_PATHS.squintLeft, MAJA_PATHS.squintRight]"
					:key="d"
					:d="d"
					stroke="currentColor"
					stroke-width="5"
					stroke-linecap="round"
					stroke-linejoin="round"
					:style="{ opacity: squintOpacity, transition: fade }"
				/>
				<path
					data-part="mouth"
					:d="mouthD"
					:fill="mouthStroked ? 'none' : 'currentColor'"
					:stroke="mouthStroked ? 'currentColor' : 'none'"
					stroke-width="5"
					stroke-linecap="round"
					stroke-linejoin="round"
					:style="{ transform: mouthTransform, transition: animate ? 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), d 0.3s ease' : 'none' }"
				/>
			</g>
		</g>

		<g
			v-if="effectiveMood === 'sleeping'"
			data-part="zzz"
			fill="currentColor"
			font-family="ui-sans-serif, system-ui, sans-serif"
			font-weight="800"
		>
			<text
				x="238"
				y="52"
				font-size="18"
			>z</text>
			<text
				x="254"
				y="34"
				font-size="24"
			>z</text>
			<text
				x="272"
				y="12"
				font-size="30"
			>z</text>
		</g>
		<text
			v-if="effectiveMood === 'confused'"
			data-part="question"
			x="252"
			y="40"
			font-size="40"
			font-family="ui-sans-serif, system-ui, sans-serif"
			font-weight="800"
			fill="currentColor"
		>?</text>
	</svg>
</template>

<style scoped>
[data-part="body"],
[data-part="eye"],
[data-part="mouth"] {
	transform-box: fill-box;
	transform-origin: center;
}

[data-part="body"] {
	transform-origin: center bottom;
}

/* Gerak badan per suasana hati, mengikuti Nuxi. Dimatikan saat easter egg (Web Animations) sedang berjalan. */
[data-animate][data-mood="idle"] [data-part="body"] { animation: maja-float 3.2s ease-in-out infinite; }
[data-animate][data-mood="happy"] [data-part="body"] { animation: maja-happy 2.5s ease-in-out infinite; }
[data-animate][data-mood="excited"] [data-part="body"] { animation: maja-excited 0.65s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
[data-animate][data-mood="thinking"] [data-part="body"] { animation: maja-thinking 1.6s ease-in-out infinite; }
[data-animate][data-mood="sleeping"] [data-part="body"] { animation: maja-sleeping 5s ease-in-out infinite; }
[data-animate][data-mood="surprised"] [data-part="body"] { animation: maja-surprised 0.6s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
[data-animate][data-mood="sad"] [data-part="body"] { animation: maja-sad 4s ease-in-out infinite; }
[data-animate][data-mood="confused"] [data-part="body"] { animation: maja-confused 2.4s ease-in-out infinite; }

[data-animate] [data-part="zzz"] text {
	opacity: 0;
	animation: maja-z-float 3.2s ease-in-out infinite;
}
[data-animate] [data-part="zzz"] text:nth-child(2) { animation-delay: 1.05s; }
[data-animate] [data-part="zzz"] text:nth-child(3) { animation-delay: 2.1s; }

[data-animate] [data-part="question"] {
	transform-box: fill-box;
	transform-origin: center bottom;
	animation: maja-question-bob 2.4s ease-in-out infinite;
}

@keyframes maja-float {
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(-4px); }
}
@keyframes maja-happy {
	0%, 100% { transform: translateY(0) rotate(0deg); }
	33% { transform: translateY(-5px) rotate(2deg); }
	66% { transform: translateY(-3px) rotate(-1.5deg); }
}
@keyframes maja-excited {
	0% { transform: scale(1, 1) translateY(0); }
	18% { transform: scale(1.05, 0.9) translateY(5px); }
	45% { transform: scale(0.93, 1.1) translateY(-14px); }
	65% { transform: scale(1.04, 0.95) translateY(-6px); }
	80% { transform: scale(0.98, 1.03) translateY(-10px); }
	100% { transform: scale(1, 1) translateY(-8px); }
}
@keyframes maja-thinking {
	0%, 100% { transform: rotate(-4deg) translateY(0) scale(1, 1); }
	30% { transform: rotate(3deg) translateY(-6px) scale(0.98, 1.02); }
	60% { transform: rotate(-6deg) translateY(-2px) scale(1.02, 0.98); }
}
@keyframes maja-sleeping {
	0%, 100% { transform: rotate(0deg) translateY(0) scale(1, 1); }
	50% { transform: rotate(-4deg) translateY(4px) scale(1.02, 0.98); }
}
@keyframes maja-surprised {
	0% { transform: scale(1, 1) translateY(0); }
	15% { transform: scale(1.1, 0.9) translateY(4px); }
	40% { transform: scale(0.9, 1.12) translateY(-12px); }
	65% { transform: scale(1.05, 0.96) translateY(-5px); }
	85% { transform: scale(0.97, 1.02) translateY(-8px); }
	100% { transform: scale(1, 1) translateY(0); }
}
@keyframes maja-sad {
	0%, 55%, 100% { transform: translateY(0) scale(1, 1); }
	65% { transform: translateY(3px) scale(1.05, 0.92); }
	80% { transform: translateY(1px) scale(0.98, 1.02); }
}
@keyframes maja-confused {
	0%, 100% { transform: rotate(0deg); }
	25% { transform: rotate(-5deg); }
	75% { transform: rotate(5deg); }
}
@keyframes maja-z-float {
	0% { opacity: 0; transform: translate(0, 0) scale(0.6); }
	30% { opacity: 1; }
	100% { opacity: 0; transform: translate(10px, -18px) scale(1.1); }
}
@keyframes maja-question-bob {
	0%, 100% { transform: translateY(0) rotate(-6deg); }
	50% { transform: translateY(-5px) rotate(6deg); }
}
</style>
