<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { modalBehavior } from '$lib/actions/modal';
  import Button from './Button.svelte';

  let {
    isOpen = false,
    title = '',
    message = '',
    type = 'alert',
    variant = 'info',
    onConfirm,
    onCancel,
    onClose,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    isLoading = false,
    size = 'sm'
  }: {
    isOpen: boolean;
    title?: string;
    message: string;
    type?: 'alert' | 'confirm';
    variant?: 'info' | 'success' | 'warning' | 'danger';
    onConfirm?: () => void | Promise<void>;
    onCancel?: () => void;
    onClose?: () => void;
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
    size?: 'sm' | 'md' | 'lg';
  } = $props();

  const variantStyles = {
    info: 'border-indigo-500/30 bg-indigo-600/10',
    success: 'border-emerald-500/30 bg-emerald-600/10',
    warning: 'border-amber-500/30 bg-amber-600/10',
    danger: 'border-red-500/30 bg-red-600/10'
  };

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-xl'
  };

  async function handleConfirm() {
    if (isLoading) return;
    if (onConfirm) {
      await onConfirm();
    }
    onClose?.();
  }

  function handleCancel() {
    if (isLoading) return;
    onCancel?.();
    onClose?.();
  }
</script>

{#if isOpen}
  <div
    class="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4"
    transition:fade={{ duration: 160 }}
  >
    <div
      class="absolute inset-0 bg-black/70 backdrop-blur-sm"
      onclick={handleCancel}
      aria-hidden="true"
    ></div>

    <div
      data-modal-panel
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Confirmación'}
      use:modalBehavior={handleCancel}
      in:fly={{ y: 40, duration: 240 }}
      out:fade={{ duration: 120 }}
      class="relative w-full rounded-t-3xl border border-white/10 bg-gray-900 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] shadow-[0_20px_60px_rgba(0,0,0,0.8)] outline-none sm:rounded-3xl sm:p-8 {sizeClasses[size]} {variantStyles[variant]}"
    >
      <div class="mb-3 flex justify-center sm:hidden" aria-hidden="true">
        <span class="h-1 w-10 rounded-full bg-white/20"></span>
      </div>

      <div class="flex items-start gap-4">
        <div class="mt-0.5 flex-shrink-0">
          {#if variant === 'info'}
            <svg class="h-6 w-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          {:else if variant === 'success'}
            <svg class="h-6 w-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          {:else if variant === 'warning'}
            <svg class="h-6 w-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          {:else if variant === 'danger'}
            <svg class="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          {/if}
        </div>
        <div class="min-w-0 flex-1">
          {#if title}
            <h3 class="mb-2 text-lg font-bold text-white">{title}</h3>
          {/if}
          <p class="text-sm leading-relaxed text-gray-300">{message}</p>
        </div>
      </div>

      <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
        {#if type === 'confirm'}
          <Button
            variant="secondary"
            size="sm"
            class="w-full sm:w-auto"
            onclick={handleCancel}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            class="w-full sm:w-auto"
            onclick={handleConfirm}
            loading={isLoading}
          >
            {isLoading ? 'Procesando...' : confirmText}
          </Button>
        {:else}
          <Button
            variant="primary"
            size="sm"
            fullWidth
            onclick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Procesando...' : confirmText}
          </Button>
        {/if}
      </div>
    </div>
  </div>
{/if}
