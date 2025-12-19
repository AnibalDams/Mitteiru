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
  $: animes = data.animes.filter(anime => 
    anime.name.toLowerCase().includes(searchIndex.toLowerCase())
  );

  onMount(()=>{
      profileId = getCookie("profileId");
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
    <input placeholder="Search an anime" type="text" bind:value={searchIndex} />
</div>
<div class="container">
  {#each animes as anime}
    <MobileAnimeCard cover={anime.cover} id={anime._id} title={anime.name} />
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
    border:1px solid #333;
    font-weight: bold;
}
input:focus{
    box-shadow: 4px 4px 0px #333;
}
</style>
