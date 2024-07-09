<script>
  import Header from "./Header.svelte";
  import "./styles.css";
  export let data;
</script>

<div class="app">
  <main>
    <slot />
  </main>
</div>
