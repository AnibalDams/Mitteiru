<script lang="ts">
  import './layout.css';
  import Navbar from '$lib/components/layout/Navbar.svelte';
  import MobileTabBar from '$lib/components/layout/MobileTabBar.svelte';
  import MobileSearchSheet from '$lib/components/layout/MobileSearchSheet.svelte';
  import MobileAccountSheet from '$lib/components/layout/MobileAccountSheet.svelte';
  import RouteProgress from '$lib/components/ui/RouteProgress.svelte';
  import Toaster from '$lib/components/ui/Toaster.svelte';
  import { page } from '$app/state';
  import { afterNavigate, onNavigate } from '$app/navigation';
  import {
    prefersReducedMotion,
    startViewTransition,
    supportsViewTransitions
  } from '$lib/utils/motion';

  let { data, children } = $props();

  let mainEl = $state<HTMLElement | null>(null);
  let announcement = $state('');
  let usedViewTransition = false;
  let searchOpen = $state(false);
  let accountOpen = $state(false);

  const autoHideRoutes = ['/', '/anime'];
  let autoHide = $derived(
    autoHideRoutes.some(
      (route) =>
        page.url.pathname === route || page.url.pathname.startsWith(route + '/')
    )
  );

  /*
   * View Transitions como mejora progresiva: si el navegador no las soporta
   * o el usuario prefiere menos movimiento, la navegación sigue igual.
   */
  onNavigate((navigation) => {
    if (!supportsViewTransitions() || prefersReducedMotion()) return;
    if (!navigation.to || !navigation.from) return;

    // Los cambios de filtros o paginación comparten pathname: no hay crossfade.
    if (navigation.to.url.pathname === navigation.from.url.pathname) return;

    usedViewTransition = true;

    return new Promise<void>((resolve) => {
      const transition = startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });

      if (!transition) {
        usedViewTransition = false;
        resolve();
        return;
      }

      transition.finished.catch(() => {
        // Una transición cancelada no debe romper la navegación.
      });
    });
  });

  afterNavigate(({ from }) => {
    if (!from) return;

    announcement = document.title;

    // Fallback de entrada cuando no hay View Transition disponible.
    if (!usedViewTransition && mainEl && !prefersReducedMotion()) {
      mainEl.classList.remove('route-enter');
      void mainEl.offsetWidth;
      mainEl.classList.add('route-enter');
    }

    usedViewTransition = false;
  });
</script>

<div class="min-h-screen bg-gray-950 text-white flex flex-col font-sans">
  <RouteProgress />
  <Navbar
    user={data?.user}
    currentProfile={data?.profile}
    {autoHide}
    onOpenSearch={() => (searchOpen = true)}
    onOpenAccount={() => (accountOpen = true)}
  />
  <main bind:this={mainEl} class="flex-1 pb-tabbar">
    {@render children()}
  </main>

  <MobileTabBar
    user={data?.user}
    currentProfile={data?.profile}
    onOpenSearch={() => (searchOpen = true)}
    onOpenAccount={() => (accountOpen = true)}
  />

  <MobileSearchSheet bind:open={searchOpen} />
  <MobileAccountSheet
    bind:open={accountOpen}
    user={data?.user}
    currentProfile={data?.profile}
  />

  <Toaster />
</div>

<span class="sr-only" aria-live="polite">{announcement}</span>
