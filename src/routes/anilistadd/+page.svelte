<script>
    import axios from "axios";
    import { onMount } from "svelte";
    import Header from "../Header.svelte";
    import { getCookie } from "svelte-cookie";
 import {PUBLIC_API_URL} from "$env/static/public"
  import Button from "../../components/Button.svelte";
  import { toast, Toaster } from "svelte-sonner";

 //let animes = [];
    let loaded = false;
    let profileId = "";
    let profileImage = "";
    let profileName = "";
    let animesInList = [];
    let savedSet = new Set();
    $: if (animesInList.length > 0) {
      savedSet = new Set(animesInList.map((e) => e._id));
    }
    export let data;
    let logged;
    let id;
    onMount(async () => {
      profileId = getCookie("profileId");
      profileImage = getCookie("profileImage");
      profileName = getCookie("profileName");
      logged = data.userId ? "si" : "no";
  


        if (profileId.length > 0) {
          let getAnimesInList = await axios(
            `${PUBLIC_API_URL}/user/profile/${profileId}/list/anime/all`
          );
          animesInList = getAnimesInList.data.animes;
        }

        loaded = true;
      
    });

    async function addAnime(){
        try {
            toast.loading("Adding...")
            const anime = await axios.post("https://graphql.anilist.co", {
                query:`       query  {
 Media(type: ANIME, id: ${Number(id)}) {
  

    id
      status(version: 2)
        title {
          romaji
          english
          native
        }
        coverImage {
          extraLarge
        }
        bannerImage
        description
        genres
        startDate {
          year
        }
        studios {
          nodes {
            name
          }
        }


      
      }
    
  
 

}`
            })
             if (anime.data.data.Media) {
                const addAnime=await axios.post("https://mitteiru-backend.onrender.com/anime/new", {
         name: anime.data.data.Media.title.english
           ? anime.data.data.Media.title.english
           : anime.data.data.Media.title.romaji,
         japaneseName: anime.data.data.Media.title.native,
         synopsis: anime.data.data.Media.description,
         releaseYear: anime.data.data.Media.startDate.year,
         onGoing: anime.data.data.Media.status == "FINISHED" ? false : true,
         studio: anime.data.data.Media.studios.nodes[0]?anime.data.data.Media.studios.nodes[0].name:"Unknown",
         cover: anime.data.data.Media.coverImage.extraLarge,
         image: anime.data.data.Media.bannerImage,
         horizontalImage: anime.data.data.Media.coverImage.extraLarge,
         genres: anime.data.data.Media.genres,
       });
       toast.success("Added")
             }
        return
        } catch (error) {
            console.log(error)
            toast.error("Not added")
            return
        }
    }
  </script>

    <Toaster richColors />
  <svelte:head>
    <title>Add an anime from anilist</title>
    <meta name="description" content="Svelte demo app" />
  </svelte:head>
  <Header {logged} {profileImage} name={profileName} />
  <h1>Add an anime from anilist</h1>
  <div >
    <input type="text" bind:value={id} placeholder="Put the anilist id here">
    <Button onClick={addAnime}>Add anime</Button>
  </div>

  <style>
    h1 {
        text-align: center;
        margin: 32px;
    }
        input {
        margin-top: 10px;
        margin-bottom: 10px;
        border: none;
        outline: none;
        padding-left: 30px;
        padding-right: 30px;
        font-weight: bold;
        padding-top: 10px;
        padding-bottom: 10px;
        border-radius: 5px;
        box-shadow: 4px 4px 0px black;
        border: 1px solid black;
        transition: 0.1s;
    }
    input:focus {
        border: 1px solid gray;
        box-shadow: 4px 4px 0px gray;
    }

    div{
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
    }
  </style>