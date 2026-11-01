<script lang="ts">
  import { navigating } from '$app/state';

  const SHOW_DELAY = 150;
  const HIDE_DELAY = 280;

  let visible = $state(false);
  let progress = $state(0);

  // Variable no reactiva: evita que el efecto se re-ejecute al mostrarse.
  let shown = false;
  let showTimer: ReturnType<typeof setTimeout> | undefined;
  let tickTimer: ReturnType<typeof setInterval> | undefined;
  let hideTimer: ReturnType<typeof setTimeout> | undefined;

  function startTicking() {
    clearInterval(tickTimer);
    tickTimer = setInterval(() => {
      // Avance asintótico hacia 90 %: no sabemos el progreso real.
      progress = Math.min(progress + Math.max(1, (90 - progress) * 0.09), 90);
    }, 180);
  }

  $effect(() => {
    const active = navigating.to !== null;

    clearTimeout(showTimer);
    clearInterval(tickTimer);
    clearTimeout(hideTimer);

    if (active) {
      if (shown) {
        // Navegación encadenada: reinicia sin ocultar la barra.
        progress = 12;
        visible = true;
        startTicking();
      } else {
        showTimer = setTimeout(() => {
          shown = true;
          visible = true;
          progress = 12;
          startTicking();
        }, SHOW_DELAY);
      }
    } else if (shown) {
      clearInterval(tickTimer);
      progress = 100;
      hideTimer = setTimeout(() => {
        visible = false;
        progress = 0;
        shown = false;
      }, HIDE_DELAY);
    } else {
      progress = 0;
    }

    return () => {
      clearTimeout(showTimer);
      clearInterval(tickTimer);
      clearTimeout(hideTimer);
    };
  });
</script>

<div
  class="pointer-events-none fixed inset-x-0 top-0 z-[200] h-[2px]"
  aria-hidden="true"
  data-route-progress
>
  <div
    class="h-full origin-left bg-gradient-to-r from-indigo-500 via-indigo-400 to-pink-500 shadow-[0_0_12px_rgba(99,102,241,0.75)] transition-[transform,opacity] duration-200 ease-out"
    style={`transform: scaleX(${progress / 100}); opacity: ${visible ? 1 : 0}`}
  ></div>
</div>

<span class="sr-only" aria-live="polite">{visible ? 'Cargando página' : ''}</span>
