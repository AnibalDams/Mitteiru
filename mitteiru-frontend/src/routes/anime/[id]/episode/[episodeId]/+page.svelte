<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { language, translations } from '$lib/i18n';
  import { api } from '$lib/api/client';
  import { env } from '$env/dynamic/public';
  import { invalidateAll, goto } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Markdown from '$lib/components/ui/Markdown.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import Sheet from '$lib/components/ui/Sheet.svelte';
  import CommentSection from '$lib/components/comments/CommentSection.svelte';
  import VideoPlayer from '$lib/components/ui/VideoPlayer.svelte';
  import DashPlayer from '$lib/components/ui/DashPlayer.svelte';
  import type { Episode, Anime, SourceServer } from '$lib/types';

  let { data } = $props();
  let currentLang = $derived($language);

  let anime = $derived(data?.anime);
  let episodes = $derived(data?.episodes || []);
  let episode = $derived(data?.episode);
  let comments = $derived(data?.comments || []);
  let profileId = $derived(data?.profileId);
  let sourcesEnabled = $derived(data?.sourcesEnabled ?? false);

  // Player state
  let showEpisodeDetails = $state(false);
  let isEpisodesSheetOpen = $state(false);
  let currentEpisodeIndex = $derived(episodes.findIndex((ep: Episode) => String(ep._id) === String(episode?._id)));

  // Fuente externa: selector de servidores (si el episodio fue importado)
  let selectedServerIndex = $state(0);
  let fetchedServers = $state<SourceServer[]>([]);
  let servers = $derived<SourceServer[]>(
    fetchedServers.length > 0 ? fetchedServers : (episode?.servers ?? [])
  );
  let legacyPlayback = $derived(episode?.legacyPlayback === true);
  let playbackAllowed = $derived(sourcesEnabled || legacyPlayback);
  const configuredEmbedHosts = (env.PUBLIC_EMBED_HOSTS ?? '')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
  let allowedEmbedHosts = $derived(
    sourcesEnabled ? configuredEmbedHosts : ['jkanime.net']
  );
  let activeServer = $derived(servers[selectedServerIndex] ?? servers[0] ?? null);
  let activeSrc = $derived(
    playbackAllowed
      ? (activeServer?.url || episode?.link || '')
      : (episode?.external ? '' : (episode?.link || ''))
  );
  let isLinkServer = $derived(playbackAllowed && activeServer?.kind === 'link');
  let isDashServer = $derived(sourcesEnabled && activeServer?.kind === 'dash');
  let fallbackUrl = $derived(
    playbackAllowed
      ? (servers.find((server) => server.kind === 'link')?.url ??
          (episode?.link?.includes('/watch/') ? episode.link : undefined))
      : undefined
  );
  let activeExternal = $derived(
    playbackAllowed &&
      (activeServer
        ? activeServer.kind === 'embed' || activeServer.kind === 'unknown'
        : (episode?.external ?? legacyPlayback))
  );

  $effect(() => {
    const id = episode?._id;
    if (id) selectedServerIndex = 0;
  });

  // Profile info for comments
  let profileName = $derived(data?.profileName);
  let profileImage = $derived(data?.profileImage);

  const fallbackPoster = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600&auto=format&fit=crop';
  const fallbackHero = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=2574&auto=format&fit=crop';

  onMount(async () => {
    // Add to history when episode page loads
    if (profileId && anime?._id && episode?.episodeNumber) {
      try {
        await api.addToHistory(profileId, anime._id, episode.episodeNumber);
      } catch (e) {
        console.error('Failed to add to history:', e);
      }
    }

    // Resolver servidores externos en el cliente (no bloquea el SSR).
    // AnimeOnsen firma URLs de playback por sesión; se refrescan en cada visita.
    const needsServerRefresh =
      !episode?.servers?.length ||
      episode?.sourceId === 'animeonsen';

    if (
      sourcesEnabled &&
      episode &&
      needsServerRefresh &&
      episode.sourceId &&
      episode.externalId &&
      episode.animeExternalId
    ) {
      try {
        const response = await api.getSourceServers(
          episode.sourceId,
          episode.animeExternalId,
          episode.externalId
        );
        fetchedServers = response.servers ?? [];
      } catch {
        // La fuente puede estar bloqueada/caída; se usa el link guardado.
      }
    }
  });

  function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString();
  }

  function getPrevEpisode(): Episode | undefined {
    if (currentEpisodeIndex > 0) return episodes[currentEpisodeIndex - 1];
    return undefined;
  }

  function getNextEpisode(): Episode | undefined {
    if (currentEpisodeIndex < episodes.length - 1) return episodes[currentEpisodeIndex + 1];
    return undefined;
  }

  function goToEpisode(ep: Episode) {
    if (!ep?._id) return;
    goto(`/anime/${anime?._id}/episode/${ep._id}`);
  }

  async function handleNextEpisode() {
    const nextEp = getNextEpisode();
    if (nextEp) goToEpisode(nextEp);
  }

  async function handlePrevEpisode() {
    const prevEp = getPrevEpisode();
    if (prevEp) goToEpisode(prevEp);
  }

  function openEpisodeDetails() {
    showEpisodeDetails = true;
  }

  function closeEpisodeDetails() {
    showEpisodeDetails = false;
  }
