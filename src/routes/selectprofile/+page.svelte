<script>
  import { getCookie, setCookie } from "svelte-cookie";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { Reload } from "radix-icons-svelte";
  import axios from "axios";
  import Profile from "./components/Profile.svelte";
  import NewProfile from "./components/NewProfile.svelte";
  import Header from "../Header.svelte";
  import NewProfilePage from "./components/newProfilePage.svelte";
  import UpdatePage from "./components/updatePage.svelte";
  export let data;
  let userId;
  let newProfile = false;
  let profiles = [];
  let pName = "";
  let profile = [];
  let logged = false;
  let profileImage = "";
  let update = false;
  const refreshProfiles = async () => {
    if (userId.length > 0 && userId != undefined) {
      const profilesQuery = await axios(
        `https://mitteiru-backend.onrender.com/user/${userId}/profile/d/all`
      );
      profiles = profilesQuery.data.profiles;
    } else {
      goto("/");
    }
  };

  const setProfile = async (profileId, profileImage, profileName) => {
    document.cookie = `profileId=${profileId};samesite=strict;`;
    document.cookie = `profileName=${profileName};samesite=strict;`;
    document.cookie = `profileImage=${profileImage};samesite=strict;`;

    goto("/");
  };
  onMount(async () => {
    userId = data.userId;

    if (userId.length > 0 && userId != undefined) {
      profileImage = getCookie("profileImage");
      pName = getCookie("profileName");
      const profilesQuery = await axios(
        `https://mitteiru-backend.onrender.com/user/${userId}/profile/d/all`
      );
      profiles = profilesQuery.data.profiles;
      logged = userId.length > 0 && userId !== undefined ? "si" : "no";
    } else {
      goto("/");
    }
  });
</script>

<svelte:head>
  <title>Who's watching?</title>
</svelte:head>

{#if logged}
  <Header {logged} {profileImage} name={pName} />

  <div class="container">
    {#if newProfile === false}
      <span class="title"
        >Who's watching? <button
          on:click={refreshProfiles}
          class="reload_button"><Reload /></button
        ></span
      >

      <div class="profile_container">
        {#each profiles as profile_}
          <Profile
            secondaryAction={refreshProfiles}
            onClick={() => {
              
              setProfile(profile_.id, profile_.photo, profile_.name);
            }}
            editAction={() => {
              document.cookie = "profileId=;max-age=-1;path=/;";
              document.cookie = "profileName=;max-age=-1;path=/;";
              document.cookie = "profileImage=;max-age=-1;path=/;";
              profile = profile_;
              update = true;
              newProfile = true;
            }}
            image={profile_.photo}
            id={profile_.id}
            name={profile_.name}
          />
        {/each}

        <NewProfile
          onClick={() => {
            newProfile = true;
          }}
        />
      </div>
    {:else if update != true}
      <span class="title">Create a profile</span>
      <NewProfilePage
        {userId}
        variant="create"
        refresh={refreshProfiles}
        cancel={() => {
          newProfile = false;
          update = false;
        }}
      />
    {:else}
      <span class="title">Update This Profile</span>
      <UpdatePage
        cancel={() => {
          update = false;
          newProfile = false;
        }}
        refresh={refreshProfiles}
        avatar={profile.photo}
        name={profile.name}
        profileId={profile.id}
      />
    {/if}
  </div>
{/if}

<style>
  .container {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    margin-top: 25vh;
  }
  .title {
    font-weight: bold;
    font-size: 20px;
  }

  .profile_container {
    margin-top: 30px;
    gap: 30px;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    width: 90%;
  }
  .reload_button {
    margin-top: 10px;
    cursor: pointer;
    background: none;
    border: 1px solid black;
    padding: 5px;
    box-shadow: 2px 2px 0px black;
    border-radius: 5px;
  }
</style>
