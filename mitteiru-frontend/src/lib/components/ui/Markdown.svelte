<script lang="ts">
  import { renderMarkdown } from '$lib/utils/markdown';

  let {
    content = '',
    class: className = ''
  }: {
    content?: string;
    class?: string;
  } = $props();

  let parsedHtml = $derived(renderMarkdown(content));
</script>

<div class="md-renderer text-gray-300 text-sm sm:text-base leading-relaxed {className}">
  {@html parsedHtml}
</div>

<style>
  .md-renderer :global(h1),
  .md-renderer :global(h2),
  .md-renderer :global(h3),
  .md-renderer :global(h4),
  .md-renderer :global(h5),
  .md-renderer :global(h6) {
    color: #fff;
    font-weight: 800;
    line-height: 1.3;
    letter-spacing: -0.015em;
    margin: 1.6em 0 0.6em;
  }

  .md-renderer :global(h1) {
    font-size: 1.85em;
  }

  .md-renderer :global(h2) {
    font-size: 1.5em;
  }

  .md-renderer :global(h3) {
    font-size: 1.25em;
  }

  .md-renderer :global(h4) {
    font-size: 1.05em;
  }

  .md-renderer :global(h5),
  .md-renderer :global(h6) {
    font-size: 0.95em;
  }

  .md-renderer :global(h1:first-child),
  .md-renderer :global(h2:first-child),
  .md-renderer :global(h3:first-child) {
    margin-top: 0;
  }

  .md-renderer :global(p) {
    margin: 0 0 1em;
  }

  .md-renderer :global(strong),
  .md-renderer :global(b) {
    color: #fff;
    font-weight: 700;
  }

  .md-renderer :global(em),
  .md-renderer :global(i) {
    color: inherit;
  }

  .md-renderer :global(a) {
    color: #818cf8;
    text-decoration: none;
    border-bottom: 1px solid rgba(129, 140, 248, 0.35);
    transition: color 0.15s ease, border-color 0.15s ease;
  }

  .md-renderer :global(a:hover) {
    color: #a5b4fc;
    border-color: rgba(165, 180, 252, 0.7);
  }

  .md-renderer :global(ul),
  .md-renderer :global(ol) {
    margin: 0 0 1em;
    padding-left: 1.4em;
  }

  .md-renderer :global(ul) {
    list-style-type: disc;
  }

  .md-renderer :global(ol) {
    list-style-type: decimal;
  }

  .md-renderer :global(li) {
    margin: 0.3em 0;
  }

  .md-renderer :global(ul ul),
  .md-renderer :global(ol ul),
  .md-renderer :global(ul ol),
  .md-renderer :global(ol ol) {
    margin-bottom: 0;
  }

  .md-renderer :global(blockquote) {
    margin: 1.2em 0;
    padding: 0.6em 1.1em;
    border-left: 3px solid #6366f1;
    background: rgba(99, 102, 241, 0.08);
    border-radius: 0 0.75rem 0.75rem 0;
    color: #d1d5db;
  }

  .md-renderer :global(blockquote p:last-child) {
    margin-bottom: 0;
  }

  .md-renderer :global(code) {
    font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.85em;
    background: rgba(255, 255, 255, 0.08);
    color: #c7d2fe;
    padding: 0.15em 0.4em;
    border-radius: 0.375rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .md-renderer :global(pre) {
    margin: 1.2em 0;
    padding: 1em 1.2em;
    background: rgba(0, 0, 0, 0.45);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 0.9rem;
    overflow-x: auto;
    line-height: 1.55;
  }

  .md-renderer :global(pre code) {
    background: transparent;
    border: 0;
    padding: 0;
    font-size: 0.85em;
    color: #e5e7eb;
  }

  .md-renderer :global(img) {
    max-width: 100%;
    height: auto;
    border-radius: 0.9rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    margin: 1.2em 0;
  }

  .md-renderer :global(hr) {
    margin: 2em 0;
    border: 0;
    height: 1px;
    background: rgba(255, 255, 255, 0.1);
  }

  .md-renderer :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 1.2em 0;
    font-size: 0.9em;
  }

  .md-renderer :global(th),
  .md-renderer :global(td) {
    padding: 0.6em 0.9em;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .md-renderer :global(th) {
    background: rgba(255, 255, 255, 0.06);
    color: #fff;
    font-weight: 700;
    text-align: left;
  }
</style>
