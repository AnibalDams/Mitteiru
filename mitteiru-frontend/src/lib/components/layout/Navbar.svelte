<script lang="ts">
  import { language, languages, translations } from '$lib/i18n';
  import { navigating, page } from '$app/state';
  import { fade, fly } from 'svelte/transition';
  import SearchBar from '../ui/SearchBar.svelte';
  import LanguageSelector from './LanguageSelector.svelte';

  let {
    user = null,
    currentProfile = null,
    autoHide = false
  }: {
    user?: any;
    currentProfile?: any;
    autoHide?: boolean;
  } = $props();

  const REVEAL_DELAY = 300;

  let isDropdownOpen = $state(false);
  let isMobileMenuOpen = $state(false);
  let currentLang = $derived($language);

  let navLinks = $derived([
    { href: '/', label: translations.nav.home[currentLang] },
    { href: '/directory', label: translations.nav.directory[currentLang] }
  ]);

  function isActive(href: string): boolean {
    const pathname = page.url.pathname;
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  }

  function isPending(href: string): boolean {
    const target = navigating.to?.url.pathname;
    if (!target) return false;
    return target === href || (href !== '/' && target.startsWith(href + '/'));
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
    isMobileMenuOpen = false;

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
    class="fixed top-0 left-0 right-0 h-6 z-40"
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
  <div class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-3">
    
    <div class="flex min-w-0 items-center gap-4 lg:gap-8">
      <a href="/" class="group flex min-w-0 shrink-0 items-center gap-2 sm:gap-2.5">
        <div class="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <span class="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">Mitteiru</span>
      </a>

      <div class="hidden md:flex items-center gap-1 text-sm font-medium">
        {#each navLinks as link (link.href)}
          <a
            href={link.href}
            aria-current={isActive(link.href) ? 'page' : undefined}
            data-pending={isPending(link.href) ? 'true' : undefined}
            class="relative px-3.5 py-2 rounded-lg transition-all {isActive(link.href)
              ? 'text-white font-semibold bg-white/10 backdrop-blur-sm'
              : 'text-gray-400 hover:text-white hover:bg-white/5'}"
          >
            {link.label}
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
      <div class="relative hidden sm:block">
        <SearchBar 
          placeholder={translations.nav.search[currentLang]} 
          class="w-56 focus:w-72"
          shortcut
        />
        <kbd class="hidden lg:flex items-center absolute right-3 top-2.5 px-1.5 py-0.5 text-[10px] font-semibold text-gray-400 bg-white/10 rounded border border-white/10 pointer-events-none">⌘K</kbd>
      </div>

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
              class="absolute right-0 top-full pt-2 z-50"
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

      <button
        onclick={() => (isMobileMenuOpen = !isMobileMenuOpen)}
        type="button"
        class="md:hidden p-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
        aria-label="Open Menu"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
        </svg>
      </button>
    </div>
  </div>

  {#if isMobileMenuOpen}
    <div
      class="md:hidden bg-gray-950/95 backdrop-blur-xl border-b border-white/10 px-6 py-4 space-y-4"
      in:fly={{ y: -10, duration: 180 }}
      out:fade={{ duration: 120 }}
    >
      <div class="sm:hidden mb-4">
        <SearchBar />
      </div>
      {#each navLinks as link (link.href)}
        <a
          href={link.href}
          aria-current={isActive(link.href) ? 'page' : undefined}
          class="block font-medium transition-colors {isActive(link.href)
            ? 'text-white'
            : 'text-gray-300 hover:text-white'}"
        >
          {link.label}
        </a>
      {/each}
      {#if user}
        <a
          href="/lists"
          aria-current={isActive('/lists') ? 'page' : undefined}
          class="block font-medium transition-colors {isActive('/lists') ? 'text-white' : 'text-gray-300 hover:text-white'}"
        >
          {translations.nav.myLists[currentLang]}
        </a>
        <a
          href="/selectprofile"
          class="block text-gray-300 hover:text-white font-medium"
        >
          {translations.nav.changeProfile[currentLang]}
        </a>
      {:else}
        <a href="/login" class="block font-medium text-gray-300 hover:text-white transition-colors">
          {translations.nav.login[currentLang]}
        </a>
        <a href="/signup" class="block font-medium text-gray-300 hover:text-white transition-colors">
          {translations.nav.signup[currentLang]}
        </a>
      {/if}
      <div class="space-y-2 border-t border-white/10 pt-3">
        <p class="text-[11px] font-semibold uppercase tracking-widest text-gray-500">
          {translations.nav.language[currentLang]}
        </p>
        <div class="flex gap-2">
          {#each languages as option (option.code)}
            <button
              type="button"
              onclick={() => language.set(option.code)}
              aria-pressed={option.code === currentLang}
              class="flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors {option.code ===
              currentLang
                ? 'border-indigo-500/40 bg-indigo-600/15 text-white'
                : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'}"
            >
              <span class="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                {option.short}
              </span>
              {option.label}
              {#if option.code === currentLang}
                <svg class="h-3.5 w-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              {/if}
            </button>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</nav>