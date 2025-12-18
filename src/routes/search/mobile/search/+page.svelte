<script>
    import { onMount } from "svelte";
  import MobileHeader from "../../../../components/MobileHeader.svelte";
  import MobileAnimeCard from "../../../../components/mobileAnimeCard.svelte";
    import { getCookie } from "svelte-cookie";

  export let data;
  let searchIndex = "";
  let animes = data.animes;
  let profileId = "";
  let profileImage = "";
  let profileName = "";
  let logged = "nosesabe";
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
  onMount(()=>{
          profileImage = getCookie("profileImage");
      profileName = getCookie("profileName");
      logged = data.userId ? "si" : "no";
  
      if (profileId.length <= 0 && logged == "si") {
        goto("/selectprofile");
      }
  })
</script>

<MobileHeader {logged} {profileImage}{profileName}/>
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
