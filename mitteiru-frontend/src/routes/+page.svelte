<script lang="ts">
  import { goto } from '$app/navigation';
  import { language, translations } from '$lib/i18n';
  import AnimeCard from '$lib/components/anime/AnimeCard.svelte';
  import MediaRow from '$lib/components/anime/MediaRow.svelte';
  import Button from '$lib/components/ui/Button.svelte';

  let { data } = $props();
  let currentLang = $derived($language);

  let featured = $derived(data?.featuredAnime);
  let latest = $derived(data?.latestAnimes || []);
  let popular = $derived(data?.popularAnimes || []);
  let mostLiked = $derived(data?.mostLikedAnimes || []);
  let savedAnimeListsMap = $derived(data?.savedAnimeListsMap || {});

  const cardWidth =
    'w-[42vw] max-w-[180px] shrink-0 snap-start md:w-auto md:max-w-none';

  const fallbackHeroImage = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=2574&auto=format&fit=crop';
</script>

<svelte:head>
  <title>Mitteiru - Tu plataforma de anime</title>
</svelte:head>

<!-- Hero Section -->
<header class="relative flex h-[62svh] min-h-[440px] w-full items-end overflow-hidden md:h-[85vh] md:min-h-[600px] md:items-center">
  <!-- Background Image -->
  <img
    src={featured?.image || featured?.horizontalImage || featured?.cover || fallbackHeroImage}
    alt={featured?.name || 'Featured Anime'}
    class="hero-zoom absolute inset-0 h-full w-full object-cover object-center opacity-40"
    fetchpriority="high"
  />

  <!-- Dual Gradients for Perfect Legibility -->
  <div class="absolute inset-0 z-10 bg-gradient-to-r from-gray-950 via-gray-950/90 to-transparent"></div>
  <div class="absolute inset-0 z-10 bg-gradient-to-t from-gray-950 via-transparent to-transparent"></div>

  <!-- Hero Details Container -->
  <div class="relative z-20 mx-auto w-full max-w-7xl px-4 pb-10 pt-14 sm:px-6 md:py-0 md:pt-20">
    <div class="max-w-2xl">
      <h1 class="animate-slide-up mb-2 line-clamp-2 break-words text-3xl font-extrabold tracking-tight text-white drop-shadow-lg sm:text-5xl md:text-6xl lg:text-7xl">
        {featured?.name || 'Bocchi the Rock!'}
      </h1>

      {#if featured?.japaneseName}
        <p
          class="animate-slide-up mb-3 line-clamp-1 text-sm font-medium tracking-wide text-gray-400 sm:mb-4 sm:text-lg"
          style="animation-delay: 60ms"
        >
          {featured.japaneseName}
        </p>
      {/if}

      <!-- Genre Pills -->
      {#if featured?.genres && featured.genres.length > 0}
        <div
          class="animate-slide-up mb-4 flex flex-wrap gap-2 text-xs font-semibold sm:mb-6 sm:text-sm"
          style="animation-delay: 90ms"
        >
          {#each featured.genres.slice(0, 3) as genre}
            <span class="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-gray-200 backdrop-blur-md">
              {genre}
            </span>
          {/each}
        </div>
      {/if}

      <!-- Synopsis -->
      <p
        class="animate-slide-up mb-6 line-clamp-2 text-sm leading-relaxed text-gray-300 sm:mb-8 sm:line-clamp-3 sm:text-base md:text-lg"
        style="animation-delay: 140ms"
      >
        {featured?.synopsis ||
          'Hitori Gotou, "Bocchi-chan," is a girl who\'s so introverted and shy around people that she\'d always start her conversations with "Ah..."'}
      </p>

      <!-- CTA Buttons -->
      <div class="animate-slide-up flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4" style="animation-delay: 200ms">
        {#if featured}
          <Button
            variant="primary"
            size="lg"
            class="w-full sm:w-auto"
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
            class="w-full sm:w-auto"
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
<div class="relative z-20 mx-auto -mt-6 max-w-7xl space-y-10 px-4 py-8 sm:-mt-10 sm:space-y-16 sm:px-6 sm:py-12">
  <!-- Latest Releases -->
  <MediaRow
    title={translations.home.latestReleases[currentLang]}
    viewAllHref="/directory"
    viewAllLabel={translations.home.viewAll[currentLang]}
  >
    {#each latest.slice(0, 6) as anime, index (anime._id)}
      <AnimeCard
        {anime}
        {index}
        class={cardWidth}
        savedListName={savedAnimeListsMap[anime._id]}
        badgeText={index === 0 && !savedAnimeListsMap[anime._id] ? 'NEW' : ''}
        badgeVariant="new"
      />
    {/each}
  </MediaRow>

  <!-- Popular Anime Section -->
  {#if popular.length > 0}
    <MediaRow
      title={translations.home.mostPopular[currentLang]}
      viewAllHref="/directory"
      viewAllLabel={translations.home.viewAll[currentLang]}
      delay={80}
    >
      {#each popular.slice(0, 6) as anime, index (anime._id)}
        <AnimeCard
          {anime}
          {index}
          class={cardWidth}
          savedListName={savedAnimeListsMap[anime._id]}
        />
      {/each}
    </MediaRow>
  {/if}

  <!-- Most Liked Anime Section with Heart Likes Badge -->
  {#if mostLiked.length > 0}
    <MediaRow
      title={translations.home.mostLiked[currentLang]}
      viewAllHref="/directory"
      viewAllLabel={translations.home.viewAll[currentLang]}
      delay={160}
    >
      {#each mostLiked.slice(0, 6) as anime, index (anime._id)}
        <AnimeCard
          {anime}
          {index}
          class={cardWidth}
          savedListName={savedAnimeListsMap[anime._id]}
          likesCount={anime.likes || (anime.views ? Math.floor(anime.views / 5) : 340)}
        />
      {/each}
    </MediaRow>
  {/if}
</div>
