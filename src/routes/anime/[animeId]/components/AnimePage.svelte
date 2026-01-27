<script>
  import { onMount } from "svelte";

  import EpisodeCard from "./EpisodeCard.svelte";
  import AddToListButton from "./AddToListButton.svelte";
  import GenreShip from "../../../../components/GenreShip.svelte";
  import { goto } from "$app/navigation";
  import RelatedAnimeCard from "./relatedAnimeCard.svelte";
  import { languages } from "$lib/languagesDic";
  import { language } from "$lib/store";
  import LangText from "../../../../components/LangText.svelte";
  import LikeButton from "../../../../components/LikeButton.svelte";
  import Likes from "../../../../components/Likes.svelte";
  import ReviewCard from "./ReviewCard.svelte";
  import { Splide, SplideSlide } from "@splidejs/svelte-splide";
  import "@splidejs/svelte-splide/css";
  import TypeSelector from "./TypeSelector.svelte";
  import AmountSelectror from "./AmountSelectror.svelte";
  import IconButton from "../../../user/profile/list/components/IconButton.svelte";
  import { Toaster } from "svelte-sonner";
  import "./animePage.css";
  import CharactersCard from "./CharactersCard.svelte";
  import LearninProgress from "./LearninProgress.svelte";
  import SvelteMarkdown from "svelte-markdown";

  export let logged;
  export let dataA;
  export let profileLists = [[0, ""]];
  export let animesInList = [[0, ""]];
  export let profileId = "";
  export let profileName=""
  export let likesCount = 0;
  export let liked;
  export let learningProgress;


  let showCover = false;

  const splideOptions = {
    rewind: true,
    perPage: 7,
    perMove: tenperMove ? 10 : 1,
    width: "100%",
    breakpoints: {
      2550: {
        perMove: 1,
        perPage: 6.7,
      },
      2420: {
        perMove: 1,
        perPage: 6.4,
      },
      2335: {
        perMove: 1,
        perPage: 6.1,
      },

      2150: {
        perMove: 1,
        perPage: 5.5,
      },
      1980: {
        perMove: 1,
        perPage: 5.2,
      },
      1880: {
        perMove: 1,
        perPage: 4.8,
      },
      1770: {
        perMove: 1,
        perPage: 4.5,
      },
      1600: {
        perMove: 1,
        perPage: 4,
      },

      1400: {
        perMove: 1,
        perPage: 3.5,
      },
      1280: {
        perMove: 1,
        perPage: 3.2,
      },

      1150: {
        perMove: 1,
        perPage: 2.7,
      },
      980: {
        perMove: 1,
        perPage: 2.4,
      },
      880: {
        perMove: 1,
        perPage: 2.1,
      },
    },
  };

  let type = "slider";
  $: tenperMove = false;
</script>

<Toaster richColors />

<div
  class="anime_container"
  style={`background-image: linear-gradient(to top, #fff, transparent),linear-gradient(to bottom, #fff, transparent),url(${dataA.anime.studio === "animeFlv" ? dataA.anime.cover : dataA.anime.image});`}
