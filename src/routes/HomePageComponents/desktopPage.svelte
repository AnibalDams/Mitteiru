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
  let mostPopularAnimes = [];
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
      let animesFetch = await axios("http://localhost:8000/anime/d/all");
      let mostPopularAnimesFetch = await axios(
        "http://localhost:8000/anime/d/mostpopular"
      );

      if (animesFetch.data.animes.length >= 1) {
        let number = randomNumber(0, animesFetch.data.animes.length - 1);

        for (let i = 0; i < animesFetch.data.animes.length; i++) {
          const anime = animesFetch.data.animes[i];

          if (animes.length < 10) {
            animes.push(anime);
          }
        }

        mostPopularAnimes = mostPopularAnimesFetch.data.animes;
        animeRandom = animesFetch.data.animes[number];

        const genres = await axios(
          `http://localhost:8000/anime/${animeRandom.id}`
        );

        animeGenres = genres.data.genres;
        if (profileId.length > 0) {
          let getAnimesInList = await axios(
            `http://localhost:8000/user/profile/${profileId}/list/anime/all`
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
  <h2 style="margin-left:10px; margin-top:25px;">
    Not sure? Check out the most popular series!
  </h2>
  <div class="anime_card_container">
    {#each mostPopularAnimes as popularAnime}
      <AnimeCard
        animeData={popularAnime}
        saved={animesInList.find((e) => e.id == popularAnime.id) ? true : false}
      />
    {/each}
  </div>
{:else}
  <div
    style="width:100%;height:100%; display:flex; justify-content:center;margin-top:100px;"
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
