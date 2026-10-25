<script setup lang="ts">
// Alamat lama /@username tetap berfungsi untuk link yang sudah terlanjur dibagikan.
const route = useRoute()
await navigateTo(`/${String(route.params.username).toLowerCase()}`, { redirectCode: 301 })
</script>

<template>
	<div />
</template>
