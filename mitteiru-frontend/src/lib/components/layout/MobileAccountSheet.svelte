<script lang="ts">
  import { language, languages, translations } from '$lib/i18n';
  import Sheet from '$lib/components/ui/Sheet.svelte';

  let {
    open = $bindable(false),
    user = null,
    currentProfile = null
  }: {
    open?: boolean;
    user?: { username?: string } | null;
    currentProfile?: { name?: string; photo?: string } | null;
  } = $props();

  let currentLang = $derived($language);
  let isLoggedIn = $derived(Boolean(user));

  function close() {
    open = false;
  }

  const menuLinkClass =
    'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white';
</script>

<Sheet {open} title={translations.nav.account[currentLang]} onclose={close}>
  {#if isLoggedIn}
    <div class="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
      <img
        src={currentProfile?.photo || 'https://i.pravatar.cc/150?img=32'}
        alt={currentProfile?.name || user?.username || 'Perfil'}
        class="h-12 w-12 rounded-full border border-indigo-500/40 object-cover"
      />
      <div class="min-w-0">
        <p class="truncate text-sm font-bold text-white">
          {currentProfile?.name || user?.username || 'Usuario'}
        </p>
        <p class="truncate text-xs text-gray-400">{translations.nav.premium[currentLang]}</p>
      </div>
    </div>

    <nav class="mt-3 space-y-1" aria-label={translations.nav.account[currentLang]}>
      <a href="/lists" class={menuLinkClass} onclick={close}>
        <svg class="h-5 w-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
        {translations.nav.myLists[currentLang]}
      </a>

      <a href="/history" class={menuLinkClass} onclick={close}>
        <svg class="h-5 w-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {translations.nav.history[currentLang]}
      </a>

      <a href="/selectprofile" class={menuLinkClass} onclick={close}>
        <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        {translations.nav.changeProfile[currentLang]}
      </a>

      <a href="/admin" class={menuLinkClass} onclick={close}>
        <svg class="h-5 w-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Panel Admin
      </a>
    </nav>
  {:else}
    <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p class="text-base font-bold text-white">{translations.nav.guestTitle[currentLang]}</p>
      <p class="mt-1 text-sm leading-relaxed text-gray-400">
        {translations.nav.guestSubtitle[currentLang]}
      </p>
    </div>

    <div class="mt-4 flex flex-col gap-2">
      <a
        href="/login"
        class="flex min-h-11 w-full items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white transition-colors hover:bg-indigo-500"
        onclick={close}
      >
        {translations.nav.login[currentLang]}
      </a>
      <a
        href="/signup"
        class="flex min-h-11 w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-white transition-colors hover:bg-white/10"
        onclick={close}
      >
        {translations.nav.signup[currentLang]}
      </a>
    </div>
  {/if}

  <div class="mt-5 border-t border-white/10 pt-4">
    <p class="mb-2 text-[11px] font-semibold uppercase tracking-widest text-gray-500">
      {translations.nav.language[currentLang]}
    </p>
    <div class="flex gap-2">
      {#each languages as option (option.code)}
        <button
          type="button"
          onclick={() => language.set(option.code)}
          aria-pressed={option.code === currentLang}
          class="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors {option.code ===
          currentLang
            ? 'border-indigo-500/40 bg-indigo-600/15 text-white'
            : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'}"
        >
          <span class="text-[10px] font-bold uppercase tracking-wide text-gray-400">
            {option.short}
          </span>
          {option.label}
        </button>
      {/each}
    </div>
  </div>

  {#if isLoggedIn}
    <form method="POST" action="/logout" class="mt-5 border-t border-white/10 pt-3">
      <button
        type="submit"
        class="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        {translations.nav.logout[currentLang]}
      </button>
    </form>
  {/if}
</Sheet>
