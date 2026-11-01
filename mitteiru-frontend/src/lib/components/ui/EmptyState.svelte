<script lang="ts">
  import type { Snippet } from 'svelte';

  type Variant = 'search' | 'bookmark' | 'history' | 'inbox' | 'error';

  let {
    variant = 'inbox',
    title,
    description = '',
    action
  }: {
    variant?: Variant;
    title: string;
    description?: string;
    action?: Snippet;
  } = $props();

  const icons: Record<Variant, string> = {
    search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    bookmark: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z',
    history: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    inbox: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5zM4 13h4l2 3h4l2-3h4',
    error: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
  };
</script>

<div class="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/5 px-6 py-16 text-center">
  <div class="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-gray-500">
    <svg class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={icons[variant]} />
    </svg>
  </div>

  <h2 class="text-lg font-bold text-white text-balance">{title}</h2>

  {#if description}
    <p class="mt-2 max-w-md text-sm leading-relaxed text-gray-400 text-pretty">
      {description}
    </p>
  {/if}

  {#if action}
    <div class="mt-6">
      {@render action()}
    </div>
  {/if}
</div>
