<script lang="ts">
  import { onMount } from 'svelte';
  import { api } from '$lib/api/client';
  import type { Comment } from '$lib/types';
  import Button from '$lib/components/ui/Button.svelte';
  import Loader from '$lib/components/ui/Loader.svelte';
  import { toastError, toastSuccess } from '$lib/stores/toast';

  let {
    episodeId,
    profileId,
    profileName,
    profileImage
  }: {
    episodeId: string;
    profileId: string | null;
    profileName: string | null;
    profileImage: string | null;
  } = $props();

  let comments = $state<Comment[]>([]);
  let newComment = $state('');
  let loading = $state(true);
  let submitting = $state(false);
  let error = $state<string | null>(null);

  onMount(async () => {
    await loadComments();
  });

  async function loadComments() {
    try {
      loading = true;
      const res = await api.getComments(episodeId);
      comments = res.comments || [];
    } catch (err) {
      error = 'Failed to load comments';
      console.error(err);
    } finally {
      loading = false;
    }
  }

  async function handleSubmit() {
    if (!newComment.trim() || !profileId || submitting) return;

    try {
      submitting = true;
      error = null;
      
      const res = await api.addComment(episodeId, {
        profileId,
        profileName: profileName || 'Usuario',
        profileImage: profileImage || '',
        content: newComment.trim()
      });

      if (res.message === 'Comment added successfully') {
        // Add new comment to the top of the list
        const commentRes = await api.getComments(episodeId);
        comments = commentRes.comments || [];
        newComment = '';
        toastSuccess('Comentario publicado');
      } else {
        toastError(
          'No se pudo publicar el comentario',
          res.error || res.message || undefined
        );
      }
    } catch (err) {
      toastError('No se pudo publicar el comentario', 'Revisá tu conexión e intentá de nuevo.');
      console.error(err);
    } finally {
      submitting = false;
    }
  }

  function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString();
  }
</script>

<div class="mt-8">
  <h3 class="text-xl font-bold text-white mb-4">Comentarios ({comments.length})</h3>
  
  {#if profileId}
    <div class="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
      <div class="flex gap-3">
        <img
          src={profileImage || 'https://i.pravatar.cc/150?img=32'}
          alt={profileName || 'Usuario'}
          class="w-10 h-10 rounded-full object-cover border border-white/20"
        />
        <div class="flex-1">
          <textarea
            bind:value={newComment}
            placeholder="Escribe un comentario..."
            class="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            rows="3"
          ></textarea>
          <div class="flex justify-end mt-2">
            <Button 
              variant="primary" 
              size="sm" 
              disabled={!newComment.trim()}
              loading={submitting}
              onclick={handleSubmit}
            >
              {submitting ? 'Enviando...' : 'Comentar'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  {:else}
    <div class="bg-white/5 border border-white/10 rounded-2xl p-6 text-center mb-6">
      <p class="text-gray-400">Debes seleccionar un perfil para comentar.</p>
    </div>
  {/if}

  {#if loading}
    <div class="flex justify-center py-8">
      <Loader />
    </div>
  {:else if error}
    <div class="bg-red-900/20 border border-red-500/30 rounded-2xl p-4 mb-6">
      <p class="text-red-400 text-center">{error}</p>
    </div>
  {:else if comments.length === 0}
    <div class="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
      <p class="text-gray-400">No hay comentarios aún. ¡Sé el primero en comentar!</p>
    </div>
  {:else}
    <div class="space-y-4">
      {#each comments as comment (comment._id)}
        <div class="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div class="flex gap-3">
            <img
              src={comment.profileImage || 'https://i.pravatar.cc/150?img=32'}
              alt={comment.profileName}
              class="w-10 h-10 rounded-full object-cover border border-white/20"
            />
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-bold text-white">{comment.profileName}</span>
                <span class="text-gray-500 text-xs">• {formatDate(comment.date)}</span>
              </div>
              <p class="text-gray-300 text-sm">{comment.content}</p>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>