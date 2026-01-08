<script>
  import Header from "../../../../Header.svelte";
  import AnimeCard from "../../../../../components/AnimeCard.svelte";

  export let data;
  export let logged;
  export let profileImage;
  export let profileName;
</script>

<svelte:head>
  <title>{data.character?.name ?? "Character not found"} - Mitteiru</title>
  <meta
    name="description"
    content="Character page for {data.character
      ?.name} on Mitteiru. Explore details, images, and more about this character from your favorite anime."
  />
</svelte:head>

<Header {logged} {profileImage} name={profileName} />
<div class="container">
  <div class="left">
    <img src={data.character?.image} alt={data.character?.name} />
  </div>
  <div class="right">
    <h1 class="name">{data.character?.name}</h1>
    <span class="japanese_name">{data.character?.japaneseName}</span>
    <p class="description">{data.character?.description}</p>
    <div class="extras">
      {#if data.character?.extraInformation}
        {#each data.character?.extraInformation as info}
          <div class="extra_info">
            <span class="label">{info.name}:</span>
            <span class="value">{info.value}</span>
          </div>
        {/each}
      {/if}
    </div>
  </div>
</div>
<div class="related_animes">
  <h2>Related Animes</h2>
  {#if data.character?.relatedAnimes?.length > 0}
    <div class="related_animes_container">
      {#each data.character.relatedAnimes as anime}
        <AnimeCard animeData={anime} />
      {/each}
    </div>
  {:else}
    <p>No related animes found.</p>
  {/if}
</div>

<style>
  .container {
    display: flex;
    margin-top: 20px;
    padding: 32px;
    width: 100%;
    justify-content: center;
    gap: 20px;
  }
  .container > .left > img {
    border-radius: 8px;
    width: 230px;
    height: 345px;
  }

  .container > .right {
    display: flex;
    flex-direction: column;
    max-width: 70%;
  }

  .container > .right > .name {
    font-size: 2.2rem;
    font-weight: bold;
    margin-bottom: 8px;
  }

  .container > .right > .japanese_name {
    color: #444;
    font-weight: bold;
  }

  .container > .right > .description {
    margin-top: 16px;
    line-height: 1.5;
    text-align: justify;
    color: #555;
    font-size: 0.95rem;
  }

  .container > .right > .extras {
    display: flex;
    flex-direction: column;
    margin-top: 24px;
    gap: 12px;
  }

 
  .container > .right > .extras > .extra_info > .label {
    font-weight: bold;
    color: #555;
  }
  .container > .right > .extras > .extra_info > .value {
    color: #555;
  }

  .related_animes {
    margin-left: 10px;
    margin-top: 40px;
  }
  .related_animes > h2 {
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 20px;

  }
  .related_animes > .related_animes_container {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
</style>
