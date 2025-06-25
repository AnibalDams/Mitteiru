<script>
  import { onMount } from "svelte";
  import Header from "../../../../Header.svelte";
  import { goto } from "$app/navigation";

  import {
    TrackNext,
    TrackPrevious,
    HamburgerMenu,
    EyeOpen,
  } from "radix-icons-svelte";
  import Button from "../../../../../components/Button.svelte";

  import NotFoundError from "../../../../../components/NotFoundError.svelte";

  import ModalWithoutActions from "../../../../../components/ModalWithoutActions.svelte";
  import CommentCard from "../../components/commentCard.svelte";
  import axios from "axios";

  export let data;
  let episodeNumber = data.episode.episodeNumber;
  let profileId = "";
  let profileImage = "";
  let profileName = "";
  let logged = "";
  let showModal = false;
  let episodeLink = data.episode.link;
  let episode_ = data.episode;
  $: comments = data.comments
  let commentContent = ""
  let commentsLikes = []

  const getEpisode = async (episodeN) => {
    for (let i = 0; i < data.allEpisodes.length; i++) {
      const episode = data.allEpisodes[i];
      if (episode.episodeNumber === episodeNumber) {
        episode_ = data.allEpisodes[i];
        episodeLink = episode.link;
        comments  =(await axios(`http://localhost:8000/anime/episode/${episode._id}/comment/all`)).data.comments
        commentsLikes  =await axios(`http://localhost:8000/anime/episode/${episode._id}/comment/likes/all`)


      }
    }
  };

  const sendComment = async()=>{
    if(commentContent.length >0){
      await axios.post(`http://localhost:8000/anime/episode/${episode_._id}/comment/new`,{
        profileId:profileId,
        content:commentContent,
        profileName:profileName,
        profileImage:profileImage,
    })
    const newComment = {
      content: commentContent,
      date: new Date(),
      profileName: profileName,
      profileImage: profileImage
    }
    comments = [newComment,...comments ];
    commentContent = ""; 
    }
  }

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

      logged = "si";
    } else {
      logged = "no";
    }
  });
</script>

<Header {logged} {profileImage} name={profileName} />

<svelte:head>
  <title
    >{`${data.status === 404 ? "This anime doesn't have episodes" : data.anime.name + " " + "episode" + " " + episodeNumber}`}</title
  >
</svelte:head>

