<script lang="ts">
  import { goto } from '$app/navigation';
  import { language, translations } from '$lib/i18n';
  import { reveal } from '$lib/actions/reveal';
  import AnimeCard from '$lib/components/anime/AnimeCard.svelte';
  import Button from '$lib/components/ui/Button.svelte';

  let { data } = $props();
  let currentLang = $derived($language);

  let featured = $derived(data?.featuredAnime);
  let latest = $derived(data?.latestAnimes || []);
  let popular = $derived(data?.popularAnimes || []);
  let mostLiked = $derived(data?.mostLikedAnimes || []);
  let savedAnimeListsMap = $derived(data?.savedAnimeListsMap || {});

  const fallbackHeroImage = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=2574&auto=format&fit=crop';
</script>

<svelte:head>
  <title>Mitteiru - Tu plataforma de anime</title>
</svelte:head>

<!-- Hero Section -->
<header class="relative w-full h-[85vh] min-h-[600px] flex items-center justify-start overflow-hidden">
  <!-- Background Image -->
  <img
    src={featured?.image || featured?.horizontalImage || featured?.cover || fallbackHeroImage}
    alt={featured?.name || 'Featured Anime'}
    class="hero-zoom absolute inset-0 h-full w-full object-cover object-center opacity-40"
    fetchpriority="high"
  />

  <!-- Dual Gradients for Perfect Legibility -->
  <div class="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/90 to-transparent z-10"></div>
  <div class="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent z-10"></div>

  <!-- Hero Details Container -->
  <div class="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 w-full pt-20">
    <div class="max-w-2xl">
      <h1 class="animate-slide-up text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-2 text-white drop-shadow-lg line-clamp-2 break-words">
        {featured?.name || 'Bocchi the Rock!'}
      </h1>

      {#if featured?.japaneseName}
        <p
          class="animate-slide-up text-base sm:text-lg text-gray-400 font-medium mb-4 tracking-wide line-clamp-1"
          style="animation-delay: 60ms"
        >
          {featured.japaneseName}
        </p>
      {/if}

      <!-- Genre Pills -->
      {#if featured?.genres && featured.genres.length > 0}
        <div
          class="animate-slide-up flex flex-wrap gap-2 mb-6 text-xs sm:text-sm font-semibold"
          style="animation-delay: 90ms"
        >
          {#each featured.genres.slice(0, 4) as genre}
            <span class="px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-gray-200">
              {genre}
            </span>
          {/each}
        </div>
      {/if}

      <!-- Synopsis -->
      <p
        class="animate-slide-up text-gray-300 text-sm sm:text-base md:text-lg leading-relaxed mb-8 line-clamp-3"
        style="animation-delay: 140ms"
      >
        {featured?.synopsis ||
          'Hitori Gotou, "Bocchi-chan," is a girl who\'s so introverted and shy around people that she\'d always start her conversations with "Ah..."'}
      </p>

      <!-- CTA Buttons -->
      <div class="animate-slide-up flex items-center gap-4" style="animation-delay: 200ms">
        {#if featured}
          <Button
            variant="primary"
            size="lg"
            onclick={() => goto(`/anime/${featured._id}#episodes`)}
          >
            <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            {translations.hero.watchNow[currentLang]}
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onclick={() => goto(`/anime/${featured._id}`)}
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {translations.hero.moreDetails[currentLang]}
          </Button>
        {/if}
      </div>
    </div>
  </div>
</header>

<!-- Main Catalog Content -->
<div class="max-w-7xl mx-auto px-4 sm:px-6 py-12 relative z-20 -mt-10 space-y-16">
  <!-- Latest Releases -->
  <section use:reveal>
    <div class="flex items-center justify-between mb-8">
      <h2 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
        {translations.home.latestReleases[currentLang]}
      </h2>
      <a href="/directory" class="group inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-sm font-semibold transition-colors">
        {translations.home.viewAll[currentLang]}
        <span class="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true">→</span>
      </a>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
      {#each latest.slice(0, 6) as anime, index (anime._id)}
        <AnimeCard
          {anime}
          {index}
          savedListName={savedAnimeListsMap[anime._id]}
          badgeText={index === 0 && !savedAnimeListsMap[anime._id] ? 'NEW' : ''}
          badgeVariant="new"
        />
      {/each}
    </div>
  </section>

  <!-- Popular Anime Section -->
  {#if popular.length > 0}
    <section use:reveal={{ delay: 80 }}>
      <div class="flex items-center justify-between mb-8">
        <h2 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {translations.home.mostPopular[currentLang]}
        </h2>
        <a href="/directory" class="group inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-sm font-semibold transition-colors">
          {translations.home.viewAll[currentLang]}
          <span class="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true">→</span>
        </a>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
        {#each popular.slice(0, 6) as anime, index (anime._id)}
          <AnimeCard
            {anime}
            {index}
            savedListName={savedAnimeListsMap[anime._id]}
          />
        {/each}
      </div>
    </section>
  {/if}

  <!-- Most Liked Anime Section with Heart Likes Badge -->
  {#if mostLiked.length > 0}
    <section use:reveal={{ delay: 160 }}>
      <div class="flex items-center justify-between mb-8">
        <h2 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {translations.home.mostLiked[currentLang]}
        </h2>
        <a href="/directory" class="group inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-sm font-semibold transition-colors">
          {translations.home.viewAll[currentLang]}
          <span class="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true">→</span>
        </a>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
        {#each mostLiked.slice(0, 6) as anime, index (anime._id)}
          <AnimeCard
            {anime}
            {index}
            savedListName={savedAnimeListsMap[anime._id]}
            likesCount={anime.likes || (anime.views ? Math.floor(anime.views / 5) : 340)}
          />
        {/each}
      </div>
    </section>
  {/if}
</div>>
