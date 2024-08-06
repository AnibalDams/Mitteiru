<script context="module">
	import { onMount } from "svelte";
	import DesktopPage from "./HomePageComponents/desktopPage.svelte"; 
	import MobilePage from "./HomePageComponents/mobilePage.svelte";
    import { Width } from "radix-icons-svelte";
</script>

<script>

	export let data
	let screenWidth;
	onMount(()=>{

		screenWidth =window.innerWidth 

	})
	
</script>

<svelte:body on:viewportChanged={()=>screenWidth= window.innerWidth}/>
{#if screenWidth>= 725}
	<DesktopPage data={data}/>
{:else}
	<MobilePage/>
	
{/if}

