<script>
    import { onMount } from 'svelte';
	import './styles.css';
	import { injectAnalytics } from '@vercel/analytics/sveltekit'
	onMount(()=>{
		injectAnalytics()
	}
	)
</script>

<div class="app">
	<main>
		<slot />
	</main>

</div>
