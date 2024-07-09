<script>
  import { onMount } from "svelte";
  import axios from "axios";
  import AnimeReccomendation from "../../../../components/AnimeReccomendation.svelte";
  import AnimeCard from "../../../../components/AnimeCard.svelte";
  import Loader from "../../../../components/Loader.svelte";
  import Header from "../../../Header.svelte";
  import { getCookie } from "svelte-cookie";
  import { goto } from "$app/navigation";

  import NotFoundError from "../../../../components/NotFoundError.svelte";

  export let data;
  let isThereAnime = null;
  let animeRandom;
  let animes = [];
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
      let animesFetch = await axios(
        `http://localhost:8000/user/profile/${profileId}/list/all`
      );
      if (animesFetch.data.list.length <= 0) {
        isThereAnime = false;
        loaded = true;
      }
      if (animesFetch.data.list.length >= 1) {
        let number = randomNumber(0, animesFetch.data.list.length - 1);

        for (let i = 0; i < animesFetch.data.list.length; i++) {
          const anime = animesFetch.data.list[i];

          if (animes.length < 10) {
            animes.push([anime[2], anime[3], "", "", "", anime[5]]);
          }
        }

        animeRandom = animesFetch.data.list[number];
        animeRandom = [
          animeRandom[2],
          animeRandom[3],
          animeRandom[4],
          "",
          "",
          "",
          animeRandom[6],
        ];
        const genres = await axios(
          `http://localhost:8000/anime/${animeRandom[0]}`
        );
        animeGenres = genres.data.genres;
        isThereAnime = true;
        loaded = true;
      }
    }
  });
</script>

<svelte:head>
  <title>Your List</title>
  <meta name="description" content="Svelte demo app" />
</svelte:head>

{#if loaded}
  {#if !isThereAnime}
    <Header {logged} {profileImage} name={profileName} />

    <NotFoundError
      text={`You don't have any anime here... `}
      link={true}
      linkText="Try adding one!"
      linkDirection="/directory"
    />
  {:else}
    <Header {logged} {profileImage} name={profileName} />
    <AnimeReccomendation animeData={animeRandom} {animeGenres} />

    <h2 style="margin:10px;">Your list. Let's watch something!</h2>
    <div class="anime_card_container">
      {#each animes as anime}
        <AnimeCard animeData={anime} />
      {/each}
    </div>
  {/if}
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
