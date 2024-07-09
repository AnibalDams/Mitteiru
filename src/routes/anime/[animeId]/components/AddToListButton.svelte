<script>
  import { Plus, Exit, Cross2 } from "radix-icons-svelte";
  import axios from "axios";
  import { onMount } from "svelte";

  export let animeData;
  let doesTheAnimeIsInList = false;
  let buttonText = "Add to list";
  export let profileId;

  const addToList = async () => {
    buttonText = "loading...";
    await axios.post(
      `http://localhost:8000/user/profile/${profileId}/list/add`,
      {
        animeId: animeData.id,
        animeTitle: animeData.name,
        animeSynopsis: animeData.synopsis,
        animeCover: animeData.cover,
        animeImage: animeData.image,
      }
    );

    doesTheAnimeIsInList = true;
    buttonText = "Remove from list";
  };
  const removeFromList = async () => {
    buttonText = "loading...";
    await axios.delete(
      `http://localhost:8000/user/profile/${profileId}/list/anime/${animeData.id}`
    );

    doesTheAnimeIsInList = false;
    buttonText = "Add to list";
  };
  onMount(async () => {
    let doesTheAnimeIsInListQuery = await axios(
      `http://localhost:8000/user/profile/${profileId}/list/all`
    );

    for (let i = 0; i < doesTheAnimeIsInListQuery.data.list.length; i++) {
      const anime = doesTheAnimeIsInListQuery.data.list[i];
      if (anime[2] === animeData.id) {
        doesTheAnimeIsInList = true;
        console.log(doesTheAnimeIsInList);

        buttonText = "Remove from list";
      }
    }
  });
</script>

{#if doesTheAnimeIsInList === false}
  <button type="button" class="button" on:click={addToList}
    ><Plus style="margin-right:5px;" /> {buttonText}</button
  >
{:else}
  <button type="button" on:click={removeFromList} class="button"
    ><Cross2 style="margin-right:5px;" /> {buttonText}</button
  >
{/if}

<style>
  .button {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 10px;
    width: 300px;
    height: 50px;
    background: none;
    border: 1px solid black;
    border-radius: 5px;
    font-weight: bold;
    cursor: pointer;
    transition: 0.1s;
  }
  .button:hover {
    box-shadow: 4px 4px 0px black;
  }
</style>
