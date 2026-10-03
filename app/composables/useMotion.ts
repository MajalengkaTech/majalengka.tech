import type { ComponentPublicInstance, MaybeRef } from 'vue'
import { animate, stagger } from 'animejs'

type RevealRoot = HTMLElement | ComponentPublicInstance | null | undefined

// Dibaca langsung dari media query, bukan dari kelas .motion-ready: di halaman SPA (dashboard) skrip <head> baru jalan setelah app dibuat.
export function motionAllowed() {
	return import.meta.client && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function resolveElement(root: RevealRoot) {
	if (!root) return null
	return root instanceof HTMLElement ? root : (root.$el as HTMLElement | null)
}

/**
 * Memunculkan elemen [data-reveal] saat masuk layar.
 * Hanya elemen yang awalnya di bawah layar yang disembunyikan, jadi isi yang sudah terlihat saat halaman dibuka tidak berkedip.
 * Pemicunya posisi scroll, bukan IntersectionObserver, supaya elemen yang terlewati saat melompat (End, anchor, Back) tetap muncul.
 */
export function useReveal(container: MaybeRef<RevealRoot>, selector = '[data-reveal]') {
	let hidden: HTMLElement[] = []
	let frame = 0

	function revealPassed() {
		frame = 0
		const limit = window.innerHeight * 0.92
		const ready = hidden.filter(item => item.getBoundingClientRect().top < limit)
		if (!ready.length) return

		hidden = hidden.filter(item => !ready.includes(item))
		if (!hidden.length) stop()

		animate(ready, {
			opacity: [0, 1],
			translateY: [28, 0],
			duration: 700,
			delay: stagger(80),
			ease: 'out(4)',
			onComplete: () => {
				for (const item of ready) {
					item.style.removeProperty('opacity')
					item.style.removeProperty('transform')
				}
			}
		})
	}

	function onScroll() {
		if (!frame) frame = requestAnimationFrame(revealPassed)
	}

	function stop() {
		window.removeEventListener('scroll', onScroll)
		window.removeEventListener('resize', onScroll)
		if (frame) cancelAnimationFrame(frame)
		frame = 0
	}

	onMounted(() => {
		const root = resolveElement(unref(container))
		if (!root || !motionAllowed()) return

		hidden = [...root.querySelectorAll<HTMLElement>(selector)]
			.filter(item => item.getBoundingClientRect().top > window.innerHeight)
		if (!hidden.length) return

		for (const item of hidden) {
			item.style.opacity = '0'
			item.style.transform = 'translateY(28px)'
		}

		window.addEventListener('scroll', onScroll, { passive: true })
		window.addEventListener('resize', onScroll, { passive: true })
	})

	onBeforeUnmount(stop)
}
