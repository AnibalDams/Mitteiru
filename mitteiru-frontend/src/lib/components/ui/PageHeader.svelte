<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    title,
    subtitle = '',
    eyebrow = '',
    actions,
    class: className = ''
  }: {
    title: string;
    subtitle?: string;
    eyebrow?: string;
    actions?: Snippet;
    class?: string;
  } = $props();
</script>

<header class="mb-10 sm:mb-12 {className}">
  {#if eyebrow}
    <p class="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-indigo-400">{eyebrow}</p>
  {/if}

  <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div class="min-w-0">
      <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white text-balance">
        {title}
      </h1>
      {#if subtitle}
        <p class="mt-2 max-w-2xl text-base leading-relaxed text-gray-400 text-pretty sm:text-lg">
          {subtitle}
        </p>
      {/if}
    </div>

    {#if actions}
      <div class="shrink-0">
        {@render actions()}
      </div>
    {/if}
  </div>
</header>
