// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'
import betterTailwindcss from 'eslint-plugin-better-tailwindcss'
import { getDefaultAttributes } from 'eslint-plugin-better-tailwindcss/api/defaults'

export default withNuxt(
	{
		ignores: [
			'.agents/**',
			'.roo/**',
			'okf/**',
			'**/*.svg',
			'public/**/*.svg'
		]
	},
	betterTailwindcss.configs['correctness-error'],
	{
		settings: {
			'better-tailwindcss': {
				entryPoint: 'app/assets/css/main.css',
				attributes: [
					...getDefaultAttributes(),
					['^v-bind:ui$', [{ match: 'objectValues' }]]
				]
			}
		},
		rules: {
			'better-tailwindcss/no-unknown-classes': ['error', { ignore: ['^stars$', '^star-layer$', '^star$'] }],
			'vue/html-indent': [
				'error',
				'tab',
				{
					ignores: [
						'VElement[name="svg"]',
						'VElement[name="svg"] *'
					]
				}
			]
		}
	},
	{
		files: [
			'**/*Illustration*.vue',
			'**/*Svg*.vue',
			'**/svg/**/*.vue',
			'**/SVG/**/*.vue',
			'app/components/HeroIllustration.vue'
		],
		rules: {
			'vue/first-attribute-linebreak': 'off',
			'vue/html-closing-bracket-newline': 'off',
			'vue/html-indent': 'off',
			'vue/html-quotes': 'off',
			'vue/html-self-closing': 'off',
			'vue/max-attributes-per-line': 'off',
			'vue/multiline-html-element-content-newline': 'off',
			'vue/singleline-html-element-content-newline': 'off'
		}
	}
)
