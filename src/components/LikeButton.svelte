
<script>
    import {  Heart, HeartFilled} from "radix-icons-svelte";
    import formatNumber from "$lib/numberFormatter"
    import axios from "axios";
    export let likesCount = 0
    export let animeId = 0
    export let profileLikes = []
    export let profileId = 0
    export let liked = profileLikes.find(e=>e.profile_id==profileId)?true:false

</script>
<span on:click={async()=>{
    await axios.post(`https://mitteiru-backend.onrender.com/anime/${animeId}/like/${profileId}`)
    likesCount = liked?likesCount+1:likesCount-1
    
    
}} title={likesCount} on:click={()=>{liked=liked?false:true}} style={`color: ${liked?"green":"black"}; box-shadow: 0px 0px 4px ${liked?"green":"black"};border: 1px solid ${liked?"green":"black"};`}>{#if !liked}
    <Heart style="position:absolute;top:50%; left:3px; transform:translateY(-50%)"/> 
    {:else}
    <HeartFilled color="green" style="position:absolute;top:50%; left:3px; transform:translateY(-50%)"/> 
{/if} {formatNumber(likesCount)}</span>


<style>
    span {
        position: relative;
        padding-left: 20px;
        padding-right: 10px;
        padding-top: 5px;
        padding-bottom: 5px;
        background-color: white;
        font-weight: bold;
        font-size: 15px;
        border-radius: 5px;
        cursor: pointer;
       transition:0.1s;
        
    }
</style>