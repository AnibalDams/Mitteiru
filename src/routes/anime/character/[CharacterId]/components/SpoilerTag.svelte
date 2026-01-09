<script>
  export let info;
  export let revealed = false;
</script>


<div class="extra_info">
  {#if !revealed}
   
    <button on:click={() => (revealed = true)}>This is a spoiler. Click to view</button>
  {:else}
    <span class="label">{info.name}:</span>
    <span class="value">{info.value}</span>
  {/if}
</div>


<style>
  button{
    padding: 5px 10px;
    border: none;
    cursor: pointer;
    background-color: #eee;
    color: #555;
    border-radius: 4px;
    font-weight: bold;
    transition: 0.1s;
  }
  button:hover{
    box-shadow: 4px 4px 0px #444;
  }
   .extra_info > .label {
    font-weight: bold;
    color: #555;
  }
  .extra_info > .value {
    color: #555;
  }

</style>