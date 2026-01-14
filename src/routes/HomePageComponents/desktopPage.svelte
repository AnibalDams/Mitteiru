<script>
  import { onMount } from "svelte";
  import axios from "axios";
  import AnimeReccomendation from "../../components/AnimeReccomendation.svelte";
  import AnimeCard from "../../components/AnimeCard.svelte";
  import Loader from "../../components/Loader.svelte";
  import Header from "../Header.svelte";
  import { getCookie } from "svelte-cookie";
  import { goto } from "$app/navigation";
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
      return
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

<svelte:head>
  <title>Home</title>
  <meta name="description" content="An app to watch anime online" />
</svelte:head>

{#if loaded}
  <Header {logged} {profileImage} name={profileName} />
  <AnimeReccomendation
    animeData={animeRandom}
    {animeGenres}
    inList={animesInList.find((e) => e._id == animeRandom._id) ? true : false}
  />

  <h2 style="margin:10px;">Watch our latest releases!</h2>
  <div class="anime_card_container">
    {#each animes as anime}
      <AnimeCard
        animeData={anime}
        saved={animesInList.find((e) => e._id == anime._id) ? true : false}
      />
    {/each}
  </div>
  <h2 style="margin-left:10px; margin-top:25px; ">
    Not sure? Check out the most popular series!
  </h2>
  <div class="anime_card_container">
    {#each data.mostPopularAnimes as popularAnime}
      <AnimeCard
        animeData={popularAnime}
        saved={animesInList.find((e) => e._id == popularAnime._id) ? true : false}
      />
    {/each}
  </div>
  <h2 style="margin-left:10px; margin-top:25px; ">
    Still not sure? The animes our users love will solve that!
  </h2>
  <div class="anime_card_container">
    {#each data.mostLikedAnimes as likedAnime}
      <AnimeCard
        animeData={likedAnime}
        profileId={profileId}
        showLikes={true}
        saved={animesInList.find((e) => e._id == likedAnime._id) ? true : false}
      />
    {/each}
  </div>
{:else}
  <div
    style="position:relative;width:100%;height:500px;"
  >
    <Loader />
  </div>
{/if}

<style>
  .anime_card_container {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;

    margin-left: 10px;
    margin-top: 20px;
  }
</style>
