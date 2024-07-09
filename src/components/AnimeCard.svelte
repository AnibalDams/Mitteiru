<script>
	import { goto } from "$app/navigation";
    

    export let animeData = []
</script>



<div class="container" on:click={()=>goto(`/anime/${animeData[0]}`)}>
    <img src={`http://localhost:8000/static/${animeData[5]} `} alt="" class="anime_cover">
    <span class="anime_title">{animeData[1]}</span>
</div>


<style>
    .container{
        display: block;
        margin-right: 20px;
        margin-bottom: 40px;
        width: 300px;
        height: 400px;
        
        cursor: pointer;
    }
    .container .anime_cover{
        border-radius: 5px;
        width: inherit;
        height: inherit;
        object-fit: cover;
        object-position:center;
        transition:0.1s;
    }
    .container .anime_title{
        display:inline-block;
        margin-top: 5px;
        font-weight: bold;
    }
    .container:hover .anime_cover{
        box-shadow: 4px 4px 0px black;
    }
</style>