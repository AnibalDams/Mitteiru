<script>
  import MobileHeader from "../../components/MobileHeader.svelte";
  import MobileAnimeRecommendation from "../../components/MobileAnimeRecommendation.svelte";
  import Loader from "../../components/Loader.svelte";
  import { onMount } from "svelte";
  import { getCookie } from "svelte-cookie";
  import { goto } from "$app/navigation";
  import axios from "axios";
  import MobileAnimeCard from "../../components/mobileAnimeCard.svelte";
 import {PUBLIC_API_URL} from "$env/static/public"

  export let data;
  let animeRandom;
  let animes = data.animes.sort((a, b) => b.createdAt - a.createdAt);

  let animesInList = [];
  let loaded = false;
  let animeGenres;
  let profileId = "";
  let profileImage = "";
  let profileName = "";
  let logged = "nosesabe";

  onMount(async () => {
    profileId = getCookie("profileId");
    logged = data.userId ? "si" : "no";
    profileName = getCookie("profileName");
    profileImage = getCookie("profileImage");

    if (profileId.length <= 0 && logged === "si") {
      goto("/selectprofile");
    } else {
      if (data.animes.length >= 1) {
       
        animeRandom = data.randomAnime;

        const genres = await axios(
          `${PUBLIC_API_URL}/anime/${animeRandom._id}`
        );

        animeGenres = genres.data.genres;
        if (profileId.length > 0) {
          let getAnimesInList = await axios(
            `${PUBLIC_API_URL}/user/profile/${profileId}/list/anime/all`
          );
          animesInList = getAnimesInList.data.animes;
        }
        loaded = true;
      }
    }
  });
</script>

{#if loaded}
  <MobileHeader {profileName} {logged} {profileImage}/>
  <MobileAnimeRecommendation animeData={animeRandom} />
  <h3 style="margin-left: 10px; margin-top:20px;">
    Watch our latest releases!
  </h3>
  <div class="card_container">
    {#each animes as anime}
      <MobileAnimeCard id={anime._id} cover={anime.cover} title={anime.name} />
    {/each}
  </div>
  <h3 style="margin-left: 10px; margin-top:20px;">
    Not sure? Check out the most popular series!
  </h3>
  <div class="card_container">
    {#each data.mostPopularAnimes as anime}
      <MobileAnimeCard id={anime._id} cover={anime.cover} title={anime.name} />
    {/each}
  </div>

  <h3 style="margin-left: 10px; margin-top:20px;">
    Still not sure? The animes our users love will solve that!
  </h3>
  <div class="card_container">
    {#each data.mostLikedAnimes as anime}
      <MobileAnimeCard anime={anime} id={anime._id} cover={anime.cover} title={anime.name} likes={anime.likes} showLikes={true}/>
    
      {/each}
  </div>
{:else}
  <Loader />
{/if}

<style>
  .card_container {
    margin-top: 20px;
    margin-left: 10px;
    display: flex;
    overflow: auto;
    white-space: nowrap;
  }
</style>
