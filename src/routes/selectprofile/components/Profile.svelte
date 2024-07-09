<script>
  import DeleteModal from "./deleteModal.svelte";
  import { deleteCookie } from "svelte-cookie";
  import axios from "axios";
  export let image;
  export let name;
  export let id;
  export let onClick;
  export let secondaryAction;
  let deleteButtonText = "Delete";
  const deleteAction = async () => {
    try {
      deleteButtonText = "Deleting...";
      deleteCookie("profileId");
      deleteCookie("profileId");
      deleteCookie("profileId");
      deleteCookie("profileName");
      deleteCookie("profileName");
      deleteCookie("profileName");
      deleteCookie("profileName");
      deleteCookie("profileImage");
      deleteCookie("profileImage");
      deleteCookie("profileImage");
      await axios.delete(`http://localhost:8000/user/profile/${id}/delete`);
      deleteButtonText = "Deleted";
      secondaryAction();
    } catch (error) {
      console.error(error.message);
    }
  };
  export let deleteButtonClicked = false;
  let showModal = false;
</script>

<DeleteModal bind:showModal {deleteAction} {deleteButtonText}>
  <h2 slot="header" style="font-size:20px; margin-bottom:10px;">
    Are you sure?
  </h2>
  <div class="modal_information">
    <p class="modal_information_text">
      The related data to {name} will be deleted and
      <span style="font-weight: bold;"> this action can't be undone.</span>
    </p>
  </div>
</DeleteModal>

<button class="profile">
  <img
    on:click={() => {
      if (!deleteButtonClicked) {
        onClick();
      }
    }}
    src={image}
    class="profile_image"
    alt=""
  />
  <span class="profile_name">{name}</span>
  <button
    type="button"
    on:click={() => {
      deleteButtonClicked = true;
      showModal = true;
      deleteButtonClicked = false;
    }}
    class="delete_button">x</button
  >
</button>

<style>
  .profile {
    position: relative;
    background: none;
    border: none;
    width: 200px;
    height: 200px;
    margin-bottom: 10px;
    cursor: pointer;
  }

  .profile .profile_image {
    width: 200px;
    height: 200px;
    object-fit: cover;
    border-radius: 5px;
    transition: 0.1s;
    margin-bottom: 7px;
  }
  .profile .profile_name {
    font-weight: bold;
    font-size: 18px;
  }
  .delete_button {
    opacity: 0;
    cursor: pointer;

    padding-left: 5px;
    padding-right: 5px;
    top: -13px;
    font-size: 16px;
    font-weight: bold;
    right: -10px;
    position: absolute;
    background-color: red;
    border: 3px solid white;
    border-radius: 50%;
    color: white;
    transition: 0.1s;
  }

  .profile:hover .profile_image {
    box-shadow: 4px 4px 0px black;
  }
  .profile:hover .delete_button {
    opacity: 1;
    top: -10px;
  }

  .modal_information {
    margin-top: 10px;
    margin-bottom: 10px;
  }
</style>
