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
  export let animeName="";
  export let profileName = "";
  export let mobile = false
  let notes =learningProgress ? learningProgress.notes : "";
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
          notes: notes,
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
    <div class="notes">
      <span class="score_title">Notes</span>
      <textarea name="notes" id="" bind:value={notes} placeholder={`Place your notes about your undertanding of ${animeName} here...`}></textarea>
    </div>
  </div>
</ModalWithActions>
<span
  class={mobile?"mobile_trigger":"trigger"}
  on:click={() => (displayModal = displayModal ? false : true)}
  >{#if !mobile}
    {#if !learningProgress}
    <Plus
      style="position:absolute;top:50%; left:3px; transform:translateY(-50%)"
    />
  {:else}
    <Pencil1
      style="position:absolute;top:50%; left:3px; transform:translateY(-50%)"
    />
  {/if}
  {:else}
  {#if !learningProgress}
    <Plus
    />
  {:else}
    <Pencil1
    />
  {/if}
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
  .mobile_trigger {
      display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        margin-top: 10px;
        width: 100%;
        font-size: 14px;
        height: 50px;
        background: none;
        border: 1px solid black;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
        transition: 0.1s;
      }
  .score {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding-top: 16px;
    padding-bottom: 16px;
    overflow: hidden;

  }
  .score span.score_title {
    font-size: 20px;
    font-weight: bold;
  }
  .score .score_container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;

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
  .score .notes{
    width: 70%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding-top: 16px;
    padding-bottom: 16px;
  }
  .score .notes textarea{
    width: 100%;
    max-width: 100%;
    height: 100px;
    max-height: 200px;
    padding: 8px;
    border-radius: 8px;
    outline: none;
    transition: 0.1s;
  }
  .score .notes textarea:focus{
    box-shadow: 4px 4px 0px black;
  }
</style>
