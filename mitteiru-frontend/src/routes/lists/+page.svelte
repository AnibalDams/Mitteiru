<script lang="ts">
  import { language, translations } from '$lib/i18n';
  import { api } from '$lib/api/client';
  import { goto, invalidateAll } from '$app/navigation';
  import AnimeCard from '$lib/components/anime/AnimeCard.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import ConfirmModal from '$lib/components/ui/ConfirmModal.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import { toastError, toastSuccess } from '$lib/stores/toast';

  let { data } = $props();
  let currentLang = $derived($language);

  let profileId = $derived(data?.profileId);
  let initialLists = $derived(data?.lists || []);
  let initialAnimes = $derived(data?.animesInLists || []);

  let customLists = $state<any[] | null>(null);
  let lists = $derived(customLists !== null ? customLists : initialLists);

  let removedItems = $state<string[]>([]);
  let rawAnimesInLists = $derived(
    initialAnimes.filter((item: any) => !removedItems.includes(`${item.listId}-${item._id || item.animeId}`))
  );

  let selectedListId = $state('');
  let activeListId = $derived(selectedListId || lists[0]?._id || '');
  let activeListName = $derived(lists.find((l) => String(l._id) === String(activeListId))?.name || 'Watching');

  let isListDropdownOpen = $state(false);
  let isCreateModalOpen = $state(false);

  // New List form state
  let newListName = $state('');
  let newListPrivacy = $state('public');
  let isCreating = $state(false);

  // Remove anime modal state
  let removeAnimeModal = $state<{ open: boolean; listId: string; animeId: string }>({ open: false, listId: '', animeId: '' });
  let isMutating = $state(false);

  // Change list modal state
  let changeListModal = $state<{ open: boolean; animeId: string; animeName: string; currentListId: string }>({ open: false, animeId: '', animeName: '', currentListId: '' });
  let selectedTargetListId = $state('');

  // Animes for the active list (comparing string IDs robustly)
  let currentListAnimes = $derived.by(() => {
    return rawAnimesInLists.filter(
      (item: any) => String(item.listId) === String(activeListId)
    );
  });

  // Count items per list
  function countItemsInList(listId: string) {
    return rawAnimesInLists.filter(
      (item: any) => String(item.listId) === String(listId)
    ).length;
  }

  async function handleCreateList() {
    if (!newListName.trim() || !profileId) return;
    isCreating = true;
    const res = await api.createList(profileId, newListName.trim());
    isCreating = false;

    if (res.message === 'Success') {
      const createdName = newListName.trim();
      const updatedLists = await api.getLists(profileId);
      customLists = updatedLists.lists || [];
      const created = customLists.find((l) => l.name === createdName);
      if (created) selectedListId = created._id;
      newListName = '';
      isCreateModalOpen = false;
      toastSuccess(translations.feedback.listCreated[currentLang], createdName);
      await invalidateAll();
    } else {
      toastError(
        translations.feedback.listCreateError[currentLang],
        res.error || res.message || undefined
      );
    }
  }

  function openRemoveAnimeModal(listId: string, animeId: string) {
    removeAnimeModal = { open: true, listId, animeId };
  }

  async function confirmRemoveAnime() {
    const { listId, animeId } = removeAnimeModal;
    if (!listId || !animeId || isMutating) return;

    isMutating = true;
    const res = await api.removeAnimeFromList(listId, animeId);
    isMutating = false;

    if (res.error || (res.status ?? 200) >= 400) {
      toastError(
        translations.feedback.removeError[currentLang],
        res.error || res.message || undefined
      );
      return;
    }

    removedItems = [...removedItems, `${listId}-${animeId}`];
    removeAnimeModal = { open: false, listId: '', animeId: '' };
    toastSuccess(translations.feedback.removedFromList[currentLang]);
    await invalidateAll();
  }

  function openChangeListModal(animeId: string, animeName: string, currentListId: string) {
    selectedTargetListId = '';
    changeListModal = { open: true, animeId, animeName, currentListId };
  }

  async function confirmChangeList() {
    const { animeId, currentListId } = changeListModal;
    const targetListId = selectedTargetListId;

    if (!animeId || !currentListId || !targetListId || currentListId === targetListId) {
      changeListModal = { open: false, animeId: '', animeName: '', currentListId: '' };
      return;
    }

    if (isMutating) return;
    isMutating = true;

    const removed = await api.removeAnimeFromList(currentListId, animeId);
    if (removed.error || (removed.status ?? 200) >= 400) {
      isMutating = false;
      toastError(
        translations.feedback.moveError[currentLang],
        removed.error || removed.message || undefined
      );
      return;
    }

    const added = await api.addAnimeToList(animeId, targetListId);
    isMutating = false;

    if (added.error || (added.status ?? 200) >= 400) {
      toastError(
        translations.feedback.moveError[currentLang],
        added.error || added.message || undefined
      );
      // El anime ya salió de la lista anterior: resincronizamos el estado real.
      await invalidateAll();
      return;
    }

    removedItems = [...removedItems, `${currentListId}-${animeId}`];
    changeListModal = { open: false, animeId: '', animeName: '', currentListId: '' };
    toastSuccess(translations.feedback.movedToList[currentLang]);
    await invalidateAll();
  }

  function closeChangeListModal() {
    changeListModal = { open: false, animeId: '', animeName: '', currentListId: '' };
    selectedTargetListId = '';
  }

  // Get available lists (excluding current list)
  let availableLists = $derived.by(() => {
    return lists.filter((l) => String(l._id) !== String(changeListModal.currentListId));
  });
