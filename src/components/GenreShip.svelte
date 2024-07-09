<script>
  export let genre;
  import { goto } from "$app/navigation";
</script>

<button
  on:click={() => {
    goto(`/anime/genre/${genre}`);
  }}
  class="genre">{genre}</button
>

<style>
  .genre {
    margin-bottom: 5px;
    background-color: white;
    padding-left: 10px;
    padding-right: 10px;
    padding-top: 5px;
    padding-bottom: 5px;
    margin-right: 5px;
    border: 1px solid black;
    border-radius: 5px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    transition: 0.1s;
  }
  .genre:hover {
    box-shadow: 2px 2px 0px black;
  }
</style>
