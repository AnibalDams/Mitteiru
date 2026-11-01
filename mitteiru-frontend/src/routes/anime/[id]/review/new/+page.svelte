<script lang="ts">
  import { goto } from '$app/navigation';
  import { tick } from 'svelte';
  import { language, translations } from '$lib/i18n';
  import { api } from '$lib/api/client';
  import Button from '$lib/components/ui/Button.svelte';
  import Markdown from '$lib/components/ui/Markdown.svelte';
  import { toastError, toastSuccess } from '$lib/stores/toast';

  let { data } = $props();
  let currentLang = $derived($language);

  let anime = $derived(data?.anime);
  let profile = $derived(data?.profile);
  let profileId = $derived(data?.profileId);

  let title = $state('');
  let body = $state('');
  let submitting = $state(false);
  let errorMessage = $state('');
  let editorEl = $state<HTMLTextAreaElement | null>(null);

  let charCount = $derived(body.length);
  let wordCount = $derived(body.trim() ? body.trim().split(/\s+/).length : 0);
  let canPublish = $derived(title.trim().length > 0 && body.trim().length > 0 && !submitting);

  function getSelection() {
    const el = editorEl;
    if (!el) return { start: 0, end: 0 };
    return { start: el.selectionStart, end: el.selectionEnd };
  }

  function applyFormat(fn: (el: HTMLTextAreaElement, start: number, end: number, text: string) => { newText: string; newStart: number; newEnd: number }) {
    const el = editorEl;
    if (!el) return;
    const { start, end } = getSelection();
    const result = fn(el, start, end, body);
    body = result.newText;
    // Use microtask to ensure DOM updates before restoring selection
    queueMicrotask(() => {
      el.focus();
      el.setSelectionRange(result.newStart, result.newEnd);
    });
  }

  function wrapSelection(before: string, after = before, placeholder?: string) {
    applyFormat((_el, start, end, text) => {
      const selected = text.slice(start, end) || placeholder || '';
      const newText = text.slice(0, start) + before + selected + after + text.slice(end);
      const newPos = start + before.length + selected.length;
      return { newText, newStart: newPos, newEnd: newPos };
    });
  }

  function prefixLines(prefix: string) {
    applyFormat((_el, start, end, text) => {
      const before = text.slice(0, start);
      const lineStart = before.lastIndexOf('\n') + 1;
      let blockEnd = end;
      const between = text.slice(start, end);
      if (between.includes('\n')) {
        const tail = text.slice(end);
        const nl = tail.indexOf('\n');
        blockEnd = nl === -1 ? text.length : end + nl;
      }
      const block = text.slice(lineStart, blockEnd);
      const prefixed = block
        .split('\n')
        .map((line) =>
          line.startsWith(prefix) || (prefix === '1. ' && /^\d+\.\s/.test(line)) ? line : prefix + line
        )
        .join('\n');
      const newText = text.slice(0, lineStart) + prefixed + text.slice(blockEnd);
      const newPos = lineStart + prefixed.length;
      return { newText, newStart: newPos, newEnd: newPos };
    });
  }

  function insertBlock(block: string) {
    applyFormat((_el, start, end, text) => {
      const newText = text.slice(0, start) + block + text.slice(end);
      const newPos = start + block.length;
      return { newText, newStart: newPos, newEnd: newPos };
    });
  }

  function insertDivider() {
    applyFormat((_el, start, end, text) => {
      let insert = '\n\n---\n\n';
      if (!text || text.endsWith('\n')) insert = insert.trimStart();
      const newText = text + insert;
      const newPos = newText.length;
      return { newText, newStart: newPos, newEnd: newPos };
    });
  }

  function goBack() {
    if (!anime?._id) return;
    goto(`/anime/${anime._id}`);
  }

  async function publish() {
    // Prevenir múltiples envíos
    if (submitting) return;
    
    if (!anime?._id || !profile || !profileId) {
      errorMessage = 'Falta información necesaria para publicar la reseña.';
      return;
    }
    if (!title.trim() || !body.trim()) {
      errorMessage = 'Completa el título y el contenido de la reseña.';
      return;
    }
    
    errorMessage = '';
    submitting = true;
    
    try {
      const res = await api.addReview(anime._id, {
        title: title.trim(),
        review: body,
        profileId,
        profileName: profile.name || 'Usuario',
        profileImage: profile.photo || 'https://i.pravatar.cc/150?img=32'
      });
      
      if (res.message === 'Success') {
        toastSuccess(translations.feedback.reviewPublished[currentLang], title.trim());
        // Mantener submitting en true para evitar envíos adicionales durante la redirección
        if (res.reviewId) {
          await goto(`/anime/${anime._id}/review/${res.reviewId}`);
        } else {
          await goto(`/anime/${anime._id}#reviews`);
        }
      } else {
        submitting = false;
        errorMessage = res.error || res.message || 'Hubo un error al publicar la reseña.';
        toastError(
          translations.feedback.reviewError[currentLang],
          res.error || res.message || undefined
        );
      }
    } catch (error) {
      submitting = false;
      errorMessage = 'Error de conexión. Intenta nuevamente.';
      toastError(
        translations.feedback.reviewError[currentLang],
        translations.feedback.networkError[currentLang]
      );
      console.error('Error publishing review:', error);
    }
  }
