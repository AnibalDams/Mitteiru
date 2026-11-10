<script lang="ts">
  import { page } from '$app/state';
  import { language, translations } from '$lib/i18n';
  import { isActivePath, primaryNav } from '$lib/nav';

  let {
    user = null,
    currentProfile = null,
    onOpenSearch,
    onOpenAccount
  }: {
    user?: { username?: string } | null;
    currentProfile?: { name?: string; photo?: string } | null;
    onOpenSearch: () => void;
    onOpenAccount: () => void;
  } = $props();

  let currentLang = $derived($language);
  let isLoggedIn = $derived(Boolean(user));

  let listsActive = $derived(isActivePath(page.url.pathname, '/lists'));
  let accountActive = $derived(
    isActivePath(page.url.pathname, '/selectprofile') ||
      isActivePath(page.url.pathname, '/history')
  );

  const itemClass =
    'flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-[11px] font-semibold transition-colors';
  const activeClass = 'text-indigo-400';
  const idleClass = 'text-gray-400 hover:text-white';
</script>

<nav
  data-mobile-tabbar
  aria-label={translations.nav.mainNav[currentLang]}
  class="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-gray-950/95 backdrop-blur-xl md:hidden"
>
  <div class="mx-auto grid max-w-lg grid-cols-5 pb-safe">
    {#each primaryNav as item (item.id)}
      {@const active = isActivePath(page.url.pathname, item.href)}
      <a
        href={item.href}
        aria-current={active ? 'page' : undefined}
        class="{itemClass} {active ? activeClass : idleClass}"
      >
        {#if item.id === 'home'}
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10" />
          </svg>
        {:else}
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h5v16H5a1 1 0 01-1-1V5zm10-1h5a1 1 0 011 1v14a1 1 0 01-1 1h-5V4z" />
          </svg>
        {/if}
        <span class="truncate">{item.label[currentLang]}</span>
      </a>
    {/each}

    <button type="button" onclick={onOpenSearch} class="{itemClass} {idleClass}">
      <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <span class="truncate">{translations.nav.searchTab[currentLang]}</span>
    </button>

    <a
      href={isLoggedIn ? '/lists' : '/login'}
      aria-current={listsActive ? 'page' : undefined}
      class="{itemClass} {listsActive ? activeClass : idleClass}"
    >
      <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
      <span class="truncate">{translations.nav.myLists[currentLang]}</span>
    </a>

    <button
      type="button"
      onclick={onOpenAccount}
      aria-current={accountActive ? 'page' : undefined}
      class="{itemClass} {accountActive ? activeClass : idleClass}"
    >
      {#if isLoggedIn}
        <img
          src={currentProfile?.photo || 'https://i.pravatar.cc/150?img=32'}
          alt=""
          class="h-6 w-6 rounded-full border object-cover {accountActive ? 'border-indigo-400' : 'border-white/20'}"
        />
      {:else}
        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      {/if}
      <span class="truncate">{translations.nav.profileTab[currentLang]}</span>
    </button>
  </div>
</nav>
