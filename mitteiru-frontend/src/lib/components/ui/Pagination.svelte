<script lang="ts">
  import { language, translations } from '$lib/i18n';

  let {
    currentPage = 1,
    totalPages = 1,
    onPageChange
  }: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  } = $props();

  let currentLang = $derived($language);

  // Generate page numbers array with ellipses if needed
  let pages = $derived.by(() => {
    const list: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) list.push(i);
    } else {
      list.push(1);
      if (currentPage > 3) list.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) list.push(i);
      if (currentPage < totalPages - 2) list.push('...');
      list.push(totalPages);
    }
    return list;
  });
</script>

{#if totalPages > 1}
  <div class="flex items-center justify-center gap-2 mt-8">
    <button
      onclick={() => onPageChange(currentPage - 1)}
      disabled={currentPage === 1}
      class="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all text-sm font-semibold disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
    >
      {translations.directory.previous[currentLang]}
    </button>

    {#each pages as p}
      {#if typeof p === 'number'}
        <button
          onclick={() => onPageChange(p)}
          class="w-10 h-10 rounded-xl font-bold text-sm transition-all cursor-pointer {p === currentPage
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
            : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'}"
        >
          {p}
        </button>
      {:else}
        <span class="text-gray-600 px-1 font-semibold">{p}</span>
      {/if}
    {/each}

    <button
      onclick={() => onPageChange(currentPage + 1)}
      disabled={currentPage === totalPages}
      class="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all text-sm font-semibold disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
    >
      {translations.directory.next[currentLang]}
    </button>
  </div>
{/if}
