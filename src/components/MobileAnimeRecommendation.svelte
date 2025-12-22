<script>
    import { goto } from "$app/navigation";

    import Button from "./Button.svelte";
    export let animeData = { synopsis: "" };
</script>

<div
    class="container"
    style={`background-image: linear-gradient(to top, #fff, transparent),linear-gradient(to bottom, #fff, transparent), url(${animeData.studio === "animeFlv" ? animeData.cover : animeData.image});`}
>
    <h1 class="title">
        {animeData.name.length >= 58
            ? animeData.name.substring(0, 55) + "..."
            : animeData.name}
    </h1>
    <p class="synopsis">
        {animeData.synopsis.length >= 250
            ? animeData.synopsis.substring(0, 247) + "..."
            : animeData.synopsis}
    </p>
    <div class="actions">
        <Button
            variant="primaryMobile"
            onClick={() => goto(`/anime/${animeData._id}/episode/1`)}
            >Watch Now!</Button
        >
        <Button
            variant="lightMobile"
            onClick={() => goto(`/anime/${animeData._id}`)}>More Details</Button
        >
    </div>
</div>

<style>
    .container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        max-width: 100%;
        height: 400px;
        padding-left: 10px;
        background-repeat: no-repeat;
        background-position: center;
        background-size: cover;
    }
    .container h1.title {
        font-size: 40px;
    }
    .container p.synopsis {
        line-height: 1.3;
        color: #333;
        max-width: 80%;
        text-wrap: pretty;
    }
    .container .actions {
        margin-top: 15px;
    }
</style>
