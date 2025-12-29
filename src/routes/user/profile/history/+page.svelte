<script>
  import { onMount } from "svelte";
  import axios from "axios";
  import Header from "../../../Header.svelte";
  import { getCookie } from "svelte-cookie";

  import { goto } from "$app/navigation";
  import Loader from "../../../../components/Loader.svelte";
  import AnimeCard from "../../../../components/AnimeCard.svelte";
  import { PUBLIC_API_URL } from "$env/static/public";
  import DesktopPage from "./components/DesktopPage.svelte";
  import MobilePage from "./components/MobilePage.svelte";

  export let data;
  let profileId;
  let profileImage;
  let profileName;
  let logged;
  let animesInList = [];
  let history = [];
  let loaded = false;
  let today = new Date().toISOString().substring(0, 10);
  let isMobile = false;

  onMount(async () => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    isMobile = mediaQuery.matches;

    const handleResize = () => {
      isMobile = mediaQuery.matches;
    };

    mediaQuery.addEventListener("change", handleResize);
    profileId = getCookie("profileId");
    profileImage = getCookie("profileImage");
    profileName = getCookie("profileName");
    logged = data.userId ? "si" : "no";

    if (profileId.length <= 0 && logged == "si") {
      goto("/selectprofile");
    } else {
      if (profileId.length > 0) {
        let getAnimesInList = await axios(
          `${PUBLIC_API_URL}/user/profile/${profileId}/list/anime/all`,
        );
        let getHistory = await axios(
          `${PUBLIC_API_URL}/user/profile/${profileId}/history`,
        );

        animesInList = getAnimesInList.data.animes;
        history = getHistory.data.animes;
        loaded = true;
      }

      return () => {
        mediaQuery.removeEventListener("change", handleResize);
      };
    }
  });
</script>

<svelte:head>
  <title>Your history</title>
</svelte:head>

{#if !loaded}
  <Loader/>
{:else}
{#if !isMobile}
  <DesktopPage
    {profileImage}
    {profileName}
    {logged}
    {animesInList}
    {history}
    {loaded}
  />
{:else}
  <MobilePage
    {loaded}
    {profileImage}
    {profileName}
    {logged}
    {animesInList}
    {history}
  />
{/if}

{/if}
