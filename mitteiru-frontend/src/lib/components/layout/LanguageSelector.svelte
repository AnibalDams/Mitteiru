<script lang="ts">
  import { tick } from 'svelte';
  import { afterNavigate } from '$app/navigation';
  import { language, languages, translations, type Language } from '$lib/i18n';

  let open = $state(false);
  let rootEl = $state<HTMLDivElement | null>(null);
  let triggerEl = $state<HTMLButtonElement | null>(null);
  let menuEl = $state<HTMLDivElement | null>(null);

  let currentLang = $derived($language);
  let currentShort = $derived(
    languages.find((option) => option.code === currentLang)?.short ?? 'ES'
  );

  function openMenu() {
    open = true;
    tick().then(() => {
      const selected = menuEl?.querySelector<HTMLElement>('[aria-selected="true"]');
      const first = menuEl?.querySelector<HTMLElement>('[role="option"]');
      (selected ?? first)?.focus();
    });
  }

  function closeMenu(restoreFocus = true) {
    open = false;
    if (restoreFocus) triggerEl?.focus();
  }

  function toggleMenu() {
    if (open) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  function selectLanguage(code: Language) {
    language.set(code);
    closeMenu();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!open) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        openMenu();
      }
      return;
    }

    const options = Array.from(
      menuEl?.querySelectorAll<HTMLElement>('[role="option"]') ?? []
    );
    const activeIndex = options.indexOf(document.activeElement as HTMLElement);

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        options[(activeIndex + 1) % options.length]?.focus();
        break;
      case 'ArrowUp':
        event.preventDefault();
        options[(activeIndex - 1 + options.length) % options.length]?.focus();
        break;
      case 'Home':
        event.preventDefault();
        options[0]?.focus();
        break;
      case 'End':
        event.preventDefault();
        options[options.length - 1]?.focus();
        break;
      case 'Escape':
        event.preventDefault();
        closeMenu();
        break;
      case 'Tab':
        // Deja que el navegador mueva el foco con naturalidad.
        closeMenu(false);
        break;
    }
  }

  // El menú no debe sobrevivir a un cambio de ruta.
  afterNavigate(() => {
    if (open) closeMenu(false);
  });

  $effect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootEl?.contains(event.target as Node)) {
        closeMenu(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => document.removeEventListener('pointerdown', handlePointerDown, true);
  });
</script>

<div class="relative ml-2" bind:this={rootEl}>
  <button
    bind:this={triggerEl}
    type="button"
    onclick={toggleMenu}
    onkeydown={handleKeydown}
    aria-haspopup="listbox"
    aria-expanded={open}
    aria-label={translations.nav.changeLanguage[currentLang]}
    class="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-300 transition-colors hover:bg-white/10 hover:text-white {open
      ? 'border-indigo-500/40 text-white'
      : ''}"
  >
    <svg class="h-3.5 w-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
      />
    </svg>

    <span class="uppercase">{currentShort}</span>

    <svg
      class="h-3 w-3 text-gray-400 transition-transform duration-200 {open ? 'rotate-180' : ''}"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
    </svg>
  </button>

  {#if open}
    <!-- El padding superior es un área de puente: evita que el hueco entre
         el trigger y el menú cuente como "fuera de la navbar". -->
    <div class="absolute left-0 top-full z-50 w-44 pt-2">
      <div
        bind:this={menuEl}
        role="listbox"
        tabindex="-1"
        aria-label={translations.nav.language[currentLang]}
        onkeydown={handleKeydown}
        class="origin-top-left animate-scale-in overflow-hidden rounded-xl border border-white/10 bg-gray-900/95 p-1 shadow-[0_10px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl"
      >
        {#each languages as option (option.code)}
          <button
            type="button"
            role="option"
            aria-selected={option.code === currentLang}
            onclick={() => selectLanguage(option.code)}
            class="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors {option.code ===
            currentLang
              ? 'bg-indigo-600/15 text-white'
              : 'text-gray-300 hover:bg-white/5 hover:text-white'}"
          >
            <span class="flex items-center gap-2.5">
              <span
                class="inline-flex h-6 min-w-8 items-center justify-center rounded-md border border-white/10 bg-white/5 px-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-400"
              >
                {option.short}
              </span>
              <span class="font-medium">{option.label}</span>
            </span>

            {#if option.code === currentLang}
              <svg class="h-4 w-4 shrink-0 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            {/if}
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>
