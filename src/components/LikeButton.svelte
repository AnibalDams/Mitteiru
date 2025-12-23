
<script>
    import {  Heart, HeartFilled} from "radix-icons-svelte";
    import formatNumber from "$lib/numberFormatter"
    import axios from "axios";
    export let likesCount = 0
    export let animeId = ""
    export let profileLikes = []
    export let profileId = ""
    export let liked;
    import {PUBLIC_API_URL} from "$env/static/public"

</script>
<span  on:click={async()=>{
    await axios.post(`${PUBLIC_API_URL}/anime/${animeId}/like/${profileId}`)
    likesCount = !liked?likesCount+1:likesCount-1
    liked=liked?false:true
    
    
}} title={likesCount} style={`color: ${liked?"hsl(53, 50%, 10%)":"black"}; box-shadow: 2px 2px 0px ${liked?" hsl(145 100% 22%)":"black"};border: 1px solid ${liked?"hsl(145 100% 22%)":"black"};`}>{#if !liked}
    <Heart style="position:absolute;top:50%; left:3px; transform:translateY(-50%)"/> 
    {:else}
    <HeartFilled color="green" style="position:absolute;top:50%; left:3px; transform:translateY(-50%)"/> 
{/if} {formatNumber(likesCount)} </span>


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