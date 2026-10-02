<script setup lang="ts">
import type { CreatorCardData } from '~/types/project'

defineProps<{
	data: CreatorCardData
}>()
</script>

<template>
	<!-- Kartu sengaja selalu gelap di kedua tema, supaya sama dengan gambar yang dibagikan. -->
	<figure
		class="overflow-hidden rounded-xl bg-[#000033] p-6 text-white sm:p-8"
		:aria-label="`Kartu kreator ${data.name}`"
	>
		<div class="flex items-center gap-2 text-sm font-semibold">
			<img
				src="/logo-circle.svg"
				alt=""
				class="size-6 rounded-sm"
			>
			majalengka.tech
		</div>

		<div class="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:items-center">
			<div class="flex items-center gap-4 md:flex-col md:items-start">
				<UAvatar
					:src="data.avatarUrl || undefined"
					:alt="data.name"
					class="size-20 text-2xl ring-4 ring-[#00017B] md:size-28 md:text-4xl"
				/>
				<div class="min-w-0">
					<p class="truncate text-2xl font-bold md:text-3xl">
						{{ data.name }}
					</p>
					<p class="truncate text-[#99BAFE]">
						@{{ data.username }}<template v-if="data.roleLabel">
							· {{ data.roleLabel }}
						</template>
					</p>
				</div>
			</div>

			<div class="flex flex-col gap-4">
				<dl class="grid grid-cols-2 gap-3 sm:gap-4">
					<div class="flex flex-col-reverse rounded-lg border-2 border-[#00017B] bg-[#00004A] px-4 py-5 sm:px-6">
						<dt class="mt-1 text-sm text-[#99BAFE] sm:text-base">
							Karya terbit
						</dt>
						<dd class="text-4xl font-bold tabular-nums sm:text-5xl">
							{{ data.projectCount }}
						</dd>
					</div>
					<div class="flex flex-col-reverse rounded-lg border-2 border-[#00017B] bg-[#00004A] px-4 py-5 sm:px-6">
						<dt class="mt-1 text-sm text-[#99BAFE] sm:text-base">
							Apresiasi diterima
						</dt>
						<dd class="text-4xl font-bold text-[#FEB33B] tabular-nums sm:text-5xl">
							{{ data.likeCount }}
						</dd>
					</div>
				</dl>
				<p
					v-if="data.totalCreators > 0 && data.projectCount > 0"
					class="text-sm sm:text-base"
				>
					Peringkat apresiasi <strong class="tabular-nums">#{{ data.rank }}</strong> dari {{ data.totalCreators }} kreator
				</p>
			</div>
		</div>

		<figcaption class="mt-6 text-sm text-[#6293FF]">
			majalengka.tech/{{ data.username }}
		</figcaption>
	</figure>
</template>
