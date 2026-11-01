<script lang="ts">
  let {
    class: className = '',
    rounded = 'rounded-xl'
  }: {
    class?: string;
    rounded?: string;
  } = $props();
</script>

<div class="skeleton {rounded} {className}" aria-hidden="true"></div>
