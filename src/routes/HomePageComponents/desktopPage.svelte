<script>
  import { onMount } from "svelte";
  import axios from "axios";
  import AnimeReccomendation from "../../components/AnimeReccomendation.svelte";
  import AnimeCard from "../../components/AnimeCard.svelte";
  import Loader from "../../components/Loader.svelte";
  import Header from "../Header.svelte";
  import { getCookie } from "svelte-cookie";
  import { goto } from "$app/navigation";

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
          `https://mitteiru-backend.onrender.com/anime/${animeRandom.id}`
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

<svelte:head>
  <title>Home</title>
  <meta name="description" content="Svelte demo app" />
</svelte:head>

{#if loaded}
  <Header {logged} {profileImage} name={profileName} />
  <AnimeReccomendation
    animeData={animeRandom}
    {animeGenres}
    inList={animesInList.find((e) => e.id == animeRandom.id) ? true : false}
  />

  <h2 style="margin:10px;">Watch our latest releases!</h2>
  <div class="anime_card_container">
    {#each animes as anime}
      <AnimeCard
        animeData={anime}
        saved={animesInList.find((e) => e.id == anime.id) ? true : false}
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
        saved={animesInList.find((e) => e.id == popularAnime.id) ? true : false}
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
        saved={animesInList.find((e) => e.id == likedAnime.id) ? true : false}
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
