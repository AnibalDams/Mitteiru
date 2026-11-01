<script lang="ts">
  type Variant = 'watching' | 'completed' | 'finished' | 'releasing' | 'new' | 'default';

  let {
    variant = 'default',
    text = '',
    pulse = false,
    class: className = ''
  }: {
    variant?: Variant;
    text: string;
    pulse?: boolean;
    class?: string;
  } = $props();

  const variantStyles: Record<Variant, string> = {
    watching: 'bg-indigo-600/90 text-white border-white/10',
    completed: 'bg-gray-900/80 text-gray-300 border-white/10',
    finished: 'bg-green-500/20 text-green-400 border-green-500/30',
    releasing: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    new: 'bg-indigo-600 text-white font-extrabold',
    default: 'bg-white/10 text-gray-300 border-white/10 backdrop-blur-md'
  };
</script>

<span
  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold border backdrop-blur-md shadow-md transition-all {variantStyles[variant]} {className}"
>
  {#if pulse}
    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
  {/if}
  {text}
</span>
