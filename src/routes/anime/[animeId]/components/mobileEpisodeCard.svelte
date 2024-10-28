<script>
    import {goto} from '$app/navigation'
    export let thumbnail;
    export let episodeTitle;
    export let episodeNumber;
    export let animeId;
</script>

<div class="episode_card" on:click={()=>{goto(`/anime/${animeId}/episode/${episodeNumber}`)}}>
    <img src={thumbnail} alt={episodeTitle} class="thumbnail">
    <span>Episode - {episodeNumber} / {episodeTitle}</span>
</div>


<style>
    div.episode_card{
        display: flex;
        align-items: center;
        width: 100%;
        height: 70px;
        margin-bottom: 10px;
        border-radius: 10px;
        transition: 0.1s;
    }
    div.episode_card:hover{
        opacity: 0.5;
    }

    div.episode_card img.thumbnail{
        width: 120px;
        height: 70px;
        object-fit: cover;
        object-position: center;
        margin-right: 20px;

    }
    div.episode_card span{
        font-size: 16px;
        font-weight: bold;
    }
</style>