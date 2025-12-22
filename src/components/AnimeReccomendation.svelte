<script>
  import Button from "./Button.svelte";
  import GenreShip from "./GenreShip.svelte";
  import { goto } from "$app/navigation";
  import SavedCheck from "./SavedCheck.svelte";
  export let animeData = [];
  export let animeGenres = [];
  export let inList = false;
  
  let url = `url(${animeData.image})`
</script>

<div
  class="container"
  style={`background-image: linear-gradient(to top, #fff, transparent),linear-gradient(to bottom, #fff, transparent), ${url};`}
>
  <div class="content">
    <h1 class="content_title">{animeData.name}</h1>
    <span style="font-weight: bold; display:inline-block;margin-bottom:5px;">{animeData.japaneseName}</span>
    {#if animeData.genres.length >0}
      <div class="content_genres">
        {#each animeData.genres as genre}
          <GenreShip genre={genre} />
        {/each}
        {#if inList}
          <SavedCheck />
        {/if}
      </div>
    {/if}
    <p class="content_description">{animeData.synopsis}</p>
    <div class="content_buttons">
      <Button
        variant="light"
        marginRight={"5px"}
        onClick={() => {
          goto(`/anime/${animeData._id}/episode/1`);
        }}><svg xmlns="http://www.w3.org/2000/svg" height="15px"style="margin-right:3px;" viewBox="0 -960 960 960" width="15px" fill="#1f1f1f"><path d="m384-312 264-168-264-168v336Zm96.28 216Q401-96 331-126t-122.5-82.5Q156-261 126-330.96t-30-149.5Q96-560 126-629.5q30-69.5 82.5-122T330.96-834q69.96-30 149.5-30t149.04 30q69.5 30 122 82.5T834-629.28q30 69.73 30 149Q864-401 834-331t-82.5 122.5Q699-156 629.28-126q-69.73 30-149 30Z"/></svg>Watch now</Button
      >
      <Button onClick={() => goto(`/anime/${animeData._id}`)}
        ><svg xmlns="http://www.w3.org/2000/svg" height="15px" style="margin-right:3px;" viewBox="0 -960 960 960" width="15px" fill="#fff"><path d="M168-144q-29 0-50.5-21.5T96-216v-528q0-29.7 21.5-50.85Q139-816 168-816h624q29 0 50.5 21.15T864-744v528q0 29-21.5 50.5T792-144H168Zm0-84h72v-72h-72v72Zm552 0h72v-72h-72v72Zm-276-60h72v-240h-72v240Zm-276-84h72v-72h-72v72Zm552 0h72v-72h-72v72ZM168-516h72v-72h-72v72Zm552 0h72v-72h-72v72Zm-240-84q14 0 25-11t11-25.5q0-14.5-11-25T479.5-672q-14.5 0-25 10.35T444-636q0 14 10.35 25T480-600Zm-312-60h72v-72h-72v72Zm552 0h72v-72h-72v72Z"/></svg>More details</Button
      >
    </div>
  </div>
</div>

<style>
  .container {
    width: 100%;
    height: 600px;
    background-position: center;
    background-size: cover;
    display: flex;
    justify-content: flex-start;
    align-items: center;
  }
  h1.content_title {
    font-size: 2.9rem;
  }
  .container .content {
    margin: 10px;
    display: flex;
    flex-direction: column;
    max-width: 60%;
  }
  .container .content .content_genres {
    margin-top: 5px;
    margin-bottom: 25px;
  }

  .container .content .content_description {
    font-size: 18px;
    font-weight: 500;
    color: hsl(0, 0%, 10%);
  }
  .container .content .content_buttons {
    margin-top: 20px;
    display: flex;
  }
</style>
