<script>
    import Header from "../../../../Header.svelte";
    import AnimeCard from "../../../../../components/AnimeCard.svelte";
    import { PUBLIC_API_URL } from "$env/static/public";
    import DaysAgo from "./daysAgo.js";
    export let logged   
    export let profileName=""
    export let profileImage=""
    export let animesInList=[]
    export let history=[]
    let today = new Date().toISOString().substring(0, 10);

</script>


<Header {logged} name={profileName} {profileImage} searchPage={false} />

  <div class="container">
    {#if history.length > 0}
      {#each history as h}
        <span>{h.date == today ? "Today" :DaysAgo.get(h.date).value <15?DaysAgo.get(h.date).text:h.date}</span>
        <div class="animes_container">
          {#each h.animes as anime}
            <AnimeCard
              animeData={anime}
              saved={animesInList.find((e) => e._id == anime._id)
                ? true
                : false}
            />
          {/each}
        </div>
      {/each}
    {:else}
      <div class="no_history">
        <img
          src={`${PUBLIC_API_URL}/static/WhatsApp Image 2025-01-15 at 3.18.19 PM.jpeg`}
          alt=""
        />
        <span>You haven't visited an anime yet</span>
      </div>
    {/if}
  </div>


<style>
  .container {
    position: relative;
    display: flex;
    flex-direction: column;
  }
  span {
    font-size: 24px;
    margin: 10px;
    font-weight: bold;
  }
  .animes_container {
    margin: 10px;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
  }
  .no_history {
    position: absolute;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    top: 50%;
    left: 50%;
    transform: translate(-50%, 50%);
  }
  .no_history img {
    width: 200px;
    height: 200px;
    object-fit: cover;
  }
</style>
