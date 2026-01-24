<script>
    import { Container } from "radix-icons-svelte";
    import NotFoundError from "../../../../components/NotFoundError.svelte";
    import AnimeCard from "../../../../components/AnimeCard.svelte";
    import Header from "../../../Header.svelte";
    import GenreShip from '../../../../components/GenreShip.svelte'
    import axios from "axios"
    import { onMount } from "svelte";
 import {PUBLIC_API_URL} from "$env/static/public"
    export let data;

    let profileId = "";
    let profileImage = "";
    let profileName = "";
    let logged = "";
    let animesInList = []
    onMount(async () => {
        const userId = data.userId;
        if (userId && userId.length > 0) {
            const { getCookie } = await import("svelte-cookie");
            profileId = getCookie("profileId");
            profileImage = getCookie("profileImage");
            profileName = getCookie("profileName");
            if (profileId.length <= 0) {
                goto("/selectprofile");
                return
            }
            let getAnimesInList = await axios(
				`${PUBLIC_API_URL}/user/profile/${profileId}/list/anime/all`,
			);
            animesInList = getAnimesInList.data.animes
            logged = "si";
        } else {
            logged = "no";
        }
    });
</script>

<Header {logged} {profileImage} name={profileName} />

<svelte:head>


    <title>Animes with the genre: {data.genreName}</title>


</svelte:head>


<div class="genres_container">
    {#each data.tenGenres as genre}
        <GenreShip genre={genre}/>
    {/each}
</div>
{#if data.status === 404}
    <NotFoundError text="There's no genre with the given name." />
{:else}
    <div class="container">

        <span class="text">Results for the genre: {data.genreName} ({data.animes.length})</span>
        <div class="animes_container">
            {#each data.animes as anime}
                <AnimeCard animeData={anime}  saved={animesInList.find(e=>e._id==anime._id)?true:false}/>

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
    .genres_container{
        margin-top: 20px;
        margin-bottom: 20px;
        margin-left: 10px;
        overflow: auto;
        white-space: nowrap;
    }
</style>
