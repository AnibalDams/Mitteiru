<script lang="ts">
  import { navigating, page } from '$app/state';
  import AnimeCard from '$lib/components/anime/AnimeCard.svelte';
  import AnimeGridSkeleton from '$lib/components/anime/AnimeGridSkeleton.svelte';
  import SearchBar from '$lib/components/ui/SearchBar.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';

  let { data } = $props();
  let query = $derived(data?.query || '');
  let results = $derived(data?.results || []);
  let savedAnimeListsMap = $derived(data?.savedAnimeListsMap || {});

  let pendingSearch = $derived(
    navigating.to?.url.pathname === page.url.pathname &&
      navigating.to?.url.search !== page.url.search
  );
  let showSkeleton = $state(false);

  $effect(() => {
    if (!pendingSearch) {
      showSkeleton = false;
      return;
    }

    const timer = setTimeout(() => {
      showSkeleton = true;
    }, 150);

    return () => clearTimeout(timer);
  });
</script>

<svelte:head>
  <title>Búsqueda: {query} - Mitteiru</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-20">
  <div class="mb-10">
    <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">
      Resultados para <span class="text-indigo-400">"{query}"</span>
    </h1>
    <p class="text-gray-400 text-sm sm:text-base">
      {#if pendingSearch}
        Buscando…
      {:else}
        Se encontraron {results.length} coincidencias
      {/if}
    </p>
  </div>

  <div class="mb-8 max-w-md">
    <SearchBar placeholder="Buscar otro anime..." initialQuery={query} />
  </div>

  {#if showSkeleton}
    <AnimeGridSkeleton count={10} />
  {:else if results.length > 0}
    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
      {#each results as anime, index (anime._id)}
        <AnimeCard
          {anime}
          {index}
          savedListName={savedAnimeListsMap[anime._id]}
        />
      {/each}
    </div>
  {:else}
    <EmptyState
      variant="search"
      title="No se encontraron animes que coincidan con la búsqueda"
      description="Probá con otro título, revisá la ortografía o explorá el catálogo completo."
    >
      {#snippet action()}
        <a
          href="/directory"
          class="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-600/30 transition-colors hover:bg-indigo-500"
        >
          Explorar todo el directorio
        </a>
      {/snippet}
    </EmptyState>
  {/if}
</div>