>
  <div
    class="image_large"
    on:click={() => (showCover = false)}
    style={`display: ${showCover ? "flex" : "none"};`}
  >
    <img
      src={dataA.anime.cover}
      style="border-radius: 10px; width:600px;height:800px; object-fit:cover;"
      alt={dataA.anime.name}
    />
  </div>
  <div class="right_sec">
    <div class="image_sec">
      <img
        src={dataA.anime.cover}
        alt=""
        on:click={() => (showCover = true)}
        class="cover"
      />
      {#if logged === "si" && profileId.length > 0}
        <AddToListButton
          animeData={dataA.anime}
          {profileId}
          {animesInList}
          lists={profileLists}
        />
      {/if}
    </div>
    <div class="anime_information">
      <div class="episodes_status_sec">
        <span
          class="episodes_status_text"
          title="This number may not accurately reflect the total number of episodes in the anime, as it is based on the episodes available in the database."
          ><LangText p="animeShow" w="episodes" />:
          <span style="color:blue;">{dataA.episodes.length}</span></span
        >
        <span class="episodes_status_text"
          ><LangText p="animeShow" w="status" />:
          <span style={`color:${dataA.anime.on_going ? "green" : "blue"};`}
            >{dataA.anime.on_going
              ? languages["animeShow"]["onGoing"][$language]
              : languages["animeShow"]["finished"][$language]}</span
          ></span
        >
      </div>
      <h1 class="anime_title">{dataA.anime.name}</h1>
      <span style="display: block;margin-bottom:15px;font-weight:bold;"
        >{dataA.anime.japaneseName}</span
      >
      <span
        class="anime_studio_ship"
        on:click={() => goto(`/anime/studio/${dataA.anime.studio}`)}
        >{dataA.anime.studio}</span
      >

      <span
        class="anime_studio_ship"
        on:click={() => {
          goto(`/anime/year/${dataA.anime.releaseYear}`);
        }}>{dataA.anime.releaseYear}</span
      >
    

      {#if logged === "si" && profileId.length > 0}
        <LearninProgress profileId={profileId} learningProgress={learningProgress} profileName={profileName} animeId={dataA.anime._id}/>
        <LikeButton
          {liked}
          {likesCount}
          {profileId}
          animeId={dataA.anime._id}
        />
      {:else}
        <Likes {likesCount} />
      {/if}
      <p class="anime_synopsis">
      <SvelteMarkdown source={dataA.anime.synopsis}/>
</p>
      <div class="genres">
        {#each dataA.anime.genres as genre}
          <GenreShip {genre} />
        {/each}
      </div>
      <div class="related_anime">
        <h2><LangText p="animeShow" w="similarAnime" /></h2>
        {#if dataA.similarAnime}
          <RelatedAnimeCard
            {dataA}
            inList={animesInList.find((e) => e._id == dataA.similarAnime._id)
              ? true
              : false}
          />
        {:else}
          <span style="display:inline-block; margin-top:20px;font-weight:bold;"
            ><LangText p="animeShow" w="animeSimilarNoFound" /> :(</span
          >
        {/if}
      </div>
    </div>
  </div>
  <div class="episodes_information">
    <h2 class="episodes_information_title" style="margin-bottom: 20px;">
      <LangText p="animeShow" w="episodes" /><TypeSelector
        option1Click={() => {
          type = "slider";
        }}
        option2Click={() => {
          type = "grid";
        }}
      />
      {#if type == "slider"}
        <AmountSelectror
          option1Click={() => {
            tenperMove = false;
          }}
          option2Click={() => {
            tenperMove = true;
          }}
        />
      {/if}
    </h2>
    {#if type == "slider"}
      <Splide options={splideOptions} style="margin-top:20px;">
        {#each dataA.episodes as episode}
          {#if episode.episode_number != 0}
            <SplideSlide>
              <EpisodeCard
                animeStudio={dataA.anime.studio}
                episodeData={episode}
              />
            </SplideSlide>
          {/if}
        {/each}
      </Splide>
    {:else if type == "grid"}
      <div class="episodes_information_list">
        {#each dataA.episodes as episode}
          {#if episode.episode_number != 0}
            <EpisodeCard
              animeStudio={dataA.anime.studio}
              episodeData={episode}
            />
          {/if}
        {/each}
      </div>
    {/if}
  </div>

  <div class="reviews">
    <h2
      class="episodes_information_title"
      style="display: flex; align-items:center;"
    >
      Reviews ({dataA.reviews.length}) {#if logged === "si" && profileId.length > 0}
        <IconButton
          on:click={() => {
            goto(`/anime/${dataA.anime._id}/review/new`);
          }}
        />
      {/if}
    </h2>
    {#if dataA.reviews && dataA.reviews.length > 0}
      <Splide
        options={{ rewind: true, perPage: 3, perMove: 1, autoplay: true }}
      >
        {#each dataA.reviews as review}
          <SplideSlide>
            <ReviewCard
              on:click={() =>
                goto(`/anime/${dataA.anime._id}/review/${review._id}`)}
              avatar={review.profileImage}
              content={review.review}
              name={review.profileName}
              title={review.title}
              date={new Date(review.createdAt).toISOString().split("T")[0]}
            />
          </SplideSlide>
        {/each}
      </Splide>
    {/if}
  </div>
  {#if dataA.characters.length > 0}
    <div class="characters_container">
      <h2 class="episodes_information_title">Characters - <a href="/">View All</a></h2>
      <div class="characters">
        {#each dataA.characters as character}
          <CharactersCard characterId={character._id} picture={character.image} name={character.name} role={character.role}/>
        {/each}
      </div>
    </div>
  {/if}
</div>
