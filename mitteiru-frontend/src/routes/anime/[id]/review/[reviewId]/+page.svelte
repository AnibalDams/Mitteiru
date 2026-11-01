<script lang="ts">
  import { language, translations } from '$lib/i18n';
  import Markdown from '$lib/components/ui/Markdown.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import { goto } from '$app/navigation';

  let { data } = $props();
  let currentLang = $derived($language);

  let anime = $derived(data?.anime);
  let review = $derived(data?.review);

  function formatDate(timestamp: number): string {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function goToAnime() {
    if (!anime?._id) return;
    goto(`/anime/${anime._id}`);
  }

  function goBack() {
    if (!anime?._id) return;
    goto(`/anime/${anime._id}#reviews`);
  }
</script>

<svelte:head>
  <title>{review?.title ? `${review.title} - ${anime?.name || 'Reseña'}` : 'Reseña'} - Mitteiru</title>
</svelte:head>

{#if !anime || !review}
  <div class="max-w-7xl mx-auto px-6 pt-40 text-center py-20">
    <h1 class="text-3xl font-bold text-gray-300">{translations.reviewPage.notFound[currentLang]}</h1>
    <a href="/directory" class="text-indigo-400 mt-4 inline-block font-semibold">Volver al directorio</a>
  </div>
{:else}
  <div class="relative w-full pb-24">
    <!-- Blurred Background -->
    <div class="absolute inset-x-0 top-0 h-[55vh] min-h-[460px] overflow-hidden pointer-events-none">
      <img
        src={anime.image || anime.horizontalImage || anime.cover}
        alt=""
        class="w-full h-full object-cover opacity-20 filter blur-sm"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/80 to-transparent"></div>
    </div>

    <div class="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32">
      <!-- Header -->
      <div class="mb-8">
        <button
          onclick={goBack}
          type="button"
          class="inline-flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer mb-6"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          {translations.reviewPage.backToReviews[currentLang]}
        </button>

        <div class="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 items-start">
          <!-- Main Review Card -->
          <div class="bg-gray-900/70 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
            <!-- Author Bar -->
            <div class="flex flex-wrap items-center justify-between gap-4 px-6 sm:px-8 py-5 border-b border-white/10 bg-white/[0.03]">
              <div class="flex items-center gap-3">
                <img
                  src={review.profileImage || 'https://i.pravatar.cc/150?img=32'}
                  alt={review.profileName}
                  class="w-12 h-12 rounded-full object-cover border-2 border-indigo-500/50"
                />
                <div>
                  <p class="text-white font-bold leading-tight">{review.profileName || 'Usuario'}</p>
                  <p class="text-xs text-gray-500 mt-0.5">
                    {formatDate(review.createdAt)}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <Badge text={anime.releaseYear || 'Anime'} />
                {#if anime.studio}
                  <Badge text={anime.studio} />
                {/if}
              </div>
            </div>

            <!-- Review Content -->
            <div class="px-6 sm:px-8 py-7">
              <h1 class="text-2xl sm:text-4xl font-extrabold text-white leading-tight mb-6">{review.title}</h1>

              <div class="flex items-center gap-2 mb-7">
                <button
                  onclick={goToAnime}
                  type="button"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 transition-colors cursor-pointer"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  {anime.name}
                </button>
                {#if anime.onGoing}
                  <Badge text="En emisión" variant="releasing" />
                {/if}
              </div>

              <div class="border-t border-white/10 pt-7">
                <Markdown content={review.review || 'Esta reseña no tiene contenido.'} />
              </div>
            </div>
          </div>

          <!-- Sidebar: Anime Card -->
          <aside class="space-y-6">
            <div class="bg-gray-900/70 backdrop-blur-xl border border-white/10 rounded-3xl p-4">
              <button
                onclick={goToAnime}
                type="button"
                class="group block w-full text-left cursor-pointer"
              >
                <img
                  src={anime.cover || anime.image}
                  alt={anime.name}
                  class="w-full aspect-[2/3] object-cover rounded-2xl border border-white/10 group-hover:border-indigo-500/50 transition-colors shadow-[0_0_30px_rgba(79,70,229,0.15)]"
                />
                <h3 class="text-white font-bold text-base mt-4 group-hover:text-indigo-300 transition-colors">
                  {anime.name}
                </h3>
                {#if anime.japaneseName}
                  <p class="text-xs text-gray-500 mt-0.5">{anime.japaneseName}</p>
                {/if}
              </button>

              {#if anime.genres && anime.genres.length > 0}
                <div class="flex flex-wrap gap-1.5 mt-4">
                  {#each anime.genres as genre}
                    <span class="px-2 py-0.5 bg-white/5 border border-white/10 text-gray-300 text-[11px] rounded-md">{genre}</span>
                  {/each}
                </div>
              {/if}

              <button
                onclick={goToAnime}
                type="button"
                class="mt-5 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all shadow-lg shadow-indigo-600/30 active:scale-[0.98] cursor-pointer"
              >
                {translations.reviewPage.viewAnime[currentLang]}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  </div>
{/if}