<script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import Header from "../../Header.svelte";
    import AnimePage from "./components/AnimePage.svelte";
    import NotFoundError from "../../../components/NotFoundError.svelte";
    import axios from "axios";

    export let data;

    let profileId = "";
    let profileImage = "";
    let profileName = "";
    let logged = "";
    let animesInList = []
    let profileLists= []
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
				`http://localhost:8000/user/profile/${profileId}/list/all`,
			);
            let getAnimesInList = await axios(
				`http://localhost:8000/user/profile/${profileId}/list/anime/all`,
			);
            profileLists = getLists.data.list
            animesInList = getAnimesInList.data.animes
            logged = "si";
        } else {
            logged = "no";
        }
    });
</script>

<svelte:head>
    <title>{data.status === 404 ? "Anime not found" : data.anime.name}</title>
    <meta name="description" content="Svelte demo app" />
</svelte:head>

<Header {logged} {profileImage} name={profileName} />
{#if data.status === 404}
    <NotFoundError
        text="This anime wasn't found. Are you sure that you put the right anime in the url? Check it!"
    />
{:else}
    <AnimePage dataA={data} {logged} {profileId} {profileLists} {animesInList}/>
{/if}
