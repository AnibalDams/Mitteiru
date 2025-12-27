<script>
    import MobileHeader from "../../../../../components/MobileHeader.svelte";
    import MobileAnimeRecommendation from "../../../../../components/MobileAnimeRecommendation.svelte";
    import MobileAnimeCard from "../../../../../components/mobileAnimeCard.svelte";
    import ModalWithActions from "../../../../../components/ModalWithActions.svelte";
    import axios from "axios";
    import { Plus } from "radix-icons-svelte";
    import { onMount } from "svelte";

    import { PUBLIC_API_URL } from "$env/static/public";
    import { Toaster, toast } from "svelte-sonner";

    export let loaded = false;
    export let profileId = "";
    export let profileImage = "";
    export let profileName = "";
    export let logged = "nosesabe";
    export let selectedList = "";
    export let lists = [];
    export let animes = [];
    export let isThereAnime = null;
    export let animeRandom;
    let newListName = "";
    let createButtonText = "Create";

    $: displayModal = false;

    async function newList() {
        if (newListName.length > 0) {
            createButtonText = "Creating...";

            await axios.post(
                `${PUBLIC_API_URL}/user/profile/${profileId}/list/new`,
                { name: newListName },
            );
            let listsFetch = await axios(
                `${PUBLIC_API_URL}/user/profile/${profileId}/list/all`,
            );
            lists = listsFetch.data.lists;
            createButtonText = "Created";
            newListName = "";
            
            createButtonText = "Create";
        }
    }
</script>

<Toaster richColors position="top-center" />
{#if isThereAnime}
    <ModalWithActions
        bind:showModal={displayModal}
        buttonText={createButtonText}
        action={async () => {
            try {
                toast.loading("Creating your new list...");
                await newList();
                toast.success("List created!");
                displayModal = false;
            } catch (error) {
                toast.error("An error has occurred.");
                console.error(error)
                displayModal = false;
            }
        }}
    >
        <h2 slot="header" style="font-size:20px; margin-bottom:10px;">
            Let's create a new list!
        </h2>
        <div class="modal_information">
            <label for="listName">Type a name for your list</label>
            <input
            name="listName"
            type="text"
            placeholder="Your list's name"
            bind:value={newListName}
            on:input={newListName}
            />
        </div>
    </ModalWithActions>
    <MobileHeader {logged} {profileImage} {profileName} />

    <MobileAnimeRecommendation animeData={animeRandom} />

    <h2 style="text-align: center;">Your lists. Let's watch something!</h2>
    <div class="select_container">
        <select name="lists" id="lists" bind:value={$selectedList}>
            {#each lists as list}
                <option value={list._id}>{list.name}</option>
            {/each}
        </select>
        <button
            on:click={() => {
                displayModal = !displayModal ? true : false;
            }}
            style="background-color:hsl(0,0%,10%); color:#eee; display:flex;justify-content:center;align-items:center; gap:4px"
            ><Plus /> New List</button
        >
    </div>
    <div
        class="anime_card_container"
       
    >
        {#if animes.find((e) => e.listId === $selectedList)}
            {#each animes as anime}
                {#if anime.listId === $selectedList}
                    <MobileAnimeCard
                        id={anime._id}
                        cover={anime.cover}
                        title={anime.name}
                    />
                {/if}
            {/each}
        {:else}
            <div
                style="display:flex; justify-content:center; align-items:center; width:100%; height: 500px;"
            >
                <img
                    src={`${PUBLIC_API_URL}/static/notFound.png`}
                    style="width: 400px; height:400px;"
                    alt="animes not found"
                />
            </div>
        {/if}
    </div>
{:else}
    <MobileHeader {logged} {profileImage} {profileName} />
    <div
        style="width: 100%; height:100%; display:flex; justify-content:center;align-items:center;"
    >
        <img
            src="https://i.ibb.co/99HgFwbV/Gemini-Generated-Image-gj4nz7gj4nz7gj4n.png"
            alt=""
        />
    </div>
{/if}

<style>
    .select_container {
        display: flex;
        flex-direction: column;
        gap: 4px;
        justify-content: center;
        align-items: center;
        margin-top: 15px;
        margin-bottom: 15px;
        width: 100%;
    }
    select,
    button {
        width: 70%;
        padding-right: 10px;
        padding-left: 10px;
        padding-top: 3px;
        padding-bottom: 3px;
        cursor: pointer;
        border: 1px solid black;
        border-radius: 5px;
        font-size: 18px;
        transition: 0.1s;
        text-align: center;
        appearance: none;
        font-weight: bold;
        outline: none;
        background: none;
    }
    .anime_card_container {
        margin-top: 30px;
        padding-left: 20px;
        padding-right: 20px;
        padding-bottom: 20px;
        display: flex;
        overflow: auto;
        white-space: nowrap;
    }
    img {
        width: 100%;
        height: 100%;
    }

    .modal_information {
        margin-top: 20px;
        margin-bottom: 20px;
    }
    input{
        margin-top: 12px;
        width: 100%;
        padding:10px;
        border: 1px solid #333;
        font-weight: bold;
        border-radius: 5px;
        outline: none;
    }
    label{
        font-weight: bold;
        margin-bottom: 5px;
    }
    input:focus{
        box-shadow: 4px 4px 0px #111;
        

    }
</style>
