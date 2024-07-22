<script>
  import { Plus } from "radix-icons-svelte";
  import axios from "axios";
  import { onMount } from "svelte";

  export let animeData;
  let doesTheAnimeIsInList = false;
  let buttonText = "Add to list";
  export let profileId;
  let rotationNumber = 0;

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
          },
      );

      doesTheAnimeIsInList = true;
      rotationNumber = 45;
      buttonText = "Remove from list";
  };
  const removeFromList = async () => {
      buttonText = "loading...";
      await axios.delete(
          `http://localhost:8000/user/profile/${profileId}/list/anime/${animeData.id}`,
      );

      doesTheAnimeIsInList = false;
      rotationNumber = 0;
      buttonText = "Add to list";
  };
  onMount(async () => {
      let doesTheAnimeIsInListQuery = await axios(
          `http://localhost:8000/user/profile/${profileId}/list/all`,
      );

      for (let i = 0; i < doesTheAnimeIsInListQuery.data.list.length; i++) {
          const anime = doesTheAnimeIsInListQuery.data.list[i];
          if (anime[2] === animeData.id) {
              doesTheAnimeIsInList = true;

              rotationNumber = 45;

              buttonText = "Remove from list";
          }
      }
  });
</script>

<button
  type="button"
  style={`opacity:${buttonText === "loading..." ? 0.5 : 1}; cursor:${buttonText === "loading..." ? "progress" : "pointer"}`}
  class="button"
  on:click={() => {
      if (buttonText !== "loading...") {
          if (buttonText === "Add to list") {
              addToList();
          } else {
              removeFromList();
          }
      }
  }}
  ><Plus
      style={`transition:0.1s;margin-right:5px; margin-left:100px; transform:rotate(${rotationNumber}deg);`}
  />
  <span
      style="position:absolute;
      top:35%; left:120px;">{buttonText}</span
  ></button
>

<style>
  .button {
      position: relative;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: flex-start;
      margin-top: 10px;
      width: 300px;
      text-align: center;
      font-size: 15px;
      height: 50px;
      background: none;
      border: 1px solid black;
      border-radius: 5px;

      font-weight: bold;
      transition: 0.1s;
  }
  .button:hover {
      box-shadow: 4px 4px 0px black;
  }
</style>
