<script>
    import axios from "axios";
    import { onMount } from "svelte";
    import AnimeCard from "../../../components/AnimeCard.svelte";
    import Loader from "../../../components/Loader.svelte";
    import Header from "../../Header.svelte";
    import LangText from "../../../components/LangText.svelte";
    import { getCookie } from "svelte-cookie";
 import {PUBLIC_API_URL} from "$env/static/public"
 //let animes = [];
    let loaded = false;
    let profileId = "";
    let profileImage = "";
    let profileName = "";
    let animesInList = [];
    let savedSet = new Set();
    $: if (animesInList.length > 0) {
      savedSet = new Set(animesInList.map((e) => e._id));
    }
    export let data;
    let logged;
    onMount(async () => {
      profileId = getCookie("profileId");
      profileImage = getCookie("profileImage");
      profileName = getCookie("profileName");
      logged = data.userId ? "si" : "no";
  


        if (profileId.length > 0) {
          let getAnimesInList = await axios(
            `${PUBLIC_API_URL}/user/profile/${profileId}/list/anime/all`
          );
          animesInList = getAnimesInList.data.animes;
        }

        loaded = true;
      
    });
  </script>
  
  <svelte:head>
    <title>Directory</title>
    <meta name="description" content="Svelte demo app" />
  </svelte:head>
  
  {#if loaded}
    <Header {logged} {profileImage} name={profileName} />
    <h2 ><LangText p="navBar" w="directory"/> ({data.animes.length})</h2>
  
      <div class="animes_container" >
       {#each data.animes as anime (anime._id)}
         <AnimeCard
          animeData={anime}
          saved={savedSet.has(anime._id) ? true : false}
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
      margin: 10px;
    }
    .animes_container {
      margin: 10px;
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
    }
  </style>
  