<script>
  import { onMount } from "svelte";
  import axios from "axios";

  import getCookie from "$lib/getCookie";
  import { goto } from "$app/navigation";

  import { selectedList } from "./store";

  import { Chart } from "chart.js/auto";
  import { PUBLIC_API_URL } from "$env/static/public";
  import DesktopPage from "./components/DesktopPage.svelte";
  import MobilePage from "./components/MobilePage.svelte";

  export let data;
  let isThereAnime = null;
  let animeRandom;
  let lists = [];

  let animes = [];
  let loaded = false;
  let animeGenres;
  let profileId = "";
  let profileImage = "";
  let profileName = "";
  let display = false;
  let logged = "nosesabe";
  let newListName = "";
  let createButtonText = "Create";
  let analyticsPage = false;
  let listCanvasElement;
  let listChart;
  let genreChartCanvas;
  let genreChart;
  function randomNumber(min, max) {
    return Math.round(Math.random() * (max - min)) + min;
  }

  let isMobile;
  onMount(async () => {
    profileId = getCookie("profileId", document);
    logged = data.userId.user ? "si" : "no";
    profileName = getCookie("profileName", document);
    profileImage = getCookie("profileImage", document);

    if (profileId.length <= 0 && logged === "si") {
      goto("/selectprofile");
    } else {
      let listsFetch = await axios(
        `${PUBLIC_API_URL}/user/profile/${profileId}/list/all`,
      );
      let animesFetch = await axios(
        `${PUBLIC_API_URL}/user/profile/${profileId}/list/anime/all`,
      );
      lists = listsFetch.data.lists;
      $selectedList = lists[0]._id;
      if (animesFetch.data.animes.length <= 0) {
        isThereAnime = false;
        loaded = true;
      }
      if (animesFetch.data.animes.length >= 1) {
        let number = randomNumber(0, animesFetch.data.animes.length - 1);
        for (let i = 0; i < animesFetch.data.animes.length; i++) {
          const anime = animesFetch.data.animes[i];
          animes.push(anime);
        }
        animeRandom = animesFetch.data.animes[number];

        isThereAnime = true;
        loaded = true;
      }
    }
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    isMobile = mediaQuery.matches;

    const handleResize = () => {
      isMobile = mediaQuery.matches;
    };

    mediaQuery.addEventListener("change", handleResize);

    return () => {
      mediaQuery.removeEventListener("change", handleResize);
    };
  });
</script>

{#if isMobile}
  <MobilePage
    {profileId}
    {animeRandom}

    {selectedList}

    {animes}
    {createButtonText}


    {isThereAnime}


    {lists}
    {loaded}
    {logged}

    {profileImage}
    {profileName}
    {display}
  />
{:else}
  <DesktopPage
    {profileId}
    {animeRandom}
    {analyticsPage}
    {selectedList}
    {animeGenres}
    {animes}
    {createButtonText}
    {genreChart}
    {genreChartCanvas}
    {isThereAnime}
    {listCanvasElement}
    {listChart}
    {lists}
    {loaded}
    {logged}
    {newListName}
    {profileImage}
    {profileName}
    {display}
  />
{/if}
