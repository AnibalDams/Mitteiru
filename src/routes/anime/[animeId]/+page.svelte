<script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import Header from "../../Header.svelte";
  import AnimePage from "./components/AnimePage.svelte";
  import NotFoundError from "../../../components/NotFoundError.svelte";
  import axios from "axios";
  import MobileHeader from "../../../components/MobileHeader.svelte";
  import MobilePage from "./components/MobilePage.svelte";

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
  onMount(async () => {
    const userId = data.userId;
    if (userId && userId.length > 0) {
      const { getCookie } = await import("svelte-cookie");
      profileId = getCookie("profileId");
      profileImage = getCookie("profileImage");
      profileName = getCookie("profileName");
      if (profileId.length <= 0) {
        goto("/selectprofile");
      }
      let getLists = await axios(
        `https://mitteiru-backend.onrender.com/user/profile/${profileId}/list/all`
      );

      let getAnimesInList = await axios(
        `https://mitteiru-backend.onrender.com/user/profile/${profileId}/list/anime/all`
      );
      let getLikes = await axios(
        `https://mitteiru-backend.onrender.com/anime/${data.anime.id}/likes/count`
      );
      likesCount = getLikes.data.likesCount;
      profileLikes = getLikes.data.profiles;
      await axios.post(
        `https://mitteiru-backend.onrender.com/user/profile/${profileId}/history/${data.anime.id}/0/add`
      );
      profileLists = getLists.data.lists;
      animesInList = getAnimesInList.data.animes;
      logged = "si";
    } else {
      logged = "no";
    }
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    isMobile = mediaQuery.matches;

    const handleResize = () => {
      isMobile = mediaQuery.matches;
    };

    mediaQuery.addEventListener("change", handleResize);
    console.log(isMobile)
    return () => {
      mediaQuery.removeEventListener("change", handleResize);
    };
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

{#if isMobile}
    <MobileHeader/>
{:else}
<Header {logged} {profileImage} name={profileName} />
{/if}
{#if !data.anime}
  <NotFoundError
    text="This anime wasn't found. Are you sure that you put the right anime in the url? Check it!"
  />
{:else}
{#if isMobile}
<MobilePage data={data}/>
{:else}
<AnimePage
dataA={data}
{logged}
{profileId}
{profileLists}
{animesInList}
{likesCount}
{profileLikes}
/>
{/if}
{/if}
