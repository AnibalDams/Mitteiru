<script>
    import MobileHeader from "../../../../../components/MobileHeader.svelte";
    import MobileAnimeCard from "../../../../../components/mobileAnimeCard.svelte";
    import Loader from "../../../../../components/Loader.svelte";
    import { PUBLIC_API_URL } from "$env/static/public";

    export let logged;
    export let profileName = "";
    export let profileImage = "";
    export let loaded = false;
    export let history = [];
    let today = new Date().toISOString().substring(0, 10);
</script>

<MobileHeader {logged} {profileName} {profileImage} />

<div class="container">
    {#if history.length > 0}
        {#each history as h}
            <span>{h.date == today ? "Today" : h.date}</span>
            <div class="animes_container">
                {#each h.animes as anime}
                    <MobileAnimeCard
                        cover={anime.cover}
                        title={anime.name}
                        id={anime._id}
                    />
                {/each}
            </div>
        {/each}
    {:else}
        <div class="no_history">
            <img
                src={`${PUBLIC_API_URL}/static/WhatsApp Image 2025-01-15 at 3.18.19 PM.jpeg`}
                alt=""
            />
            <span>You haven't visited an anime yet</span>
        </div>
    {/if}
</div>

<style>
    .container {
        margin: 12px;
    }
    .container span {
        font-size: 20px;
        font-weight: bold;
    }
    .animes_container {
        margin-top: 30px;
        display: flex;
        overflow: auto;
        white-space: nowrap;
    }
    .no_history {
        position: absolute;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        top: 50%;
        left: 50%;
        transform: translate(-50%, 50%);
    }
    .no_history img {
        width: 200px;
        height: 200px;
        object-fit: cover;
    }
</style>
