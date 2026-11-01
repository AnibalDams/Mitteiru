<script lang="ts">
  import { goto } from '$app/navigation';
  import { imageError } from '$lib/actions/imageError';
  import type { Episode } from '$lib/types';

  let {
    episode,
    animeId = '',
    layout = 'slides',
  }: {
    episode: Episode;
    animeId?: string;
    layout?: 'slides' | 'grid';
  } = $props();

  const fallbackThumbnail = 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=600&auto=format&fit=crop';

  let primaryImage = $derived(episode.thumbnail || fallbackThumbnail);
  let hasImageError = $state(false);
  let imgSrc = $derived(hasImageError ? fallbackThumbnail : primaryImage);

  $effect(() => {
    // Restablece el fallback cuando cambia el episodio o su miniatura.
    const src = primaryImage;
    if (src) hasImageError = false;
  });

  function handleError() {
    hasImageError = true;
  }

  function handleClick() {
    if (episode._id && animeId) {
      goto(`/anime/${animeId}/episode/${episode._id}`);
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    handleClick();
  }
</script>

<div
  onclick={handleClick}
  class="group flex cursor-pointer flex-col transition-transform duration-300 motion-safe:hover:-translate-y-0.5 {layout === 'grid'
    ? 'w-full min-w-0 h-full'
    : 'snap-start shrink-0 w-72 md:w-80'}"
  role="button"
  tabindex="0"
  aria-label={`Ver episodio ${episode.episodeNumber}: ${episode.name || ''}`}
  onkeydown={handleKeydown}
>
  <div class="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-900 border border-white/10 mb-2">
    <img
      src={imgSrc}
      alt={episode.name}
      use:imageError={handleError}
      class="w-full h-full object-cover motion-safe:group-hover:scale-105 transition-transform duration-500"
      loading="lazy"
    />

    <!-- Play Overlay -->
    <div
      class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
    >
      <div class="w-12 h-12 rounded-full bg-indigo-600/90 flex items-center justify-center backdrop-blur-sm shadow-lg shadow-indigo-600/40">
        <svg class="w-6 h-6 fill-white ml-0.5" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </div>

    <!-- Episode Number Pill -->
    <div class="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[10px] font-bold text-white backdrop-blur-md">
      Ep. {episode.episodeNumber}
    </div>
  </div>

  <h3 class="text-white text-sm font-semibold truncate group-hover:text-indigo-400 transition-colors">
    {episode.episodeNumber}. {episode.name || `Episodio ${episode.episodeNumber}`}
  </h3>
  {#if episode.synopsis}
    <p class="text-xs text-gray-400 line-clamp-1 mt-0.5">{episode.synopsis}</p>
  {/if}
</div>