</script>

<svelte:head>
  <title>My Lists - Mitteiru</title>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 sm:pt-32">
  <!-- Header with List Selector & Create Button -->
  <div class="mb-8 flex flex-col justify-between gap-4 md:mb-12 md:flex-row md:items-center md:gap-6">
    <!-- Interactive List Selector Title -->
    <div class="relative z-40 min-w-0">
      <button
        onclick={() => (isListDropdownOpen = !isListDropdownOpen)}
        type="button"
        class="flex max-w-full items-center gap-2 text-2xl font-extrabold tracking-tight text-white transition-colors hover:text-indigo-400 sm:text-4xl md:text-5xl md:gap-3"
      >
        <span class="truncate">{activeListName}</span>
        <svg class="w-6 h-6 shrink-0 text-indigo-500 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <!-- Dropdown of User Lists -->
      {#if isListDropdownOpen}
        <div
          class="absolute left-0 mt-4 w-64 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] py-2 z-50 origin-top-left animate-scale-in"
        >
          {#each lists as list (list._id)}
            <button
              onclick={() => {
                selectedListId = list._id;
                isListDropdownOpen = false;
              }}
              type="button"
              class="w-full flex items-center justify-between px-5 py-3 text-sm transition-colors cursor-pointer {String(list._id) ===
              String(activeListId)
                ? 'text-white bg-white/10 border-l-4 border-indigo-500 font-semibold'
                : 'text-gray-400 hover:text-white hover:bg-white/5'}"
            >
              <span>{list.name}</span>
              <span class="text-xs bg-white/10 px-2 py-0.5 rounded-full">{countItemsInList(list._id)}</span>
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Create List Button -->
    <Button
      variant="secondary"
      size="md"
      class="w-full sm:w-auto"
      onclick={() => (isCreateModalOpen = true)}
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      {translations.lists.newList[currentLang]}
    </Button>
  </div>

  <!-- Anime Grid for Selected List -->
  {#if currentListAnimes.length > 0}
    <div class="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {#each currentListAnimes as item, index (item._id || item.id2 || item.animeId)}
        {@const animeObj = item.anime || item}
        <AnimeCard
          anime={animeObj}
          {index}
          showActions
          progress={{ ep: item.episodeProgress || 1, total: item.totalEpisodes || 12, percent: item.percent || 50 }}
          onChangeList={() => openChangeListModal(animeObj._id, animeObj.name, activeListId)}
          onRemove={() => openRemoveAnimeModal(activeListId, animeObj._id)}
        />
      {/each}
    </div>
  {:else}
    <EmptyState
      variant="bookmark"
      title={translations.lists.emptyList[currentLang]}
      description={currentLang === 'es'
        ? 'Buscá anime en el directorio y guardalos en esta lista.'
        : 'Find anime in the directory and save them to this list.'}
    >
      {#snippet action()}
        <Button variant="primary" size="md" onclick={() => goto('/directory')}>
          {currentLang === 'es' ? 'Explorar anime' : 'Browse anime'}
        </Button>
      {/snippet}
    </EmptyState>
  {/if}
</div>

<!-- Modal: Create New List -->
<Modal
  isOpen={isCreateModalOpen}
  title={translations.lists.createListTitle[currentLang]}
  onclose={() => (isCreateModalOpen = false)}
>
  <p class="text-sm text-gray-400 mb-6">{translations.lists.createListSubtitle[currentLang]}</p>

  <div class="space-y-6">
    <div>
      <label for="list-name-input" class="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
        {translations.lists.listName[currentLang]}
      </label>
      <input
        id="list-name-input"
        type="text"
        bind:value={newListName}
        placeholder={translations.lists.listPlaceholder[currentLang]}
        class="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
      />
    </div>

    <div>
      <span class="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
        {translations.lists.privacy[currentLang]}
      </span>
      <div class="flex gap-4">
        <label class="flex-1 cursor-pointer">
          <input type="radio" bind:group={newListPrivacy} value="public" class="sr-only peer" />
          <div
            class="bg-black/30 border border-white/10 text-gray-400 rounded-xl p-3 text-center text-sm font-semibold peer-checked:border-indigo-500 peer-checked:bg-indigo-600/20 peer-checked:text-indigo-300 transition-all"
          >
            {translations.lists.public[currentLang]}
          </div>
        </label>
        <label class="flex-1 cursor-pointer">
          <input type="radio" bind:group={newListPrivacy} value="private" class="sr-only peer" />
          <div
            class="bg-black/30 border border-white/10 text-gray-400 rounded-xl p-3 text-center text-sm font-semibold peer-checked:border-indigo-500 peer-checked:bg-indigo-600/20 peer-checked:text-indigo-300 transition-all"
          >
            {translations.lists.private[currentLang]}
          </div>
        </label>
      </div>
    </div>

    <Button variant="primary" fullWidth loading={isCreating} onclick={handleCreateList}>
      {isCreating ? 'Creando...' : translations.lists.createBtn[currentLang]}
    </Button>
  </div>
</Modal>

<!-- Modal: Confirm Remove Anime -->
<ConfirmModal
  isOpen={removeAnimeModal.open}
  title="Quitar de la lista"
  message="¿Estás seguro de que quieres quitar este anime de la lista?"
  type="confirm"
  variant="danger"
  confirmText="Quitar"
  cancelText="Cancelar"
  isLoading={isMutating}
  onConfirm={confirmRemoveAnime}
  onClose={() => (removeAnimeModal = { open: false, listId: '', animeId: '' })}
/>

<!-- Modal: Change Anime List -->
<Modal
  isOpen={changeListModal.open}
  title="Cambiar de lista"
  onclose={closeChangeListModal}
  size="md"
>
  <p class="text-sm text-gray-400 mb-6">Mover <strong class="text-white">{changeListModal.animeName}</strong> a otra lista:</p>

  {#if availableLists.length > 0}
    <div class="space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
      {#each availableLists as list (list._id)}
        <label class="flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer {selectedTargetListId === String(list._id)
          ? 'bg-indigo-600/20 border-indigo-500 text-white'
          : 'bg-black/30 border-white/10 text-gray-300 hover:bg-white/5'}">
          <span class="font-medium text-sm">{list.name}</span>
          <input
            type="radio"
            name="target-list"
            value={list._id}
            bind:group={selectedTargetListId}
            class="sr-only peer"
          />
          <svg class="w-5 h-5 text-indigo-400 opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </label>
      {/each}
    </div>

    <div class="mt-6 flex justify-end gap-3">
      <Button variant="secondary" size="sm" onclick={closeChangeListModal} disabled={isMutating}>
        Cancelar
      </Button>
      <Button variant="primary" size="sm" disabled={!selectedTargetListId} loading={isMutating} onclick={confirmChangeList}>
        Mover
      </Button>
    </div>
  {:else}
    <p class="text-xs text-gray-400 text-center py-4">No tienes otras listas creadas.</p>
    <Button variant="secondary" fullWidth class="mt-4" onclick={() => { closeChangeListModal(); isCreateModalOpen = true; }}>
      + Crear nueva lista
    </Button>
  {/if}
</Modal>
