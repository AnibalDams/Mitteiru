<script lang="ts">
  let { size = 'md' }: { size?: 'sm' | 'md' | 'lg' } = $props();

  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };
</script>

<div class="flex items-center justify-center p-8">
  <div
    class="{sizeClasses[size]} border-indigo-500 border-t-transparent rounded-full animate-spin"
  ></div>
</div>
