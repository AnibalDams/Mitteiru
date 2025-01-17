<script>
  import SvelteMarkdown from "svelte-markdown";

  let markDown = ``

</script>

<div style="margin: 50px;"><textarea name="" bind:value={markDown} style=" padding:20px;width: 100%; height:500px; font-size:20px;"></textarea></div>
<div style="margin: 50px;"><SvelteMarkdown source={markDown}/></div>