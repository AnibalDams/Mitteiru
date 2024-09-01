<script>
	import { onMount } from "svelte";
	import axios from "axios";
	import AnimeReccomendation from "../../../../components/AnimeReccomendation.svelte";
	import AnimeCard from "../../../../components/AnimeCard.svelte";
	import Loader from "../../../../components/Loader.svelte";
	import Header from "../../../Header.svelte";
	import { getCookie } from "svelte-cookie";
	import { goto } from "$app/navigation";
	

	import NotFoundError from "../../../../components/NotFoundError.svelte";
    import ComboBox from "../../../../components/ComboBox.svelte";

	import {selectedList} from './store'
    import IconButton from "./components/IconButton.svelte";
    import Button from "../../../../components/Button.svelte";

	export let data;
	let isThereAnime = null
	let animeRandom;
	let lists = []
	
	let animes = [];
	let loaded = false;
	let animeGenres;
	let profileId = "";
	let profileImage = "";
	let profileName = "";
	let display = false
	let logged = "nosesabe";
	let newListName=""
	let createButtonText = "Create"
	function randomNumber(min, max) {
		return Math.round(Math.random() * (max - min)) + min;
	}

	const createNewList = async()=>{
		if (newListName.length >0) {
			createButtonText ="Creating..."
			 
			await axios.post(`http://localhost:8000/user/profile/${profileId}/list/new`,{name:newListName})
			createButtonText = "Created"
			newListName = ""

			display=false
			createButtonText="Create"
		}
	}

	onMount(async () => {
		profileId = getCookie("profileId");
		logged = data.userId ? "si" : "no";
		profileName = getCookie("profileName");
		profileImage = getCookie("profileImage");

		if (profileId.length <= 0 && logged === "si") {
			goto("/selectprofile");
		} else {
			let listsFetch = await axios(
				`http://localhost:8000/user/profile/${profileId}/list/all`,
			);
			let animesFetch = await axios(
				`http://localhost:8000/user/profile/${profileId}/list/anime/all`,
			);
			lists = listsFetch.data.lists
			$selectedList = lists[0].id

			if(animesFetch.data.animes.length<=0){
				isThereAnime = false
				loaded = true
			}
			if (animesFetch.data.animes.length >= 1) {
				let number = randomNumber(0, animesFetch.data.animes.length - 1);
				for (let i = 0; i < animesFetch.data.animes.length; i++) {
					const anime = animesFetch.data.animes[i];
					animes.push(anime)

					
				}
				animeRandom = animesFetch.data.animes[number];
				isThereAnime=true
				loaded = true

			}
		}
	});
</script>

<svelte:head>
	<title>Your List</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

{#if loaded}
	{#if !isThereAnime}
	<Header {logged} {profileImage} name={profileName} />



	<NotFoundError text={`You don't have any anime here... `} link={true} linkText="Try adding one!" linkDirection="/directory"/>
	
	

		{:else}
		<Header {logged} {profileImage} name={profileName} />
		<AnimeReccomendation animeData={animeRandom} {animeGenres} />
	
		<h2 style="margin:10px; display:flex; align-items:center; ">Your lists. Let's watch something! <ComboBox selecteed={$selectedList} data={lists}/> <IconButton on:click={()=>display = display==true?false:true} /> {#if display}<input bind:value={newListName} placeholder="Insert a name for the list"/> <Button marginLeft="10px" onClick={()=>createNewList()}>{createButtonText}</Button>{/if}</h2>
		<div class="anime_card_container">
			{#if animes.find(e=>e.list_id===$selectedList)}
				{#each animes as anime}
					{#if anime.list_id===$selectedList}
							<AnimeCard animeData={anime} />
					{/if}
				{/each}
			{:else}
				<div style="display:flex; justify-content:center; align-items:center; width:100%; height: 500px;">
					<img src="http://localhost:8000/static/404.png" style="width: 400px; height:400px;" alt="animes not found">
				</div>
			{/if}
		</div>

	{/if}
	{:else}
		<div
			style="width:100%;height:100%; display:flex; justify-content:center;margin-top:100px;"
		>
			<Loader />
		</div>
	{/if}

<style>
	.anime_card_container {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		margin-left: 10px;
		margin-top: 20px;
	}
	input{
		margin-left:10px;
        border: none;
        outline: none;
        padding-left: 10px;
        padding-right: 10px;
        font-weight: bold;
        padding-top: 10px;
        padding-bottom: 10px;
        border-radius: 5px;
        box-shadow: 4px 4px 0px black;
        border:1px solid black;
        transition: 0.1s;
    }
    input:focus{
        border:1px solid gray;
        box-shadow: 4px 4px 0px gray;


    }

</style>
