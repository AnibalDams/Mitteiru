<script lang="ts">
  import { createEventDispatcher } from "svelte";

  interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
  }

  let {
    options = [],
    value = $bindable(""),
    placeholder = "Select...",
    disabled = false,
    searchable = false,
    // @deprecated: la altura ahora se gestiona automáticamente según el
    // viewport. Se mantiene solo por compatibilidad de la API.
    maxHeight = "200px",
    class: className = "",
    name,
    onchange,
  }: {
    options: SelectOption[];
    value: string;
    placeholder?: string;
    disabled?: boolean;
    searchable?: boolean;
    maxHeight?: string;
    class?: string;
    name?: string;
    onchange?: (value: string) => void;
  } = $props();

  const dispatch = createEventDispatcher<{
    change: string;
    open: void;
    close: void;
  }>();

  let isOpen = $state(false);
  let searchQuery = $state("");
  let highlightedIndex = $state(-1);
  let buttonRef = $state<HTMLButtonElement>();
  let menuRef = $state<HTMLDivElement | null>(null);
  let menuStyle = $state("");

  const filteredOptions = $derived.by(() => {
    if (!searchable || !searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(query));
  });

  const selectedOption = $derived.by(() =>
    options.find((opt) => opt.value === value),
  );

  function positionMenu() {
    if (!buttonRef || !menuRef) return;
    const r = buttonRef.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 16;

    // Sin cap arbitrario (antes 600px): el único límite es el espacio real
    // del viewport. El ancho natural lo resuelve CSS vía `w-max`.
    const spaceRight = vw - margin - r.left;

    // Si a la derecha no cabe ni el ancho del botón, abrir hacia la izquierda.
    const openLeft = spaceRight < r.width;

    // La altura la controla el scroll interno; solo acotamos al viewport
    // con un tope razonable para listas muy largas.
    const maxHeightPx = Math.max(
      120,
      Math.min(480, vh - (r.bottom + 6) - margin),
    );

    if (openLeft) {
      menuStyle = `top: ${r.bottom + 6}px; right: ${vw - r.right}px; min-width: ${r.width}px; max-width: ${r.right - margin}px; max-height: ${maxHeightPx}px;`;
    } else {
      menuStyle = `top: ${r.bottom + 6}px; left: ${r.left}px; min-width: ${r.width}px; max-width: ${spaceRight}px; max-height: ${maxHeightPx}px;`;
    }
  }

  function toggleDropdown() {
    if (disabled) return;
    isOpen = !isOpen;
    if (isOpen) {
      dispatch("open");
      searchQuery = "";
      highlightedIndex = -1;
      setTimeout(() => {
        const searchInput = menuRef?.querySelector("input") as HTMLInputElement;
        searchInput?.focus();
      }, 0);
    } else {
      dispatch("close");
    }
  }

  function selectOption(optionValue: string) {
    if (disabled) return;
    value = optionValue;
    dispatch("change", optionValue);
    onchange?.(optionValue);
    isOpen = false;
    searchQuery = "";
    highlightedIndex = -1;
    buttonRef?.focus();
  }

  function handleKeyDown(event: KeyboardEvent) {
    const visibleOptions = filteredOptions.filter((opt) => !opt.disabled);

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        highlightedIndex = Math.min(
          highlightedIndex + 1,
          visibleOptions.length - 1,
        );
        break;
      case "ArrowUp":
        event.preventDefault();
        highlightedIndex = Math.max(highlightedIndex - 1, 0);
        break;
      case "Enter":
        event.preventDefault();
        if (highlightedIndex >= 0 && visibleOptions[highlightedIndex]) {
          selectOption(visibleOptions[highlightedIndex].value);
        }
        break;
      case "Escape":
        isOpen = false;
        break;
      case "Tab":
        isOpen = false;
        break;
    }
  }

  function handleClickOutside(event: MouseEvent) {
    if (
      menuRef &&
      !menuRef.contains(event.target as Node) &&
      buttonRef &&
      !buttonRef.contains(event.target as Node)
    ) {
      isOpen = false;
    }
  }

  function portal(node: HTMLElement) {
    document.body.appendChild(node);
    return {
      destroy() {
        node.remove();
      },
    };
  }

  // Posiciona al abrir y reposiciona cuando cambia la lista filtrada
  // (p. ej. mientras el usuario escribe en el buscador).
  $effect(() => {
    if (!isOpen) return;
    void filteredOptions;
    positionMenu();
  });

  $effect(() => {
    if (!isOpen) return;
    const onScroll = () => positionMenu();
    document.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  });

  $effect(() => {
    function handleClick(event: MouseEvent) {
      handleClickOutside(event);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  });

  $effect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        isOpen = false;
      }
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  });
</script>

