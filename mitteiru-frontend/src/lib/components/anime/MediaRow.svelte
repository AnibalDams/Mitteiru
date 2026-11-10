<script lang="ts">
  import type { Snippet } from 'svelte';
  import { reveal } from '$lib/actions/reveal';

  let {
    title,
    viewAllHref = '',
    viewAllLabel = '',
    delay = 0,
    children
  }: {
    title: string;
    viewAllHref?: string;
    viewAllLabel?: string;
    delay?: number;
    children?: Snippet;
  } = $props();
</script>

<section use:reveal={{ delay }}>
  <div class="mb-4 flex items-end justify-between gap-3 sm:mb-8">
    <h2 class="text-xl font-extrabold tracking-tight text-white sm:text-3xl">
      {title}
    </h2>

    {#if viewAllHref && viewAllLabel}
      <a
        href={viewAllHref}
        class="group inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-indigo-400 transition-colors hover:text-indigo-300"
      >
        {viewAllLabel}
        <span class="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true">→</span>
      </a>
    {/if}
  </div>

  <div
    class="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:gap-6 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-6"
  >
    {#if children}
      {@render children()}
    {/if}
  </div>
</section>
