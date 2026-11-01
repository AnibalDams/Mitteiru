<script lang="ts">
  import { page } from '$app/state';

  let { error }: { error?: { message?: string } } = $props();

  let status = $derived(page.status);
  let title = $derived(
    status === 404 ? 'No encontramos esta página' : 'Algo se rompió en la señal'
  );
  let message = $derived(
    status === 404
      ? 'El anime, episodio o página que buscás no existe o cambió de lugar.'
      : error?.message || 'Ocurrió un error inesperado. Intentá de nuevo en unos segundos.'
  );
</script>

<svelte:head>
  <title>{status} - Mitteiru</title>
</svelte:head>

<div class="relative min-h-[70vh] flex items-center justify-center px-4 py-24 overflow-hidden">
  <div class="absolute top-[-20%] left-[-10%] w-[45vw] h-[45vw] bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none"></div>
  <div class="absolute bottom-[-20%] right-[-10%] w-[35vw] h-[35vw] bg-pink-600/15 rounded-full blur-[120px] pointer-events-none"></div>

  <div class="relative z-10 max-w-xl w-full text-center animate-slide-up">
    <p class="text-7xl sm:text-8xl font-black tracking-tighter bg-gradient-to-br from-indigo-300 via-white to-pink-300 bg-clip-text text-transparent mb-4">
      {status}
    </p>

    <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-3">
      {title}
    </h1>

    <p class="text-gray-400 leading-relaxed mb-8">
      {message}
    </p>

    <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
      <a
        href="/"
        class="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] hover:bg-indigo-500 active:scale-95"
      >
        Volver al inicio
      </a>
      <a
        href="/directory"
        class="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/10 px-6 py-2.5 text-sm font-bold text-white backdrop-blur-md transition-all hover:scale-[1.02] hover:bg-white/20 active:scale-95"
      >
        Explorar el directorio
      </a>
    </div>
  </div>
</div>