{#snippet optionItem(opt: SelectOption, index: number)}
  <button
    type="button"
    role="option"
    id={`option-${index}`}
    aria-selected={opt.value === value}
    aria-disabled={opt.disabled}
    class="w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center gap-3 {opt.disabled
      ? 'text-gray-500 cursor-not-allowed'
      : 'text-gray-300 hover:bg-indigo-600/30 hover:text-white cursor-pointer'} {index ===
    highlightedIndex && !opt.disabled
      ? 'bg-indigo-600/30 text-white'
      : ''}"
    onclick={() => !opt.disabled && selectOption(opt.value)}
    onmouseenter={() => !opt.disabled && (highlightedIndex = index)}
  >
    {#if opt.value === value && !opt.disabled}
      <svg
        class="w-4 h-4 text-indigo-400 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M5 13l4 4L19 7"
        />
      </svg>
    {:else}
      <span class="w-4 h-4 flex-shrink-0"></span>
    {/if}
    <span class="flex-1 min-w-0 break-words [overflow-wrap:anywhere]">{opt
      .label}</span>
  </button>
{/snippet}

<div class="relative {className}">
  <!-- Trigger Button -->
  <button
    bind:this={buttonRef}
    type="button"
    onclick={toggleDropdown}
    {disabled}
    aria-haspopup="listbox"
    aria-expanded={isOpen}
    class="w-full min-w-[180px] bg-gray-900/90 border border-white/10 text-gray-300 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer flex items-center justify-between gap-2 hover:border-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <span class="truncate flex-1">{selectedOption?.label || placeholder}</span>
    <svg
      class="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 {isOpen
        ? 'rotate-180'
        : ''}"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M19 9l-7 7-7-7"
      />
    </svg>
  </button>

  <!-- Hidden native select for form submission (optional) -->
  {#if name}
    <select {name} bind:value class="hidden" aria-hidden="true">
      {#each options as opt}
        <option
          value={opt.value}
          selected={opt.value === value}
          disabled={opt.disabled}
        >{opt.label}</option
        >
      {/each}
    </select>
  {/if}

  <!-- Dropdown Panel - Rendered in body via portal -->
  {#if isOpen}
    <div
      bind:this={menuRef}
      use:portal
      style={menuStyle}
      class="fixed z-[9999] flex flex-col overflow-hidden w-max bg-gray-900/95 border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] animate-scale-in"
      role="listbox"
      aria-label={placeholder}
    >
      {#if searchable}
        <div class="shrink-0 p-2 border-b border-white/10">
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="Buscar..."
            class="w-full bg-gray-800/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            aria-label="Filtrar opciones"
            onkeydown={handleKeyDown}
          />
        </div>
      {/if}

      <div
        class="flex-1 min-h-0 py-1 overflow-y-auto overscroll-contain"
        role="presentation"
        onkeydown={handleKeyDown}
      >
        {#if filteredOptions.length > 0}
          {#each filteredOptions as opt, index (opt.value)}
            {@render optionItem(opt, index)}
          {/each}
        {:else}
          <div class="px-4 py-3 text-center text-gray-500 text-sm">
            {searchable && searchQuery
              ? "No se encontraron resultados"
              : "No hay opciones disponibles"}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>