<script>
    import DeleteModal from "./deleteModal.svelte";
    import {Pencil1, Trash} from "radix-icons-svelte"
    import axios from "axios";
    export let image;
    export let name;
    export let id;
    export let onClick;
    export let secondaryAction;
    export let editAction
    let deleteButtonText = "Delete";
    const deleteAction = async () => {
        try {
            deleteButtonText = "Deleting...";
            document.cookie = "profileId=;max-age=-1;path=/;";
            document.cookie = "profileName=;max-age=-1;path=/;";
            document.cookie = "profileImage=;max-age=-1;path=/;";
            const delte  = await axios.delete(
                `https://mitteiru-backend.onrender.com/user/profile/${id}/delete`,
            );
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
            <span style="font-weight: bold;">
                this action can't be undone.</span
            >
        </p>
    </div>
</DeleteModal>

<button class="profile">
    <img src={image} class="profile_image" alt="" />
    <span
        class="gradient"
        on:click={() => {
            if (!deleteButtonClicked) {
                onClick();
            }
        }}
    ></span>
    <span class="profile_name"
        >{name.length <= 20 ? name : name.substring(0, 17) + "..."}</span
    >

    <button
        type="button"
        on:click={()=>{editAction()}}
        title="This functionality is being developed"
        class="edit_button"><Pencil1/></button
    >
    <button
        type="button"
        on:click={() => {
            deleteButtonClicked = true;
            showModal = true;
            deleteButtonClicked = false;
        }}
        class="delete_button"><Trash/></button
    >
</button>

<style>
    .profile {
        position: relative;
        background: none;
        background-position: center;
        background-size: cover;
        border-radius: 5px;
        border: none;
        width: 200px;
        height: 200px;
        transition: 0.1s;
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
        opacity: 0;
        color: #eee;
        position: absolute;
        top: 90%;
        left: 5%;
        font-weight: bold;
        font-size: 18px;
        transition: 0.1s;
    }
    .delete_button {
        opacity: 0;
        cursor: pointer; 
        display: flex;
        padding: 3px;
 
        
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

    .profile:hover {
        box-shadow: 4px 4px 0px black;
    }
    .profile:hover .profile_name {
        opacity: 1;
        top: 85%;
    }
    .profile:hover .delete_button {
        opacity: 1;
        top: -10px;
    }

    .edit_button{
        opacity: 0;
         cursor: pointer; 
        display: flex;
        padding: 3px;
 
        
        top: -13px;
        font-size: 16px;
        font-weight: bold;
        right: 20px;
        position: absolute;
        background-color: rgb(0, 0, 0);
        border: 3px solid white;
        border-radius: 50%;
        color: white;
        transition: 0.1s;
    }
    .profile:hover .edit_button{
        opacity: 1;
        top: -10px;
    }

    .modal_information {
        margin-top: 10px;
        margin-bottom: 10px;
    }
    span.gradient {
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0%;
        left: 0%;
        right: 0%;
        bottom: 0%;
        border-radius: 5px;
        background-image: linear-gradient(to top, #000, transparent 70%);
        background-size: 200% 200%;
        background-position: 100% 0%;
        transition: 0.1s;
    }
    .profile:hover span.gradient {
        background-position: 100% 90%;
    }

</style>
