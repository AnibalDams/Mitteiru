<script lang="ts">
  import { goto } from '$app/navigation';
  import { language, translations } from '$lib/i18n';
  import Sheet from '$lib/components/ui/Sheet.svelte';
  import SearchBar from '$lib/components/ui/SearchBar.svelte';

  let { open = $bindable(false) }: { open?: boolean } = $props();

  let currentLang = $derived($language);

  function close() {
    open = false;
  }

  function handleSearch(query: string) {
    open = false;
    goto(`/search?q=${encodeURIComponent(query)}`);
  }
</script>

<Sheet {open} title={translations.nav.searchTitle[currentLang]} onclose={close}>
  <div class="space-y-4 pt-1">
    <SearchBar
      placeholder={translations.nav.search[currentLang]}
      autofocus
      onsearch={handleSearch}
      class="max-w-none"
    />

    <p class="text-xs leading-relaxed text-gray-500">
      {currentLang === 'es'
        ? 'Buscá por título, género o estudio y te llevamos al resultado.'
        : 'Search by title, genre or studio and we will take you to the results.'}
    </p>
  </div>
</Sheet>
