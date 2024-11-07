<script>
  import MobileHeader from "../../../../components/MobileHeader.svelte";
  import MobileAnimeCard from "../../../../components/mobileAnimeCard.svelte";
  export let data;
  let searchIndex = "";
  let animes = data.animes;
  let putAnimes = () => {
    const _animes = [];
    for (const anime of data.animes) {
      const animeNameLower = anime.name.toLowerCase();
      if (animeNameLower.includes(searchIndex.toLowerCase())) {
        _animes.push(anime);
      }
    }
    animes = _animes
  };
</script>

<MobileHeader />
<div style="display: flex; justify-content:center; margin-bottom:20px;">
    <input placeholder="Search an anime" type="text" bind:value={searchIndex} on:change={()=>putAnimes()}/>
</div>
<div class="container">
  {#each animes as anime}
    <MobileAnimeCard cover={anime.cover} id={anime.id} title={anime.name} />
  {/each}
</div>

<style>
  .container {
    margin: 10px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;

    flex-wrap: wrap;
  }

  input {
    padding-left: 20px;
    padding-right: 20px;
    padding-top: 10px;
    padding-bottom: 10px;
    border-radius: 10px;
    outline: none;
    border:1px solid black;
    font-weight: bold;
}
input:focus{
    border-color: blue;
}
</style>
