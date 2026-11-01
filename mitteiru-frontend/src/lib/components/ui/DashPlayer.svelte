<script lang="ts">
  import { onMount } from 'svelte';
  import type { MediaPlayerClass } from 'dashjs';
  import { isLocalPlaybackSrc } from '$lib/utils/embed';

  interface Props {
    src: string;
    title: string;
    fallbackUrl?: string;
  }

  let { src, title, fallbackUrl }: Props = $props();

  let container: HTMLDivElement | undefined = $state();
  let loading = $state(true);
  let error = $state<string | null>(null);

  onMount(() => {
    let player: MediaPlayerClass | undefined;
    let video: HTMLVideoElement | undefined;
    let disposed = false;

    if (!isLocalPlaybackSrc(src)) {
      loading = false;
      error = 'Fuente de video no permitida.';
      return;
    }

    (async () => {
      try {
        const module = await import('dashjs');
        if (disposed || !container) return;

        video = document.createElement('video');
        video.controls = true;
        video.autoplay = true;
        video.playsInline = true;
        video.preload = 'auto';
        video.setAttribute('aria-label', title);
        video.className = 'h-full w-full bg-black object-contain';
        container.appendChild(video);

        player = module.MediaPlayer().create();
        player.initialize(video, src, true);
        player.on('error', () => {
          error = 'No se pudo reproducir el stream DASH de AnimeOnsen.';
        });

        video.addEventListener(
          'loadedmetadata',
          () => {
            loading = false;
          },
          { once: true }
        );
        video.addEventListener(
          'playing',
          () => {
            loading = false;
          },
          { once: true }
        );
        video.addEventListener(
          'error',
          () => {
            error = 'El navegador no pudo reproducir el video.';
          },
          { once: true }
        );
      } catch {
        error = 'No se pudo cargar el reproductor DASH.';
      }
    })();

    return () => {
      disposed = true;
      try {
        player?.reset();
      } catch {
        // El player pudo no haberse inicializado.
      }
      video?.remove();
    };
  });
</script>

<div
  class="relative w-full aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black"
  aria-label={title}
>
  <div bind:this={container} class="dash-container absolute inset-0"></div>

  {#if loading && !error}
    <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
      <span class="rounded-full bg-black/70 px-4 py-2 text-sm text-gray-300">
        Cargando stream...
      </span>
    </div>
  {/if}

  {#if error}
    <div class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/85 p-6 text-center">
      <p class="max-w-md text-sm text-red-300">{error}</p>
      {#if fallbackUrl}
        <a
          href={fallbackUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-indigo-500"
        >
          Abrir en AnimeOnsen
        </a>
      {/if}
    </div>
  {/if}
</div>

<style>
  .dash-container :global(video) {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: #000;
  }
</style>