</script>

<svelte:head>
  <title>{anime?.name ? `Escribir reseña - ${anime.name}` : 'Escribir reseña'} - Mitteiru</title>
</svelte:head>

{#if !anime}
  <div class="max-w-7xl mx-auto px-6 pt-40 text-center py-20">
    <h1 class="text-3xl font-bold text-gray-300">Anime no encontrado</h1>
    <a href="/directory" class="text-indigo-400 mt-4 inline-block font-semibold">Volver al directorio</a>
  </div>
{:else}
  <div class="relative w-full pb-20">
    <!-- Blurred Background -->
    <div class="absolute inset-x-0 top-0 h-[50vh] min-h-[420px] overflow-hidden pointer-events-none">
      <img
        src={anime.image || anime.horizontalImage || anime.cover}
        alt=""
        class="w-full h-full object-cover opacity-20 filter blur-sm"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/80 to-transparent"></div>
    </div>

    <div class="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32">
      <!-- Header -->
      <div class="mb-8">
        <button
          onclick={goBack}
          type="button"
          class="inline-flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer mb-5"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Volver a {anime.name}
        </button>

        <div class="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          <img
            src={anime.cover || anime.image}
            alt={anime.name}
            class="w-16 h-24 md:w-20 md:h-30 object-cover rounded-xl border border-white/10 shadow-[0_0_30px_rgba(79,70,229,0.25)]"
          />
          <div class="flex-1">
            <p class="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-1">
              {translations.reviewPage.newFor[currentLang]}
            </p>
            <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              {anime.name}
            </h1>
            {#if anime.japaneseName}
              <p class="text-gray-400 font-medium mt-1">{anime.japaneseName}</p>
            {/if}
          </div>
          {#if profile}
            <div class="flex items-center gap-3 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl px-4 py-3 shrink-0">
              <img
                src={profile.photo || 'https://i.pravatar.cc/150?img=32'}
                alt={profile.name}
                class="w-10 h-10 rounded-full object-cover border border-indigo-500/50"
              />
              <div>
                <p class="text-xs text-gray-400">{translations.reviewPage.publishingAs[currentLang]}</p>
                <p class="text-sm font-bold text-white">{profile.name}</p>
              </div>
            </div>
          {/if}
        </div>
      </div>

      <!-- Editor -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <!-- Left: Form -->
        <div class="bg-gray-900/70 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-7">
          <div>
            <label for="review-title" class="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
              {translations.reviewPage.title[currentLang]}
            </label>
            <input
              id="review-title"
              type="text"
              bind:value={title}
              maxlength="120"
              placeholder={translations.reviewPage.titlePlaceholder[currentLang]}
              class="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p class="text-right text-[11px] text-gray-500 mt-1">{title.length}/120</p>
          </div>

          <div class="mt-4">
            <label for="review-body" class="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
              {translations.reviewPage.body[currentLang]}
            </label>

            <!-- Toolbar -->
            <div class="flex flex-wrap items-center gap-1 p-1.5 bg-black/40 border border-white/10 rounded-t-xl">
              <button type="button" title="Negrita (**texto**)" onclick={() => wrapSelection('**', '**', 'negrita')} class="min-w-8 h-8 px-1.5 rounded-lg text-sm flex items-center justify-center gap-1 border border-transparent hover:border-white/20 hover:bg-white/10 text-gray-300 hover:text-white transition-all cursor-pointer font-extrabold">B</button>
              <button type="button" title="Cursiva (*texto*)" onclick={() => wrapSelection('*', '*', 'cursiva')} class="min-w-8 h-8 px-1.5 rounded-lg text-sm flex items-center justify-center gap-1 border border-transparent hover:border-white/20 hover:bg-white/10 text-gray-300 hover:text-white transition-all cursor-pointer italic">I</button>
              <button type="button" title="Tachado (~~texto~~)" onclick={() => wrapSelection('~~', '~~', 'tachado')} class="min-w-8 h-8 px-1.5 rounded-lg text-sm flex items-center justify-center gap-1 border border-transparent hover:border-white/20 hover:bg-white/10 text-gray-300 hover:text-white transition-all cursor-pointer line-through">S</button>
              <span class="w-px h-5 bg-white/10 mx-1"></span>
              <button type="button" title="Encabezado (## )" onclick={() => prefixLines('## ')} class="min-w-8 h-8 px-1.5 rounded-lg text-sm flex items-center justify-center gap-1 border border-transparent hover:border-white/20 hover:bg-white/10 text-gray-300 hover:text-white transition-all cursor-pointer font-extrabold">H2</button>
              <button type="button" title="Cita (> )" onclick={() => prefixLines('> ')} class="min-w-8 h-8 px-1.5 rounded-lg text-sm flex items-center justify-center gap-1 border border-transparent hover:border-white/20 hover:bg-white/10 text-gray-300 hover:text-white transition-all cursor-pointer">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.17 16c-2.2-2.2-3-4.4-2.4-6.6.6-2 2.1-3.3 4-3.7.2 1.5-.4 2.8-1.5 3.7.2.3.4.5.7.7.8.8.9 2 .3 3.2-.6 1.2-1.6 2-2.8 2.4V16zm10 0c-2.2-2.2-3-4.4-2.4-6.6.6-2 2.1-3.3 4-3.7.2 1.5-.4 2.8-1.5 3.7.3.3.5.5.8.7.5.5.8 1.2.8 2.1 0 1.1-.5 2.3-1.5 3.2-.9.8-2.1 1.2-3.3.8-.3.2-.6.3-.9.3 0-.2 0-.5 0-.9z"/>
                </svg>
              </button>
              <button type="button" title="Lista con viñetas (- )" onclick={() => prefixLines('- ')} class="min-w-8 h-8 px-1.5 rounded-lg text-sm flex items-center justify-center gap-1 border border-transparent hover:border-white/20 hover:bg-white/10 text-gray-300 hover:text-white transition-all cursor-pointer">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h4M4 12h4M4 18h4M10 6h10M10 12h10M10 18h10" />
                </svg>
              </button>
              <button type="button" title="Lista numerada (1. )" onclick={() => prefixLines('1. ')} class="min-w-8 h-8 px-1.5 rounded-lg text-sm flex items-center justify-center gap-1 border border-transparent hover:border-white/20 hover:bg-white/10 text-gray-300 hover:text-white transition-all cursor-pointer">1.</button>
              <span class="w-px h-5 bg-white/10 mx-1"></span>
              <button type="button" title="Enlace ([texto](url))" onclick={() => wrapSelection('[', '](https://)', 'texto del enlace')} class="min-w-8 h-8 px-1.5 rounded-lg text-sm flex items-center justify-center gap-1 border border-transparent hover:border-white/20 hover:bg-white/10 text-gray-300 hover:text-white transition-all cursor-pointer">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 015.656 0l2 2a4 4 0 01-5.657 5.657l-1.414 1.414a4 4 0 01-5.657 0M10.172 13.828a4 4 0 010-5.656l2-2a4 4 0 015.657 5.657l-1.414 1.414" />
                </svg>
              </button>
              <button type="button" title="Imagen (![alt](url))" onclick={() => wrapSelection('![', '](https://)', 'Descripción')} class="min-w-8 h-8 px-1.5 rounded-lg text-sm flex items-center justify-center gap-1 border border-transparent hover:border-white/20 hover:bg-white/10 text-gray-300 hover:text-white transition-all cursor-pointer">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              <button type="button" title="Código en línea (`código`)" onclick={() => wrapSelection('`', '`', 'código')} class="min-w-8 h-8 px-1.5 rounded-lg text-sm flex items-center justify-center gap-1 border border-transparent hover:border-white/20 hover:bg-white/10 text-gray-300 hover:text-white transition-all cursor-pointer font-medium">&lt;&gt;</button>
              <button type="button" title="Bloque de código (```)" onclick={() => insertBlock('```\nCódigo\n```')} class="min-w-8 h-8 px-1.5 rounded-lg text-sm flex items-center justify-center gap-1 border border-transparent hover:border-white/20 hover:bg-white/10 text-gray-300 hover:text-white transition-all cursor-pointer">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </button>
              <button type="button" title="Línea divisoria (---)" onclick={insertDivider} class="min-w-8 h-8 px-1.5 rounded-lg text-sm flex items-center justify-center gap-1 border border-transparent hover:border-white/20 hover:bg-white/10 text-gray-300 hover:text-white transition-all cursor-pointer">—</button>
            </div>

            <!-- Textarea -->
            <textarea
              id="review-body"
              bind:this={editorEl}
              bind:value={body}
              rows="16"
              placeholder={translations.reviewPage.bodyPlaceholder[currentLang]}
              class="w-full bg-black/40 border border-t-0 border-white/10 rounded-b-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y font-mono text-sm leading-relaxed custom-scrollbar"
            ></textarea>

            <div class="flex items-center justify-between mt-2 text-[11px] text-gray-500">
              <span>{wordCount} {translations.reviewPage.words[currentLang]} · {charCount} {translations.reviewPage.chars[currentLang]}</span>
              <span class="text-indigo-400/80">Markdown ✓</span>
            </div>
          </div>

          {#if errorMessage}
            <div class="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
              {errorMessage}
            </div>
          {/if}

          <div class="flex flex-col sm:flex-row gap-3 mt-6">
            <Button variant="secondary" size="md" fullWidth onclick={goBack} disabled={submitting}>
              {translations.reviewPage.cancel[currentLang]}
            </Button>
            <Button variant="primary" size="md" fullWidth disabled={!canPublish} loading={submitting} onclick={publish}>
              {#if submitting}
                {translations.reviewPage.publishing[currentLang]}...
              {:else}
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                {translations.reviewPage.publish[currentLang]}
              {/if}
            </Button>
          </div>
        </div>

        <!-- Right: Live Preview -->
        <div class="lg:sticky lg:top-28 bg-gray-900/70 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-7 min-h-[400px]">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              {translations.reviewPage.preview[currentLang]}
            </h3>
            <span class="text-[11px] text-emerald-400 font-semibold">● En vivo</span>
          </div>

          {#if title || body}
            <div class="space-y-4">
              {#if title}
                <h1 class="text-2xl sm:text-3xl font-extrabold text-white leading-tight">{title}</h1>
              {/if}
              <hr class="border-white/10" />
              {#if body.trim()}
                <Markdown content={body} class="prose max-w-full" />
              {:else}
                <p class="text-gray-500 italic">La vista previa aparecerá aquí mientras escribes...</p>
              {/if}
            </div>
          {:else}
            <div class="h-full flex flex-col items-center justify-center text-center text-gray-500 py-16">
              <div class="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                <svg class="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <p class="text-sm">{translations.reviewPage.previewPlaceholder[currentLang]}</p>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}
