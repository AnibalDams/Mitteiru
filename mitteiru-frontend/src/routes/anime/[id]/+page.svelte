<script lang="ts">
  import { onDestroy } from 'svelte';
  import { language, translations } from '$lib/i18n';
  import { api } from '$lib/api/client';
  import { invalidateAll, goto } from '$app/navigation';
  import EpisodeCard from '$lib/components/anime/EpisodeCard.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Markdown from '$lib/components/ui/Markdown.svelte';
  import { toastError, toastInfo, toastSuccess } from '$lib/stores/toast';

  let { data } = $props();
  let currentLang = $derived($language);

  let anime = $derived(data?.anime);
  let episodes = $derived(data?.episodes || []);
  let reviews = $derived(data?.reviews || []);
  let userLists = $derived(data?.userLists || []);
  let initialSavedListIds = $derived(data?.savedInListIds || []);
  let activeSavedListIds = $state<string[]>([]);
  
  $effect(() => {
    activeSavedListIds = [...initialSavedListIds];
  });

  let profileId = $derived(data?.profileId);
  let sourcesEnabled = $derived(data?.sourcesEnabled ?? false);
  // El modal de listas solo está operativo con sesión y perfil; si falta alguno,
  // la página muestra un acceso a /login o /selectprofile en su lugar.
  let canManageLists = $derived(Boolean(data?.user && profileId));
  // Destino del placeholder: vuelve a este anime al terminar login o selección de perfil.
  let saveListCtaHref = $derived.by(() => {
    const target = `/anime/${anime?._id ?? ''}`;
    const base = data?.user ? '/selectprofile' : '/login';
    return `${base}?next=${encodeURIComponent(target)}`;
  });

  let isListModalOpen = $state(false);
  let episodeViewMode = $state<'slides' | 'grid'>('slides');
  let isLiked = $state(false);
  let isAddingList = $state(false);
  let likePulse = $state(false);

  // New list in modal form
  let isCreatingListInline = $state(false);
  let inlineListName = $state('');

  // Carrusel de episodios (modo diapositivas)
  const DRAG_THRESHOLD = 6;

  let carouselEl = $state<HTMLDivElement | null>(null);
  let canScrollPrev = $state(false);
  let canScrollNext = $state(false);
  let isDragging = $state(false);
  let dragActive = false;
  let dragStartX = 0;
  let dragStartScrollLeft = 0;
  let suppressClick = false;

  function updateCarouselState() {
    const el = carouselEl;
    if (!el) {
      canScrollPrev = false;
      canScrollNext = false;
      return;
    }
    const maxScroll = el.scrollWidth - el.clientWidth;
    canScrollPrev = el.scrollLeft > 2;
    canScrollNext = el.scrollLeft < maxScroll - 2;
  }

  function scrollCarousel(direction: -1 | 1) {
    const el = carouselEl;
    if (!el) return;
    const step = Math.max(el.clientWidth * 0.8, 280);
    el.scrollBy({ left: direction * step, behavior: 'smooth' });
  }

  function handleDragStart(event: PointerEvent) {
    if (event.pointerType === 'touch' || event.button !== 0) return;
    const el = carouselEl;
    if (!el) return;

    dragActive = true;
    isDragging = false;
    dragStartX = event.clientX;
    dragStartScrollLeft = el.scrollLeft;

    window.addEventListener('pointermove', handleDragMove);
    window.addEventListener('pointerup', handleDragEnd);
    window.addEventListener('pointercancel', handleDragEnd);
  }

  function handleDragMove(event: PointerEvent) {
    if (!dragActive) return;
    const el = carouselEl;
    if (!el) return;

    const delta = event.clientX - dragStartX;
    if (!isDragging && Math.abs(delta) < DRAG_THRESHOLD) return;

    if (!isDragging) {
      isDragging = true;
      // Evita que el snap obligatorio pelee con el arrastre manual.
      el.style.scrollSnapType = 'none';
    }

    event.preventDefault();
    el.scrollLeft = dragStartScrollLeft - delta;
    updateCarouselState();
  }

  function handleDragEnd() {
    if (!dragActive) return;
    dragActive = false;
    window.removeEventListener('pointermove', handleDragMove);
    window.removeEventListener('pointerup', handleDragEnd);
    window.removeEventListener('pointercancel', handleDragEnd);

    if (isDragging) {
      const el = carouselEl;
      if (el) el.style.scrollSnapType = '';
      // El clic que sigue al pointerup no debe navegar tras arrastrar.
      suppressClick = true;
      window.setTimeout(() => {
        suppressClick = false;
      }, 60);
    }
    isDragging = false;
  }

  function handleCarouselClick(event: MouseEvent) {
    if (!suppressClick) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClick = false;
  }

  $effect(() => {
    if (episodeViewMode !== 'slides') return;
    const el = carouselEl;
    void episodes.length;
    if (!el) return;

    updateCarouselState();
    const observer = new ResizeObserver(updateCarouselState);
    observer.observe(el);
    window.addEventListener('resize', updateCarouselState);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateCarouselState);
    };
  });

  onDestroy(() => {
    if (dragActive) handleDragEnd();
  });

  const fallbackPoster = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600&auto=format&fit=crop';
  const fallbackHero = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=2574&auto=format&fit=crop';

  function stripMarkdown(text: string): string {
    return (text || '')
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/^[#]+\s+/gm, '')
      .replace(/^[>*\-+]\s+/gm, '')
      .replace(/^>\s?/gm, '')
      .replace(/^(\d+)\.\s+/gm, '$1. ')
      .replace(/(\*\*|__|\*|_|~~|`)/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function reviewExcerpt(review: any, maxLength = 160): string {
    const plain = stripMarkdown(review.review || '');
    if (plain.length <= maxLength) return plain;
    return plain.slice(0, maxLength).trimEnd() + '…';
  }

  function goToWriteReview() {
    if (!anime?._id) return;
    goto(`/anime/${anime._id}/review/new`);
  }

  function goToReview(review: any) {
    if (!anime?._id || !review?._id) return;
    goto(`/anime/${anime._id}/review/${review._id}`);
  }

  // Compute active list names for display on button
  let savedListNames = $derived.by(() => {
    return userLists
      .filter((l) => activeSavedListIds.includes(String(l._id)))
      .map((l) => l.name);
  });

  async function handleToggleList(listId: string) {
    if (!anime?._id || !profileId) {
      toastInfo(
        currentLang === 'es' ? 'Elegí un perfil' : 'Pick a profile',
        currentLang === 'es'
          ? 'Necesitás un perfil activo para guardar animes en tus listas.'
          : 'You need an active profile to save anime to your lists.'
      );
      return;
    }

    const listName = userLists.find(
      (list) => String(list._id) === String(listId)
    )?.name;
    const isCurrentlySaved = activeSavedListIds.includes(String(listId));

    isAddingList = true;
    const res = isCurrentlySaved
      ? await api.removeAnimeFromList(listId, anime._id)
      : await api.addAnimeToList(anime._id, listId);
    isAddingList = false;

    if (res.error || (res.status ?? 200) >= 400) {
      toastError(
        translations.feedback.listUpdateError[currentLang],
        res.error || res.message || undefined
      );
      return;
    }

    if (isCurrentlySaved) {
      activeSavedListIds = activeSavedListIds.filter((id) => id !== String(listId));
      toastSuccess(translations.feedback.removedFromList[currentLang], listName);
    } else {
      activeSavedListIds = [...activeSavedListIds, String(listId)];
      toastSuccess(translations.feedback.savedToList[currentLang], listName);
    }

    await invalidateAll();
  }

  async function handleInlineCreateList() {
    if (!inlineListName.trim() || !profileId) return;

    const name = inlineListName.trim();
    const res = await api.createList(profileId, name);

    if (res.message === 'Success') {
      const updatedLists = await api.getLists(profileId);
      data.userLists = updatedLists.lists || [];
      const created = (updatedLists.lists || []).find((l: any) => l.name === name);

      if (created && anime?._id) {
        const added = await api.addAnimeToList(anime._id, created._id);
        if (!added.error && (added.status ?? 200) < 400) {
          activeSavedListIds = [...activeSavedListIds, String(created._id)];
        }
      }

      inlineListName = '';
      isCreatingListInline = false;
      toastSuccess(translations.feedback.listCreated[currentLang], name);
      await invalidateAll();
    } else {
      toastError(
        translations.feedback.listCreateError[currentLang],
        res.error || res.message || undefined
      );
    }
  }

  async function handleLike() {
    if (!profileId || !anime?._id) {
      toastInfo(
        currentLang === 'es' ? 'Elegí un perfil' : 'Pick a profile',
        currentLang === 'es'
          ? 'Necesitás un perfil activo para guardar favoritos.'
          : 'You need an active profile to save favorites.'
      );
      return;
    }

    const wasLiked = isLiked;
    isLiked = !isLiked;
    likePulse = true;

    const res = await api.likeAnime(anime._id, profileId);

    if (res.error || (res.status ?? 200) >= 400) {
      isLiked = wasLiked;
      toastError(
        translations.feedback.favoriteError[currentLang],
        res.error || res.message || undefined
      );
      return;
    }

    toastSuccess(
      isLiked
        ? translations.feedback.favoriteAdded[currentLang]
        : translations.feedback.favoriteRemoved[currentLang]
    );
  }
</script>

<svelte:head>
  <title>{anime?.name || 'Anime'} - Mitteiru</title>
</svelte:head>

{#if !anime}
  <div class="max-w-7xl mx-auto px-6 pt-40 text-center py-20">
    <h1 class="text-3xl font-bold text-gray-300">Anime no encontrado</h1>
    <a href="/directory" class="text-indigo-400 mt-4 inline-block font-semibold">Volver al directorio</a>
  </div>
{:else}
  <div class="relative w-full pb-20">
    <!-- Blurred Background Hero Banner -->
    <div class="absolute inset-0 w-full h-[80vh] min-h-[600px] overflow-hidden pointer-events-none">
      <img
        src={anime.image || anime.horizontalImage || anime.cover || fallbackHero}
        alt="Background"
        class="w-full h-full object-cover opacity-25 filter blur-sm"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/80 to-transparent"></div>
      <div class="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/50 to-transparent"></div>
    </div>

    <!-- Main Detail Container -->
    <div class="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 flex flex-col md:flex-row gap-8 lg:gap-10">
      <!-- Left: Poster (Cover 2:3) & Main Actions -->
      <div class="w-full md:w-72 shrink-0 flex flex-col gap-4">
        <img
          src={anime.cover || anime.image || fallbackPoster}
          alt={anime.name}
          class="w-full aspect-[2/3] object-cover rounded-2xl shadow-[0_0_40px_rgba(79,70,229,0.2)] border border-white/10"
        />

        <!-- Guardar en lista: botón con perfil activo, si no un acceso a login o selección de perfil -->
        {#if canManageLists}
          <Button
            variant={savedListNames.length > 0 ? 'primary' : 'primary'}
            fullWidth
            onclick={() => (isListModalOpen = true)}
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            {#if savedListNames.length > 0}
              En lista: {savedListNames[0]}
            {:else}
              {translations.animePage.selectList[currentLang]}
            {/if}
          </Button>
        {:else}
          <a
            href={saveListCtaHref}
            class="group flex w-full items-center gap-3 rounded-xl border border-dashed border-indigo-500/40 bg-indigo-500/5 px-4 py-2.5 text-left transition-colors hover:border-indigo-400/70 hover:bg-indigo-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
          >
            <svg class="h-5 w-5 shrink-0 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <span class="min-w-0 leading-tight">
              <span class="block text-sm font-bold text-indigo-100 transition-colors group-hover:text-white">
                {data?.user
                  ? translations.animePage.saveListCtaProfile[currentLang]
                  : translations.animePage.saveListCtaLogin[currentLang]}
              </span>
              <span class="mt-0.5 block text-xs font-medium text-indigo-300/80 transition-colors group-hover:text-indigo-200">
                {translations.animePage.saveListCtaHint[currentLang]}
              </span>
            </span>
          </a>
        {/if}
      </div>

      <!-- Right: Details & Metadata -->
      <div class="w-full flex-1 flex flex-col pt-2 md:pt-4">
        <!-- Badges -->
        <div class="flex flex-wrap items-center gap-3 mb-4 text-xs font-semibold">
          <Badge
            variant={anime.onGoing ? 'releasing' : 'finished'}
            text={anime.onGoing ? 'Releasing' : 'Finished'}
          />
          <Badge text={`Episodios: ${episodes.length}`} />
          {#if anime.studio}
            <Badge text={anime.studio} />
          {/if}
          {#if anime.releaseYear}
            <Badge text={anime.releaseYear} />
          {/if}
          {#if sourcesEnabled && anime.sourceId}
            <Badge text={`Fuente: ${anime.sourceId}`} />
          {/if}
        </div>

        <h1 class="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-1 text-white">
          {anime.name}
        </h1>
        {#if anime.japaneseName}
          <p class="text-lg sm:text-xl text-gray-400 font-medium mb-6">
            {anime.japaneseName}
          </p>
        {/if}

        <!-- Genres -->
        {#if anime.genres && anime.genres.length > 0}
          <div class="flex flex-wrap gap-2 mb-6">
            {#each anime.genres as genre}
              <span class="px-3 py-1 bg-white/5 border border-white/10 text-gray-300 text-sm rounded-lg backdrop-blur-sm">
                {genre}
              </span>
            {/each}
          </div>
        {/if}

        <!-- Synopsis rendered with Markdown -->
        <div class="mb-8 max-w-3xl">
          <Markdown content={anime.synopsis || 'Sin descripción disponible para este anime.'} />
        </div>

        <!-- Secondary Actions (Like Button) -->
        <div class="flex items-center gap-4 mt-auto">
          <button
            onclick={handleLike}
            type="button"
            class="w-12 h-12 flex items-center justify-center rounded-full transition-colors border border-white/10 backdrop-blur-md cursor-pointer {isLiked
              ? 'bg-red-500/20 text-red-500 border-red-500/30'
              : 'bg-white/10 hover:bg-red-500/20 text-gray-400 hover:text-red-400'}"
            aria-label="Añadir a Favoritos"
            aria-pressed={isLiked}
          >
            <svg
              class="w-6 h-6 fill-current {likePulse ? 'animate-heart-pop' : ''}"
              viewBox="0 0 24 24"
              onanimationend={() => (likePulse = false)}
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </button>
          <span class="text-sm text-gray-400 font-medium">
            {isLiked ? translations.animePage.inFavorites[currentLang] : translations.animePage.addFavorite[currentLang]}
          </span>
        </div>
      </div>
    </div>

    <hr class="max-w-7xl mx-auto border-white/10 my-12" />

    <!-- Episodes Section -->
    <section id="episodes" class="max-w-7xl mx-auto px-4 sm:px-6 mb-16 relative z-20 scroll-mt-24">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-4">
          <h2 class="text-2xl font-bold text-white">
            {translations.animePage.episodes[currentLang]} ({episodes.length})
          </h2>
          <!-- Toggle View Buttons -->
          <div class="flex items-center bg-gray-900 rounded-lg p-1 border border-white/10 text-xs font-medium">
            <button
              onclick={() => (episodeViewMode = 'slides')}
              type="button"
              class="px-3 py-1.5 rounded-md transition-colors cursor-pointer {episodeViewMode === 'slides' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white'}"
            >
              {translations.animePage.slides[currentLang]}
            </button>
            <button
              onclick={() => (episodeViewMode = 'grid')}
              type="button"
              class="px-3 py-1.5 rounded-md transition-colors cursor-pointer {episodeViewMode === 'grid' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white'}"
            >
              {translations.animePage.grid[currentLang]}
            </button>
          </div>
        </div>

        {#if episodeViewMode === 'slides' && episodes.length > 0 && (canScrollPrev || canScrollNext)}
          <div class="flex items-center gap-2">
            <button
              type="button"
              onclick={() => scrollCarousel(-1)}
              disabled={!canScrollPrev}
              aria-label="Ver episodios anteriores"
              class="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-gray-300 transition-colors cursor-pointer hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white/5 disabled:hover:text-gray-300"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onclick={() => scrollCarousel(1)}
              disabled={!canScrollNext}
              aria-label="Ver episodios siguientes"
              class="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-gray-300 transition-colors cursor-pointer hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white/5 disabled:hover:text-gray-300"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        {/if}
      </div>

      {#if episodes.length > 0}
        {#if episodeViewMode === 'slides'}
          <!-- Horizontal Scroll Container -->
          <div
            bind:this={carouselEl}
            role="group"
            aria-label="Carrusel de episodios"
            class="flex overflow-x-auto gap-5 no-scrollbar pb-4 snap-x snap-mandatory cursor-grab {isDragging
              ? 'select-none cursor-grabbing'
              : ''}"
            onscroll={updateCarouselState}
            onclickcapture={handleCarouselClick}
            onpointerdown={handleDragStart}
            ondragstart={(event) => event.preventDefault()}
          >
            {#each episodes as episode}
              <EpisodeCard {episode} animeId={anime._id} layout="slides" />
            {/each}
          </div>
        {:else}
          <!-- Grid Container -->
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 items-stretch">
            {#each episodes as episode}
              <EpisodeCard {episode} animeId={anime._id} layout="grid" />
            {/each}
          </div>
        {/if}
      {:else}
        <div class="bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-gray-400">
          {translations.animePage.noEpisodes[currentLang]}
        </div>
      {/if}
    </section>

    <!-- Reviews Section -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 relative z-20">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-white">
          {translations.animePage.reviews[currentLang]} ({reviews.length})
        </h2>
        {#if profileId}
        <Button variant="secondary" size="sm" onclick={goToWriteReview}>
          + {translations.animePage.addReview[currentLang]}
        </Button>
        {/if}
      </div>

      {#if reviews.length > 0}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          {#each reviews as review}
            <div
              role="button"
              tabindex="0"
              onclick={() => goToReview(review)}
              onkeydown={(e) => e.key === 'Enter' && goToReview(review)}
              class="group bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 transition-all hover:bg-white/10 hover:border-indigo-500/40 hover:shadow-[0_8px_30px_rgba(79,70,229,0.15)] cursor-pointer"
            >
              <div class="flex items-start gap-4">
                <img
                  src={review.profileImage || 'https://i.pravatar.cc/150?img=32'}
                  alt={review.profileName}
                  class="w-12 h-12 rounded-full object-cover border border-white/20 shrink-0"
                />
                <div class="flex-1 min-w-0">
                  <h4 class="text-white font-bold text-base leading-tight group-hover:text-indigo-300 transition-colors line-clamp-2">
                    {review.title}
                  </h4>
                  <div class="flex items-center gap-2 mt-1 mb-3">
                    <span class="text-indigo-400 text-sm font-semibold truncate">{review.profileName || 'Usuario'}</span>
                    <span class="text-gray-500 text-xs shrink-0">• {new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p class="text-gray-300 text-sm leading-relaxed line-clamp-3">
                    {reviewExcerpt(review)}
                  </p>
                  <span class="inline-flex items-center gap-1 mt-4 text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 transition-colors">
                    {translations.animePage.readFullReview[currentLang]}
                    <svg class="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-gray-400">
          {translations.animePage.noReviews[currentLang]}
        </div>
      {/if}
    </section>
  </div>

  <!-- MODAL: Manage Anime Lists -->
  {#if canManageLists}
  <Modal isOpen={isListModalOpen} title="Guardar en tus Listas" onclose={() => (isListModalOpen = false)}>
    <div class="mt-2 space-y-4">
      <p class="text-xs text-gray-400">
        Elige en qué lista deseas incluir <strong class="text-white">{anime.name}</strong>.
      </p>

      <div class="space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
        {#if userLists.length > 0}
          {#each userLists as list (list._id)}
            {@const isSaved = activeSavedListIds.includes(String(list._id))}
            <div
              class="flex items-center justify-between p-4 rounded-2xl border transition-all {isSaved
                ? 'bg-indigo-600/20 border-indigo-500 text-white'
                : 'bg-black/30 border-white/10 text-gray-300 hover:bg-white/5'}"
            >
              <div class="flex items-center gap-2">
                <span class="font-bold text-sm">{list.name}</span>
                {#if isSaved}
                  <span class="bg-indigo-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    ✓ Guardado aquí
                  </span>
                {/if}
              </div>

              <Button
                variant={isSaved ? 'danger' : 'primary'}
                size="sm"
                disabled={isAddingList}
                onclick={() => handleToggleList(list._id)}
              >
                {isSaved ? 'Quitar' : '+ Añadir'}
              </Button>
            </div>
          {/each}
        {:else}
          <p class="text-xs text-gray-400 text-center py-4">No tienes listas creadas aún.</p>
        {/if}
      </div>

      <!-- Inline Create List Form -->
      {#if isCreatingListInline}
        <div class="pt-4 border-t border-white/10 space-y-3">
          <input
            type="text"
            bind:value={inlineListName}
            placeholder="Nombre de la nueva lista..."
            class="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div class="flex gap-2">
            <Button variant="secondary" size="sm" fullWidth onclick={() => (isCreatingListInline = false)}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" fullWidth disabled={!inlineListName.trim()} onclick={handleInlineCreateList}>
              Crear y Guardar
            </Button>
          </div>
        </div>
      {:else}
        <button
          onclick={() => (isCreatingListInline = true)}
          type="button"
          class="w-full py-2.5 text-center text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors border border-dashed border-indigo-500/30 rounded-xl hover:bg-indigo-500/10 cursor-pointer"
        >
          + Crear una nueva lista
        </button>
      {/if}
    </div>
  </Modal>
  {/if}
{/if}
