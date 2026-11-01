<script lang="ts">
  import { api } from '$lib/api/client';
  import Button from '$lib/components/ui/Button.svelte';
  import SourcesPanel from '$lib/components/admin/SourcesPanel.svelte';
  import { toastError, toastSuccess } from '$lib/stores/toast';

  let { data } = $props();
  let initialAnimes = $derived(data?.animes || []);
  let customAnimes = $state<any[]>([]);
  let animes = $derived([...customAnimes, ...initialAnimes]);

  let activeTab = $state<'anime' | 'episode' | 'sources'>('anime');
  let sourcesEnabled = $derived(data?.sourcesEnabled ?? false);
  let isSubmitting = $state(false);
  let statusMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

  // New Anime Form State
  let animeName = $state('');
  let japaneseName = $state('');
  let synopsis = $state('');
  let releaseYear = $state(new Date().getFullYear().toString());
  let studio = $state('');
  let cover = $state('');
  let image = $state('');
  let horizontalImage = $state('');
  let onGoing = $state(1); // 1 = releasing, 0 = finished
  let genresInput = $state('Action, Drama, Slice of Life');

  // New Episode Form State
  let selectedAnimeId = $state('');
  let episodeNumber = $state(1);
  let episodeName = $state('');
  let episodeThumbnail = $state('');
  let episodeLink = $state('');
  let episodeSynopsis = $state('');

  async function handleCreateAnime() {
    if (!animeName.trim() || !synopsis.trim() || !cover.trim()) {
      statusMessage = { type: 'error', text: 'Por favor completa los campos obligatorios (Nombre, Sinopsis y Cover).' };
      return;
    }

    isSubmitting = true;
    statusMessage = null;

    const genresList = genresInput
      .split(',')
      .map((g) => g.trim())
      .filter((g) => g.length > 0);

    const res = await api.createAnime({
      name: animeName.trim(),
      japaneseName: japaneseName.trim(),
      synopsis: synopsis.trim(),
      releaseYear: releaseYear.trim(),
      studio: studio.trim() || 'Estudio',
      cover: cover.trim(),
      image: image.trim() || cover.trim(),
      horizontalImage: horizontalImage.trim() || image.trim() || cover.trim(),
      onGoing,
      genres: genresList
    });

    isSubmitting = false;

    if (
      res.message === 'The anime has been created successfully' ||
      res.message === 'The anime has been updated successfully'
    ) {
      statusMessage = { type: 'success', text: '¡Anime registrado correctamente en la plataforma!' };
      toastSuccess('Anime registrado', animeName.trim());
      const updated = await api.getAllAnimes();
      customAnimes = updated.animes || [];
      animeName = '';
      japaneseName = '';
      synopsis = '';
      cover = '';
      image = '';
      horizontalImage = '';
    } else {
      statusMessage = { type: 'error', text: res.error || res.message || 'Error al guardar el anime.' };
      toastError('No se pudo guardar el anime', res.error || res.message || undefined);
    }
  }

  async function handleCreateEpisode() {
    if (!selectedAnimeId || !episodeNumber || !episodeLink.trim()) {
      statusMessage = { type: 'error', text: 'Selecciona un anime, número de episodio y enlace de video.' };
      return;
    }

    isSubmitting = true;
    statusMessage = null;

    const res = await api.createEpisode(selectedAnimeId, {
      name: episodeName.trim() || `Episodio ${episodeNumber}`,
      episodeNumber: Number(episodeNumber),
      synopsis: episodeSynopsis.trim(),
      thumbnail: episodeThumbnail.trim() || 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=600&auto=format&fit=crop',
      link: episodeLink.trim()
    });

    isSubmitting = false;

    if (res.message === 'The episode was added to the anime') {
      statusMessage = { type: 'success', text: `¡Episodio ${episodeNumber} agregado exitosamente!` };
      toastSuccess('Episodio añadido', `Episodio ${episodeNumber}`);
      episodeName = '';
      episodeLink = '';
      episodeSynopsis = '';
      episodeThumbnail = '';
      episodeNumber += 1;
    } else {
      statusMessage = { type: 'error', text: res.error || res.message || 'Error al añadir el episodio.' };
      toastError('No se pudo añadir el episodio', res.error || res.message || undefined);
    }
  }
</script>

