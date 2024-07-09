<script>
  import { onMount } from "svelte";

  import EpisodeCard from "./EpisodeCard.svelte";
  import AddToListButton from "./AddToListButton.svelte";
  import GenreShip from "../../../../components/GenreShip.svelte";
  import { Plus } from "radix-icons-svelte";
  import { goto } from "$app/navigation";

  export let logged;
  export let dataA;

  export let profileId;
  onMount(() => {
    console.log(dataA.similarAnime);
  });
</script>

<div
  class="anime_container"
  style={`background-image: linear-gradient(to top, #fff, transparent),linear-gradient(to bottom, #fff, transparent),url(http://localhost:8000/static/${dataA.anime.image});`}
>
  <div class="right_sec">
    <div class="image_sec">
      <img
        src={`http://localhost:8000/static/${dataA.anime.cover}`}
        alt=""
        class="cover"
      />
      {#if logged === "si" && profileId.length > 0}
        <AddToListButton animeData={dataA.anime} {profileId} />
      {/if}
    </div>
    <div class="anime_information">
      <div class="episodes_status_sec">
        <span class="episodes_status_text"
          >Episodes: <span style="color:blue;">{dataA.episodes.length}</span
          ></span
        >
        <span class="episodes_status_text"
          >Status: <span
            style={`color:${dataA.anime.onGoing ? "green" : "blue"};`}
            >{dataA.anime.onGoing ? "On going" : "Finished"}</span
          ></span
        >
      </div>
      <h1 class="anime_title">{dataA.anime.name}</h1>
      <span
        class="anime_studio_ship"
        on:click={() => goto(`/anime/studio/${dataA.anime.studio}`)}
        >{dataA.anime.studio}</span
      >
      <span class="anime_studio_ship">{dataA.anime.releaseYear}</span>
      <p class="anime_synopsis">
        {dataA.anime.synopsis}
      </p>
      <div class="genres">
        {#each dataA.genres as genre}
          <GenreShip genre={genre[1]} />
        {/each}
      </div>
      <div class="related_anime">
        <h2>Similar Anime</h2>
        {#if dataA.similarAnime}
          <div
            class="related_anime_card"
            on:click={() => goto(`/anime/${dataA.similarAnime.id}`)}
          >
            <img
              class="related_anime_card_image"
              src={`http://localhost:8000/static/${dataA.similarAnime.horizontalImage}`}
              alt=""
            />
            <span class="related_anime_card_name"
              >{dataA.similarAnime.name}</span
            >
          </div>
        {:else}
          <span style="display:inline-block; margin-top:20px;font-weight:bold;"
            >No similar anime was found :(</span
          >
        {/if}
      </div>
    </div>
  </div>
  <div class="episodes_information">
    <h2 class="episodes_information_title">Episodes</h2>
    <div class="episodes_information_list">
      {#each dataA.episodes as episode}
        <EpisodeCard episodeData={episode} />
      {/each}
    </div>
  </div>
</div>

<style>
  .anime_container {
    max-width: 100%;
    height: 1000px;
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
  }
  .anime_container .right_sec {
    display: flex;
    flex-direction: row;
    margin: 10px;
  }
  .anime_container .right_sec .anime_information {
    margin-left: 20px;
  }
  .anime_container .right_sec .anime_information .episodes_status_text {
    margin-right: 10px;
    font-weight: bold;
  }
  .anime_container .right_sec .anime_information .anime_title {
    margin-bottom: 20px;

    margin-top: 10px;
    font-size: 2.6rem;
  }
  .anime_container .right_sec .anime_information .anime_synopsis {
    margin-top: 20px;
    max-width: 70%;
    font-weight: 100;
  }
  .anime_container .right_sec .anime_information .anime_studio_ship {
    padding-left: 10px;
    padding-right: 10px;
    padding-top: 5px;
    padding-bottom: 5px;
    background-color: white;
    font-weight: bold;
    border-radius: 5px;
    cursor: pointer;
    box-shadow: 2px 2px 0px black;
    border: 1px solid black;
  }
  .anime_container .right_sec .anime_information .genres {
    margin-top: 20px;
  }
  .anime_container .right_sec img.cover {
    width: 300px;
    height: 500px;
    object-fit: cover;
    border-radius: 5px;
  }

  .related_anime {
    margin-top: 30px;
  }

  .related_anime .related_anime_card {
    margin-top: 20px;
    cursor: pointer;
    width: 350px;
  }

  .related_anime .related_anime_card .related_anime_card_image {
    width: 350px;
    height: 200px;
    border-radius: 5px;
    transition: 0.1s;
    object-fit: cover;
  }
  .related_anime .related_anime_card:hover .related_anime_card_image {
    border: 1px solid black;
    box-shadow: 4px 4px 0px black;
  }
  .related_anime .related_anime_card .related_anime_card_name {
    display: inline-block;
    margin-top: 5px;
    font-weight: bold;
  }

  .episodes_information {
    margin-left: 10px;
    margin-top: 50px;
  }
  .episodes_information .episodes_information_list {
    margin-top: 20px;
    display: flex;
    flex-wrap: wrap;
  }
</style>
