
<script>
    import MobileEpisodeCard from "./mobileEpisodeCard.svelte";
    export let data;
</script>




<div class="cover_container" 

style={`background-image: linear-gradient(to top, #fff, transparent),linear-gradient(to bottom, #fff, transparent),url(${data.anime.studio==="animeFlv"?data.anime.cover:data.anime.image});`}

>
    <img src={data.anime.cover} alt="">
    <div class="title_container">
        <span class="name">{data.anime.name}</span>
        <span class="japanese_name">{data.anime.japanese_name}</span>
    </div>
    <div class="extra_info">
        <span class="extra_info studio">{data.anime.studio}</span>
        <span class="extra_info year">{data.anime.release_year}</span>
        <span class="extra_info on_going" style={`background-color:${data.anime.on_going ===1?"#90EE90":"#ADD8E6"}`}>{data.anime.on_going===1?"Releasing":"Finished"}</span>
    </div>
</div>
<p>{data.anime.synopsis}</p>
<div class="genres">
    {#each data.genres as genre}
    <span class="extra_info">{genre.name}</span>
        
    {/each}
</div>

<div class="episodes">
    {#each data.episodes as episode}
        {#if episode.episode_number != 0}
        <MobileEpisodeCard episodeNumber={episode.episode_number} episodeTitle={episode.name} thumbnail={episode.thumbnail} animeId={data.anime.id}/>
            
        {/if}    
    {/each}
   

</div>


<style>
    div.cover_container{
    position: relative;
        width: 100%;
        height: 500px;
        display: flex;
        justify-content: center;
        align-items: center;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        flex-direction: column;

    }
    div.cover_container img{
        width: 200px;
        height: 300px;
        object-fit: cover;
        border-radius: 10px;
        /* box-shadow: 0 0 10px rgba(0, 0, 0, 0.5); */
    }
    div.title_container{
        margin-top: 20px;
        padding-left: 20px;
        padding-right: 20px;
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;

    }
    div.title_container span.name{
        font-size: 25px;
        font-weight: bold;
    }
    div.title_container span.japanese_name{
        font-size: 15px;
        font-weight: bold;
    }
    div.extra_info{
        position: absolute;
        top: 455px;
    }
    span.extra_info{
        display: inline-block;
        margin-right: 5px;
        padding-left: 10px;
        padding-right: 10px;
        padding-top: 5px;
        padding-bottom: 5px;
        border: 1px solid black;
        
        border-radius: 5px;
        font-size: 16px;
        font-weight: bold;
    }
    div.extra_info span.studio{
        background-color: #a2c0ff;
    }
    div.extra_info span.year{
        background-color: #FFFFE0;
    }
        p{
        padding-left: 10px;
        padding-right: 10px;
        text-align: justify;
        line-height: 1.2;
        font-size: 18px;
        font-weight: 400;
        max-width: 800px;
        margin-bottom: 40px;
    }
    div.genres{
        margin-left:10px;
        display: flex;
        overflow: auto;
        white-space: nowrap;
    }
    div.episodes{
        margin-left: 10px;
        margin-right: 10px;
        margin-top: 25px;
    }
</style>


