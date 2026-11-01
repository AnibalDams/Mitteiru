<script lang="ts">
  import type { Anime } from '$lib/types';
  import ContextMenu from '$lib/components/ui/ContextMenu.svelte';
  import { imageError } from '$lib/actions/imageError';

  let {
    anime,
    index = 0,
    badgeText = '',
    badgeVariant = 'default',
    savedListName = '',
    likesCount = undefined,
    progress = undefined,
    showActions = false,
    onChangeList,
    onRemove
  }: {
    anime: Anime;
    index?: number;
    badgeText?: string;
    badgeVariant?: 'watching' | 'completed' | 'finished' | 'releasing' | 'new' | 'default';
    savedListName?: string;
    likesCount?: number;
    progress?: { ep: number; total?: number; percent: number };
    showActions?: boolean;
    onChangeList?: () => void;
    onRemove?: () => void;
  } = $props();

  const fallbackImage = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600&auto=format&fit=crop';

  // Prioriza el póster vertical.
  let primaryImage = $derived(anime.cover || anime.image || fallbackImage);
  let hasError = $state(false);

  $effect(() => {
    if (anime._id) {
      hasError = false;
    }
  });

  let displaySrc = $derived(hasError ? fallbackImage : primaryImage);
  let stagger = $derived(Math.min(Math.max(index, 0), 7));

  function handleImageError() {
    hasError = true;
  }

  /**
   * Formato determinista (sin `toLocaleString`) para que SSR y cliente
   * rendericen exactamente el mismo texto.
   */
  function formatLikes(value: number): string {
    if (!Number.isFinite(value) || value < 0) return '0';
    if (value < 1000) return String(Math.round(value));

    if (value < 1_000_000) {
      const thousands = value / 1000;
      return `${thousands >= 10 ? Math.round(thousands) : Number(thousands.toFixed(1))}k`;
    }

    const millions = value / 1_000_000;
    return `${millions >= 10 ? Math.round(millions) : Number(millions.toFixed(1))}m`;
  }

  let likesLabel = $derived(
    likesCount === undefined ? '' : formatLikes(likesCount)
  );

  let badgeClasses = $derived(
    savedListName
      ? 'bg-gray-950/80 text-indigo-300 border-indigo-500/30'
      : badgeVariant === 'watching'
        ? 'bg-gray-950/80 text-emerald-300 border-emerald-500/30'
        : badgeVariant === 'completed'
          ? 'bg-gray-950/80 text-gray-300 border-white/10'
          : badgeVariant === 'new'
            ? 'bg-indigo-600/90 text-white border-indigo-400/40 shadow-indigo-600/50'
            : 'bg-gray-950/80 text-gray-200 border-white/10'
  );
</script>

<div
  class="anime-card card-enter group relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-gray-900 shadow-xl"
  style={`--stagger: ${stagger}`}
  data-anime-card
>
  <img
    src={displaySrc}
    alt={anime.name}
    use:imageError={handleImageError}
    class="anime-card-media h-full w-full object-cover"
    loading="lazy"
    decoding="async"
  />

  <!-- Legibilidad del título sobre cualquier portada -->
  <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/35 to-transparent"></div>

  <!-- Un único enlace cubre la card: un solo tab-stop por anime -->
  <a
    href={`/anime/${anime._id}`}
    class="absolute inset-0 z-10 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-inset"
    aria-label={`Ver ${anime.name}`}
  ></a>

  <!-- Insignia primaria (lista guardada o estado) -->
  {#if savedListName || badgeText}
    <div class="pointer-events-none absolute left-2.5 top-2.5 z-20">
      <span
        class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wide shadow-xl backdrop-blur-md {badgeClasses}"
      >
        {#if savedListName}
          <svg class="h-3 w-3 fill-current text-indigo-400" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" />
          </svg>
          <span>{savedListName}</span>
        {:else}
          {#if badgeVariant === 'watching'}
            <span class="motion-essential h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          {/if}
          {badgeText}
        {/if}
      </span>
    </div>
  {/if}

  <!-- Likes: pill propia, fuera de la línea de metadatos -->
  {#if likesCount !== undefined && !showActions}
    <div class="pointer-events-none absolute right-2.5 top-2.5 z-20">
      <span
        class="likes-pill inline-flex items-center gap-1.5 rounded-full border border-rose-500/25 bg-gray-950/65 px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-rose-200 shadow-[0_6px_18px_rgba(0,0,0,0.35)] backdrop-blur-md"
        title={`${likesCount} me gusta`}
      >
        <svg
          class="anime-card-heart h-3 w-3 fill-rose-400 drop-shadow-[0_0_6px_rgba(251,113,133,0.45)]"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
        <span class="tabular-nums" aria-hidden="true">{likesLabel}</span>
        <span class="sr-only">{likesCount} me gusta</span>
      </span>
    </div>
  {/if}

  <!-- Acciones de lista -->
  {#if showActions && (onChangeList || onRemove)}
    <div class="absolute right-2.5 top-2.5 z-30 opacity-0 transition-opacity duration-200 focus-within:opacity-100 group-hover:opacity-100">
      <ContextMenu position="bottom-right">
        {#snippet trigger({ toggle, isOpen }: { open: () => void; close: () => void; toggle: () => void; isOpen: boolean })}
          <button
            onclick={toggle}
            type="button"
            class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-black/60 backdrop-blur-sm transition-all duration-200 hover:border-white/20 hover:bg-black/80"
            aria-label="Más opciones"
            aria-expanded={isOpen}
          >
            <svg class="h-4 w-4 text-gray-300 transition-colors group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        {/snippet}

        {#snippet children()}
          {#if onChangeList}
            <button
              onclick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChangeList();
              }}
              type="button"
              class="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
              role="menuitem"
            >
              <svg class="h-4 w-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span>Cambiar de lista</span>
            </button>
          {/if}
          {#if onRemove}
            <button
              onclick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemove();
              }}
              type="button"
              class="flex w-full cursor-pointer items-center gap-2 border-t border-white/5 px-4 py-2.5 text-left text-sm text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
              role="menuitem"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Eliminar</span>
            </button>
          {/if}
        {/snippet}
      </ContextMenu>
    </div>
  {/if}

  <!-- Metadatos y título -->
  <div class="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col justify-end p-3 sm:p-4">
    <div class="mb-1 text-[10px] font-bold uppercase tracking-widest text-indigo-400">
      <span class="line-clamp-1">
        {anime.releaseYear || '2024'} • {anime.studio || anime.genres?.[0] || 'Anime'}
      </span>
    </div>

    <h3 class="line-clamp-2 text-xs font-bold leading-snug text-white transition-colors group-hover:text-indigo-300 sm:text-sm md:text-base">
      {anime.name}
    </h3>

    {#if progress}
      <div class="mt-2">
        <div class="mb-1 flex items-center justify-between text-[10px] font-semibold text-gray-400">
          <span>Ep {progress.ep} {progress.total ? `/ ${progress.total}` : ''}</span>
          <span>{progress.percent}%</span>
        </div>
        <div class="h-1.5 w-full overflow-hidden rounded-full border border-white/5 bg-gray-800/80 p-0.5">
          <div
            class="h-full rounded-full bg-indigo-500 transition-all duration-300"
            style={`width: ${progress.percent}%`}
          ></div>
        </div>
      </div>
    {/if}
  </div>
</div>
