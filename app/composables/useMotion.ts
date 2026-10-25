import type { ComponentPublicInstance, MaybeRef } from 'vue'

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
 * Memunculkan elemen [data-reveal] saat masuk layar menggunakan IntersectionObserver modern.
 * Menghindari layout thrashing (getBoundingClientRect saat scroll) agar scrolling tetap 60fps mulus.
 */
export function useReveal(container: MaybeRef<RevealRoot>, selector = '[data-reveal]') {
	let observer: IntersectionObserver | null = null

	onMounted(() => {
		const root = resolveElement(unref(container))
		if (!root || !motionAllowed() || typeof IntersectionObserver === 'undefined') return

		const items = [...root.querySelectorAll<HTMLElement>(selector)]
		if (!items.length) return

		// Elemen yang awalnya berada di bawah layar disembunyikan untuk animasi masuk
		const vh = window.innerHeight
		const hidden: HTMLElement[] = []

		for (const item of items) {
			const rect = item.getBoundingClientRect()
			if (rect.top > vh) {
				item.style.opacity = '0'
				item.style.transform = 'translateY(24px)'
				hidden.push(item)
			}
		}

		if (!hidden.length) return

		observer = new IntersectionObserver((entries) => {
			const intersecting = entries.filter(entry => entry.isIntersecting)
			if (!intersecting.length) return

			const targets = intersecting.map(entry => entry.target as HTMLElement)
			for (const el of targets) {
				observer?.unobserve(el)
			}

			for (let i = 0; i < targets.length; i++) {
				const el = targets[i]
				if (!el) continue
				const anim = el.animate([
					{ opacity: 0, transform: 'translateY(24px)' },
					{ opacity: 1, transform: 'translateY(0)' }
				], {
					duration: 450,
					delay: i * 50,
					easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
					fill: 'forwards'
				})
				anim.onfinish = () => {
					el.style.removeProperty('opacity')
					el.style.removeProperty('transform')
				}
			}
		}, {
			rootMargin: '0px 0px -30px 0px',
			threshold: 0.05
		})

		for (const item of hidden) {
			observer.observe(item)
		}
	})

	onBeforeUnmount(() => {
		if (observer) {
			observer.disconnect()
			observer = null
		}
	})
}
