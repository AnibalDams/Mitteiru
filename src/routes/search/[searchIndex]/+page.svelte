<script>
    import axios from "axios";
    import { onMount } from "svelte";
    import AnimeCard from "../../../components/AnimeCard.svelte";
    import Loader from "../../../components/Loader.svelte";
    import Header from "../../Header.svelte";
    import { getCookie } from "svelte-cookie";
    import { goto } from "$app/navigation";

    import {searchIndex} from './searchIndex'

    export let data;
    let loaded = false;
    let animes = [];
    let searchText = data.searchIndex
    let profileId = "";
    let profileImage = "";
    let profileName = "";
    let logged;

    const search = async () => {
        loaded=false
        animes=[]
        let getAnimes = await axios("http://localhost:8000/anime/d/all");

        for (const anime of getAnimes.data.animes) {
            const animeNameLower = anime.name.toLowerCase();
            if (animeNameLower.includes($searchIndex.toLowerCase())) {
                animes.push(anime);
            }
        }
        searchText = $searchIndex
        $searchIndex =""
        loaded=true
    };

    onMount(async () => {
        profileId = getCookie("profileId");
        profileImage = getCookie("profileImage");
        profileName = getCookie("profileName");
        logged = data.userId ? "si" : "no";


            
            
            await search()
            
            loaded = true;
        
    });
</script>

<svelte:head>
    <title>Directory</title>
    <meta name="description" content="Svelte demo app" />
</svelte:head>
<Header {logged} {profileImage} name={profileName} searchPage={true} searchPageAction={()=>{search()}}/>
{#if loaded}
    
    <h2>Results for {searchText} - ({animes.length})</h2>
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
