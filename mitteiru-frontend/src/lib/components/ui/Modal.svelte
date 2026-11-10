<script lang="ts">
  import type { Snippet } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { modalBehavior } from '$lib/actions/modal';

  let {
    isOpen = false,
    title = '',
    onclose,
    children,
    size = 'md',
    class: className = ''
  }: {
    isOpen: boolean;
    title?: string;
    onclose: () => void;
    children?: Snippet;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    class?: string;
  } = $props();

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-5xl'
  };
</script>

{#if isOpen}
  <div
    class="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4"
    transition:fade={{ duration: 160 }}
  >
    <div
      class="absolute inset-0 bg-black/70 backdrop-blur-sm"
      onclick={onclose}
      aria-hidden="true"
    ></div>

    <div
      data-modal-panel
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Diálogo'}
      use:modalBehavior={onclose}
      in:fly={{ y: 40, duration: 240 }}
      out:fade={{ duration: 120 }}
      class="custom-scrollbar relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-gray-900 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] shadow-[0_20px_60px_rgba(0,0,0,0.8)] outline-none sm:max-h-[90vh] sm:rounded-3xl sm:p-8 {sizeClasses[size]} {className}"
    >
      <div class="mb-3 flex justify-center sm:hidden" aria-hidden="true">
        <span class="h-1 w-10 rounded-full bg-white/20"></span>
      </div>

      <button
        onclick={onclose}
        class="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-white/5 hover:text-white cursor-pointer sm:right-5 sm:top-5"
        aria-label="Cerrar modal"
        type="button"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {#if title}
        <h3 class="mb-2 pr-10 text-xl font-bold text-white sm:text-2xl">{title}</h3>
      {/if}

      {#if children}
        {@render children()}
      {/if}
    </div>
  </div>
{/if}
