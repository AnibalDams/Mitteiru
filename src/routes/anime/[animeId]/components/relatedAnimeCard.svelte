<script>
    import Gradient from "../../../../components/Gradient.svelte";
    let gradientPosition = 0
    import { goto } from "$app/navigation";

    export let dataA = {similarAnime:{id:0,horizontalImage:"",name:"" }}
</script>

<div
class="related_anime_card"
on:click={() => goto(`/anime/${dataA.similarAnime.id}`)}
on:mouseover={()=>gradientPosition = 90}
on:mouseleave={()=>gradientPosition=0}
>
<Gradient positionValue={gradientPosition}/>
<img
    class="related_anime_card_image"
    src={`http://localhost:8000/static/${dataA.similarAnime.horizontal_image}`}
    alt=""
/>
<span class="related_anime_card_name"
    >{dataA.similarAnime.name.length > 45?`${dataA.similarAnime.name.substring(0,45)}...`:dataA.similarAnime.name}</span
>
</div>

<style>
        .related_anime_card {
        position: relative;
        margin-top: 20px;
        cursor: pointer;
        width: 350px;
    }

     .related_anime_card .related_anime_card_image {
        width: 350px;
        height: 200px;
        border-radius: 5px;
        transition: 0.1s;
        object-fit: cover;
    }
    .related_anime_card:hover .related_anime_card_image {
        box-shadow: 4px 4px 0px black;
    }
    .related_anime_card .related_anime_card_name {
        position: absolute;
        left: 5%;
        top: 85%;
        opacity: 0;
        z-index: 99;
        color: white;
        width: 330px;
        display: inline-block;
        margin-top: 5px;
        font-weight: bold;
        transition: 0.1s;
    }
     .related_anime_card:hover .related_anime_card_name{
        opacity: 1;
        top: 80%;
    }

</style>