</script>

<svelte:head>
  <title>{episode?.name || `Episodio ${episode?.episodeNumber}`} - {anime?.name} - Mitteiru</title>
</svelte:head>

{#if !anime || !episode}
  <div class="max-w-7xl mx-auto px-6 pt-40 text-center py-20">
    <h1 class="text-3xl font-bold text-gray-300">Episodio no encontrado</h1>
    <a href="/directory" class="text-indigo-400 mt-4 inline-block font-semibold">Volver al directorio</a>
  </div>
{:else}
  {#snippet episodeList()}
    <div class="space-y-2">
      {#each episodes as ep (ep._id)}
        <button
          type="button"
          onclick={() => {
            isEpisodesSheetOpen = false;
            goToEpisode(ep);
          }}
          class="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all {String(ep._id) === String(episode._id)
            ? 'border border-indigo-500/50 bg-indigo-600/30'
            : 'border border-white/5 bg-black/30 hover:border-white/10 hover:bg-white/5'}"
        >
          <div class="relative h-10 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-800">
            <img
              src={ep.thumbnail || fallbackPoster}
              alt={ep.name}
              class="h-full w-full object-cover"
            />
            <span class="absolute bottom-0 right-0 rounded-bl-lg bg-black/80 px-1 py-0.5 text-[10px] font-bold text-white">
              {ep.episodeNumber}
            </span>
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium {String(ep._id) === String(episode._id) ? 'text-indigo-300' : 'text-white'}">
              {ep.name || `Episodio ${ep.episodeNumber}`}
            </p>
            <p class="mt-0.5 truncate text-xs text-gray-500">
              Ep. {ep.episodeNumber}
            </p>
          </div>
          {#if String(ep._id) === String(episode._id)}
            <div class="h-2 w-2 rounded-full bg-indigo-400"></div>
          {/if}
        </button>
      {/each}
    </div>
  {/snippet}

  <div class="relative w-full min-h-screen pb-20 bg-gray-950">
    <!-- Blurred Background Hero Banner -->
    <div class="absolute inset-0 w-full h-[50vh] min-h-[400px] overflow-hidden pointer-events-none">
      <img
        src={anime.image || anime.horizontalImage || anime.cover || fallbackHero}
        alt="Background"
        class="w-full h-full object-cover opacity-25 filter blur-sm"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/80 to-transparent"></div>
      <div class="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/50 to-transparent"></div>
    </div>

    <!-- Main Content -->
    <div class="relative z-20 mx-auto flex max-w-7xl flex-col gap-6 px-4 pt-16 sm:px-6 sm:pt-24 md:gap-8">
      
      <!-- Episode Header: debajo del player en móvil -->
      <div class="order-2 flex flex-col justify-between gap-4 md:order-1 md:flex-row md:items-center md:gap-6">
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-3 flex-wrap">
            <Badge
              variant={anime.onGoing ? 'releasing' : 'finished'}
              text={anime.onGoing ? 'Releasing' : 'Finished'}
            />
            <Badge text={`Episodio ${episode.episodeNumber}`} />
            {#if playbackAllowed && episode.sourceId}
              <Badge text={`Fuente: ${episode.sourceId}`} />
            {/if}
            {#if anime.studio}
              <Badge text={anime.studio} />
            {/if}
          </div>
          
          <h1 class="mb-1 text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl md:mb-2 md:text-5xl">
            {episode.name || `Episodio ${episode.episodeNumber}`}
          </h1>
          
          <p class="text-base font-medium text-gray-400 sm:text-lg">
            {anime.name}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button variant="secondary" size="lg" onclick={openEpisodeDetails}>
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Detalles
          </Button>

          <Button
            variant="secondary"
            size="lg"
            class="lg:hidden"
            onclick={() => (isEpisodesSheetOpen = true)}
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            {translations.animePage.openEpisodeList[currentLang]}
          </Button>
        </div>
      </div>

<!-- Video Player Section -->
      {#if !playbackAllowed && episode?.externalUnavailable}
        <div class="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Este episodio proviene de AnimeOnsen y no está disponible en este entorno.
        </div>
      {/if}
      <section class="relative order-1 md:order-2">
        {#key activeSrc}
          <div in:fade={{ duration: 180 }}>
            {#if isDashServer}
              <DashPlayer
                src={activeSrc}
                title={episode.name || `Episodio ${episode.episodeNumber}`}
                fallbackUrl={fallbackUrl}
              />
            {:else if isLinkServer}
              <div class="relative w-full aspect-video bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-4 p-6 text-center">
                <p class="text-lg font-bold text-white">
                  Este episodio se reproduce en {episode?.sourceId ?? 'la fuente externa'}
                </p>
                <p class="text-sm text-gray-400 max-w-xl">
                  La fuente usa su propio reproductor. Ábrelo en una pestaña nueva para evitar bloqueos de cookies de terceros.
                </p>
                <a
                  href={activeSrc}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors"
                >
                  Abrir episodio en la fuente
                </a>
              </div>
            {:else}
              <VideoPlayer
                src={activeSrc}
                title={episode.name || `Episodio ${episode.episodeNumber}`}
                poster={episode.thumbnail}
                external={activeExternal}
                allowExternal={playbackAllowed}
                allowedHosts={allowedEmbedHosts}
                onPrevEpisode={handlePrevEpisode}
                onNextEpisode={handleNextEpisode}
                hasPrev={!!getPrevEpisode()}
                hasNext={!!getNextEpisode()}
              />
            {/if}
          </div>
        {/key}

        {#if legacyPlayback && episode?.link}
          <div class="mt-3 text-sm">
            <a
              href={episode.link}
              target="_blank"
              rel="noopener noreferrer"
              class="text-indigo-300 underline underline-offset-4 hover:text-indigo-200"
            >
              Abrir en JKAnime
            </a>
          </div>
        {/if}

        {#if servers.length > 0}
          <div class="mt-4 flex flex-wrap items-center gap-2">
            <span class="text-xs uppercase tracking-widest text-gray-500 mr-1">Servidores</span>
            {#each servers as server, index (server.id)}
              <button
                type="button"
                onclick={() => (selectedServerIndex = index)}
                class="px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer {selectedServerIndex === index
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'}"
                title={server.url}
              >
                {server.name}
              </button>
            {/each}
            {#if activeSrc && !isLinkServer && !isDashServer}
              <a
                href={activeSrc}
                target="_blank"
                rel="noopener noreferrer"
                class="px-3 py-1.5 rounded-lg text-xs font-bold border border-white/10 bg-white/5 text-indigo-300 hover:bg-white/10 transition-colors"
              >
                Abrir en nueva pestaña
              </a>
            {/if}
          </div>
        {/if}

        <!-- Episode Navigation (below player) -->
        <div class="flex items-center justify-between mt-4 gap-4">
          <Button 
            variant="outline" 
            size="md"
            onclick={handlePrevEpisode}
            disabled={!getPrevEpisode()}
            class="min-w-0 flex-1"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span class="flex items-center gap-1">
              <span>Anterior</span>
              {#if getPrevEpisode()}
                <span class="hidden text-xs opacity-75 sm:inline">Ep. {getPrevEpisode()!.episodeNumber}</span>
              {/if}
            </span>
          </Button>

          <Button 
            variant="outline" 
            size="md"
            onclick={handleNextEpisode}
            disabled={!getNextEpisode()}
            class="min-w-0 flex-1"
          >
            <span class="flex w-full items-center justify-end gap-1">
              <span>Siguiente</span>
              {#if getNextEpisode()}
                <span class="hidden text-xs opacity-75 sm:inline">Ep. {getNextEpisode()!.episodeNumber}</span>
              {/if}
              <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </Button>
        </div>
      </section>

      <hr class="order-3 border-white/10" />

      <!-- Episode Synopsis & Details -->
      <section class="order-4 grid gap-6 sm:gap-8 lg:grid-cols-3">
        <div class="lg:col-span-2">
          <div class="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-bold text-white">Sinopsis del Episodio</h2>
              <Button variant="ghost" size="sm" onclick={openEpisodeDetails}>
                Ver detalles completos
              </Button>
            </div>
            
            <Markdown content={episode.synopsis || 'Sin sinopsis disponible para este episodio.'} />
          </div>

          <!-- Comments Section -->
          <div class="mt-8">
            <CommentSection 
              episodeId={episode._id}
              profileId={profileId}
              profileName={profileName}
              profileImage={profileImage}
            />
          </div>
        </div>

        <!-- Episode List Sidebar (solo desktop) -->
        <aside class="hidden lg:col-span-1 lg:block">
          <div class="custom-scrollbar sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-lg">
            <h3 class="mb-4 text-lg font-bold text-white">
              {translations.animePage.episodes[currentLang]} ({episodes.length})
            </h3>

            {@render episodeList()}
          </div>
        </aside>
      </section>
    </div>
  </div>

  <!-- Episode Details Modal -->
  <Modal isOpen={showEpisodeDetails} title={`Episodio ${episode?.episodeNumber}: ${episode?.name}`} onclose={closeEpisodeDetails} size="lg">
    <div class="space-y-6">
      <div class="flex items-center gap-4">
        <div class="w-24 h-13.5 flex-shrink-0 relative rounded-xl overflow-hidden bg-gray-800 border border-white/10">
          <img
            src={episode.thumbnail || fallbackPoster}
            alt={episode.name}
            class="w-full h-full object-cover"
          />
        </div>
        <div class="flex-1">
          <h4 class="text-xl font-bold text-white">{episode.name || `Episodio ${episode.episodeNumber}`}</h4>
          <p class="text-gray-400 mt-1">{anime.name}</p>
          <div class="flex items-center gap-3 mt-2 text-sm text-gray-500">
            <span>Episodio #{episode.episodeNumber}</span>
            <span>•</span>
            <span>De {episodes.length} episodios</span>
          </div>
        </div>
      </div>

      <div class="pt-4 border-t border-white/10">
        <h5 class="font-bold text-white mb-2">Sinopsis completa</h5>
        <Markdown content={episode.synopsis || 'Sin sinopsis disponible para este episodio.'} />
      </div>

      {#if episode.link}
        <div class="pt-4 border-t border-white/10">
          <h5 class="font-bold text-white mb-2">Enlace de reproducción</h5>
          <p class="text-gray-400 text-sm break-all">{episode.link}</p>
        </div>
      {/if}
    </div>
  </Modal>

  <Sheet
    bind:open={isEpisodesSheetOpen}
    title={`${translations.animePage.episodes[currentLang]} (${episodes.length})`}
    onclose={() => (isEpisodesSheetOpen = false)}
  >
    {@render episodeList()}
  </Sheet>
{/if}