<script>
  import { Heart, HeartFilled } from "radix-icons-svelte";
  import formatNumber from "$lib/numberFormatter";
  import {Toaster, toast} from "svelte-sonner"
  export let likesCount = 0;
  

</script>
<span
on:click={()=>{
  toast.info("To perform this action, please login first!", {position:"top-center"})
}}
  title={likesCount}
  style={`color:black; box-shadow: 0px 0px 4px "black";border: 1px solid black;`}
>
  <Heart
    style="position:absolute;top:50%; left:3px; transform:translateY(-50%)"
  />

  <Heart
    color="black"
    style="position:absolute;top:50%; left:3px; transform:translateY(-50%)"
  />
  {formatNumber(likesCount)}</span>

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
    cursor: default;
    border-radius: 5px;
    transition: 0.1s;
    box-shadow: 2px 2px 0px black;
  }
</style>
