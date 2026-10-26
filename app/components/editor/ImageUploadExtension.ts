import { Node, mergeAttributes } from '@tiptap/core'
import type { NodeViewRenderer } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import ImageUploadNode from './ImageUploadNode.vue'

export interface ImageUploadOptions {
	folder: 'tutorial' | 'projek'
	projectId?: number
}

// Blok sementara berisi kotak unggah (pola template Nuxt UI Editor). Setelah unggahan selesai, blok ini diganti gambar.
export const ImageUpload = Node.create<ImageUploadOptions>({
	name: 'imageUpload',
	group: 'block',
	atom: true,
	draggable: true,
	addOptions() {
		return { folder: 'tutorial', projectId: undefined }
	},
	parseHTML() {
		return [{ tag: 'div[data-type="image-upload"]' }]
	},
	renderHTML({ HTMLAttributes }) {
		return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'image-upload' })]
	},
	addNodeView(): NodeViewRenderer {
		return VueNodeViewRenderer(ImageUploadNode)
	}
})
