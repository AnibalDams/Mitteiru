<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { env } from '$env/dynamic/public';
  import Button from '$lib/components/ui/Button.svelte';
  import Loader from '$lib/components/ui/Loader.svelte';
  import { sanitizeEmbedSrc, sanitizeMediaSrc } from '$lib/utils/embed';

  interface Props {
    src: string;
    title: string;
    external: boolean;
    /** Permite iframes externos; false en producción sin motor de fuentes. */
    allowExternal?: boolean;
    /** Allowlist explícita; si se omite, usa PUBLIC_EMBED_HOSTS. */
    allowedHosts?: string[];
    onPrevEpisode: () => void;
    onNextEpisode: () => void;
    hasPrev: boolean;
    hasNext: boolean;
    isFullscreen?: boolean;
    onToggleFullscreen: () => void;
  }

  let { 
    src, 
    title, 
    external, 
    allowExternal = false,
    allowedHosts,
    onPrevEpisode, 
    onNextEpisode, 
    hasPrev, 
    hasNext, 
    isFullscreen = false, 
    onToggleFullscreen 
  }: Props = $props();

  const DEFAULT_ALLOWED_HOSTS = (env.PUBLIC_EMBED_HOSTS ?? '')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);

  // Iframes: externos solo con allowExternal + allowlist (vacía = ninguno).
  // Video nativo: externos con allowExternal, sin allowlist de host.
  let embedSrc = $derived(
    sanitizeEmbedSrc(src, {
      allowExternal,
      allowedHosts: allowedHosts ?? DEFAULT_ALLOWED_HOSTS
    })
  );
  let mediaSrc = $derived(sanitizeMediaSrc(src, allowExternal));

  // State for native video player (when !external)
  let videoEl: HTMLVideoElement | null = null;
  let isLoading = $state(true);
  let showControls = $state(true);
  let controlsTimeout: number;
  let isPlaying = $state(false);
  let volume = $state(1);
  let isMuted = $state(false);
  let currentTime = $state(0);
  let duration = $state(0);
  let buffered = $state(0);
  let playbackRate = $state(1);
  let isWaiting = $state(false);
  let error: string | null = $state(null);

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || !isFinite(seconds)) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const hideControls = () => {
    if (controlsTimeout) clearTimeout(controlsTimeout);
    controlsTimeout = window.setTimeout(() => {
      showControls = false;
    }, 3000);
  };

  const showControlsFn = () => {
    showControls = true;
    hideControls();
  };

  // Native video event handlers
  const handleVideoLoadStart = () => {
    isLoading = true;
    isWaiting = true;
  };

  const handleVideoLoadedData = () => {
    isLoading = false;
    isWaiting = false;
  };

  const handleVideoWaiting = () => {
    isWaiting = true;
  };

  const handleVideoPlaying = () => {
    isWaiting = false;
    isPlaying = true;
  };

  const handleVideoPause = () => {
    isPlaying = false;
  };

  const handleVideoTimeUpdate = () => {
    if (videoEl) {
      currentTime = videoEl.currentTime;
      duration = videoEl.duration || 0;
    }
  };

  const handleVideoDurationChange = () => {
    if (videoEl) {
      duration = videoEl.duration || 0;
    }
  };

  const handleVideoProgress = () => {
    if (videoEl) {
      buffered = videoEl.buffered.length > 0 
        ? (videoEl.buffered.end(videoEl.buffered.length - 1) / videoEl.duration) * 100 
        : 0;
    }
  };

  const handleVideoError = () => {
    isLoading = false;
    isWaiting = false;
    error = videoEl?.error?.message || 'Error al cargar el video';
  };

  const handleVideoEnded = () => {
    isPlaying = false;
    // Auto-play next episode if available
    if (hasNext) {
      setTimeout(() => onNextEpisode(), 2000);
    }
  };

  const handleVideoRateChange = () => {
    if (videoEl) {
      playbackRate = videoEl.playbackRate;
    }
  };

  const handleVideoVolumeChange = () => {
    if (videoEl) {
      volume = videoEl.volume;
      isMuted = videoEl.muted;
    }
  };

  // Control functions for native video
  const togglePlayPause = () => {
    if (!videoEl) return;
    if (isPlaying || videoEl.currentTime > 0 && !videoEl.paused && !videoEl.ended) {
      videoEl.pause();
    } else {
      videoEl.play().catch(() => {
        // Autoplay blocked, user needs to interact
      });
    }
  };

  const toggleMute = () => {
    if (!videoEl) return;
    videoEl.muted = !videoEl.muted;
  };

  const handleVolumeChange = (value: number) => {
    if (!videoEl) return;
    videoEl.volume = value;
    videoEl.muted = value === 0;
  };

  const handleProgressClick = (e: MouseEvent) => {
    if (!videoEl || !duration) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    videoEl.currentTime = percent * duration;
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    // Don't handle keys if user is typing in an input/textarea
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }
    
    if (!videoEl) return;
    
    switch (e.key) {
      case ' ':
      case 'k':
        e.preventDefault();
        togglePlayPause();
        break;
      case 'f':
        onToggleFullscreen();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        videoEl.currentTime = Math.max(0, videoEl.currentTime - 10);
        break;
      case 'ArrowRight':
        e.preventDefault();
        videoEl.currentTime = Math.min(duration, videoEl.currentTime + 10);
        break;
      case 'ArrowUp':
        e.preventDefault();
        handleVolumeChange(Math.min(1, volume + 0.1));
        break;
      case 'ArrowDown':
        e.preventDefault();
        handleVolumeChange(Math.max(0, volume - 0.1));
        break;
      case 'm':
        toggleMute();
        break;
      case 'Escape':
        if (isFullscreen) onToggleFullscreen();
        break;
      case '>':
      case '.':
        e.preventDefault();
        if (videoEl) videoEl.playbackRate = Math.min(2, playbackRate + 0.25);
        break;
      case '<':
      case ',':
        e.preventDefault();
        if (videoEl) videoEl.playbackRate = Math.max(0.25, playbackRate - 0.25);
        break;
    }
  };

  onMount(() => {
    document.addEventListener('keydown', handleKeyDown);
    hideControls();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (controlsTimeout) clearTimeout(controlsTimeout);
    };
  });

  onDestroy(() => {
    if (controlsTimeout) clearTimeout(controlsTimeout);
  });
