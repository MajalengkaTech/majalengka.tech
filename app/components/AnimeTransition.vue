<template>
	<Transition
		v-bind="$attrs"
		name="fade"
		mode="out-in"
	>
		<slot />
	</Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
	transform: translateY(4px);
}
</style>
