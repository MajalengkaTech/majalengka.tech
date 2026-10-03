const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
// Sama dengan batas di server/api/upload.post.ts.
const MAX_BYTES = 8 * 1024 * 1024

// projectId diisi saat mengedit proyek, supaya admin yang mengunggah untuk proyek orang lain menyimpan gambar di folder pemiliknya.
export function useImageUpload(projectId?: MaybeRefOrGetter<number | undefined>) {
	const toast = useToast()
	const uploading = ref(0)

	async function uploadImage(file: File): Promise<string | null> {
		if (!ALLOWED_TYPES.includes(file.type)) {
			toast.add({ title: `${file.name} dilewati`, description: 'Pakai gambar JPG, PNG, WebP, atau GIF.', color: 'error' })
			return null
		}
		if (file.size > MAX_BYTES) {
			toast.add({ title: `${file.name} terlalu besar`, description: 'Ukuran gambar maksimal 8 MB.', color: 'error' })
			return null
		}

		const formData = new FormData()
		formData.append('file', file)
		uploading.value++
		try {
			const id = toValue(projectId)
			const res = await $fetch<{ url: string }>('/api/upload', { method: 'POST', body: formData, query: id ? { projectId: id } : undefined })
			return res.url
		} catch (err: unknown) {
			const errorResponse = err as { data?: { statusMessage?: string } }
			toast.add({
				title: `${file.name} gagal diunggah`,
				description: errorResponse.data?.statusMessage || 'Coba lagi, atau tempel link gambarnya.',
				color: 'error'
			})
			return null
		} finally {
			uploading.value--
		}
	}

	return { uploadImage, isUploading: computed(() => uploading.value > 0) }
}
