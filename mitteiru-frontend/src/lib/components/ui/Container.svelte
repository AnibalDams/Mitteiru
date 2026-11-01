<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    class: className = '',
    children
  }: {
    class?: string;
    children?: Snippet;
  } = $props();
</script>

<div class="mx-auto w-full max-w-7xl px-4 sm:px-6 {className}">
  {@render children?.()}
</div>
