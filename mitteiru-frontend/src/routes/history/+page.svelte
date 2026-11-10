<script lang="ts">
  import { language, translations } from '$lib/i18n';
  import { goto } from '$app/navigation';
  import { navigating, page } from '$app/state';
  import type { Anime } from '$lib/types';
  import AnimeCard from '$lib/components/anime/AnimeCard.svelte';
  import AnimeGridSkeleton from '$lib/components/anime/AnimeGridSkeleton.svelte';
  import CustomSelect from '$lib/components/ui/CustomSelect.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import PageHeader from '$lib/components/ui/PageHeader.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';

  let { data } = $props();
  let currentLang = $derived($language);

  let history = $derived(data?.history || []);
  let initialFilters = $derived(data?.filters || { from: '', to: '', range: 'all' });

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

  let selectedRange = $state(initialFilters.range);
  let fromDate = $state(initialFilters.from);
  let toDate = $state(initialFilters.to);
  let showCustomRange = $state(selectedRange === 'custom');

  $effect(() => {
    selectedRange = initialFilters.range;
    fromDate = initialFilters.from;
    toDate = initialFilters.to;
    showCustomRange = initialFilters.range === 'custom';
  });

  let rangeOptions = $derived.by(() => [
    { value: 'all', label: translations.history.allTime[currentLang] },
    { value: '7d', label: translations.history.last7Days[currentLang] },
    { value: '30d', label: translations.history.last30Days[currentLang] },
    { value: '90d', label: translations.history.last90Days[currentLang] },
    { value: 'custom', label: translations.history.customRange[currentLang] }
  ]);

  function formatDate(timestamp: number): string {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString(currentLang === 'es' ? 'es-ES' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function getWatchedAt(item: any): number {
    return item.watchedAt || item.createdAt || item.date || 0;
  }

  function getEpisodeNumber(item: any): number {
    return item.episodeNumber || item.episode || item.progress?.ep || 1;
  }

  // Client-side filtering for instant feedback
  let filteredHistory = $derived.by(() => {
    if (!history.length) return [];
    
    const now = Date.now();
    
    return history.filter((item) => {
      const watchedAt = getWatchedAt(item);
      if (!watchedAt) return true;
      
      if (selectedRange && selectedRange !== 'all' && selectedRange !== 'custom') {
        let cutoff = 0;
        switch (selectedRange) {
          case '7d':
            cutoff = now - 7 * 24 * 60 * 60 * 1000;
            break;
          case '30d':
            cutoff = now - 30 * 24 * 60 * 60 * 1000;
            break;
          case '90d':
            cutoff = now - 90 * 24 * 60 * 60 * 1000;
            break;
        }
        return watchedAt >= cutoff;
      }
      
      if (selectedRange === 'custom') {
        const fromTime = fromDate ? new Date(fromDate).getTime() : 0;
        const toTime = toDate ? new Date(toDate).getTime() + 24 * 60 * 60 * 1000 : now;
        return watchedAt >= fromTime && watchedAt <= toTime;
      }
      
      return true; // 'all' - no filter
    });
  });

  function updateURL() {
    const params = new URLSearchParams();
    if (selectedRange && selectedRange !== 'all') {
      params.set('range', selectedRange);
    } else if (selectedRange === 'custom') {
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);
    }
    goto(`/history?${params.toString()}`, { replaceState: true });
  }

  function handleRangeChange(range: string) {
    selectedRange = range;
    showCustomRange = range === 'custom';
    if (range !== 'custom') {
      fromDate = '';
      toDate = '';
    }
    updateURL();
  }

  function handleDateChange() {
    if (fromDate || toDate) {
      updateURL();
    }
  }

  function clearFilters() {
    selectedRange = 'all';
    fromDate = '';
    toDate = '';
    showCustomRange = false;
    updateURL();
  }

  function hasActiveFilters() {
    return selectedRange !== 'all' || fromDate || toDate;
  }
</script>

<svelte:head>
  <title>History - Mitteiru</title>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 sm:pt-32">
  <!-- Header -->
  <PageHeader
    title={translations.history.title[currentLang]}
    subtitle={translations.history.subtitle[currentLang]}
    eyebrow={currentLang === 'es' ? 'Tu actividad' : 'Your activity'}
  />

  <!-- Filter Bar -->
  <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 mb-10 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shadow-xl">
    <div class="flex flex-wrap gap-3 items-center flex-1">
      <span class="text-xs text-gray-400 font-semibold uppercase tracking-wider hidden sm:inline">
        {translations.history.filter[currentLang]}:
      </span>
      
      <CustomSelect
        bind:value={selectedRange}
        options={rangeOptions}
        placeholder={translations.history.filter[currentLang]}
        onchange={handleRangeChange}
        class="w-full sm:w-auto sm:min-w-[180px]"
        searchable={false}
      />
    </div>

    {#if showCustomRange}
      <div class="flex flex-wrap gap-3 items-center w-full sm:w-auto">
        <div class="flex items-center gap-2">
          <label for="from-date" class="text-xs text-gray-400 font-medium whitespace-nowrap">
            {translations.history.from[currentLang]}
          </label>
          <input
            id="from-date"
            type="date"
            bind:value={fromDate}
            onchange={handleDateChange}
            class="bg-gray-900/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
        <div class="flex items-center gap-2">
          <label for="to-date" class="text-xs text-gray-400 font-medium whitespace-nowrap">
            {translations.history.to[currentLang]}
          </label>
          <input
            id="to-date"
            type="date"
            bind:value={toDate}
            onchange={handleDateChange}
            class="bg-gray-900/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
        <Button variant="secondary" size="sm" onclick={clearFilters}>
          {translations.history.clear[currentLang]}
        </Button>
      </div>
    {:else if hasActiveFilters()}
      <Button variant="secondary" size="sm" onclick={clearFilters}>
        {translations.history.clear[currentLang]}
      </Button>
    {/if}
  </div>

  <!-- Results Info -->
  <div class="mb-6 flex items-center justify-between text-sm text-gray-400">
    <span>
      {#if pendingFilters}
        {currentLang === 'es' ? 'Actualizando…' : 'Updating…'}
      {:else}
        {filteredHistory.length} {filteredHistory.length === 1 
          ? (currentLang === 'es' ? 'resultado' : 'result')
          : (currentLang === 'es' ? 'resultados' : 'results')}
      {/if}
    </span>
  </div>

  <!-- History Grid -->
  {#if showSkeleton}
    <AnimeGridSkeleton
      count={12}
      class="mb-12 grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
    />
  {:else if filteredHistory.length > 0}
    <div class="mb-12 grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {#each filteredHistory as item, index (item.anime?._id || item._id || item.id || item.animeId ? `${item.anime?._id || item._id || item.id || item.animeId}-${item.watchedAt || 0}-${index}` : `history-${index}`)}
        {@const animeObj = item.anime || item}
        {@const watchedAt = getWatchedAt(item)}
        {@const episodeNum = getEpisodeNumber(item)}
        <AnimeCard
          anime={animeObj}
          {index}
          badgeText={watchedAt ? `${translations.history.watchedOn[currentLang]} ${formatDate(watchedAt)}` : ''}
          badgeVariant="watching"
          progress={{ ep: episodeNum, total: animeObj.totalEpisodes || 12, percent: Math.min(100, Math.round((episodeNum / (animeObj.totalEpisodes || 12)) * 100)) }}
        />
      {/each}
    </div>
  {:else}
    <EmptyState
      variant="history"
      title={translations.history.empty[currentLang]}
      description={translations.history.emptySubtitle[currentLang]}
    >
      {#snippet action()}
        <Button variant="primary" size="md" onclick={() => goto('/directory')}>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {currentLang === 'es' ? 'Explorar anime' : 'Browse anime'}
        </Button>
      {/snippet}
    </EmptyState>
  {/if}
</div>