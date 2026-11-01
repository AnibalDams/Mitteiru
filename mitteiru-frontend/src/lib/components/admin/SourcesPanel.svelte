<script lang="ts">
  import { onMount } from 'svelte';
  import { api } from '$lib/api/client';
  import { toastError, toastSuccess } from '$lib/stores/toast';
  import type {
    SourceInfo,
    SourceAnime,
    SourceAnimeDetails,
    SourceEpisode,
    SourceImportResult
  } from '$lib/types';

  let sources = $state<SourceInfo[]>([]);
  let selectedSourceId = $state('');
  let selectedSource = $derived(sources.find((source) => source.id === selectedSourceId));

  let query = $state('');
  let catalogSort = $state<'popular' | 'latest'>('popular');
  let page = $state(1);
  let hasNextPage = $state(false);
  let results = $state<SourceAnime[]>([]);
  let lastMode = $state<'search' | 'catalog'>('catalog');
  let loadingSources = $state(true);
  let loadingResults = $state(false);
  let loadingDetails = $state(false);
  let importing = $state(false);
  let error = $state<string | null>(null);
  let notice = $state<string | null>(null);

  let selectedAnime = $state<SourceAnimeDetails | null>(null);
  let episodes = $state<SourceEpisode[]>([]);
  let selectedNumbers = $state<number[]>([]);
  let importResult = $state<SourceImportResult | null>(null);

  let isAdmin = $state(false);
  let showLogin = $state(false);
  let adminEmail = $state('');
  let adminPassword = $state('');
  let loginError = $state<string | null>(null);
  let loggingIn = $state(false);

  onMount(async () => {
    const session = await api.adminSession();
    isAdmin = session.authenticated === true;
    await loadSources();
  });

  async function loadSources() {
    loadingSources = true;
    error = null;
    const response = await api.getSources();
    loadingSources = false;

    if (response.message !== 'success' || !response.sources) {
      error = response.error || response.message || 'No se pudieron cargar las fuentes';
      return;
    }

    sources = response.sources;
    if (!selectedSourceId && sources.length > 0) {
      selectedSourceId = sources[0].id;
    }
  }

  function selectSource(sourceId: string) {
    selectedSourceId = sourceId;
    results = [];
    selectedAnime = null;
    episodes = [];
    selectedNumbers = [];
    importResult = null;
    error = null;
    notice = null;
    page = 1;
  }

  async function runSearch(resetPage = true) {
    if (!selectedSourceId || !query.trim()) return;
    if (resetPage) page = 1;
    await loadResults('search');
  }

  async function loadCatalog(sort: 'popular' | 'latest', resetPage = true) {
    if (!selectedSourceId) return;
    catalogSort = sort;
    if (resetPage) page = 1;
    await loadResults('catalog');
  }

  async function loadResults(kind: 'search' | 'catalog') {
    loadingResults = true;
    error = null;
    notice = null;
    importResult = null;
    lastMode = kind;

    const response =
      kind === 'search'
        ? await api.searchSource(selectedSourceId, query.trim(), page)
        : await api.getSourceCatalog(selectedSourceId, catalogSort, page);

    loadingResults = false;

    if (response.message !== 'success') {
      results = [];
      hasNextPage = false;
      error = response.error || response.message || 'La fuente no respondió';
      return;
    }

    results = response.items ?? [];
    hasNextPage = response.hasNextPage ?? false;
    page = response.page ?? page;

    if (results.length === 0) {
      notice = 'La fuente no devolvió resultados para esta búsqueda.';
    }
  }

  async function changePage(delta: number) {
    const next = page + delta;
    if (next < 1) return;
    page = next;
    await loadResults(lastMode);
  }

  async function openAnime(item: SourceAnime) {
    loadingDetails = true;
    error = null;
    notice = null;
    importResult = null;
    selectedAnime = null;
    episodes = [];
    selectedNumbers = [];

    const [detailsResponse, episodesResponse] = await Promise.all([
      api.getSourceAnime(selectedSourceId, item.externalId),
      api.getSourceEpisodes(selectedSourceId, item.externalId)
    ]);

    loadingDetails = false;

    if (detailsResponse.message !== 'success' || !detailsResponse.anime) {
      error = detailsResponse.error || detailsResponse.message || 'No se pudo abrir el anime';
      return;
    }

    selectedAnime = detailsResponse.anime;
    episodes = episodesResponse.episodes ?? [];
    selectedNumbers = episodes.map((episode) => episode.number);

    if (episodesResponse.message !== 'success') {
      notice =
        episodesResponse.error ||
        'No se pudieron cargar los episodios; puedes importar solo la ficha.';
    }
  }

  function closeAnime() {
    selectedAnime = null;
    episodes = [];
    selectedNumbers = [];
  }

  function toggleEpisode(number: number) {
    selectedNumbers = selectedNumbers.includes(number)
      ? selectedNumbers.filter((value) => value !== number)
      : [...selectedNumbers, number];
  }

  function toggleAllEpisodes() {
    selectedNumbers =
      selectedNumbers.length === episodes.length ? [] : episodes.map((episode) => episode.number);
  }

  async function login() {
    if (!adminEmail.trim() || !adminPassword) {
      loginError = 'Completa email y contraseña.';
      return;
    }

    loggingIn = true;
    loginError = null;
    const response = await api.adminLogin(adminEmail.trim(), adminPassword);
    loggingIn = false;

    if (response.message !== 'success') {
      loginError = response.error || response.message || 'Credenciales inválidas';
      return;
    }

    isAdmin = true;
    adminPassword = '';
    showLogin = false;
    notice = 'Sesión de administrador iniciada.';
  }

  async function logout() {
    await api.adminLogout();
    isAdmin = false;
    notice = 'Sesión de administrador cerrada.';
  }

  async function importSelected() {
    if (!selectedAnime) return;
    if (!isAdmin) {
      showLogin = true;
      error = 'Necesitas iniciar sesión como administrador para importar.';
      return;
    }

    importing = true;
    error = null;
    notice = null;
    importResult = null;

    const response = await api.importFromSource(
      selectedSourceId,
      {
        externalId: selectedAnime.externalId,
        importEpisodes: episodes.length > 0 && selectedNumbers.length > 0,
        episodeNumbers: selectedNumbers.length > 0 ? selectedNumbers : undefined
      }
    );

    importing = false;

    if (response.code === 'blocked' || response.status === 401 || response.code === 'unauthorized') {
      isAdmin = false;
      showLogin = true;
      error = 'La sesión de administrador expiró. Inicia sesión de nuevo.';
      return;
    }

    if (!response.animeId) {
      error = response.error || response.message || 'No se pudo importar el anime';
      toastError('La importación falló', error ?? undefined);
      return;
    }

    importResult = {
      message: response.message,
      animeId: response.animeId ?? '',
      createdAnime: response.createdAnime ?? false,
      episodesImported: response.episodesImported ?? 0,
      episodesUpdated: response.episodesUpdated ?? 0,
      episodesSkipped: response.episodesSkipped ?? 0,
      sourceId: response.sourceId ?? selectedSourceId,
      externalId: response.externalId ?? selectedAnime.externalId,
      warnings: response.warnings ?? []
    };
    notice = response.message;
    toastSuccess(
      'Importación completada',
      `${response.episodesImported ?? 0} episodios nuevos · ${response.episodesUpdated ?? 0} actualizados`
    );
  }

  async function checkHealth(sourceId: string) {
    const response = await api.getSourceHealth(sourceId);
    if (!response.health) {
      error = response.error || 'No se pudo consultar el estado de la fuente';
      return;
    }

    sources = sources.map((source) =>
      source.id === sourceId ? { ...source, health: response.health } : source
    );
  }

  function healthClass(status?: string): string {
    switch (status) {
      case 'ok':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'degraded':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'blocked':
        return 'bg-orange-500/15 text-orange-300 border-orange-500/30';
      case 'down':
        return 'bg-red-500/15 text-red-300 border-red-500/30';
      default:
        return 'bg-white/5 text-gray-400 border-white/10';
    }
  }
