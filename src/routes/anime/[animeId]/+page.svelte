<script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import Header from "../../Header.svelte";
  import AnimePage from "./components/AnimePage.svelte";
  import NotFoundError from "../../../components/NotFoundError.svelte";
  import axios from "axios";
  import MobileHeader from "../../../components/MobileHeader.svelte";
  import MobilePage from "./components/MobilePage.svelte";
  import { getCookie } from "svelte-cookie";
  import { afterNavigate } from "$app/navigation";
  import Loader from "../../../components/Loader.svelte";
  import {PUBLIC_API_URL} from "$env/static/public"

  export let data;

  let profileId = "";
  let profileImage = "";
  let profileName = "";
  let logged = "";
  let animesInList = [];
  let profileLists = [];
  let likesCount = 0;
  let profileLikes = [];
  let isMobile;
  let liked;
  let loading = true;

  onMount(async () => {
    loading = true;
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    isMobile = mediaQuery.matches;

    const handleResize = () => {
      isMobile = mediaQuery.matches;
    };

    mediaQuery.addEventListener("change", handleResize);

    const userId = data.userId;


    profileLikes = data.profilesLikes;
    likesCount = data.likes;
    
    if (userId && userId.user._id.length > 0) {
      profileId = getCookie("profileId");
      profileImage = getCookie("profileImage");
      profileName = getCookie("profileName");
      if (profileId.length <= 0) {
        goto("/selectprofile");
        return
      }
      if (data.anime) {
        if (profileId.length > 0) {
          
          let getLists = await axios(
            `${PUBLIC_API_URL}/user/profile/${profileId}/list/all`,
          );

          let getAnimesInList = await axios(
            `${PUBLIC_API_URL}/user/profile/${profileId}/list/anime/all`,
          );
          console.log(data.anime)
          await axios.post(
            `${PUBLIC_API_URL}/user/profile/${profileId}/history/${data.anime._id}/0/add`,
          );
          profileLists = getLists.data.lists;
          animesInList = getAnimesInList.data.animes;
        }

      }

      logged = "si";
    } else {
      logged = "no";
    }
      loading = false;

    return () => {
      mediaQuery.removeEventListener("change", handleResize);
    };
  });

  afterNavigate(async () => {
    loading = true;
    const userId = data.userId;
    profileLikes = data.profileLikes;

    likesCount = data.likes;
    if (userId && userId.user._id.length > 0) {
      let profileId = getCookie("profileId");

      if (profileId.length <= 0) {
        goto("/selectprofile");
        return
      } else {
        if (data.anime) {
          let getLists = await axios(
            `${PUBLIC_API_URL}/user/profile/${profileId}/list/all`,
          );

          let getAnimesInList = await axios(
            `${PUBLIC_API_URL}/user/profile/${profileId}/list/anime/all`,
          );

          await axios.post(
            `${PUBLIC_API_URL}/user/profile/${profileId}/history/${data.anime._id}/0/add`,
          );
          profileLists = getLists.data.lists;
          animesInList = getAnimesInList.data.animes;
        }
        console.log(data.anime)
        liked = profileLikes.find((e) => e.profileId == profileId)
          ? true
          : false;
        await axios.post(
          `${PUBLIC_API_URL}/user/profile/${profileId}/history/${data.anime._id}/0/add`,
        );
      }
    }
        loading = false;
  });
</script>

<svelte:head>
  <title
    >{!data.anime
      ? "Anime not found"
      : data.anime.name
        ? data.anime.name
        : "Loading..."}</title
  >
  <meta name="description" content="Svelte demo app" />
</svelte:head>

{#if !data.error}
  {#if isMobile}
    <MobileHeader {profileName} {logged} {profileImage}/>
  {:else}
    <Header {logged} {profileImage} name={profileName} />
  {/if}
  {#if !data.anime}
    <NotFoundError
      image={`${PUBLIC_API_URL}/static/WhatsApp Image 2025-01-15 at 3.18.19 PM.jpeg`}
      text="This anime wasn't found. Are you sure that you put the right anime in the url? Check it!"
    />
  {:else if isMobile}
    <MobilePage {data} {logged} {profileImage} />
  {:else if !loading}
    <AnimePage
      dataA={data}
      {liked}
      {logged}
      {profileId}
      {profileLists}
      {animesInList}
      {likesCount}
      {profileLikes}
    />
  {:else} 
    <div style="position:relative;width:100%;height:500px; ">
      <Loader />
    </div>
  {/if}
{:else}
  <Header {logged} {profileImage} name={profileName} />

  <NotFoundError
    image={`${PUBLIC_API_URL}/static/WhatsApp Image 2025-01-16 at 9.51.21 AM.jpeg`}
    text="There was an error while we tried to show the anime. Sorry for the inconvenience :("
  />
  <div
    style="display: flex; flex-direction:column;justify-content:center; align-items:center;"
  >
    <span style="font-weight: bolder; font-style: italic;"
      >{data.errorMessage1}</span
    >
    <span style="font-weight: bold; font-size:17px;">{data.errorMessage2}</span>
  </div>
{/if}
