export default defineAppConfig({
	ui: {
		colors: {
			primary: 'brand',
			neutral: 'slate'
		},
		// Modal pencarian di ponsel tidak setinggi layar (bawaan Nuxt UI h-full); desktop tetap 28rem.
		contentSearch: {
			variants: {
				fullscreen: {
					false: {
						modal: 'sm:max-w-3xl h-[min(30rem,70dvh)] sm:h-[28rem]'
					}
				}
			}
		},
		icons: {
			arrowDown: 'i-tabler-arrow-down',
			arrowLeft: 'i-tabler-arrow-left',
			arrowRight: 'i-tabler-arrow-right',
			arrowUp: 'i-tabler-arrow-up',
			caution: 'i-tabler-alert-square-rounded',
			check: 'i-tabler-check',
			chevronDoubleLeft: 'i-tabler-chevrons-left',
			chevronDoubleRight: 'i-tabler-chevrons-right',
			chevronDown: 'i-tabler-chevron-down',
			chevronLeft: 'i-tabler-chevron-left',
			chevronRight: 'i-tabler-chevron-right',
			chevronUp: 'i-tabler-chevron-up',
			close: 'i-tabler-x',
			copy: 'i-tabler-copy',
			copyCheck: 'i-tabler-copy-check',
			dark: 'i-tabler-moon',
			drag: 'i-tabler-grip-vertical',
			ellipsis: 'i-tabler-dots',
			error: 'i-tabler-square-rounded-x',
			external: 'i-tabler-external-link',
			eye: 'i-tabler-eye',
			eyeOff: 'i-tabler-eye-off',
			file: 'i-tabler-file',
			folder: 'i-tabler-folder',
			folderOpen: 'i-tabler-folder-open',
			hash: 'i-tabler-hash',
			info: 'i-tabler-info-square-rounded',
			light: 'i-tabler-sun',
			loading: 'i-tabler-loader-2',
			menu: 'i-tabler-menu',
			minus: 'i-tabler-minus',
			panelClose: 'i-tabler-layout-sidebar-left-collapse',
			panelOpen: 'i-tabler-layout-sidebar-left-expand',
			plus: 'i-tabler-plus',
			reload: 'i-tabler-reload',
			search: 'i-tabler-search',
			stop: 'i-tabler-player-stop',
			star: 'i-tabler-star',
			success: 'i-tabler-square-rounded-check',
			system: 'i-tabler-device-desktop',
			tip: 'i-tabler-bulb',
			upload: 'i-tabler-upload',
			warning: 'i-tabler-alert-triangle'
		},
		// Umpan balik tekan: tombol sedikit mengecil saat ditekan. motion-safe mematikannya untuk yang memilih gerak dikurangi.
		button: {
			slots: {
				base: 'transition-[color,background-color,border-color,box-shadow,transform] duration-150 motion-safe:active:scale-[0.97]'
			}
		}
	}
})
