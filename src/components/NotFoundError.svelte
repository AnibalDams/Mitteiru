<script>
  export let link = false;
  export let text = "404 Not found";
  export let linkText = "";
  export let linkDirection = "/";
</script>

<div class="not_found_c">
  <img src="http://localhost:8000/static/404.png" alt="" srcset="" />

  {#if !link}
    <span class="not_found_text">{text}</span>
  {:else}
    <span class="not_found_text"
      >{text} <a href={linkDirection} class="link">{linkText}</a></span
    >
  {/if}
</div>

<style>
  .not_found_c {
    width: 100%;
    height: 500px;
    position: relative;
  }

  .not_found_c img {
    width: 450px;
    height: 450px;
    position: absolute;
    top: 50%;
    right: 50%;
    transform: translate(50%, -50%);
  }
  .not_found_c span.not_found_text {
    display: inline-block;
    padding-bottom: 20px;

    position: absolute;
    font-weight: bold;
    top: 100%;
    right: 50%;
    transform: translate(50%, -50%);
  }
  .link {
    display: inline-block;
    text-decoration: none;
    font-weight: bold;
    color: blue;
  }
</style>
