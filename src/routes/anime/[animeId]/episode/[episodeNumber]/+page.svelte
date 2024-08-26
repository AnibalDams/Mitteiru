<script>
    import { onMount } from "svelte";
    import Header from "../../../../Header.svelte";
    import { goto } from "$app/navigation";

    import {
        TrackNext,
        TrackPrevious,
        HamburgerMenu,
        EyeOpen
    } from "radix-icons-svelte";

    import NotFoundError from '../../../../../components/NotFoundError.svelte'

    import ModalWithoutActions from "../../../../../components/ModalWithoutActions.svelte";

    export let data;
    let episodeNumber = data.episode.episode_number;
    let profileId = "";
    let profileImage = "";
    let profileName = "";
    let logged = "";
    let showModal = false
    let episodeLink = `http://localhost:8000/static/${data.status===200?data.episode.link:0}`;
    let episode_ = data.episode

    const getEpisode = async (episodeN) => {
        for (let i = 0; i < data.allEpisodes.length; i++) {
            const episode = data.allEpisodes[i];
            if (episode.episode_number === episodeNumber) {
                episode_ = data.allEpisodes[i]
                episodeLink = `http://localhost:8000/static/${episode.link}`;
            }
        }
    };

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

            logged = "si";
        } else {
            logged = "no";
        }
    });
</script>

<Header {logged} {profileImage} name={profileName} />

<svelte:head>
    <title>{`${data.status===404?"This anime doesn't have episodes":data.anime.name+" "+"episode"+" "+episodeNumber}`}</title>
</svelte:head>

{#if data.episode.episode_number}
<ModalWithoutActions bind:showModal>
    <h2 slot="header" style="font-size:20px; margin-bottom:10px;">
        Episode {episodeNumber} - {episode_.name}
    </h2>
    <p style="display: inline-block; margin-top:10px;margin-bottom:10px;">{episode_.synopsis}</p>
</ModalWithoutActions>

<div class="episode_container">
    

    <h2 class="title">{data.anime.name} episode {episodeNumber}     <button title="Synopsis" on:click={()=>{showModal=true}} class="synopsis_button"><EyeOpen/></button> </h2>

    <video src={episodeLink} controls class="video_player">
        <track kind="captions" /></video
    >
    <div class="controls">
        {#if episodeNumber != 1}
            <button
                class="control"
                on:click={() => {
                    episodeNumber -= 1;
                    getEpisode(episodeNumber);
                }}
                ><TrackPrevious style="margin-right:10px;" />
                <span>Previous</span></button
            >
        {:else}
            <div></div>
        {/if}
        <button class="control" on:click={() => goto(`/anime/${data.animeId}`)}
            ><HamburgerMenu /></button
        >
        {#if episodeNumber < data.allEpisodes.length}
            <button
                class="control"
                on:click={() => {
                    episodeNumber += 1;
                    getEpisode(episodeNumber);
                }}
                ><span>Next</span><TrackNext style="margin-left:10px;" />
            </button>
        {:else}
        <div></div>
            
        {/if}
    </div>
</div>
{:else}
<NotFoundError text="This anime doesn't have the given episode. Sorry for the inconvenience :("/>
{/if}
<style>
    .episode_container {
        width: 100%;
        margin-top: 20px;
    }

    .episode_container .video_player {
        width: 100%;

    }
    .episode_container .title {
        margin-left: 10px;
        margin-bottom: 20px;
    }
    .episode_container .controls {
        margin: 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    button.control {
        display: flex;
        cursor: pointer;
        padding-top: 10px;
        padding-bottom: 10px;
        padding-left: 20px;
        padding-right: 20px;
        justify-content: center;
        align-items: center;
        border: 1px solid black;
        background: none;
        border-radius: 5px;
        transition: 0.1s;
    }
    .episode_container .controls .control:hover{
        box-shadow: 4px 4px 0px black;

    }
    .synopsis_button{
        padding-left: 5px;
        padding-right: 5px;
        padding-top: 5px;
        padding-bottom: 5px;
        border:1px solid black;
        border-radius: 5px;
        background-color: white;
        cursor: pointer;
    }

   
</style>

