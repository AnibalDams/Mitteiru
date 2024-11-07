
<script>
  import { goto } from "$app/navigation";
    
    import {  HeartFilled} from "radix-icons-svelte";
    import formatNumber from '$lib/numberFormatter'
    export let id;
    export let cover;
    export let title = ""
    export let likes = 0
    export let showLikes = false
</script>


<div class="card" on:click={goto(`/anime/${id}`)}>
    {#if showLikes}
        <div class="likes"><span class="like"><HeartFilled style="position:absolute; top:50%; transform:translateY(-50%); right:145%;"/>{formatNumber(likes)} </span></div>
        
    {/if}
    <img src={cover} alt={title} class="cover">
    <span class="title">{title.length>22?title.substring(0,19)+"...":title}</span>
</div>

<style>
    div.card{
        position: relative;
        display: flex;
        flex-direction: column;
        margin-right: 10px;
        margin-bottom: 20px;
        transition: 0.1s;
    }
    div.card:hover{
            opacity: 0.5;
    }
    div.card img.cover{
        border-radius: 10px;
        width: 150px;
        height: 255px;
        object-fit: cover;
    }
    div.card span.title{
        display: inline-block;
        margin-top: 5px;
        font-weight: bold;
    }
    div.card div.likes{
        position: absolute;
        padding-left: 25px;
        padding-right: 10px;
        padding-top: 5px;
        border-radius:10px ;
        font-weight: bold;
        padding-bottom: 5px;
        top: 10px;
        left:5px;
        background-color: white;
    }
    div.card div.likes span.like {
        position: relative;
        display: inline-block;
        width: 100%;
        height: 100%;
    }
</style>