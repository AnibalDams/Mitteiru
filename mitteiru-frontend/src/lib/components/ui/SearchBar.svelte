<script lang="ts">
  import { goto } from '$app/navigation';
  import { language, translations } from '$lib/i18n';

  let {
    placeholder = '',
    initialQuery = '',
    onsearch,
    shortcut = false,
    class: className = ''
  }: {
    placeholder?: string;
    initialQuery?: string;
    onsearch?: (query: string) => void;
    shortcut?: boolean;
    class?: string;
  } = $props();

  // El valor inicial se sincroniza después con `initialQuery` mediante el efecto.
  // svelte-ignore state_referenced_locally
  let query = $state(initialQuery);
  let inputEl = $state<HTMLInputElement | null>(null);
  let currentLang = $derived($language);
  let defaultPlaceholder = $derived(translations.nav.search[currentLang]);

  // Mantiene el término cuando la URL cambia (p. ej. nueva búsqueda).
  $effect(() => {
    query = initialQuery;
  });

  $effect(() => {
    if (!shortcut) return;

    function handleShortcut(event: KeyboardEvent) {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        inputEl?.focus();
        inputEl?.select();
      }
    }

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  });

  function submit() {
    const value = query.trim();
    if (!value) return;

    if (onsearch) {
      onsearch(value);
    } else {
      goto(`/search?q=${encodeURIComponent(value)}`);
    }
  }

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    submit();
  }
</script>

<form
  class="relative w-full max-w-xs {className}"
  role="search"
  onsubmit={handleSubmit}
>
  <button
    type="submit"
    class="absolute left-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-white/5 hover:text-white focus-visible:text-white"
    aria-label="Buscar anime"
  >
    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  </button>

  <input
    bind:this={inputEl}
    type="search"
    bind:value={query}
    placeholder={placeholder || defaultPlaceholder}
    class="w-full rounded-full border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white shadow-inner transition-all placeholder-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 [&::-webkit-search-cancel-button]:hidden"
    autocomplete="off"
  />
</form>
