<script>
  import { onMount } from "svelte";
  import DesktopPage from "./components/DesktopPage.svelte";
  import MobilePage from "./components/mobilePage.svelte";

  export let data;

  let isMobile;
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

<svelte:head>
  <title>Directory</title>
  <meta name="description" content="Svelte demo app" />
</svelte:head>


{#if isMobile}
<MobilePage data={data}/>
{:else}
<DesktopPage data={data}/>

{/if}