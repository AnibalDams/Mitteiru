<script>
  import { goto } from "$app/navigation";
  import Gradient from "../../../../components/Gradient.svelte";

  export let characterId = "";
  export let picture = "";
  export let name = "";
  export let role = ""
  let gPosition = 0;
</script>


<div class="character_card" title={role} on:click={goto(`/anime/character/${characterId}`)} on:mouseover={()=>gPosition = 90} on:mouseleave={()=>gPosition = 0}>
  <img src={picture} alt={name}>
  <Gradient positionValue={gPosition}/>
  <span class="name">{name}</span>
 
</div>


<style>
  .character_card{

        position: relative;
        background: none;
        border: none;
        outline: none;
        display: flex;
        flex-direction: column;
        max-width: 250px;
        cursor: pointer;
        margin-top:20px;
        border-radius: 5px;

        margin-bottom:20px;
        overflow: hidden;
        transition: 0.1s;
  }
  .character_card img{
        width: 250px;
        height: 350px;
        object-fit: cover;
        object-position: center;
        border-radius: 5px;
        transition: 0.1s;
  }
  .character_card:hover img{
        transform: scale(1.05);
  }
  .name{
      position: absolute;
        opacity: 0;

        gap: 20px;
        font-weight: bold;
        margin-top: 10px;
        color: #eee;
        margin-left: 10px;
        bottom:2%;
        transition: 0.1s;
        z-index: 4;
  }

  .character_card:hover .name{
        bottom: 5%;
        opacity: 1;
  }

</style>
