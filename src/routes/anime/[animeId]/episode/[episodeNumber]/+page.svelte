<script>
  import MobilePage from "./components/MobilePage.svelte";
import DesktopPage from "./components/DesktopPage.svelte";
  import { onMount } from "svelte";

  export let data;
  let isMobile = false;

  onMount(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    isMobile = mediaQuery.matches;

    const handleResize = () => {
      isMobile = mediaQuery.matches;
    };

    mediaQuery.addEventListener("change", handleResize);
  });
</script>

{#if !isMobile}
  <DesktopPage {data} />
{:else}
<MobilePage {data}/>
{/if}
