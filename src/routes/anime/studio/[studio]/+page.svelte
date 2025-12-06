<script>
    import NotFoundError from "../../../../components/NotFoundError.svelte";
    import AnimeCard from "../../../../components/AnimeCard.svelte";
    import Header from "../../../Header.svelte";
    import axios from "axios";
    import { onMount } from "svelte";

    export let data;

    let profileId = "";
    let profileImage = "";
    let profileName = "";
    let logged = "";
    let animesInList = [];
    onMount(async () => {
        const userId = data.userId;
        if (userId && userId.length > 0) {
            const { getCookie } = await import("svelte-cookie");
            profileId = getCookie("profileId");
            profileImage = getCookie("profileImage");
            profileName = getCookie("profileName");
            if (profileId.length <= 0) {
                goto("/selectprofile");
            }
            if (profileId.length >0){
                let getAnimesInList = await axios(
            `https://mitteiru-backend.onrender.com//user/profile/${profileId}/list/anime/all`
          );
          animesInList = getAnimesInList.data.animes;
            }
            

            logged = "si";
        } else {
            logged = "no";
        }
    });
</script>

<Header {logged} {profileImage} name={profileName} />

<svelte:head>


    <title>Animes of the studio: {data.studio}</title>


</svelte:head>



{#if data.status === 404 || data.animes.length === 0}
    <NotFoundError text="It seems like, there isn't any animes of this studio here. Or does it exist?" />
{:else}
    <div class="container">

        <span class="text">Animes of the studio: {data.studio}</span>
        <div class="animes_container">
            {#each data.animes as anime}
                <AnimeCard animeData={anime} saved={animesInList.find((e) => e.id == anime.id) ? true : false}/>

            {/each}
        </div>
    </div>
{/if}

<style>
    .container {
        margin: 10px;
    }

    .text {
        font-weight: bold;
        font-size: 1.5rem;
    }
    .animes_container{
        margin-top: 20px;
        display: flex;
        flex-wrap: wrap;
    }
</style>
