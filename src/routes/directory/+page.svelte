<script>
    import axios from "axios";
    import { onMount } from "svelte";
    import AnimeCard from "../../components/AnimeCard.svelte";
    import Loader from "../../components/Loader.svelte";
    import Header from "../Header.svelte";
    import { getCookie } from "svelte-cookie";
    import { goto } from "$app/navigation";

    let animes = [];
    let loaded = false;
    let profileId = "";
    let profileImage = "";
    let profileName = "";
    export let data;
    let logged;
    onMount(async () => {
        profileId = getCookie("profileId");
        profileImage = getCookie("profileImage");
        profileName = getCookie("profileName");
        logged = data.userId ? "si" : "no";

        if (profileId.length <= 0 && logged === "si") {
            goto("/selectprofile");
        } else {
            let getAnimes = await axios("http://localhost:8000/anime/all");
            animes = getAnimes.data.animes;
            loaded = true;
        }
    });
</script>

<svelte:head>
	<title>Directory</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>


{#if loaded}
    <Header {logged} {profileImage} name={profileName}/>
    <h2>Directory ({animes.length})</h2>
    <div class="animes_container">
        {#each animes as anime}
            <AnimeCard animeData={anime} />
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
    h2 {
        margin: 10px;
    }
    .animes_container {
        margin: 10px;
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
    }
</style>
