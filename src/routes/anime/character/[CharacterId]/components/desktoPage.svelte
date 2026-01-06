<script>
  import Header from "../../../../Header.svelte";
  export let data;
  export let logged;
  export let profileImage;
  export let profileName;

</script>

<svelte:head>
  <title>{data.character?.name ?? "Character not found"} - Mitteiru</title>
  <meta name="description" content="Character page for {data.character?.name} on Mitteiru. Explore details, images, and more about this character from your favorite anime."/>
</svelte:head>

<Header logged={logged} profileImage={profileImage} name={profileName}/>
<h1>{data.character?.name}</h1>