<script lang="ts">
  import { goto } from '$app/navigation';
  import { language, translations } from '$lib/i18n';
  import { api } from '$lib/api/client';
  import AvatarSelector from '$lib/components/profile/AvatarSelector.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import ConfirmModal from '$lib/components/ui/ConfirmModal.svelte';
  import { toastError, toastSuccess } from '$lib/stores/toast';

  let { data } = $props();
  let currentLang = $derived($language);

  let user = $derived(data?.user);
  let initialProfiles = $derived(data?.profiles || []);
  // Ruta a la que volver después de elegir perfil (validada en el servidor).
  let nextPath = $derived(data?.next ?? null);
  let customProfiles = $state<any[] | null>(null);
  let profiles = $derived(customProfiles !== null ? customProfiles : initialProfiles);

  let activeView = $state<'select' | 'manage' | 'create' | 'edit'>('select');
  
  // Create Profile State
  let newProfileName = $state('');
  let selectedAvatar = $state('https://i.ibb.co/pnkd1F0/itadori.jpg');
  let isSubmitting = $state(false);

  // Edit Profile State
  let editingProfile = $state<any | null>(null);
  let editProfileName = $state('');
  let editSelectedAvatar = $state('');

  // Modal states
  let deleteConfirmModal = $state<{ open: boolean; profile: any }>({ open: false, profile: null });
  let pendingProfileId = $state<string | null>(null);

  async function selectProfile(profileId: string) {
    if (pendingProfileId) return;

    pendingProfileId = profileId;

    try {
      const response = await fetch('/api/profile/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        pendingProfileId = null;
        toastError(
          currentLang === 'es' ? 'No se pudo seleccionar el perfil' : 'Could not select the profile',
          data.message || undefined
        );
        return;
      }

      await goto(nextPath ?? '/');
    } catch {
      pendingProfileId = null;
      toastError(
        currentLang === 'es' ? 'No se pudo seleccionar el perfil' : 'Could not select the profile',
        translations.feedback.networkError[currentLang]
      );
    }
  }

  function startEditing(profile: any) {
    editingProfile = profile;
    editProfileName = profile.name;
    editSelectedAvatar = profile.photo || 'https://i.ibb.co/pnkd1F0/itadori.jpg';
    activeView = 'edit';
  }

  async function refreshProfiles() {
    if (user?._id) {
      const freshRes = await api.getProfiles(user._id);
      customProfiles = freshRes.profiles || [];
    }
  }

  async function handleCreateProfile() {
    if (!newProfileName.trim() || !user?._id) {
      toastError(
        currentLang === 'es' ? 'Falta el nombre del perfil' : 'Profile name is missing',
        currentLang === 'es' ? 'Ingresá un nombre para continuar.' : 'Enter a name to continue.'
      );
      return;
    }

    const name = newProfileName.trim();
    isSubmitting = true;
    const res = await api.createProfile(user._id, name, selectedAvatar);
    isSubmitting = false;

    if (res.message === 'success') {
      await refreshProfiles();
      newProfileName = '';
      activeView = 'select';
      toastSuccess(translations.feedback.profileCreated[currentLang], name);
    } else {
      toastError(
        translations.feedback.profileError[currentLang],
        res.error || res.message || undefined
      );
    }
  }

  async function handleUpdateProfile() {
    if (!editProfileName.trim() || !editingProfile?._id) return;

    isSubmitting = true;
    const res = await api.updateProfile(
      editingProfile._id,
      editProfileName.trim(),
      editSelectedAvatar
    );
    isSubmitting = false;

    if (res.message === 'success') {
      await refreshProfiles();
      editingProfile = null;
      activeView = 'manage';
      toastSuccess(translations.feedback.profileUpdated[currentLang], editProfileName.trim());
    } else {
      toastError(
        translations.feedback.profileError[currentLang],
        res.error || res.message || undefined
      );
    }
  }

  function openDeleteConfirm(profile: any) {
    deleteConfirmModal = { open: true, profile };
  }

  async function confirmDeleteProfile() {
    const { profile } = deleteConfirmModal;
    if (!profile?._id) return;
    
    isSubmitting = true;
    const res = await api.deleteProfile(profile._id);
    isSubmitting = false;

    if (res.message === 'success') {
      await refreshProfiles();
      editingProfile = null;
      activeView = 'manage';
      toastSuccess(
        translations.feedback.profileDeleted[currentLang],
        profile.name
      );
    } else {
      toastError(
        translations.feedback.profileError[currentLang],
        res.error || res.message || undefined
      );
    }
    deleteConfirmModal = { open: false, profile: null };
  }

  function cancelDeleteProfile() {
    deleteConfirmModal = { open: false, profile: null };
  }
