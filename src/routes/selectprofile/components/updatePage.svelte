<script>
    import Button from "../../../components/Button.svelte";
    import axios from "axios";
    import avatars from '../avatars'
    export let refresh
     
    export let name = "";
    export let avatar = "https://i.ibb.co/pnkd1F0/itadori.jpg";
    export let cancel;
    let buttonCreatetext ="update";
    export let profileId;

    const updateProfile = async () => {
        if (name.length > 0) {
            buttonCreatetext = "Updating...";
            await axios.put(
                `http://localhost:8000/user/profile/${profileId}`,

                {
                    admin:true,
                    name: name,
                    photo: avatar,
                },
            );
            buttonCreatetext = "Done";
            refresh()
            cancel();
        }
    }

</script>

<div class="container">

    <div class="input_container">
        <Button type="button" variant="light" onClick={cancel}>Cancel</Button>

        <input
            type="text"
            placeholder="The new name of the profile"
            bind:value={name}
        />
        <Button type="button" onClick={()=>{

               if (buttonCreatetext !== "Updating...") {
                updateProfile()
               }
            
            }}>{buttonCreatetext}</Button
        >
    </div>

    <div class="avatar_container">
        {#each avatars as avatarr}
            <button
                class="avatar"
                type="button"
                on:click={() => {
                    avatar = avatarr;
                }}
            >
                <img
                    style={`${avatar === avatarr ? "border:2px solid black;" : "border:none;"}`}
                    src={avatarr}
                    alt=""
                />
            </button>
        {/each}
    </div>
</div>

<style>
    .container {
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }
    .input_container {
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .avatar_container {
        margin-top: 10px;
        margin-left:10%;
        display: flex;
        justify-content: flex-start;
        flex-direction: row;
        flex-wrap: wrap;

    }
    .avatar {
        width: 200px;
        height: 200px;
        border-radius: 5px;
        margin-right: 10px;
        margin-bottom: 10px;
        background: none;
        border: none;
        outline: none;
        cursor: pointer;
    }
    .avatar img {
        width: 200px;
        height: 200px;
        border-radius: 5px;
        object-fit: cover;
        object-position:center;
        transition: 0.1s;
    }
    .avatar:hover img {
        box-shadow: 4px 4px 0px black;
    }

    input {
        margin-top: 10px;
        margin-right: 10px;
        margin-left: 10px;
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
</style>
