<script>
  import axios from "axios";
  import { onMount } from "svelte";
  import AnimeCard from "../../components/AnimeCard.svelte";
  import Loader from "../../components/Loader.svelte";
  import Header from "../Header.svelte";
  import LangText from "../../components/LangText.svelte";
  import { getCookie } from "svelte-cookie";
  import { goto } from "$app/navigation";

  let animes = [];
  let loaded = false;
  let profileId = "";
  let profileImage = "";
  let profileName = "";
  let animesInList = [];
  export let data;
  let logged;
  onMount(async () => {
    profileId = getCookie("profileId");
    profileImage = getCookie("profileImage");
    profileName = getCookie("profileName");
    logged = data.userId ? "si" : "no";

    if (profileId.length <= 0 && logged == "si") {
      goto("/selectprofile");
    } else {
      let getAnimes = await axios("https://mitteiru-backend.onrender.com/anime/d/all");
      animes = getAnimes.data.animes;
      if (profileId.length > 0) {
        let getAnimesInList = await axios(
          `https://mitteiru-backend.onrender.com/user/profile/${profileId}/list/anime/all`
        );
        animesInList = getAnimesInList.data.animes;
      }

      loaded = true;
    }
  });
</script>

<svelte:head>
  <title>Directory</title>
  <meta name="description" content="Svelte demo app" />
</svelte:head>

{#if loaded}
  <Header {logged} {profileImage} name={profileName} />
  <h2 ><LangText p="navBar" w="directory"/> ({animes.length})</h2>
  <div class="animes_container">
    {#each animes as anime}
      <AnimeCard
        animeData={anime}
        saved={animesInList.find((e) => e.id == anime.id) ? true : false}
      />
    {/each}
  </div>
{:else}
  <div
    style="position:relative;width:100%;height:500px; "
  >
    <Loader />
  </div>
{/if}

<style>
  h2 {
    margin-top: 20px;
    text-align: center;
    margin: 10px;
  }
  .animes_container {
    margin: 10px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
  }
</style>
