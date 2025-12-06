<script>
  import { Calendar, ArrowLeft } from "radix-icons-svelte";
  import SvelteMarkdown from "svelte-markdown";
  import { onMount } from "svelte";
  import Header from "../../../../Header.svelte";
  import { getCookie } from "svelte-cookie";
  import Image from "./Image.svelte";
  import NotFoundError from '../../../../../components/NotFoundError.svelte'
  import {goto} from "$app/navigation"

  export let data;
  let profileId="";
  let profileImage="";
  let profileName="";
  let logged = "nosesabe";
  onMount(async () => {
    const userId = data.userId;
    if (userId.user && userId.user._id.length > 0) {
      profileId = getCookie("profileId");
      profileImage = getCookie("profileImage");
      profileName = getCookie("profileName");
      if (profileId.length <= 0) {
        goto("/selectprofile");
      }
      logged = "si";
    } else {
      logged = "no";
    }
  });
</script>

<Header {logged} {profileImage} name={profileName} />

{#if data.error}
<div style="width: 100%; display:flex;justify-content:center;flex-direction:column;">
<NotFoundError image="https://mitteiru-backend.onrender.com/static/WhatsApp Image 2025-01-16 at 9.51.21 AM.jpeg" text="There was an error while we tried to show the anime. Sorry for the inconvenience :("/>
<span style="text-align: center;font-weight:bold;">{data.errorMessage}</span>
</div>
{:else}
<div class="container">
  <div class="profile_Container">
    <img src={data.review.profileImage} alt="" />
    <div class="name_date_container">
      <span class="name">{data.review.profileName}</span>
      <span class="date"
        ><Calendar style="margin-right:5px;" />{new Date(data.review.createdAt)
          .toISOString()
          .split("T")[0]}</span
      >
    </div>
  </div>
  <div class="review_container">
    <button on:click={()=>goto(`/anime/${data.anime._id}`)}><ArrowLeft style="margin-right:10px;"/>{data.anime.name} </button>
    <h1>{data.review.title}</h1>

    <div style="margin-top:20px; font-size:17px; line-height: 28px; ">
      <SvelteMarkdown source={data.review.review} renderers={{image:Image}}/>
    </div>
  </div>
</div>

{/if}
<style>
  div.container {
    margin: 50px;
    display: flex;
    flex-direction: column;
  }
  div.profile_Container {
    display: flex;
    flex-direction: row;
    align-items: center;
  }
  div.profile_Container img {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    object-fit: cover;
  }
  div.profile_Container div.name_date_container {
    display: flex;
    flex-direction: column;
    margin-left: 10px;
  }
  div.profile_Container div.name_date_container span.name {
    font-weight: bold;
    font-size: 17px;
  }
  div.profile_Container div.name_date_container span.date {
    color: grey;
    display: flex;
    align-items: center;
  }
  div.review_container {
    margin-top: 30px;
    
    
  
  }
  button{
    display: flex;
    align-items: center;
    padding-left: 20px;
    padding-right: 20px;
    padding-top: 10px;
    padding-bottom: 10px;
    background-color: transparent;
    border: none;
    outline: none;
    border-radius: 10px;
    font-size: 15px;
    font-weight: bold;
    cursor: pointer;
    transition: 0.1s;
  }
  button:hover{
    background-color: #eee;
  }
</style>
