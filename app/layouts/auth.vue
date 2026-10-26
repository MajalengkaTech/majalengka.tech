<template>
	<div class="flex min-h-dvh items-center justify-center px-4 pt-20 pb-8 sm:py-8">
		<!-- min-h-dvh, bukan h-screen: form yang memanjang (Turnstile) tetap bisa digulir di ponsel. -->
		<UButton
			icon="i-lucide-chevron-left"
			to="/"
			aria-label="Kembali ke beranda"
			size="xl"
			color="neutral"
			variant="subtle"
			class="absolute top-4 left-4 z-10 rounded-full sm:top-8 sm:left-8"
		/>

		<UPageCard
			variant="subtle"
			class="max-w-sm w-full"
		>
			<slot />
		</UPageCard>
	</div>
</template>
