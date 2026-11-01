<script lang="ts">
  import { onMount } from 'svelte';
  import type { Snippet } from 'svelte';

  let {
    trigger,
    children,
    position = 'bottom-right'
  }: {
    trigger: Snippet<[{
      open: () => void;
      close: () => void;
      toggle: () => void;
      isOpen: boolean;
    }]>;
    children: Snippet;
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  } = $props();

  let isOpen = $state(false);
  let menuRef = $state<HTMLDivElement | null>(null);
  let triggerRef = $state<HTMLDivElement | null>(null);
  let menuPosition = $state({ top: 0, left: 0 });

  function open() {
    isOpen = true;
  }

  function close() {
    isOpen = false;
  }

  function toggle() {
    isOpen = !isOpen;
  }

  function updatePosition() {
    if (triggerRef) {
      const rect = triggerRef.getBoundingClientRect();
      const menuWidth = 160;
      const menuHeight = 100; // approximate
      
      let top = rect.bottom + 4; // mt-1 = 4px
      let left = rect.right - menuWidth;

      if (position.includes('top')) {
        top = rect.top - menuHeight - 4;
      }
      if (position.includes('left')) {
        left = rect.left;
      }

      // Ensure menu stays within viewport
      if (left + menuWidth > window.innerWidth) {
        left = window.innerWidth - menuWidth - 8;
      }
      if (left < 8) {
        left = 8;
      }
      if (top + menuHeight > window.innerHeight) {
        top = rect.top - menuHeight - 4;
      }

      menuPosition = { top, left };
    }
  }

  function handleClickOutside(e: MouseEvent) {
    if (menuRef && !menuRef.contains(e.target as Node)) {
      if (triggerRef && !triggerRef.contains(e.target as Node)) {
        close();
      }
    }
  }

  // El menú se monta en <body> para que los transforms de las cards
  // (hover/entrada) no rompan su posición fixed.
  function portal(node: HTMLElement) {
    document.body.appendChild(node);
    return {
      destroy() {
        node.remove();
      }
    };
  }

  $effect(() => {
    if (isOpen) {
      updatePosition();
    }
  });

  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    window.addEventListener('resize', updatePosition);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      window.removeEventListener('resize', updatePosition);
    };
  });
</script>

<div class="relative inline-block">
  <div bind:this={triggerRef}>
    {@render trigger({ open, close, toggle, isOpen })}
  </div>

  {#if isOpen}
    <div
      bind:this={menuRef}
      use:portal
      class="fixed z-[100] animate-scale-in"
      style="top: {menuPosition.top}px; left: {menuPosition.left}px;"
      role="menu"
    >
      <div class="bg-gray-900 border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] py-1 min-w-[160px] overflow-hidden">
        {@render children()}
      </div>
    </div>
  {/if}
</div>