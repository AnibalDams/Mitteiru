<script>
    import { onMount } from 'svelte';
	import './styles.css';
	import { injectAnalytics } from '@vercel/analytics/sveltekit'
    import { getCookie } from "svelte-cookie";
	import { goto } from "$app/navigation";
	export let data
	onMount(()=>{
		injectAnalytics()
		console.log(data.userId)
		if(data.userId.user._id != "" && data.userId){
			const profileId = getCookie("profileId")
			if(!profileId || profileId == ""){
				goto("/selectprofile")
				return
			}
		}
	}
	)
</script>

<div class="app">
	<main>
		<slot/>
	</main>

</div>
