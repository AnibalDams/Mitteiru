<script>
  import { onMount } from "svelte";
  import axios from "axios";
  import Header from "../../../Header.svelte";
  import getCookie from "$lib/getCookie";
  import { goto } from "$app/navigation";
  import Loader from "../../../../components/Loader.svelte";
  import AnimeCard from "../../../../components/AnimeCard.svelte";
  export let data;
  let profileId;
  let profileImage;
  let profileName;
  let logged;
  let animesInList = [];
  let history = [];
  let loaded = false;
  let today = new Date().toISOString().substring(0,10)
  onMount(async () => {
    profileId = getCookie("profileId",document);
    profileImage = getCookie("profileImage",document);
    profileName = getCookie("profileName",document);
    logged = data.userId ? "si" : "no";

    if (profileId.length <= 0 && logged == "si") {
      goto("/selectprofile");
    } else {

      if (profileId.length > 0) {
        let getAnimesInList = await axios(
          `http://localhost:8000/user/profile/${profileId}/list/anime/all`
        );
        let getHistory = await axios(`http://localhost:8000/user/profile/${profileId}/history`)
        console.log(getHistory.data)
        animesInList = getAnimesInList.data.animes;
        history = getHistory.data.animes
      }

      loaded = true;
    }
  });
</script>

<Header {logged} name={profileName} {profileImage} searchPage={false} />
{#if loaded}

<div class="container">
{#each history as h}
    <span>{h.date == today?"Today":h.date}</span>
    <div class="animes_container">
    {#each h.animes as anime}
        <AnimeCard animeData={anime} saved={animesInList.find((e) => e._id == anime._id) ? true : false}/>
    {/each}
</div>
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
    .container{
        display: flex;
        flex-direction: column;
    }
    span{
        font-size: 20px;
        margin: 10px;
        font-weight: bold;
    }
    .animes_container{
        margin: 10px;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    }
</style>