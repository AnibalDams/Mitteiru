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
  export let data;
  let userId;
  let newProfile = false;
  let profiles = [];
  let pName = "";
  let logged = false;
  let profileImage = "";
  const refreshProfiles = async () => {
    if (userId.length > 0 && userId != undefined) {
      const profilesQuery = await axios(
        `http://localhost:8000/user/${userId}/profile/all`
      );
      profiles = profilesQuery.data.Profiles;
    } else {
      goto("/");
    }
  };

  const setProfile = async (profileId, profileImage, profileName) => {
    setCookie("profileId", profileId);
    setCookie("profileName", profileName);
    setCookie("profileImage", profileImage);
    goto("/");
  };
  onMount(async () => {
    userId = data.userId;

    if (userId.length > 0 && userId != undefined) {
      profileImage = getCookie("profileImage");
      pName = getCookie("profileName");
      const profilesQuery = await axios(
        `http://localhost:8000/user/${userId}/profile/all`
      );
      profiles = profilesQuery.data.Profiles;
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
        {#each profiles as profile}
          <Profile
            secondaryAction={refreshProfiles}
            onClick={() => {
              setProfile(profile[0], profile[2], profile[3]);
            }}
            image={profile[2]}
            id={profile[0]}
            name={profile[3]}
          />
        {/each}

        <NewProfile
          onClick={() => {
            newProfile = true;
          }}
        />
      </div>
    {:else}
      <span class="title">Create a profile</span>
      <NewProfilePage
        {userId}
        refresh={refreshProfiles}
        cancel={() => {
          newProfile = false;
        }}
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
