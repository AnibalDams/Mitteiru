<script>
    import { Bookmark } from "radix-icons-svelte";
    import axios from "axios";
    import ModalWithoutActions from "../../../../components/ModalWithoutActions.svelte";
    
    import CheckBox from "../../../../components/CheckBox.svelte";
    import LangText from "../../../../components/LangText.svelte";


    export let animeData;
    let doesTheAnimeIsInList = false;
    export let lists = [[0, ""]];
    export let animesInList = [[0, ""]];
    console.log(animesInList)

    //let buttonText = "Select a list to add this anime";
    export let profileId;
    let showModal = false;
    const addToList = async (listId) => {
        await axios.post(
            `http://localhost:8000/anime/${animeData._id}/list/${listId}/add`,
        );

        doesTheAnimeIsInList = true;

        showModal = false;
    };
   
    const removeFromList = async (listId) => {
        
        await axios.delete(
            `http://localhost:8000/user/profile/list/${listId}/anime/${animeData._id}`,
        );


    };
  
</script>

<ModalWithoutActions {showModal} onClose={() => (showModal = false)}>
    <h2 slot="header"><LangText p="animeShow" w="chooseAList"/></h2>
    {#each lists as list, index}
        <CheckBox
            checked={animesInList.find((e) => e.listId == list._id && e._id==animeData._id)  ? true : false}
            selected={() => {
              
                removeFromList(list._id)
                
            }}
            notSelected={() => {
                addToList(list._id);
            }}

            text={list.name}
        />

    {/each}
</ModalWithoutActions>
<button
    title={`This anime can be added to ${lists.length} different lists`}
    type="button"
    class="button"
    on:click={() => {
        showModal = true;
    }}
    ><Bookmark style={`transition:0.1s;position:absolute; top:50%;transform:translateY(-50%); left:50px; `} />
    <span
        style="position:absolute;
        top:50%; left:70px; transform:translateY(-50%)"><LangText p="animeShow" w="addToList"/></span
    ></button
>

<style>
    .button {
        position: relative;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        margin-top: 10px;
        width: 300px;
        text-align: center;
        font-size: 15px;
        height: 50px;
        background: none;
        border: 1px solid black;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
        transition: 0.1s;
    }
    .button:hover {
        box-shadow: 4px 4px 0px black;
    }
</style>
