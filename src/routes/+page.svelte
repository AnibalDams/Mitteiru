<script >
	import { onMount } from "svelte";
	import DesktopPage from "./HomePageComponents/desktopPage.svelte"; 
	import MobilePage from "./HomePageComponents/mobilePage.svelte";
	let isMobile = false

	export let data

	onMount(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    isMobile = mediaQuery.matches;

    const handleResize = () => {
      isMobile = mediaQuery.matches;
    };

    mediaQuery.addEventListener('change', handleResize);

    return () => {
      mediaQuery.removeEventListener('change', handleResize);
    };
  });
</script>

{#if isMobile}
	<MobilePage data={data}/>
{:else}
<DesktopPage data={data}/>

{/if}

