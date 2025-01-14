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
    let episodeNumber = data.episode.episodeNumber;
    let profileId = "";
    let profileImage = "";
    let profileName = "";
    let logged = "";
    let showModal = false
    let episodeLink = data.episode.link
    let episode_ = data.episode

    const getEpisode = async (episodeN) => {
        for (let i = 0; i < data.allEpisodes.length; i++) {
            const episode = data.allEpisodes[i];
            if (episode.episodeNumber === episodeNumber) {
                episode_ = data.allEpisodes[i]
                episodeLink =episode.link;
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

{#if data.episode.episodeNumber}
<ModalWithoutActions bind:showModal>
    <h2 slot="header" style="font-size:20px; margin-bottom:10px;">
        Episode {episodeNumber} - {episode_.name}
    </h2>
    <p style="display: inline-block; margin-top:10px;margin-bottom:10px; ">{episode_.synopsis}</p>
</ModalWithoutActions>

<div class="episode_container">
    

    <h2 class="title">{data.anime.name} episode {episodeNumber} <button title="Synopsis" on:click={()=>{showModal=true}} class="synopsis_button"><EyeOpen style="position:absolute;top:50%; left:50%;transform:translate(-50%,-50%)"/></button> {#if data.anime.studio === "animeFlv"}<span style="display: inline-block;font-size:16px; padding:10px;background-color:rgb(255, 79, 79);color:darkred; border-radius:10px; margin-left:10px;">Anime obtained from an external page. This episode may contain some ads.</span>{/if}</h2>

 
    <iframe style="width: 100%; height:700px" src={episodeLink} frameborder="0"></iframe>  

    <div class="controls">
        {#if episodeNumber != 1}
            <button
                class="control"
                on:click={() => {
                    episodeNumber -= 1;
                    getEpisode(episodeNumber);
                }}
                ><TrackPrevious style="margin-right:10px;" />
                <span style="font-weight: bold;">episode {episodeNumber-1}</span></button
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
                ><span style="font-weight: bold;">episode {episodeNumber+1}</span><TrackNext style="margin-left:10px;" />
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
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: 10px;
        margin-bottom: 20px; 
        text-align: center;
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
        position: relative;
        width: 30px;
        height: 30px;
        margin-left: 5px;
        border:1px solid black;
        border-radius: 5px;
        background-color: white;
        cursor: pointer;
    }

   
</style>

