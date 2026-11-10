<script lang="ts">
  import { language, translations } from '$lib/i18n';
  import { goto } from '$app/navigation';
  import { navigating, page } from '$app/state';
  import type { Anime } from '$lib/types';
  import AnimeCard from '$lib/components/anime/AnimeCard.svelte';
  import AnimeGridSkeleton from '$lib/components/anime/AnimeGridSkeleton.svelte';
  import Pagination from '$lib/components/ui/Pagination.svelte';
  import CustomSelect from '$lib/components/ui/CustomSelect.svelte';
  import Container from '$lib/components/ui/Container.svelte';
  import PageHeader from '$lib/components/ui/PageHeader.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Sheet from '$lib/components/ui/Sheet.svelte';

  let { data } = $props();
  let currentLang = $derived($language);

  // Read initial filters from URL
  const urlParams = new URLSearchParams(page.url.search);
  const initialFilters = {
    genre: urlParams.get('genre') || '',
    status: urlParams.get('status') || '',
    year: urlParams.get('year') || '',
    studio: urlParams.get('studio') || '',
    sort: urlParams.get('sort') || 'newest',
  };

  // Filters State - synced with URL
  let selectedGenre = $state(initialFilters.genre);
  let selectedStatus = $state(initialFilters.status);
  let selectedYear = $state(initialFilters.year);
  let selectedStudio = $state(initialFilters.studio);
  let sortBy = $state(initialFilters.sort);

  // Filtros móviles: se editan en una hoja y se aplican al confirmar.
  let isFilterSheetOpen = $state(false);
  let draftGenre = $state(initialFilters.genre);
  let draftStatus = $state(initialFilters.status);
  let draftYear = $state(initialFilters.year);
  let draftStudio = $state(initialFilters.studio);

  // Server data
  let animes = $derived<Anime[]>(data?.animes || []);
  let allGenres = $derived<string[]>(data?.genres || []);
  let pagination = $derived(data?.pagination || {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 15,
    hasNextPage: false,
    hasPrevPage: false,
  });
  let savedAnimeListsMap = $derived(data?.savedAnimeListsMap || {});

  // Feedback al cambiar filtros o página sin salir de la ruta.
  let pendingFilters = $derived(
    navigating.to?.url.pathname === page.url.pathname &&
      navigating.to?.url.search !== page.url.search
  );
  let showSkeleton = $state(false);

  $effect(() => {
    if (!pendingFilters) {
      showSkeleton = false;
      return;
    }

    const timer = setTimeout(() => {
      showSkeleton = true;
    }, 150);

    return () => clearTimeout(timer);
  });

  // Options for CustomSelect (derived from server data + static options)
  let genreOptions = $derived.by(() => [
    { value: '', label: `${translations.directory.genre[currentLang]}: ${translations.directory.allGenres[currentLang]}` },
    ...allGenres.map((g) => ({ value: g, label: g }))
  ]);

  let statusOptions = $derived.by(() => [
    { value: '', label: `${translations.directory.status[currentLang]}: ${translations.directory.allStatuses[currentLang]}` },
    { value: '0', label: translations.directory.finished[currentLang] },
    { value: '1', label: translations.directory.releasing[currentLang] }
  ]);

  // Year and Studio options are now loaded from server via data
  // We'll compute them from the current page's animes for UI (or could be fetched separately)
  let availableYears = $derived.by(() => {
    const yearsSet = new Set<string>();
    animes.forEach((a: Anime) => {
      if (a.releaseYear) yearsSet.add(a.releaseYear.toString());
    });
    return Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
  });

  let availableStudios = $derived.by(() => {
    const studiosSet = new Set<string>();
    animes.forEach((a: Anime) => {
      if (a.studio) studiosSet.add(a.studio);
    });
    return Array.from(studiosSet).sort();
  });

  let yearOptions = $derived.by(() => [
    { value: '', label: `${translations.directory.year[currentLang]}: ${translations.directory.allYears[currentLang]}` },
    ...availableYears.map((y) => ({ value: y, label: y }))
  ]);

  let studioOptions = $derived.by(() => [
    { value: '', label: `${translations.directory.studio[currentLang]}: ${translations.directory.allStudios[currentLang]}` },
    ...availableStudios.map((s) => ({ value: s, label: s }))
  ]);

  let sortOptions = $derived.by(() => [
    { value: 'newest', label: translations.directory.newest[currentLang] },
    { value: 'popular', label: translations.directory.popular[currentLang] },
    { value: 'score', label: translations.directory.score[currentLang] }
  ]);

  let activeFilterCount = $derived(
    [selectedGenre, selectedStatus, selectedYear, selectedStudio].filter(Boolean).length
  );

  let activeChips = $derived.by(() => {
    const chips: { key: 'genre' | 'status' | 'year' | 'studio'; label: string }[] = [];

    if (selectedGenre) chips.push({ key: 'genre', label: selectedGenre });
    if (selectedStatus) {
      const label =
        statusOptions.find((option) => option.value === selectedStatus)?.label ??
        selectedStatus;
      chips.push({ key: 'status', label });
    }
    if (selectedYear) chips.push({ key: 'year', label: selectedYear });
    if (selectedStudio) chips.push({ key: 'studio', label: selectedStudio });

    return chips;
  });

  function openFilters() {
    draftGenre = selectedGenre;
    draftStatus = selectedStatus;
    draftYear = selectedYear;
    draftStudio = selectedStudio;
    isFilterSheetOpen = true;
  }

  function applyFilters() {
    selectedGenre = draftGenre;
    selectedStatus = draftStatus;
    selectedYear = draftYear;
    selectedStudio = draftStudio;
    isFilterSheetOpen = false;
    updateURLAndReload();
  }

  function resetDraft() {
    draftGenre = '';
    draftStatus = '';
    draftYear = '';
    draftStudio = '';
  }

  function removeFilter(key: 'genre' | 'status' | 'year' | 'studio') {
    if (key === 'genre') selectedGenre = '';
    if (key === 'status') selectedStatus = '';
    if (key === 'year') selectedYear = '';
    if (key === 'studio') selectedStudio = '';
    updateURLAndReload();
  }

  function updateURLAndReload() {
    const params = new URLSearchParams();
    if (selectedGenre) params.set('genre', selectedGenre);
    if (selectedStatus) params.set('status', selectedStatus);
    if (selectedYear) params.set('year', selectedYear);
    if (selectedStudio) params.set('studio', selectedStudio);
    if (sortBy !== 'newest') params.set('sort', sortBy);
    // Always reset to page 1 when filters change
    goto(`/directory?${params.toString()}`, { replaceState: true });
  }

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams(page.url.search);
    params.set('page', newPage.toString());
    goto(`/directory?${params.toString()}`, { replaceState: true });
  }

  function clearFilters() {
    selectedGenre = '';
    selectedStatus = '';
    selectedYear = '';
    selectedStudio = '';
    sortBy = 'newest';
    goto('/directory');
  }
