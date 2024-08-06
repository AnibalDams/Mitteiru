<script>
      import {
    MagnifyingGlass,
  } from "radix-icons-svelte";
  import { goto } from "$app/navigation";
  import {searchIndex} from '../routes/search/[searchIndex]/searchIndex'

  export let searchPage=false 
  export let searchPageAction

</script>


<div class="search_bar">
    <input type="text" bind:value={$searchIndex} placeholder="Search an anime" class="search_bar_input">
    <span class="search_bar_button" on:click={()=>{
        if (searchPage) {
            if ($searchIndex.length >0) {
            searchPageAction()
                
            }
        }else{
        if($searchIndex.length >0){
            goto(`/search/${$searchIndex}`)
        }}
    }}><MagnifyingGlass style="position:absolute;top:30%;left:20%; "/></span>
</div>



<style>
    .search_bar{
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .search_bar_input{
        background-color: none;
        border: none;
        outline: none;
        font-size: 14px;
        font-weight: bold;
        padding-left: 20px;
        padding-right: 20px;
        padding-top: 10px;
        padding-bottom: 10px;
        border-top-left-radius: 5px;
        border-bottom-left-radius: 5px;
        transition: 0.1s;

    }

     .search_bar_input:focus{
        border: 1px solid black;
        box-shadow: 4px 4px 0px black;
    }
    .search_bar_input:hover{

      box-shadow: 4px 4px 0px black;


    }
 

    .search_bar_button{
        display: inline-block;
        position:relative;
        cursor: pointer;
        height: 40px;
        width: 30px;
        border-top-right-radius: 5px;
        border-bottom-right-radius: 5px;
        background-color: #fff;
        color:black;
        border:1px solid black;
        transition:0.1s;
    }
    .search_bar_button:hover{
        box-shadow: 4px 4px 0px black;
    }


</style>