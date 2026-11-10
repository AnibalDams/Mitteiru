<script lang="ts">
  import type { Snippet } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { modalBehavior } from '$lib/actions/modal';
  import { language, translations } from '$lib/i18n';

  let {
    open = $bindable(false),
    title = '',
    onclose,
    children,
    class: className = ''
  }: {
    open?: boolean;
    title?: string;
    onclose: () => void;
    children?: Snippet;
    class?: string;
  } = $props();

  let currentLang = $derived($language);
</script>

{#if open}
  <div class="fixed inset-0 z-[110] flex items-end justify-center md:items-center">
    <div
      class="absolute inset-0 bg-black/70 backdrop-blur-sm"
      transition:fade={{ duration: 160 }}
      onclick={onclose}
      aria-hidden="true"
    ></div>

    <div
      data-modal-panel
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Panel'}
      use:modalBehavior={onclose}
      in:fly={{ y: 48, duration: 240 }}
      out:fly={{ y: 48, duration: 140 }}
      class="relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-gray-900 shadow-[0_-10px_60px_rgba(0,0,0,0.8)] outline-none md:rounded-3xl {className}"
    >
      <!-- Indicador de arrastre: señal visual de bottom sheet en móvil. -->
      <div class="flex justify-center pt-2 md:hidden" aria-hidden="true">
        <span class="h-1 w-10 rounded-full bg-white/20"></span>
      </div>

      <div class="flex items-start justify-between gap-4 px-5 pb-2 pt-3 sm:px-6">
        {#if title}
          <h2 class="text-lg font-bold text-white">{title}</h2>
        {:else}
          <span></span>
        {/if}

        <button
          type="button"
          onclick={onclose}
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          aria-label={translations.nav.close[currentLang]}
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] pt-2 sm:px-6">
        {#if children}
          {@render children()}
        {/if}
      </div>
    </div>
  </div>
{/if}