{#if data.episode.episodeNumber}
  <ModalWithoutActions bind:showModal>
    <h2 slot="header" style="font-size:20px; margin-bottom:10px;">
      Episode {episodeNumber} - {episode_.name}
    </h2>
    <p style="display: inline-block; margin-top:10px;margin-bottom:10px; ">
      {episode_.synopsis}
    </p>
  </ModalWithoutActions>

  <div class="episode_container">
    <h2 class="title">
      {data.anime.name} episode {episodeNumber}
      <button
        title="Synopsis"
        on:click={() => {
          showModal = true;
        }}
        class="synopsis_button"
        ><EyeOpen
          style="position:absolute;top:50%; left:50%;transform:translate(-50%,-50%)"
        /></button
      >
      {#if data.anime.studio === "animeFlv"}<span
          style="display: inline-block;font-size:16px; padding:10px;background-color:rgb(255, 79, 79);color:darkred; border-radius:10px; margin-left:10px;"
          >Anime obtained from an external page. This episode may contain some
          ads.</span
        >{/if}
    </h2>

    <iframe style="width: 100%; height:700px" src={episodeLink} frameborder="0"
    ></iframe>

    <div class="controls">
      {#if episodeNumber != 1}
        <button
          class="control"
          on:click={() => {
            episodeNumber -= 1;
            getEpisode(episodeNumber);
          }}
          ><TrackPrevious style="margin-right:10px;" />
          <span style="font-weight: bold;">episode {episodeNumber - 1}</span
          ></button
        >
      {:else}
        <div></div>
      {/if}
      <button class="control" on:click={() => goto(`/anime/${data.animeId}`)}
        ><HamburgerMenu /></button
      >
      {#if episodeNumber < data.allEpisodes.length}
        <button
          class="control"
          on:click={() => {
            episodeNumber += 1;
            getEpisode(episodeNumber);
          }}
          ><span style="font-weight: bold;">episode {episodeNumber + 1}</span
          ><TrackNext style="margin-left:10px;" />
        </button>
      {:else}
        <div></div>
      {/if}
    </div>
 
    <h3 style="margin:10px;">Comments ({comments.length})</h3>
    {#if profileId?.length > 0}
      <span
        style="display: inline-block; margin-left:10px;margin-bottom:10px; color:grey;"
        >Share your thoughts about "{episode_.name}"</span
      >
      <div style="margin:10px;">
        <div style="display:flex; align-items:center;">
          <img
            style="width:50px; height:50px; border-radius:50%; object-fit:cover;"
            src={profileImage}
            alt="profile image"
          />
          <span style="margin-left:10px; font-weight:bold;">{profileName}</span>
        </div>
        <textarea
          style="width:100%; height:100px; margin-top:10px; border-radius:5px; border:1px solid black; padding:10px;transition:0.1s;"
          placeholder="Write your comment here..."
          bind:value={commentContent}
        ></textarea>
        <div style="display: flex; margin-top:5px; justify-content:flex-end;">
          <Button variant="primary"  onClick={async()=>{
            await sendComment()
          }}><div style="display: flex; align-items:center; justify-content: center;">Send Comment <svg xmlns="http://www.w3.org/2000/svg" style="margin-left: 5px;" height="24px" viewBox="0 -960 960 960" width="24px" fill="#ffffff"><path d="M120-160v-640l760 320-760 320Zm80-120 474-200-474-200v140l240 60-240 60v140Zm0 0v-400 400Z"/></svg></div></Button>
        </div>
      </div>
    {/if}
    <div class="comments_container">
      {#if comments.length > 0}
        {#each comments as comment}
          <CommentCard content={comment.content} date={new Date(comment.date).toISOString().split("T")[0]} name={comment.profileName} avatar={comment.profileImage}/>
        {/each}
        {:else}
        <NotFoundError
        image="https://res.cloudinary.com/dkxmn4neg/image/upload/v1742400074/wv9vtv4fzlvou3topwuk.png"
        text={`This episode doesn't have any comments yet. ${profileId?.length > 0?"Be the first one to comment!":"Log in and be the first one to comment!"}`}
      />
      
      {/if}
    </div>
  </div>
{:else}
  <NotFoundError
    image="http://localhost:8000/static/WhatsApp Image 2025-01-16 at 9.51.21 AM.jpeg"
    text="This anime doesn't have the given episode. Sorry for the inconvenience :("
  />
{/if}

<style>
  .episode_container {
    width: 100%;
    margin-top: 20px;
  }

  .episode_container .video_player {
    width: 100%;
  }
  .episode_container .title {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 10px;
    margin-bottom: 20px;
    text-align: center;
  }
  .episode_container .controls {
    margin: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  button.control {
    display: flex;
    cursor: pointer;
    padding-top: 10px;
    padding-bottom: 10px;
    padding-left: 20px;
    padding-right: 20px;
    justify-content: center;
    align-items: center;
    border: 1px solid black;
    background: none;
    border-radius: 5px;
    transition: 0.1s;
  }
  .episode_container .controls .control:hover {
    box-shadow: 4px 4px 0px black;
  }
  .synopsis_button {
    position: relative;
    width: 30px;
    height: 30px;
    margin-left: 5px;
    border: 1px solid black;
    border-radius: 5px;
    background-color: white;
    cursor: pointer;
  }
  textarea:focus{
    outline:none; 
    box-shadow: 4px 4px 0px black;
  }
</style>
