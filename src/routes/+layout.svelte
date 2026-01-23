<script>
  import { onMount } from "svelte";
  import "./styles.css";
  import { injectAnalytics } from "@vercel/analytics/sveltekit";
  import { getCookie } from "svelte-cookie";
  import { goto } from "$app/navigation";
  import NProgress from "nprogress";
  import "nprogress/nprogress.css";
  import { navigating } from "$app/stores";

  export let data;
  NProgress.configure({
    // Full list: https://github.com/rstacruz/nprogress#configuration

    minimum: 0.16,
  });

  // Reactively start/stop based on navigation state
  $: {
    if ($navigating) {
      console.log("navigating");
      NProgress.start();
    } else {
      NProgress.done();
    }
  }

  onMount(() => {
    injectAnalytics();

    if (data.userId) {
      const profileId = getCookie("profileId");
      if (!profileId || profileId == "") {
        goto("/selectprofile");
        return;
      }
    }
  });
</script>

<div class="app">
  <main>
    <slot />
  </main>
</div>