</script>

<div class="space-y-6">
  <!-- Estado de sesión admin -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-4">
    <div>
      <p class="text-sm font-semibold text-white">Sesión de administrador</p>
      <p class="text-xs text-gray-400 mt-1">
        {isAdmin
          ? 'Sesión activa. Ya puedes importar contenido a la base local.'
          : 'Importar requiere autenticación de administrador.'}
      </p>
    </div>
    <div class="flex items-center gap-2">
      {#if isAdmin}
        <button
          type="button"
          onclick={logout}
          class="px-4 py-2 rounded-xl text-sm font-bold bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          Cerrar sesión
        </button>
      {:else}
        <button
          type="button"
          onclick={() => (showLogin = !showLogin)}
          class="px-4 py-2 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors cursor-pointer"
        >
          Iniciar sesión
        </button>
      {/if}
    </div>
  </div>

  {#if showLogin && !isAdmin}
    <form
      class="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4"
      onsubmit={(event) => {
        event.preventDefault();
        login();
      }}
    >
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label for="admin-email" class="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
            Email admin
          </label>
          <input
            id="admin-email"
            type="email"
            bind:value={adminEmail}
            class="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label for="admin-password" class="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
            Contraseña
          </label>
          <input
            id="admin-password"
            type="password"
            bind:value={adminPassword}
            class="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
      {#if loginError}
        <p class="text-sm text-red-400">{loginError}</p>
      {/if}
      <button
        type="submit"
        disabled={loggingIn}
        class="px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors cursor-pointer"
      >
        {loggingIn ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  {/if}

  <!-- Fuentes -->
  <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 space-y-4">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h2 class="text-xl font-bold text-white">Fuentes externas</h2>
        <p class="text-sm text-gray-400 mt-1">
          Busca, previsualiza e importa animes y episodios desde sitios externos.
        </p>
      </div>
      <button
        type="button"
        onclick={loadSources}
        class="px-4 py-2 rounded-xl text-sm font-bold bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
      >
        Recargar
      </button>
    </div>

    {#if loadingSources}
      <p class="text-sm text-gray-400">Cargando fuentes...</p>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        {#each sources as source (source.id)}
          <div
            class="rounded-2xl border p-4 transition-colors {source.id === selectedSourceId
              ? 'border-indigo-500/60 bg-indigo-500/10'
              : 'border-white/10 bg-black/20'}"
          >
            <div class="flex items-start justify-between gap-3">
              <button
                type="button"
                onclick={() => selectSource(source.id)}
                class="text-left cursor-pointer"
              >
                <p class="font-bold text-white">
                  {source.name}
                  <span class="ml-2 text-[10px] uppercase tracking-widest text-gray-500">{source.language}</span>
                </p>
                <p class="text-xs text-gray-400 mt-1">{source.description}</p>
                <p class="text-[11px] text-gray-500 mt-2 break-all">{source.baseUrl}</p>
              </button>
              <div class="flex flex-col items-end gap-2">
                <span class="px-2 py-1 rounded-lg border text-[10px] font-bold uppercase {healthClass(source.health?.status)}">
                  {source.health?.status ?? 'sin estado'}
                </span>
                <button
                  type="button"
                  onclick={() => checkHealth(source.id)}
                  class="text-[11px] text-indigo-300 hover:text-indigo-200 cursor-pointer"
                >
                  Verificar
                </button>
              </div>
            </div>
            {#if source.health?.message}
              <p class="text-[11px] text-gray-500 mt-2">{source.health.message}</p>
            {/if}
            {#if source.health?.hint}
              <p class="text-[11px] text-amber-300 mt-1">{source.health.hint}</p>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Alertas -->
  {#if error}
    <div class="p-4 rounded-2xl border bg-red-500/10 border-red-500/30 text-red-300 text-sm">
      {error}
    </div>
  {/if}
  {#if notice}
    <div class="p-4 rounded-2xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-300 text-sm">
      {notice}
    </div>
  {/if}
  {#if importResult}
    <div class="p-4 rounded-2xl border bg-indigo-500/10 border-indigo-500/30 text-indigo-200 text-sm space-y-1">
      <p class="font-bold">{importResult.message}</p>
      <p>
        Anime: {importResult.createdAnime ? 'creado' : 'actualizado'} · Episodios nuevos:
        {importResult.episodesImported} · actualizados: {importResult.episodesUpdated}
        {#if importResult.episodesSkipped > 0}· omitidos: {importResult.episodesSkipped}{/if}
      </p>
      {#each importResult.warnings as warning}
        <p class="text-amber-300">{warning}</p>
      {/each}
    </div>
  {/if}

  <!-- Búsqueda / catálogo -->
  <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 space-y-4">
    <form
      class="flex flex-col sm:flex-row gap-3"
      onsubmit={(event) => {
        event.preventDefault();
        runSearch();
      }}
    >
      <input
        type="search"
        bind:value={query}
        placeholder="Buscar en {selectedSource?.name ?? 'la fuente'}..."
        class="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <button
        type="submit"
        disabled={loadingResults || !query.trim()}
        class="px-5 py-3 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors cursor-pointer"
      >
        {loadingResults ? 'Buscando...' : 'Buscar'}
      </button>
    </form>

    <div class="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onclick={() => loadCatalog('popular')}
        disabled={loadingResults}
        class="px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer {catalogSort === 'popular' && !query.trim()
          ? 'bg-indigo-600 border-indigo-500 text-white'
          : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'}"
      >
        Populares
      </button>
      <button
        type="button"
        onclick={() => loadCatalog('latest')}
        disabled={loadingResults}
        class="px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer {catalogSort === 'latest' && !query.trim()
          ? 'bg-indigo-600 border-indigo-500 text-white'
          : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'}"
      >
        Recientes
      </button>
      <span class="text-xs text-gray-500 ml-auto">Página {page}</span>
    </div>

    {#if loadingResults}
      <p class="text-sm text-gray-400">Consultando la fuente...</p>
    {:else if results.length > 0}
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {#each results as item (item.externalId)}
          <button
            type="button"
            onclick={() => openAnime(item)}
            class="text-left group bg-black/30 border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-colors cursor-pointer"
          >
            <div class="aspect-[2/3] bg-gray-800 overflow-hidden">
              {#if item.poster}
                <img
                  src={item.poster}
                  alt={item.title}
                  loading="lazy"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              {:else}
                <div class="w-full h-full flex items-center justify-center text-gray-600 text-xs px-2 text-center">
                  Sin portada
                </div>
              {/if}
            </div>
            <div class="p-3 space-y-1">
              <p class="text-sm font-bold text-white line-clamp-2">{item.title}</p>
              <p class="text-[11px] text-gray-500">
                {item.year ?? '—'} {#if item.episodeCount}· {item.episodeCount} eps{/if}
              </p>
            </div>
          </button>
        {/each}
      </div>

      <div class="flex items-center justify-between pt-2">
        <button
          type="button"
          onclick={() => changePage(-1)}
          disabled={page <= 1}
          class="px-4 py-2 rounded-xl text-sm font-bold bg-white/5 border border-white/10 text-gray-300 disabled:opacity-40 hover:bg-white/10 transition-colors cursor-pointer"
        >
          Anterior
        </button>
        <button
          type="button"
          onclick={() => changePage(1)}
          disabled={!hasNextPage}
          class="px-4 py-2 rounded-xl text-sm font-bold bg-white/5 border border-white/10 text-gray-300 disabled:opacity-40 hover:bg-white/10 transition-colors cursor-pointer"
        >
          Siguiente
        </button>
      </div>
    {/if}
  </div>

  <!-- Previsualización e importación -->
  {#if loadingDetails}
    <div class="bg-white/5 border border-white/10 rounded-3xl p-6">
      <p class="text-sm text-gray-400">Cargando ficha y episodios...</p>
    </div>
  {:else if selectedAnime}
    <div class="bg-white/5 backdrop-blur-xl border border-indigo-500/30 rounded-3xl p-6 space-y-5">
      <div class="flex items-start justify-between gap-4">
        <div class="flex gap-4">
          {#if selectedAnime.poster}
            <img
              src={selectedAnime.poster}
              alt={selectedAnime.title}
              class="w-24 h-36 object-cover rounded-xl border border-white/10"
            />
          {/if}
          <div>
            <h3 class="text-xl font-bold text-white">{selectedAnime.title}</h3>
            {#if selectedAnime.altTitle}
              <p class="text-sm text-gray-400">{selectedAnime.altTitle}</p>
            {/if}
            <p class="text-xs text-gray-500 mt-2">
              {selectedAnime.year ?? '—'} · {selectedAnime.type ?? 'Anime'} · {selectedAnime.status}
              {#if selectedAnime.studio}· {selectedAnime.studio}{/if}
            </p>
            {#if selectedAnime.genres.length > 0}
              <p class="text-xs text-gray-400 mt-1">{selectedAnime.genres.join(' · ')}</p>
            {/if}
            {#if selectedAnime.synopsis}
              <p class="text-sm text-gray-400 mt-3 line-clamp-4">{selectedAnime.synopsis}</p>
            {/if}
          </div>
        </div>
        <button
          type="button"
          onclick={closeAnime}
          class="px-3 py-2 rounded-xl text-xs font-bold bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors cursor-pointer"
        >
          Cerrar
        </button>
      </div>

      {#if episodes.length > 0}
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <p class="text-sm font-bold text-white">
              Episodios ({selectedNumbers.length}/{episodes.length} seleccionados)
            </p>
            <button
              type="button"
              onclick={toggleAllEpisodes}
              class="text-xs font-bold text-indigo-300 hover:text-indigo-200 cursor-pointer"
            >
              {selectedNumbers.length === episodes.length ? 'Quitar todos' : 'Seleccionar todos'}
            </button>
          </div>
          <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-72 overflow-y-auto custom-scrollbar p-1">
            {#each episodes as episode (episode.externalId)}
              <button
                type="button"
                onclick={() => toggleEpisode(episode.number)}
                class="px-2 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer {selectedNumbers.includes(episode.number)
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-black/30 border-white/10 text-gray-400 hover:bg-white/10'}"
                title={episode.title ?? `Episodio ${episode.number}`}
              >
                {episode.number}
              </button>
            {/each}
          </div>
        </div>
      {:else}
        <p class="text-sm text-gray-400">
          Esta fuente no devolvió episodios. Puedes importar solo la ficha del anime.
        </p>
      {/if}

      <button
        type="button"
        onclick={importSelected}
        disabled={importing}
        class="w-full px-5 py-3 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors cursor-pointer"
      >
        {importing
          ? 'Importando...'
          : selectedNumbers.length > 0
            ? `Importar anime + ${selectedNumbers.length} episodios`
            : 'Importar solo el anime'}
      </button>
    </div>
  {/if}
</div>
