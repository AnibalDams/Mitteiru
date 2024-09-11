<script>
    export let episodeData
	import { goto } from "$app/navigation";
    import Gradient from '../../../../components/Gradient.svelte'

    let gPosition = 0
</script>

<button class="episode_card" on:mouseover={()=>gPosition = 90} on:mouseleave={()=>gPosition = 0} on:click={goto(`/anime/${episodeData.anime_id}/episode/${episodeData.episode_number}`)}>
    <img src={`http://localhost:8000/static/${episodeData.thumbnail}`} alt={`Episode ${episodeData.episode_number - episodeData.name}`} class="episode_card_image"/>
    <Gradient positionValue={gPosition}/>
    <span class="episode_card_name">Episode {episodeData.episode_number} - {episodeData.name}</span>
</button>




<style>
    .episode_card{
        position: relative;
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

    .episode_card img.episode_card_image{
        width: 350px;
        height: 200px;
        object-fit: cover;
        object-position: center;
        border-radius: 5px;
        transition: 0.1s;
    }

    .episode_card:hover img.episode_card_image{
        box-shadow: 4px 4px 0px black;
    }

    .episode_card span.episode_card_name{
        position: absolute;
        opacity: 0;
        display:inline-block;
        font-weight: bold;
        margin-top: 10px;
        color: #fff;
        margin-left: 10px;
        bottom:2%;
        transition: 0.1s;
    }
    .episode_card:hover span.episode_card_name{
        bottom: 5%;
        opacity: 1;
    }
</style>