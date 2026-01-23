<script>
  import { Plus, Pencil1 } from "radix-icons-svelte";
  import ModalWithActions from "../../../../components/ModalWithActions.svelte";
  import RangeSlider from "../../../../components/RangeSlider.svelte";
  import { toast } from "svelte-sonner";
  import axios from "axios";
  import { PUBLIC_API_URL } from "$env/static/public";

  let scores = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  export let learningProgress;
  let selectedScore = learningProgress ? learningProgress.score : 0;
  let value = learningProgress ? learningProgress.understandingProgress : 0;
  let displayModal = false;
  export let profileId = "";
  export let animeId = "";
  export let profileName = "";

  async function addLearningProgress() {
    try {
      if(value ==0 && selectedScore ==0){
        return
      }
      toast.loading(learningProgress ? "Updating..." : "Adding...");
       await axios.post(
        `${PUBLIC_API_URL}/anime/${animeId}/learningProgress/${profileId}`,
        {
          score: selectedScore,
          understandingProgress: value,
          profileId: profileId,
          animeId: animeId,
          notes: "",
        },
      );
      toast.success(learningProgress ? "Updated" : "Added");
      if (!learningProgress) {
        learningProgress = true;
      }
    } catch (error) {
      toast.error("Error");
      console.log(error);
    }
  }
</script>

<ModalWithActions
  buttonText={learningProgress ? "Update" : "Add"}
  bind:showModal={displayModal}
  action={addLearningProgress}
>
  <h2 slot="header" style="font-size:20px; margin-bottom:10px;">
    {learningProgress ? "Update" : "Add"} your learning progress!
    <span
      style="color:#666; cursor:help;"
      title={`This data is private and profile-specific. It is intended for users learning Japanese with anime who want to maintain a record of their comprehension levels and scores. Consequently, the data stored here is tied to ${profileName} and is not shared with other profiles.`}
      >?</span
    >
  </h2>
  <div class="score">
    <span class="score_title">Score</span>
    <div class="score_container">
      {#each scores as score}
        <label>
          <input type="radio" bind:group={selectedScore} value={score} />
          <span class="score_item">{score}</span>
        </label>
      {/each}
    </div>
    <span class="understanding_degree_title">Understanding degree</span>
    <RangeSlider bind:value />
  </div>
</ModalWithActions>
<span
  class="trigger"
  on:click={() => (displayModal = displayModal ? false : true)}
  >{#if !learningProgress}
    <Plus
      style="position:absolute;top:50%; left:3px; transform:translateY(-50%)"
    />
  {:else}
    <Pencil1
      style="position:absolute;top:50%; left:3px; transform:translateY(-50%)"
    />
  {/if}
  {learningProgress ? "Update" : "Add"} learning progress</span
>

<style>
  span.trigger {
    position: relative;
    padding-left: 20px;
    padding-right: 10px;
    padding-top: 5px;
    padding-bottom: 5px;
    background-color: white;
    font-weight: bold;
    font-size: 15px;
    cursor: default;
    border-radius: 5px;
    transition: 0.1s;
    box-shadow: 2px 2px 0px black;
    border: 1px solid black;
    cursor: pointer;
  }

  .score {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding-top: 16px;
    padding-bottom: 16px;
  }
  .score span.score_title {
    font-size: 20px;
    font-weight: bold;
  }
  .score .score_container {
    display: flex;
    gap: 12px;
  }
  .score_container label {
    user-select: none;
  }
  .score_container label input {
    display: none;
    opacity: 0;
  }
  .score_container label input:checked + .score_item {
    background-color: black;
    color: white;
  }
  .score .score_item {
    display: flex;
    align-items: center;
    justify-content: center;
    padding-top: 8px;
    padding-bottom: 8px;
    padding-left: 16px;
    padding-right: 16px;
    border-radius: 4px;
    border: 1px solid black;
    cursor: pointer;
    transition: 0.1s;
  }

  .score .score_item:hover {
    box-shadow: 2px 2px 0px black;
  }
  .understanding_degree_title {
    margin-top: 12px;
    font-size: 20px;
    font-weight: bold;
  }
</style>
