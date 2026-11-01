<script lang="ts">
  import Skeleton from '$lib/components/ui/Skeleton.svelte';

  let {
    count = 15,
    class: className = 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6'
  }: {
    count?: number;
    class?: string;
  } = $props();

  let items = $derived(Array.from({ length: Math.max(1, count) }));
</script>

<div class={className} aria-hidden="true" data-skeleton-grid>
  {#each items as _, index (index)}
    <div class="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-gray-900">
      <Skeleton class="h-full w-full" rounded="rounded-none" />
      <div class="absolute inset-x-3 bottom-3 space-y-2">
        <Skeleton class="h-2 w-1/3" rounded="rounded-full" />
        <Skeleton class="h-3 w-4/5" rounded="rounded-full" />
      </div>
    </div>
  {/each}
</div>
