<script>
    import axios from "axios";
    import { onMount } from "svelte";
    import Loader from "../../../components/Loader.svelte";
    
    import LangText from "../../../components/LangText.svelte";
    import { getCookie } from "svelte-cookie";
    import { goto } from "$app/navigation";
  import MobileHeader from "../../../components/MobileHeader.svelte";
  import MobileAnimeCard from "../../../components/mobileAnimeCard.svelte";
  
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
        let getAnimes = await axios("http://localhost:8000/anime/d/all");
        animes = getAnimes.data.animes;
        if (profileId.length > 0) {
          let getAnimesInList = await axios(
            `http://localhost:8000/user/profile/${profileId}/list/anime/all`
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
    <MobileHeader/>
    <h2 ><LangText p="navBar" w="directory"/> ({animes.length})</h2>
    <div class="animes_container">
      {#each animes as anime}
        <MobileAnimeCard cover={anime.cover} id={anime.id} title={anime.name} /> 
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
      margin-bottom: 10px;
      text-align: center;
    }
    .animes_container {
      margin: 10px;
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
  
      flex-wrap: wrap;
    }
  </style>
  