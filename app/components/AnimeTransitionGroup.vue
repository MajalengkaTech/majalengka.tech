<script setup lang="ts">
defineOptions({
	inheritAttrs: false
})

const props = withDefaults(defineProps<{
	tag?: string
}>(), {
	tag: 'div'
})
</script>

<template>
	<TransitionGroup
		:tag="props.tag"
		name="list"
		v-bind="$attrs"
	>
		<slot />
	</TransitionGroup>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
	transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.list-enter-from,
.list-leave-to {
	opacity: 0;
	transform: scale(0.96) translateY(8px);
}
</style>