<svelte:head>
  <title>Panel de Administración - Mitteiru</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-20">
  <div class="mb-10 text-center sm:text-left">
    <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
      Panel de Administración
    </h1>
    <p class="text-gray-400 text-sm sm:text-base">
      Gestiona y agrega nuevo contenido a la plataforma Mitteiru.
    </p>
  </div>

  <!-- Tab Switcher -->
  <div class="flex flex-wrap items-center gap-2 mb-8 bg-white/5 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 w-fit">
    <button
      onclick={() => {
        activeTab = 'anime';
        statusMessage = null;
      }}
      type="button"
      class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer {activeTab === 'anime'
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
        : 'text-gray-400 hover:text-white hover:bg-white/5'}"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h18M3 16h18" />
      </svg>
      <span>Crear / Editar Anime</span>
    </button>
    <button
      onclick={() => {
        activeTab = 'episode';
        statusMessage = null;
      }}
      type="button"
      class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer {activeTab === 'episode'
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
        : 'text-gray-400 hover:text-white hover:bg-white/5'}"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>Agregar Episodio</span>
    </button>
    {#if sourcesEnabled}
      <button
        onclick={() => {
          activeTab = 'sources';
          statusMessage = null;
        }}
        type="button"
        class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer {activeTab === 'sources'
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
          : 'text-gray-400 hover:text-white hover:bg-white/5'}"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span>Fuentes externas</span>
      </button>
    {/if}
  </div>

  <!-- Alert Notification -->
  {#if statusMessage}
    <div
      class="mb-6 p-4 rounded-2xl border font-medium text-sm transition-all {statusMessage.type === 'success'
        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
        : 'bg-red-500/10 border-red-500/30 text-red-400'}"
    >
      {statusMessage.text}
    </div>
  {/if}

  <!-- TAB 1: NUEVO ANIME -->
  {#if activeTab === 'anime'}
    <form
      onsubmit={(e) => {
        e.preventDefault();
        handleCreateAnime();
      }}
      class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl"
    >
      <h2 class="text-xl font-bold text-white mb-4">Información General del Anime</h2>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label for="anime-name" class="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
            Nombre del Anime *
          </label>
          <input
            id="anime-name"
            type="text"
            required
            bind:value={animeName}
            placeholder="ej. Bocchi the Rock!"
            class="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label for="anime-jp-name" class="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
            Nombre en Japonés
          </label>
          <input
            id="anime-jp-name"
            type="text"
            bind:value={japaneseName}
            placeholder="ej. ぼっち・ざ・ろっく！"
            class="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <label for="anime-synopsis" class="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
          Sinopsis *
        </label>
        <textarea
          id="anime-synopsis"
          required
          bind:value={synopsis}
          rows="4"
          placeholder="Escribe el argumento o resumen del anime..."
          class="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        ></textarea>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div>
          <label for="anime-year" class="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
            Año de Estreno
          </label>
          <input
            id="anime-year"
            type="text"
            bind:value={releaseYear}
            placeholder="ej. 2024"
            class="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label for="anime-studio" class="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
            Estudio de Animación
          </label>
          <input
            id="anime-studio"
            type="text"
            bind:value={studio}
            placeholder="ej. CloverWorks, MAPPA"
            class="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label for="anime-ongoing" class="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
            Estado de Emisión
          </label>
          <select
            id="anime-ongoing"
            bind:value={onGoing}
            class="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value={1}>En emisión (Releasing)</option>
            <option value={0}>Finalizado (Finished)</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label for="anime-cover" class="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
            URL Cover / Poster (Vertical 2:3) *
          </label>
          <input
            id="anime-cover"
            type="url"
            required
            bind:value={cover}
            placeholder="https://.../poster.jpg"
            class="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label for="anime-image" class="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
            URL Banner Horizontal (Background / Hero)
          </label>
          <input
            id="anime-image"
            type="url"
            bind:value={image}
            placeholder="https://.../banner.jpg"
            class="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <label for="anime-genres" class="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
          Géneros (separados por comas)
        </label>
        <input
          id="anime-genres"
          type="text"
          bind:value={genresInput}
          placeholder="Action, Drama, Slice of Life, Music"
          class="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <Button variant="primary" type="submit" fullWidth loading={isSubmitting}>
        {isSubmitting ? 'Guardando Anime...' : 'Guardar Anime'}
      </Button>
    </form>
  {/if}

  <!-- TAB 2: NUEVO EPISODIO -->
  {#if activeTab === 'episode'}
    <form
      onsubmit={(e) => {
        e.preventDefault();
        handleCreateEpisode();
      }}
      class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl"
    >
      <h2 class="text-xl font-bold text-white mb-4">Agregar Episodio a un Anime</h2>

      <div>
        <label for="select-anime-id" class="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
          Seleccionar Anime *
        </label>
        <select
          id="select-anime-id"
          required
          bind:value={selectedAnimeId}
          class="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
        >
          <option value="" disabled selected>-- Elige un anime de la lista --</option>
          {#each animes as a}
            <option value={a._id}>{a.name}</option>
          {/each}
        </select>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label for="ep-number" class="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
            Número de Episodio *
          </label>
          <input
            id="ep-number"
            type="number"
            min="1"
            required
            bind:value={episodeNumber}
            class="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label for="ep-name" class="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
            Título del Episodio
          </label>
          <input
            id="ep-name"
            type="text"
            bind:value={episodeName}
            placeholder="ej. 1. Lonely Rolling Loser"
            class="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <label for="ep-link" class="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
          Enlace del Video (MP4 / HLS / Embed URL) *
        </label>
        <input
          id="ep-link"
          type="text"
          required
          bind:value={episodeLink}
          placeholder="https://.../video.mp4"
          class="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label for="ep-thumb" class="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
          URL Thumbnail (Miniatura 16:9)
        </label>
        <input
          id="ep-thumb"
          type="url"
          bind:value={episodeThumbnail}
          placeholder="https://.../thumbnail.jpg"
          class="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label for="ep-synopsis" class="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
          Sinopsis / Descripción del Episodio
        </label>
        <textarea
          id="ep-synopsis"
          bind:value={episodeSynopsis}
          rows="3"
          placeholder="Resumen del capítulo..."
          class="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        ></textarea>
      </div>

      <Button variant="primary" type="submit" fullWidth loading={isSubmitting}>
        {isSubmitting ? 'Añadiendo Episodio...' : 'Añadir Episodio'}
      </Button>
    </form>
  {/if}

  <!-- TAB 3: FUENTES EXTERNAS (solo local) -->
  {#if activeTab === 'sources' && sourcesEnabled}
    <SourcesPanel />
  {/if}
</div>