</script>

<svelte:head>
  <title>Mitteiru - Who's watching?</title>
</svelte:head>

<div class="relative min-h-[85vh] flex items-center justify-center py-20 px-4 overflow-hidden">
  <!-- Abstract Glow Backgrounds -->
  <div class="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
  <div class="absolute bottom-[-10%] right-[-10%] w-[30vw] h-[30vw] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"></div>

  <div class="w-full max-w-5xl relative z-10">
    {#if activeView === 'select'}
      <!-- VIEW 1: SELECTION -->
      <div class="flex flex-col items-center animate-slide-up">
        <h1 class="text-4xl sm:text-5xl font-extrabold tracking-tight mb-12 text-white drop-shadow-lg text-center">
          {translations.profile.whosWatching[currentLang]}
        </h1>

        <div class="flex flex-wrap justify-center gap-6 sm:gap-8">
          {#each profiles as profile (profile._id)}
            <!-- Profile Card -->
            <button
              onclick={() => selectProfile(profile._id)}
              type="button"
              disabled={pendingProfileId !== null}
              aria-busy={pendingProfileId === profile._id}
              class="group relative flex cursor-pointer flex-col items-center gap-4 focus:outline-none disabled:cursor-wait"
            >
              <div
                class="relative w-32 h-32 sm:w-40 sm:h-40 overflow-hidden rounded-2xl border-2 border-transparent shadow-xl transition-all duration-300 group-hover:border-indigo-500 group-hover:scale-105"
              >
                <img
                  src={profile.photo || 'https://i.ibb.co/pnkd1F0/itadori.jpg'}
                  alt={profile.name}
                  class="h-full w-full object-cover transition-opacity duration-200 {pendingProfileId && pendingProfileId !== profile._id ? 'opacity-40' : 'opacity-100'}"
                />
                {#if pendingProfileId === profile._id}
                  <div class="absolute inset-0 flex items-center justify-center bg-gray-950/60">
                    <span class="motion-essential h-8 w-8 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent"></span>
                  </div>
                {/if}
              </div>
              <span class="text-gray-400 font-medium group-hover:text-white transition-colors text-lg">
                {pendingProfileId === profile._id
                  ? (currentLang === 'es' ? 'Entrando…' : 'Signing in…')
                  : profile.name}
              </span>
            </button>
          {/each}

          <!-- Add Profile Button -->
          <button
            onclick={() => (activeView = 'create')}
            type="button"
            class="group cursor-pointer flex flex-col items-center gap-4 focus:outline-none"
          >
            <div
              class="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/30 group-hover:scale-105 transition-all duration-300 shadow-xl"
            >
              <svg class="w-12 h-12 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span class="text-gray-400 font-medium group-hover:text-white transition-colors text-lg">
              {translations.profile.addProfile[currentLang]}
            </span>
          </button>
        </div>

        <button
          onclick={() => (activeView = 'manage')}
          type="button"
          class="mt-16 px-6 py-2 border border-gray-600 text-gray-400 rounded-full hover:border-white hover:text-white transition-all text-xs sm:text-sm uppercase tracking-widest font-semibold cursor-pointer"
        >
          {translations.profile.manageProfiles[currentLang]}
        </button>
      </div>

    {:else if activeView === 'manage'}
      <!-- VIEW 2: MANAGE PROFILES -->
      <div class="flex flex-col items-center animate-slide-up">
        <h1 class="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-white drop-shadow-lg text-center">
          Gestionar Perfiles
        </h1>
        <p class="text-gray-400 text-sm mb-10">Selecciona un perfil para editar su nombre, avatar o eliminarlo.</p>

        <div class="flex flex-wrap justify-center gap-6 sm:gap-8">
          {#each profiles as profile (profile._id)}
            <!-- Profile Card with Edit Overlay -->
            <button
              onclick={() => startEditing(profile)}
              type="button"
              class="group cursor-pointer flex flex-col items-center gap-4 focus:outline-none relative"
            >
              <div
                class="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl overflow-hidden border-2 border-indigo-500/50 group-hover:border-indigo-500 group-hover:scale-105 transition-all duration-300 shadow-xl relative"
              >
                <img
                  src={profile.photo || 'https://i.ibb.co/pnkd1F0/itadori.jpg'}
                  alt={profile.name}
                  class="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity"
                />
                <div class="absolute inset-0 flex items-center justify-center">
                  <div class="w-10 h-10 rounded-full bg-indigo-600/90 flex items-center justify-center text-white shadow-lg backdrop-blur-sm group-hover:scale-110 transition-transform">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                </div>
              </div>
              <span class="text-white font-semibold text-lg flex items-center gap-1.5">
                {profile.name}
              </span>
            </button>
          {/each}
        </div>

        <button
          onclick={() => (activeView = 'select')}
          type="button"
          class="mt-16 px-8 py-2.5 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-all text-sm uppercase tracking-widest cursor-pointer shadow-lg"
        >
          Listo
        </button>
      </div>

    {:else if activeView === 'create'}
      <!-- VIEW 3: CREATION -->
      <div class="flex flex-col items-center w-full max-w-3xl mx-auto animate-slide-up">
        <h2 class="text-3xl font-bold mb-8 text-white">{translations.profile.createTitle[currentLang]}</h2>

        <div class="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center">
          <!-- Profile Name Input -->
          <div class="w-full max-w-md mb-8">
            <input
              type="text"
              bind:value={newProfileName}
              placeholder={translations.profile.namePlaceholder[currentLang]}
              class="w-full bg-gray-900/60 border border-white/20 rounded-xl px-6 py-4 text-center text-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
            />
          </div>

          <!-- Avatar Selection -->
          <div class="w-full mb-8">
            <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4 text-center">
              {translations.profile.chooseAvatar[currentLang]}
            </h3>
            <AvatarSelector
              selectedAvatar={selectedAvatar}
              onSelectAvatar={(url) => (selectedAvatar = url)}
            />
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-4 w-full max-w-md">
            <Button
              variant="secondary"
              fullWidth
              onclick={() => (activeView = 'select')}
            >
              {translations.profile.cancel[currentLang]}
            </Button>
            <Button
              variant="primary"
              fullWidth
              disabled={!newProfileName.trim()}
              loading={isSubmitting}
              onclick={handleCreateProfile}
            >
              {isSubmitting ? 'Creando...' : translations.profile.createBtn[currentLang]}
            </Button>
          </div>
        </div>
      </div>

    {:else if activeView === 'edit'}
      <!-- VIEW 4: EDIT PROFILE -->
      <div class="flex flex-col items-center w-full max-w-3xl mx-auto animate-slide-up">
        <h2 class="text-3xl font-bold mb-8 text-white">Editar Perfil</h2>

        <div class="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center">
          <!-- Profile Name Input -->
          <div class="w-full max-w-md mb-8">
            <label for="edit-profile-name" class="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 text-center">
              Nombre del perfil
            </label>
            <input
              id="edit-profile-name"
              type="text"
              bind:value={editProfileName}
              placeholder="Nombre del perfil"
              class="w-full bg-gray-900/60 border border-white/20 rounded-xl px-6 py-4 text-center text-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
            />
          </div>

          <!-- Avatar Selection -->
          <div class="w-full mb-8">
            <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4 text-center">
              Cambiar Avatar
            </h3>
            <AvatarSelector
              selectedAvatar={editSelectedAvatar}
              onSelectAvatar={(url) => (editSelectedAvatar = url)}
            />
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <Button
              variant="secondary"
              fullWidth
              onclick={() => (activeView = 'manage')}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              fullWidth
              disabled={!editProfileName.trim()}
              loading={isSubmitting}
              onclick={handleUpdateProfile}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>

          <!-- Delete Profile Option -->
          <div class="mt-8 pt-6 border-t border-white/10 w-full max-w-md text-center">
            <button
              onclick={() => openDeleteConfirm(editingProfile)}
              type="button"
              disabled={isSubmitting}
              class="inline-flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-semibold transition-colors cursor-pointer"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Eliminar Perfil</span>
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- Modal: Delete Profile Confirmation -->
<ConfirmModal
  isOpen={deleteConfirmModal.open}
  title="Eliminar Perfil"
  message={`¿Estás seguro de que quieres eliminar el perfil "${deleteConfirmModal.profile?.name}"? Se borrarán sus listas e historial.`}
  type="confirm"
  variant="danger"
  confirmText="Eliminar"
  cancelText="Cancelar"
  isLoading={isSubmitting}
  onConfirm={confirmDeleteProfile}
  onCancel={cancelDeleteProfile}
  onClose={cancelDeleteProfile}
/>
