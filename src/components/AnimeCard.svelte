<script>
  import { goto } from "$app/navigation";
  import Gradient from "./Gradient.svelte";

  let bgPer = 0;

  export let saved = false;
  export let animeData = [];
</script>

<div
  class="container"
  on:click={() => goto(`/anime/${animeData.id}`)}
  on:mouseover={() => (bgPer = 90)}
  on:mouseleave={() => (bgPer = 0)}
>
  <img
    src={animeData.studio==="animeFlv"?animeData.cover:`https://mitteiru-backend.onrender.com/static/${animeData.cover}`}
    class="anime_cover"
    alt=""
  />
  <Gradient positionValue={bgPer} />
  <div class="data_container">
    <span class="anime_title"
      >{animeData.name.length <= 36
        ? animeData.name
        : animeData.name.substring(0, 33) + "..."}</span
    >
    <div class="chip_container">
      <span class="card_ship">{animeData.studio}</span>
      <span class="card_ship">{animeData.release_year}</span>
      {#if saved}
        <span class="card_ship saved">Saved</span>
      {/if}
    </div>
  </div>
</div>

<style>
  .container {
    display: block;
    position: relative;
    margin-right: 20px;
    margin-bottom: 40px;
    width: 300px;
    height: 400px;
    background-position: center;
    background-size: cover;
    background-repeat: no-repeat;
    border-radius: 5px;
    transition: 0.1s;
    cursor: pointer;
  }
  .container .anime_cover {
    border-radius: 5px;
    width: inherit;
    height: inherit;
    object-fit: cover;
    object-position: center;
    transition: 0.1s;
  }
  .container .anime_title {
    display: inline-block;
    color: #eeeeee;
    font-size: 18px;
    margin-top: 5px;
    font-weight: bold;
  }
  .container .data_container {
    opacity: 0;
    position: absolute;
    top: 82%;
    margin-left: 5px;
    transition: 0.1s;
  }
  .container:hover {
    box-shadow: 4px 4px 0px black;
  }
  .container:hover .data_container {
    opacity: 1;
    top: 80%;
  }
  span.card_ship {
    display: inline-block;
    font-size: 14px;
    font-weight: bold;
    padding-left: 10px;
    padding-right: 10px;
    padding-top: 5px;
    padding-bottom: 5px;
    color: #eee;
    border: 1px solid #eee;
    border-radius: 5px;
    margin-top: 5px;
  }
  span.card_ship.saved {
    border-color: green;
    color: green;
  }
</style>
