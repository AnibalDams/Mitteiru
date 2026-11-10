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
  <div class="mt-8">
    <!-- Móvil: anterior · página actual · siguiente. Evita el desborde horizontal. -->
    <div class="flex items-center justify-between gap-2 md:hidden">
      <button
        onclick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        class="flex min-h-11 items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-semibold text-gray-300 transition-all hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-30"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        {translations.directory.previous[currentLang]}
      </button>

      <span class="whitespace-nowrap text-sm font-medium text-gray-400">
        {translations.directory.page[currentLang]} {currentPage} {translations.directory.of[currentLang]} {totalPages}
      </span>

      <button
        onclick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        class="flex min-h-11 items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-semibold text-gray-300 transition-all hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-30"
      >
        {translations.directory.next[currentLang]}
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>

    <!-- Escritorio: paginación completa -->
    <div class="hidden items-center justify-center gap-2 md:flex">
      <button
        onclick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        class="cursor-pointer rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-400 transition-all hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-30"
      >
        {translations.directory.previous[currentLang]}
      </button>

      {#each pages as p}
        {#if typeof p === 'number'}
          <button
            onclick={() => onPageChange(p)}
            class="h-10 w-10 cursor-pointer rounded-xl text-sm font-bold transition-all {p ===
            currentPage
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'}"
          >
            {p}
          </button>
        {:else}
          <span class="px-1 font-semibold text-gray-600">{p}</span>
        {/if}
      {/each}

      <button
        onclick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        class="cursor-pointer rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-300 transition-all hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-30"
      >
        {translations.directory.next[currentLang]}
      </button>
    </div>
  </div>
{/if}
