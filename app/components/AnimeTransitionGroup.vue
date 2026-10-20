<script lang="ts">
import { TransitionGroup, defineComponent, h } from 'vue'

// Render function, bukan <TransitionGroup><slot /></TransitionGroup>: dengan slot di template, SSR menulis
// penanda fragmen (<!--[-->) di antara anak-anaknya, sedangkan TransitionGroup di browser meratakan fragmen,
// sehingga jumlah node server dan browser beda (hydration mismatch). Lewat h(), server memakai logika yang sama.
export default defineComponent({
	inheritAttrs: false,
	props: {
		tag: {
			type: String,
			default: 'div'
		}
	},
	setup(props, { attrs, slots }) {
		return () => h(TransitionGroup, { ...attrs, tag: props.tag, name: 'list' }, slots)
	}
})
</script>

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
