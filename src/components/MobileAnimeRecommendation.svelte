<script>
    import Button from "./Button.svelte";
    export let animeData = {synopsis:""}
</script>

<div class="container" style={`background-image: linear-gradient(to top, #fff, transparent),linear-gradient(to bottom, #fff, transparent), url(${animeData.studio==="animeFlv"?animeData.cover:animeData.image});`}>

    <h1 class="title">{animeData.name}</h1>
    <p class="synopsis">{animeData.synopsis.length >= 250?animeData.synopsis.substring(0,247)+"...":animeData.synopsis}</p>
    <div class="actions">
        <Button variant="primaryMobile">Watch Now!</Button>
        <Button variant="lightMobile">More Details</Button>
    </div>
</div>


<style>
    .container{
        display: flex;
        flex-direction: column;
        justify-content: center;
        max-width: 100%;
        height: 400px;
        padding-left:10px;
        background-repeat: no-repeat;
        background-position: center;
        background-size: cover;
    }
    .container h1.title{
        font-size:40px;
    }
    .container p.synopsis{
        display: inline-block;
        max-width: 80%;

    }
    .container .actions{
        margin-top: 15px;
    }
</style>