</script>

<div class="relative aspect-video w-full bg-black rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_40px_rgba(79,70,229,0.15),_0_8px_32px_rgba(0,0,0,0.4)]"
     role="region"
     aria-label="Reproductor de video"
     onmouseenter={showControlsFn}
     onmouseleave={hideControls}
     onmousemove={showControlsFn}>

  {#if isLoading || isWaiting}
    <div class="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/80">
      <Loader size="lg" />
      <p class="mt-4 text-white/70 text-sm font-medium">
        {isWaiting ? 'Buffering...' : 'Cargando video...'}
      </p>
    </div>
  {/if}

  {#if error}
    <div class="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/95 p-8 text-center">
      <div class="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
        <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <p class="text-white text-lg font-medium mb-2">Error de reproducción</p>
      <p class="text-gray-400 text-sm max-w-md mb-6">{error}</p>
      <Button variant="outline" class="mt-4" onclick={() => videoEl?.load()}>
        Reintentar
      </Button>
    </div>
  {:else if !external}
    <!-- Native Video Player (Direct video files: mp4, mkv, etc.) -->
    <video
      bind:this={videoEl}
      src={mediaSrc}
      poster=""
      preload="metadata"
      playsinline
      class="w-full h-full"
      onloadstart={handleVideoLoadStart}
      onloadeddata={handleVideoLoadedData}
      onwaiting={handleVideoWaiting}
      onplaying={handleVideoPlaying}
      onpause={handleVideoPause}
      ontimeupdate={handleVideoTimeUpdate}
      ondurationchange={handleVideoDurationChange}
      onprogress={handleVideoProgress}
      onerror={handleVideoError}
      onended={handleVideoEnded}
      onratechange={handleVideoRateChange}
      onvolumechange={handleVideoVolumeChange}
    ></video>

    <!-- Custom Controls Overlay -->
    <div class={[
      "absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/95 via-black/90 to-transparent backdrop-blur-sm z-20 transition-opacity duration-300",
      "pointer-events-auto",
      showControls ? "opacity-100" : "opacity-0 pointer-events-none"
    ].join(' ')}>
      <!-- Progress Bar -->
      <div class="mb-4">
        <div
          role="slider"
          aria-label="Progreso del video"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={duration > 0 ? Math.round((currentTime / duration) * 100) : 0}
          class="w-full h-2 bg-white/15 rounded-full cursor-pointer relative group"
          onclick={handleProgressClick}
          onmousemove={(e) => {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            (e.currentTarget as HTMLElement).style.setProperty('--progress-hover', `${percent * 100}%`);
          }}
          onkeydown={(e) => {
            if (!videoEl || !duration) return;
            if (e.key === 'ArrowLeft') {
              e.preventDefault();
              videoEl.currentTime = Math.max(0, videoEl.currentTime - 10);
            } else if (e.key === 'ArrowRight') {
              e.preventDefault();
              videoEl.currentTime = Math.min(duration, videoEl.currentTime + 10);
            }
          }}
          tabindex="0"
        >
          <!-- Buffered progress -->
          {#if buffered > 0}
            <div
              class="absolute top-0 left-0 h-full bg-white/30 rounded-full"
              style="width: {buffered}%"
            ></div>
          {/if}
          <!-- Played progress -->
          <div
            class="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-75 ease-out relative z-10 shadow-[0_0_8px_rgba(99,102,241,0.6)]"
            style="width: {duration > 0 ? (currentTime / duration) * 100 : 0}%"
          ></div>
          <!-- Thumb -->
          <div
            class="absolute top-1/2 left-0 w-4 h-4 bg-white rounded-full -translate-y-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-all duration-200 pointer-events-none shadow-lg"
            style="left: {duration > 0 ? (currentTime / duration) * 100 : 0}%"
          ></div>
        </div>
        <div class="flex justify-between text-xs text-white/60 mt-2 font-mono tracking-wide">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <!-- Controls Row -->
      <div class="flex items-center justify-between gap-4">
        <!-- Left: Episode Navigation -->
        <div class="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onclick={onPrevEpisode}
            disabled={!hasPrev}
            class="text-white/70 hover:text-white hover:bg-white/10 disabled:text-white/20 disabled:hover:bg-transparent transition-all duration-200 rounded-lg"
            aria-label="Episodio anterior"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19l-7-7 7-7" />
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onclick={togglePlayPause}
            class="text-white hover:text-indigo-300 hover:bg-indigo-600/20 transition-all duration-200 rounded-lg p-2"
            aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
          >
            {#if isPlaying}
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            {:else}
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            {/if}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onclick={onNextEpisode}
            disabled={!hasNext}
            class="text-white/70 hover:text-white hover:bg-white/10 disabled:text-white/20 disabled:hover:bg-transparent transition-all duration-200 rounded-lg"
            aria-label="Siguiente episodio"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5l7 7-7 7" />
            </svg>
          </Button>
        </div>

        <!-- Center: Playback Speed & Volume -->
        <div class="flex items-center gap-2 flex-1 justify-center">
          <!-- Playback Speed -->
          <div class="relative group">
            <Button
              variant="ghost"
              size="icon"
              class="text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 rounded-lg"
              aria-label={`Velocidad: ${playbackRate}x`}
            >
              <span class="text-xs font-bold font-mono px-2 py-1 bg-white/10 rounded">{playbackRate}x</span>
            </Button>
            <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200">
              <div class="bg-gray-900/95 border border-white/10 rounded-lg p-2 min-w-[80px] shadow-xl">
                {#each [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as rate}
                  <button
                    class="w-full px-3 py-2 text-sm text-white/80 hover:bg-indigo-600/30 hover:text-indigo-300 rounded transition-colors {playbackRate === rate ? 'text-indigo-300 font-medium bg-indigo-600/20' : ''}"
                    onclick={() => videoEl && (videoEl.playbackRate = rate)}
                  >
                    {rate}x
                  </button>
                {/each}
              </div>
            </div>
          </div>

          <!-- Volume -->
          <div class="relative group">
            <Button
              variant="ghost"
              size="icon"
              onclick={toggleMute}
              class="text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 rounded-lg"
              aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
            >
              {#if isMuted || volume === 0}
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9l6 6M23 9l-6 6" />
                </svg>
              {:else if volume < 0.5}
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5L6 9H2v6h4l5 4V5z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.54 8.46a5 5 0 010 7.07" />
                </svg>
              {:else}
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              {/if}
            </Button>
            <div class="absolute bottom-full right-0 mb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200">
              <div class="bg-gray-900/95 border border-white/10 rounded-lg p-3 min-w-[100px] flex items-center gap-2 shadow-xl">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  bind:value={volume}
                  oninput={(e) => handleVolumeChange(Number((e.currentTarget as HTMLInputElement).value))}
                  class="flex-1 h-2 appearance-none bg-white/20 rounded-full accent-indigo-500 cursor-pointer"
                  aria-label="Volumen"
                  style="width: 80px;"
                />
                <span class="text-white/70 text-xs font-mono w-10 text-right">{Math.round(volume * 100)}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Fullscreen & Settings -->
        <div class="flex items-center gap-1 justify-end">
          <Button
            variant="ghost"
            size="icon"
            onclick={onToggleFullscreen}
            class="text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 rounded-lg"
            aria-label={isFullscreen ? 'Salir pantalla completa' : 'Pantalla completa'}
          >
            {#if isFullscreen}
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 15l6-6M9 9l6 6" />
              </svg>
            {:else}
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            {/if}
          </Button>
        </div>
      </div>
    </div>

  {:else}
    <!-- External Embed (iframe): el reproductor de la fuente manda.
         No superponemos controles ni gradientes para no tapar su UI. -->
    <div class="relative w-full h-full">
      {#if embedSrc}
        <iframe
          src={embedSrc}
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
          referrerpolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowfullscreen
          class="block w-full h-full border-0"
          title={title}
          onload={() => isLoading = false}
        ></iframe>
      {:else}
        <div class="w-full h-full flex items-center justify-center text-sm text-gray-400 bg-black/40">
          Fuente de vídeo no permitida.
        </div>
      {/if}
    </div>
  {/if}

  <!-- Top Bar with Title (only in fullscreen) -->
  {#if isFullscreen}
    <div class="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/95 via-black/80 to-transparent backdrop-blur-sm z-20 pointer-events-none">
      <div class="flex items-center justify-between max-w-7xl mx-auto">
        <h3 class="text-white font-semibold truncate max-w-md">{title}</h3>
        <div class="flex items-center gap-2">
          <kbd class="px-2.5 py-1 bg-black/60 border border-white/10 rounded text-xs text-white/70 font-mono">Space</kbd>
          <span class="text-white/50 text-xs">Reproducir/Pausar</span>
          <kbd class="px-2.5 py-1 bg-black/60 border border-white/10 rounded text-xs text-white/70 font-mono">F</kbd>
          <span class="text-white/50 text-xs">Pantalla completa</span>
          <kbd class="px-2.5 py-1 bg-black/60 border border-white/10 rounded text-xs text-white/70 font-mono">←/→</kbd>
          <span class="text-white/50 text-xs">Buscar ±10s</span>
          <kbd class="px-2.5 py-1 bg-black/60 border border-white/10 rounded text-xs text-white/70 font-mono">M</kbd>
          <span class="text-white/50 text-xs">Silenciar</span>
          <kbd class="px-2.5 py-1 bg-black/60 border border-white/10 rounded text-xs text-white/70 font-mono">↑/↓</kbd>
          <span class="text-white/50 text-xs">Volumen</span>
        </div>
      </div>
    </div>
  {/if}
</div>