</script>

<svelte:head>
  <title>Directory - Mitteiru</title>
</svelte:head>

<div class="pt-28 sm:pt-32 pb-20">
  <Container>
    <PageHeader
      title={translations.directory.title[currentLang]}
      subtitle={translations.directory.subtitle[currentLang]}
      eyebrow={currentLang === 'es' ? 'Catálogo' : 'Catalog'}
    />

    <!-- Advanced Filters Bar -->
    <div
      class="mb-10 hidden flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl isolate z-20 backdrop-blur-xl sm:p-6 md:flex"
    >
      <div class="flex flex-wrap gap-3 sm:gap-4 items-center flex-1">
        <!-- Genre Select -->
        <CustomSelect
          bind:value={selectedGenre}
          options={genreOptions}
          placeholder={translations.directory.genre[currentLang]}
          onchange={updateURLAndReload}
          class="min-w-[180px] sm:min-w-[200px]"
          searchable={true}
        />

        <!-- Status Select -->
        <CustomSelect
          bind:value={selectedStatus}
          options={statusOptions}
          placeholder={translations.directory.status[currentLang]}
          onchange={updateURLAndReload}
          class="min-w-[160px] sm:min-w-[180px]"
          searchable={true}
        />

        <!-- Studio Select -->
        <CustomSelect
          bind:value={selectedStudio}
          options={studioOptions}
          placeholder={translations.directory.studio[currentLang]}
          onchange={updateURLAndReload}
          class="min-w-[180px] sm:min-w-[200px]"
          searchable={true}
        />

        <!-- Year Select -->
        <CustomSelect
          bind:value={selectedYear}
          options={yearOptions}
          placeholder={translations.directory.year[currentLang]}
          onchange={updateURLAndReload}
          class="min-w-[140px] sm:min-w-[160px]"
          searchable={true}
        />
      </div>

      <!-- Sort By -->
      <div class="flex items-center gap-2">
        <span class="text-xs text-gray-400 font-semibold uppercase tracking-wider">
          {translations.directory.sort[currentLang]}
        </span>
        <CustomSelect
          bind:value={sortBy}
          options={sortOptions}
          placeholder={translations.directory.sort[currentLang]}
          onchange={updateURLAndReload}
          class="min-w-[140px]"
        />
      </div>
    </div>

    <!-- Mobile Filter Bar -->
    <div class="sticky top-14 z-30 -mx-4 mb-6 border-y border-white/10 bg-gray-950/90 px-4 py-3 backdrop-blur-xl md:hidden">
      <div class="flex items-center gap-2">
        <button
          type="button"
          onclick={openFilters}
          class="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-semibold text-gray-200 transition-colors hover:border-indigo-500/50 hover:bg-white/10"
        >
          <svg class="h-4 w-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M7 12h10M10 18h4" />
          </svg>
          {translations.directory.filters[currentLang]}
          {#if activeFilterCount > 0}
            <span class="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[11px] font-bold text-white">
              {activeFilterCount}
            </span>
          {/if}
        </button>

        <CustomSelect
          bind:value={sortBy}
          options={sortOptions}
          placeholder={translations.directory.sort[currentLang]}
          onchange={updateURLAndReload}
          class="min-w-0 flex-1"
        />
      </div>

      {#if activeChips.length > 0}
        <div class="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
          {#each activeChips as chip (chip.key)}
            <button
              type="button"
              onclick={() => removeFilter(chip.key)}
              class="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-200 transition-colors hover:bg-indigo-500/20"
              aria-label={`${translations.directory.removeFilter[currentLang]}: ${chip.label}`}
            >
              {chip.label}
              <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Results Info -->
    <div class="mb-6 flex items-center justify-between text-sm text-gray-400">
      <span class="flex items-center gap-2">
        {pagination.totalItems} {translations.directory.resultsFound[currentLang] || 'resultados encontrados'}
        {#if pendingFilters}
          <span class="inline-flex items-center gap-1.5 text-indigo-400">
            <span class="motion-essential h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
            {currentLang === 'es' ? 'Actualizando…' : 'Updating…'}
          </span>
        {/if}
      </span>
      <span>
        {translations.directory.page[currentLang] || 'Página'} {pagination.currentPage} {translations.directory.of[currentLang] || 'de'} {pagination.totalPages}
      </span>
    </div>

    <!-- Anime Grid -->
    {#if showSkeleton}
      <AnimeGridSkeleton
        count={pagination.itemsPerPage || 15}
        class="mb-12 grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-5"
      />
    {:else if animes.length > 0}
      <div class="mb-12 grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-5">
        {#each animes as anime, index (anime._id)}
          <AnimeCard
            {anime}
            {index}
            savedListName={savedAnimeListsMap[anime._id]}
            badgeText={anime.onGoing && !savedAnimeListsMap[anime._id] ? 'Releasing' : ''}
            badgeVariant="watching"
          />
        {/each}
      </div>
    {:else}
      <EmptyState
        variant="search"
        title={translations.directory.noResults[currentLang]}
        description={currentLang === 'es'
          ? 'Probá quitando algún filtro o explorando todo el catálogo.'
          : 'Try removing a filter or browsing the whole catalog.'}
      >
        {#snippet action()}
          <Button variant="secondary" size="sm" onclick={clearFilters}>
            {currentLang === 'es' ? 'Limpiar filtros' : 'Clear filters'}
          </Button>
        {/snippet}
      </EmptyState>
    {/if}

    <!-- Pagination -->
    {#if pagination.totalPages > 1}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
      />
    {/if}
  </Container>
</div>

<!-- Mobile Filters Sheet -->
<Sheet
  bind:open={isFilterSheetOpen}
  title={translations.directory.filters[currentLang]}
  onclose={() => (isFilterSheetOpen = false)}
>
  <div class="space-y-3">
    <CustomSelect
      bind:value={draftGenre}
      options={genreOptions}
      placeholder={translations.directory.genre[currentLang]}
      class="min-w-0"
      searchable
    />

    <CustomSelect
      bind:value={draftStatus}
      options={statusOptions}
      placeholder={translations.directory.status[currentLang]}
      class="min-w-0"
      searchable
    />

    <CustomSelect
      bind:value={draftStudio}
      options={studioOptions}
      placeholder={translations.directory.studio[currentLang]}
      class="min-w-0"
      searchable
    />

    <CustomSelect
      bind:value={draftYear}
      options={yearOptions}
      placeholder={translations.directory.year[currentLang]}
      class="min-w-0"
      searchable
    />

    <div class="flex gap-3 pt-2">
      <Button variant="secondary" fullWidth onclick={resetDraft}>
        {translations.directory.clearFilters[currentLang]}
      </Button>
      <Button variant="primary" fullWidth onclick={applyFilters}>
        {translations.directory.applyFilters[currentLang]}
      </Button>
    </div>
  </div>
</Sheet>
