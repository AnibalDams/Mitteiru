<script>
    export let episodeData
	import { goto } from "$app/navigation";

</script>

<button class="episode_card" on:click={goto(`/anime/${episodeData.anime_id}/episode/${episodeData.episode_number}`)}>
    <img src={`http://localhost:8000/static/${episodeData.thumbnail}`} alt={`Episode ${episodeData.episode_number - episodeData.name}`} class="episode_card_image"/>
    <span class="episode_card_name">Episode {episodeData.episode_number} - {episodeData.name}</span>
</button>




<style>
    button.episode_card{
        background: none;
        border: none;
        outline: none;
        display: flex;
        flex-direction: column;
        max-width: 350px;
        cursor: pointer;
        margin-right:20px;
        margin-bottom:20px;
        
    }

    button.episode_card img.episode_card_image{
        width: 350px;
        height: 200px;
        object-fit: cover;
        object-position: center;
        border-radius: 5px;
        transition: 0.1s;
    }

    button.episode_card:hover img.episode_card_image{
        box-shadow: 4px 4px 0px black;
    }

    button.episode_card span.episode_card_name{
        display:inline-block;
        font-weight: bold;
        margin-top: 10px;
    }
</style>