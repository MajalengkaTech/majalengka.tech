import { defineCollection, z } from '@nuxt/content'
import {
	defineOgImageSchema,
	defineRobotsSchema,
	defineSchemaOrgSchema,
	defineSitemapSchema
} from '@nuxtjs/seo/content'

const seoFields = {
	ogImage: defineOgImageSchema(),
	robots: defineRobotsSchema(),
	schemaOrg: defineSchemaOrgSchema(),
	sitemap: defineSitemapSchema()
}

const variantEnum = z.enum(['solid', 'outline', 'subtle', 'soft', 'ghost', 'link'])
const colorEnum = z.enum(['primary', 'secondary', 'neutral', 'error', 'warning', 'success', 'info'])
const sizeEnum = z.enum(['xs', 'sm', 'md', 'lg', 'xl'])

const createBaseSchema = () => z.object({
	title: z.string().nonempty(),
	description: z.string().nonempty()
})

const createFeatureItemSchema = () => createBaseSchema().extend({
	icon: z.string().nonempty().editor({ input: 'icon' })
})

const createLinkSchema = () => z.object({
	label: z.string().nonempty(),
	to: z.string().nonempty(),
	icon: z.string().optional().editor({ input: 'icon' }),
	size: sizeEnum.optional(),
	trailing: z.boolean().optional(),
	target: z.string().optional(),
	color: colorEnum.optional(),
	variant: variantEnum.optional()
})

export const collections = {
	index: defineCollection({
		source: '0.index.yml',
		type: 'page',
		schema: z.object({
			hero: z.object(({
				links: z.array(createLinkSchema())
			}))
		})
	}),
	tentang: defineCollection({
		source: '5.tentang.yml',
		type: 'page',
		schema: z.object({
			hero: z.object({
				headline: z.string().optional(),
				links: z.array(createLinkSchema())
			}),
			story: createBaseSchema().extend({
				items: z.array(createFeatureItemSchema())
			}),
			features: createBaseSchema().extend({
				items: z.array(createFeatureItemSchema())
			}),
			cta: createBaseSchema().extend({
				links: z.array(createLinkSchema())
			})
		})
	}),
	docs: defineCollection({
		source: '1.docs/**/*',
		type: 'page',
		schema: z.object(seoFields)
	}),
	changelog: defineCollection({
		source: '4.changelog.yml',
		type: 'page'
	}),
	versions: defineCollection({
		source: '4.changelog/**/*',
		type: 'page',
		schema: z.object({
			title: z.string().nonempty(),
			description: z.string(),
			date: z.date(),
			image: z.string()
		})
	})
}
