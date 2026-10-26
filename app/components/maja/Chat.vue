<script setup lang="ts">
// Titik pasang Maja di app.vue: panel samping dan layar penuh berbagi percakapan yang sama.
const { open, loadQuota } = useMajaChat()
const { loggedIn } = useSessionView()

watch(open, (value) => {
	if (value) loadQuota()
}, { immediate: true })
// Kuota berbeda setelah masuk atau keluar.
watch(loggedIn, () => {
	if (open.value) loadQuota()
})
</script>

<template>
	<MajaChatPanel />
	<MajaChatFull />
</template>
