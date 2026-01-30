<script>
  import Gradient from "./Gradient.svelte";
  import {  HeartFilled} from "radix-icons-svelte";
  import formatNumber from '$lib/numberFormatter'
  import axios from "axios";
  import { onMount } from "svelte";
  import {PUBLIC_API_URL} from "$env/static/public"
  

  let bgPer = 0;
  export let showLikes = false
  export let saved = false;
  export let animeData ;
  export let liked = false
  export let profileId="";
  let likesPerProfile = [];
$: shortName = animeData.name.length <= 26 
    ? animeData.name 
    : animeData.name.substring(0, 23) + "...";
  onMount(async()=>{
    if (showLikes) {
      let getLikesPerProfile = await axios(`${PUBLIC_API_URL}/anime/${animeData._id}/likes/count`)
      let likesPerProfile = getLikesPerProfile.data.profiles
      liked = likesPerProfile.find((e)=>e.profileId == profileId)?true:false
      
    }
  })

</script>

<a
  class="container"
  href={`/anime/${animeData._id}`}
  data-sveltekit-preload-data="off"
  on:mouseover={() => (bgPer = 90)}
  on:mouseleave={() => (bgPer = 0)}
>
  <img
    src={animeData.cover}
    class="anime_cover"
    alt=""
    loading="lazy"
    decoding="async"
  />
  <Gradient positionValue={bgPer} />
  <div class="data_container">
    <span class="anime_title"
      >{shortName}</span
    >
    <div class="chip_container">
      <span class="card_ship">{animeData.studio}</span>
      <span class="card_ship">{animeData.releaseYear}</span>
      {#if showLikes}
        <span class="card_ship likes" style={`color:${liked?"green":"white"};border-color:${liked?"green":"white"};`}><HeartFilled style="position:absolute;top:50%; left:3px; transform:translateY(-50%)"/>{formatNumber(animeData.likes)}</span>
        
      {/if}
      {#if saved}
        <span class="card_ship saved">Saved</span>
      {/if}
    </div>
  </div>
</a>

<style>
  .container {
    display: block;
    position: relative;
    margin-right: 20px;
    margin-bottom: 40px;
    width: 250px;
    height: 350px;
    background-position: center;
    background-size: cover;
    background-repeat: no-repeat;
    border-radius: 5px;
    overflow: hidden;
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
  .container:hover .anime_cover {
    transform: scale(1.05);
  }
  .container .anime_title {
    display: inline-block;
    color: hsl(0, 0%, 80%);
    font-size: 20px;
    margin-top: 5px;
    font-weight: bold;
  }
  .container .data_container {
    opacity: 0;
    position: absolute;
    top: 82%;
    margin-left: 8px;
    transition: 0.1s;
    z-index: 4;
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
    font-size: 12px;
    font-weight: bold;
    padding-left: 10px;
    padding-right: 10px;
    padding-top: 5px;
    padding-bottom: 5px;
    color: hsl(0, 0%, 70%);
    border: 1px solid hsl(0, 0%,70%);
    border-radius: 5px;
    margin-top: 5px;
  }
  span.card_ship.likes{
    position: relative;
    padding-left: 20px;

  }
  span.card_ship.saved {
    border-color: green;
    color: green;
  }
</style>
