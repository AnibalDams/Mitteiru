<script lang="ts">
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import {
    toasts,
    dismissToast,
    pauseToast,
    resumeToast,
    type ToastVariant
  } from '$lib/stores/toast';

  const variantStyles: Record<
    ToastVariant,
    { badge: string; icon: string; label: string }
  > = {
    success: {
      badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
      icon: 'M5 13l4 4L19 7',
      label: 'Éxito'
    },
    error: {
      badge: 'bg-red-500/15 text-red-300 border-red-500/25',
      icon: 'M12 8v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
      label: 'Error'
    },
    info: {
      badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/25',
      icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
      label: 'Información'
    }
  };
</script>

<div
  class="pointer-events-none fixed inset-x-4 bottom-[calc(1rem+var(--mobile-tabbar-height)+env(safe-area-inset-bottom,0px))] z-[150] flex flex-col gap-3 md:inset-x-auto md:bottom-6 md:right-6"
  aria-live="polite"
  aria-atomic="false"
>
  {#each $toasts as toast (toast.id)}
    {@const styles = variantStyles[toast.variant]}
    <div
      class="toast-item group pointer-events-auto relative w-full overflow-hidden rounded-2xl border border-white/10 bg-gray-900/95 p-4 pr-11 shadow-[0_24px_70px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:w-[22rem]"
      role={toast.variant === 'error' ? 'alert' : 'status'}
      in:fly={{ y: 14, duration: 220, easing: cubicOut }}
      out:fly={{ y: 8, duration: 160 }}
      onmouseenter={() => pauseToast(toast.id)}
      onmouseleave={() => resumeToast(toast.id)}
    >
      <div class="flex items-start gap-3">
        <span
          class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border {styles.badge}"
          aria-hidden="true"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d={styles.icon}
            />
          </svg>
        </span>

        <div class="min-w-0 flex-1">
          <p class="text-sm font-bold leading-snug text-white">{toast.title}</p>
          {#if toast.description}
            <p class="mt-1 text-xs leading-relaxed text-gray-400">{toast.description}</p>
          {/if}
        </div>
      </div>

      <button
        type="button"
        class="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2"
        aria-label="Cerrar notificación"
        onclick={() => dismissToast(toast.id)}
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {#if toast.duration > 0}
        <span
          class="toast-timer absolute bottom-0 left-0 h-0.5 w-full origin-left bg-gradient-to-r from-indigo-500 via-indigo-400 to-pink-500"
          style={`animation-duration: ${toast.duration}ms`}
          aria-hidden="true"
        ></span>
      {/if}
    </div>
  {/each}
</div>
