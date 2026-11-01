<script lang="ts">
  import type { Snippet } from 'svelte';

  type Variant = 'primary' | 'secondary' | 'glass' | 'outline' | 'danger' | 'ghost';
  type Size = 'sm' | 'md' | 'lg' | 'icon';

  let {
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    fullWidth = false,
    type = 'button',
    onclick,
    children,
    class: className = '',
    'aria-label': ariaLabel
  }: {
    variant?: Variant;
    size?: Size;
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    type?: 'button' | 'submit' | 'reset';
    onclick?: (e: MouseEvent) => void;
    children?: Snippet;
    class?: string;
    'aria-label'?: string;
  } = $props();

  const variantStyles: Record<Variant, string> = {
    primary: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 hover:scale-[1.02] active:scale-95',
    secondary: 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 hover:scale-[1.02] active:scale-95',
    glass: 'bg-gray-900/80 hover:bg-gray-800/90 text-gray-200 border border-white/10 backdrop-blur-md',
    outline: 'border border-gray-600 hover:border-white text-gray-400 hover:text-white',
    danger: 'bg-red-600/80 hover:bg-red-600 text-white shadow-lg shadow-red-600/20',
    ghost: 'bg-transparent hover:bg-white/10 text-gray-300 hover:text-white'
  };

  const sizeStyles: Record<Size, string> = {
    sm: 'px-3 py-1.5 text-xs rounded-lg font-semibold',
    md: 'px-6 py-2.5 text-sm rounded-xl font-bold',
    lg: 'px-8 py-3.5 text-base rounded-full font-bold',
    icon: 'p-2 rounded-lg'
  };
</script>

<button
  {type}
  disabled={disabled || loading}
  aria-busy={loading || undefined}
  {onclick}
  aria-label={ariaLabel}
  class="inline-flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none {variantStyles[variant]} {sizeStyles[size]} {fullWidth ? 'w-full' : ''} {className}"
>
  {#if loading}
    <span
      class="motion-essential h-3.5 w-3.5 shrink-0 rounded-full border-2 border-current border-t-transparent animate-spin"
      aria-hidden="true"
    ></span>
  {/if}
  {#if children}
    {@render children()}
  {/if}
</button>
