<script>
  import { onMount } from "svelte";
  import axios from "axios";
  import AnimeReccomendation from "../../../../components/AnimeReccomendation.svelte";
  import AnimeCard from "../../../../components/AnimeCard.svelte";
  import Loader from "../../../../components/Loader.svelte";
  import Header from "../../../Header.svelte";
  import getCookie from "$lib/getCookie";
  import { goto } from "$app/navigation";

  import NotFoundError from "../../../../components/NotFoundError.svelte";
  import ComboBox from "../../../../components/ComboBox.svelte";

  import { selectedList } from "./store";
  import IconButton from "./components/IconButton.svelte";
  import Button from "../../../../components/Button.svelte";
  import { Chart } from "chart.js/auto";
  export let data;
  let isThereAnime = null;
  let animeRandom;
  let lists = [];

  let animes = [];
  let loaded = false;
  let animeGenres;
  let profileId = "";
  let profileImage = "";
  let profileName = "";
  let display = false;
  let logged = "nosesabe";
  let newListName = "";
  let createButtonText = "Create";
  let analyticsPage = false;
  let canvasElement;
  let chart;
  function randomNumber(min, max) {
    return Math.round(Math.random() * (max - min)) + min;
  }

  const createNewList = async () => {
    if (newListName.length > 0) {
      createButtonText = "Creating...";

      await axios.post(
        `http://localhost:8000/user/profile/${profileId}/list/new`,
        { name: newListName }
      );
      createButtonText = "Created";
      newListName = "";

      display = false;
      createButtonText = "Create";
    }
  };

  function createChart() {
    if (analyticsPage) {
      let data = [];
      let listNames = [];

      for (let i = 0; i < lists.length; i++) {
        const list = lists[i];
        let animesInList = animes.filter((e) => e.listId === list._id);
        data.push(animesInList.length);
        listNames.push(list.name);
      }
      const chartCtx = canvasElement.getContext("2d");
      if (chart) {
        chart.destroy();
      }
      chart = new Chart(chartCtx, {
        type: "doughnut",
        options: {
          responsive: true,
        },
        data: {
          labels: listNames,
          datasets: [
            {
              label: "Animes",
              data: data,
            },
          ],
        },
      });
    }
  }

  onMount(async () => {
    profileId = getCookie("profileId", document);
    logged = data.userId.user ? "si" : "no";
    profileName = getCookie("profileName", document);
    profileImage = getCookie("profileImage", document);

    if (profileId.length <= 0 && logged === "si") {
      goto("/selectprofile");
    } else {
      let listsFetch = await axios(
        `http://localhost:8000/user/profile/${profileId}/list/all`
      );
      let animesFetch = await axios(
        `http://localhost:8000/user/profile/${profileId}/list/anime/all`
      );
      lists = listsFetch.data.lists;
      $selectedList = lists[0]._id;
      if (animesFetch.data.animes.length <= 0) {
        isThereAnime = false;
        loaded = true;
      }
      if (animesFetch.data.animes.length >= 1) {
        let number = randomNumber(0, animesFetch.data.animes.length - 1);
        for (let i = 0; i < animesFetch.data.animes.length; i++) {
          const anime = animesFetch.data.animes[i];
          animes.push(anime);
        }
        animeRandom = animesFetch.data.animes[number];

        isThereAnime = true;
        loaded = true;
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

    <NotFoundError
      text={`You don't have any anime here... `}
      image="http://localhost:8000/static/WhatsApp Image 2025-01-15 at 4.20.42 PM.jpeg"
      link={true}
      linkText="Try adding one!"
      linkDirection="/directory"
    />
  {:else}
    <Header {logged} {profileImage} name={profileName} />
    <AnimeReccomendation animeData={animeRandom} {animeGenres} />

    <h2 style="margin:10px; display:flex; align-items:center; ">
      Your lists. Let's watch something! <ComboBox
        selecteed={$selectedList}
        data={lists}
      />
      <IconButton on:click={() => (display = display == true ? false : true)} />
      {#if display}<input
          bind:value={newListName}
          placeholder="Insert a name for the list"
        />
        <Button marginLeft="10px" onClick={() => createNewList()}
          >{createButtonText}</Button
        >{/if}
      <button
        class="analyticsButton"
        title="Visualize your list stats"
        on:click={() => {
          analyticsPage = analyticsPage ? false : true;
          if (analyticsPage) {
            createChart();
          }
        }}
        ><svg
          xmlns="http://www.w3.org/2000/svg"
          style="margin-right: 3px;"
          height="20px"
          viewBox="0 -960 960 960"
          width="20px"
          fill="#000000e6"
          ><path
            d="M441-82Q287-97 184-211T81-480q0-155 103-269t257-129v120q-104 14-172 93t-68 185q0 106 68 185t172 93v120Zm80 0v-120q94-12 159-78t79-160h120q-14 143-114.5 243.5T521-82Zm238-438q-14-94-79-160t-159-78v-120q143 14 243.5 114.5T879-520H759Z"
          /></svg
        >Analytics</button
      >
    </h2>
    <div
      class="anime_card_container"
      style={`display:${analyticsPage ? "none" : "flex"};`}
    >
      {#if animes.find((e) => e.listId === $selectedList)}
        {#each animes as anime}
          {#if anime.listId === $selectedList}
            <AnimeCard animeData={anime} />
          {/if}
        {/each}
      {:else}
        <div
          style="display:flex; justify-content:center; align-items:center; width:100%; height: 500px;"
        >
          <img
            src="http://localhost:8000/static/notFound.png"
            style="width: 400px; height:400px;"
            alt="animes not found"
          />
        </div>
      {/if}
    </div>
    <div
      class="chartContainer"
      style={`opacity:${analyticsPage ? 1 : 0}; position:${analyticsPage ? "relative" : "absolute"};`}
    >
      <h2 style="margin-bottom: 10px;">Amount of animes per list</h2>
      <canvas bind:this={canvasElement}></canvas>
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
    align-items: center;
    flex-direction: row;
    flex-wrap: wrap;
    margin-left: 10px;
    margin-top: 20px;
  }
  input {
    margin-left: 10px;
    border: none;
    outline: none;
    padding-left: 10px;
    padding-right: 10px;
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
  div.chartContainer {
    width: 100%;
    height: 500px;
    top: 40px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  button.analyticsButton {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 10px;
    padding-left: 20px;
    padding-right: 20px;
    padding-top: 5px;
    padding-bottom: 5px;
    border: 1px solid black;
    border-radius: 5px;
    font-size: 20px;
    font-weight: bold;
    background: none;
    cursor: pointer;
    transition: 0.1s;
  }
  button.analyticsButton:hover {
    box-shadow: 4px 4px 1px black;
  }
</style>
