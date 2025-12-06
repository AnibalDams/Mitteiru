<script>
  import MobileHeader from "../../components/MobileHeader.svelte";
  import MobileAnimeRecommendation from "../../components/MobileAnimeRecommendation.svelte";
  import Loader from "../../components/Loader.svelte";
  import { onMount } from "svelte";
  import { getCookie } from "svelte-cookie";
  import { goto } from "$app/navigation";
  import axios from "axios";
  import MobileAnimeCard from "../../components/mobileAnimeCard.svelte";

  export let data;
  let animeRandom;
  let animes = [];

  let animesInList = [];
  let loaded = false;
  let animeGenres;
  let profileId = "";
  let profileImage = "";
  let profileName = "";
  let logged = "nosesabe";
  function randomNumber(min, max) {
    return Math.round(Math.random() * (max - min)) + min;
  }
  onMount(async () => {
    profileId = getCookie("profileId");
    logged = data.userId ? "si" : "no";
    profileName = getCookie("profileName");
    profileImage = getCookie("profileImage");

    if (profileId.length <= 0 && logged === "si") {
      goto("/selectprofile");
    } else {
      if (data.animes.length >= 1) {
        let number = randomNumber(0, data.animes.length - 1);

        for (let i = 0; i < data.animes.length; i++) {
          const anime = data.animes[i];
          if (animes.length < 10) {
  

            animes.push(anime);
          }
        }

        animeRandom = data.animes[number];

        const genres = await axios(
          `https://mitteiru-backend.onrender.com/anime/${animeRandom._id}`
        );

        animeGenres = genres.data.genres;
        if (profileId.length > 0) {
          let getAnimesInList = await axios(
            `https://mitteiru-backend.onrender.com/user/profile/${profileId}/list/anime/all`
          );
          animesInList = getAnimesInList.data.animes;
        }
        loaded = true;
      }
    }
  });
</script>

{#if loaded}
  <MobileHeader />
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
