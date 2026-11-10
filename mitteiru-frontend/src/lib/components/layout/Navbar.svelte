<script lang="ts">
  import { language, translations } from '$lib/i18n';
  import { navigating, page } from '$app/state';
  import { isActivePath, isPendingPath, primaryNav } from '$lib/nav';
  import SearchBar from '../ui/SearchBar.svelte';
  import LanguageSelector from './LanguageSelector.svelte';

  let {
    user = null,
    currentProfile = null,
    autoHide = false,
    onOpenSearch,
    onOpenAccount
  }: {
    user?: { username?: string } | null;
    currentProfile?: { name?: string; photo?: string } | null;
    autoHide?: boolean;
    onOpenSearch: () => void;
    onOpenAccount: () => void;
  } = $props();

  const REVEAL_DELAY = 300;

  let isDropdownOpen = $state(false);
  let currentLang = $derived($language);

  function isActive(href: string): boolean {
    return isActivePath(page.url.pathname, href);
  }

  function isPending(href: string): boolean {
    return isPendingPath(navigating.to?.url.pathname, href);
  }

  // Auto-hide state: hidden on autoHide pages until the user scrolls or hovers.
  // The initial value mirrors `autoHide` so SSR matches the first paint; every
  // later change of route is handled reactively by the effect below.
  // svelte-ignore state_referenced_locally
  let isHidden = $state(autoHide);
  let isHoverRevealed = $state(false);
  let revealTimer: ReturnType<typeof setTimeout> | undefined;
  let navEl: HTMLElement | null = $state(null);
  let dropdownEl: HTMLElement | null = $state(null);

  const effectivelyHidden = $derived(isHidden && !isHoverRevealed);

  function handleAvatarClick(e: MouseEvent) {
    e.stopPropagation();

    // En móvil no existe el desplegable: se abre la hoja de cuenta táctil.
    if (window.matchMedia('(max-width: 767px)').matches) {
      onOpenAccount();
      return;
    }

    isDropdownOpen = !isDropdownOpen;
  }

  function handleOutsideClick(e: MouseEvent) {
    if (dropdownEl?.contains(e.target as Node)) return;
    isDropdownOpen = false;
  }

  function clearRevealTimer() {
    if (revealTimer !== undefined) {
      clearTimeout(revealTimer);
      revealTimer = undefined;
    }
  }

  function handleHotzoneEnter(e: PointerEvent) {
    if (e.pointerType !== 'mouse' || !isHidden || isHoverRevealed) return;
    if (revealTimer !== undefined) return;

    revealTimer = setTimeout(() => {
      revealTimer = undefined;
      isHoverRevealed = true;
    }, REVEAL_DELAY);
  }

  function handleHotzoneLeave() {
    clearRevealTimer();
  }

  function hideHoverReveal() {
    clearRevealTimer();
    isHoverRevealed = false;
  }

  function handleNavLeave(e: PointerEvent) {
    if (e.pointerType !== 'mouse') return;
    hideHoverReveal();
  }

  // Keyboard users should never tab into an invisible navbar
  function handleNavFocusIn() {
    if (isHidden) isHoverRevealed = true;
  }

  function handleNavFocusOut(e: FocusEvent) {
    const next = e.relatedTarget as Node | null;
    if (next && (e.currentTarget as Node).contains(next)) return;
    if (isHidden) isHoverRevealed = false;
  }

  // The layout persists across client-side navigation, so the scroll listener
  // must be re-bound on every route change and the state re-evaluated.
  $effect(() => {
    const pathname = page.url.pathname;

    clearRevealTimer();
    isHoverRevealed = false;
    isDropdownOpen = false;

    if (!autoHide) {
      isHidden = false;
      return;
    }

    function handleScroll() {
      const currentScrollY = window.scrollY;

      // Show navbar when scrolled down 100px, hide when at top (within 50px)
      if (currentScrollY > 100) {
        isHidden = false;
      } else if (currentScrollY < 50) {
        isHidden = true;
      }
    }

    handleScroll(); // Initial check
    // SvelteKit restores scroll after the DOM update, so re-check next frame too
    const frame = requestAnimationFrame(handleScroll);

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', handleScroll);
    };
  });

  // A fast pointer jump can leave the revealed navbar without a pointerleave
  // event, so also close it as soon as the pointer moves below it.
  $effect(() => {
    if (!isHoverRevealed) return;

    function handlePointerMove(e: PointerEvent) {
      if (e.pointerType !== 'mouse' || !navEl) return;

      // La navbar y sus desplegables pueden extenderse por debajo de los 80px
      // de la barra: mientras el puntero siga dentro, no hay que ocultarla.
      if (navEl.contains(e.target as Node)) return;

      if (e.clientY > navEl.offsetHeight) hideHoverReveal();
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', handlePointerMove);
  });
</script>

<svelte:window onclick={handleOutsideClick} />

{#if isHidden}
  <div
    class="fixed top-0 left-0 right-0 z-40 hidden h-6 md:block"
    aria-hidden="true"
    onpointerenter={handleHotzoneEnter}
    onpointerleave={handleHotzoneLeave}
  ></div>
{/if}

<nav
  bind:this={navEl}
  data-site-navbar
  class="fixed top-0 left-0 right-0 z-50 transition-all duration-500 bg-gray-950/80 backdrop-blur-xl border-b border-white/10 {effectivelyHidden ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}"
  onpointerleave={handleNavLeave}
  onfocusin={handleNavFocusIn}
  onfocusout={handleNavFocusOut}
>
  <div class="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 md:h-20 lg:px-8">
    
    <div class="flex min-w-0 items-center gap-4 lg:gap-8">
      <a href="/" class="group flex min-w-0 shrink-0 items-center gap-2 sm:gap-2.5">
        <div class="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <span class="bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-lg font-black tracking-tight text-transparent sm:text-2xl">Mitteiru</span>
      </a>

      <div class="hidden md:flex items-center gap-1 text-sm font-medium">
        {#each primaryNav as link (link.href)}
          <a
            href={link.href}
            aria-current={isActive(link.href) ? 'page' : undefined}
            data-pending={isPending(link.href) ? 'true' : undefined}
            class="relative px-3.5 py-2 rounded-lg transition-all {isActive(link.href)
              ? 'text-white font-semibold bg-white/10 backdrop-blur-sm'
              : 'text-gray-400 hover:text-white hover:bg-white/5'}"
          >
            {link.label[currentLang]}
            {#if isPending(link.href)}
              <span
                class="motion-essential absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-indigo-400 animate-pulse"
                aria-hidden="true"
              ></span>
            {/if}
          </a>
        {/each}

        <LanguageSelector />
      </div>
    </div>

    <div class="flex shrink-0 items-center gap-2 sm:gap-4">
      <div class="relative hidden lg:block">
        <SearchBar 
          placeholder={translations.nav.search[currentLang]} 
          class="w-56 focus:w-72"
          shortcut
        />
        <kbd class="hidden lg:flex items-center absolute right-3 top-2.5 px-1.5 py-0.5 text-[10px] font-semibold text-gray-400 bg-white/10 rounded border border-white/10 pointer-events-none">⌘K</kbd>
      </div>

      <button
        type="button"
        onclick={onOpenSearch}
        class="flex h-11 w-11 items-center justify-center rounded-full text-gray-300 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
        aria-label={translations.nav.searchTitle[currentLang]}
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>

      {#if user}
        <div class="relative flex items-center gap-2 pl-2 border-l border-white/10">
          <div
            class="relative cursor-pointer group"
            onclick={handleAvatarClick}
            role="button"
            tabindex="0"
            aria-haspopup="menu"
            aria-expanded={isDropdownOpen}
            onkeydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleAvatarClick(e as unknown as MouseEvent);
              }
            }}
          >
            <img 
              src={currentProfile?.photo || 'https://i.pravatar.cc/150?img=32'} 
              alt={currentProfile?.name || user?.username || 'User'} 
              class="w-9 h-9 rounded-full border border-indigo-500/50 group-hover:border-indigo-400 object-cover group-hover:scale-105 transition-all shadow-md"
            >
            <span class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-gray-950"></span>
          </div>

          {#if isDropdownOpen}
            <div
              bind:this={dropdownEl}
              class="absolute right-0 top-full z-50 pt-2 max-md:hidden"
            >
              <div class="w-56 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] py-2 origin-top-right animate-scale-in">
              <div class="px-4 py-3 border-b border-white/10 mb-2">
                <p class="text-sm font-bold text-white truncate">{currentProfile?.name || user?.username || 'Usuario'}</p>
                <p class="text-xs text-gray-400 truncate">{translations.nav.premium[currentLang]}</p>
              </div>

              <a
                href="/lists"
                class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                <svg class="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                {translations.nav.myLists[currentLang]}
              </a>

              <a
                href="/selectprofile"
                class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {translations.nav.changeProfile[currentLang]}
              </a>

              <a
                href="/admin"
                class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                <svg class="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Panel Admin
              </a>

              <a
                href="/history"
                class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                <svg class="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {translations.nav.history[currentLang]}
              </a>

              <div class="h-px bg-white/10 my-2"></div>

              <form method="POST" action="/logout">
                <button
                  type="submit"
                  class="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  {translations.nav.logout[currentLang]}
                </button>
              </form>
              </div>
            </div>
          {/if}
        </div>
      {:else}
        <div class="flex items-center gap-2 sm:gap-3">
          <a
            href="/login"
            class="hidden sm:inline-flex text-sm font-semibold text-gray-300 hover:text-white transition-colors px-3 py-1.5"
          >
            {translations.nav.login[currentLang]}
          </a>
          <a
            href="/signup"
            class="bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-full transition-all shadow-md shadow-indigo-600/30 hover:scale-105 whitespace-nowrap"
          >
            {translations.nav.signup[currentLang]}
          </a>
        </div>
      {/if}
    </div>
  </div>
</nav>