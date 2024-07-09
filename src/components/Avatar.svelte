<script>
    import { goto } from "$app/navigation";

    let classes  = "avatar_menu"
    export let image
    export let name
</script>


<div class="avatar">
    <img class="avatar_image" src={image} on:click={()=>{classes=classes==="avatar_menu"?"avatar_menu visible":"avatar_menu";}} >
    {#if classes === "avatar_menu visible"}
    <div class={classes} >

        
		<span style="font-weight: bold;">{name}</span>

        <button type="button" class="avatar_menu_button" on:click={()=>{goto("/selectprofile")}}>Change Profile</button>
        
        <button type="button" class="avatar_menu_button" on:click={()=>{goto("/user/profile/list")}}>My List</button>

        <button type="button" class="avatar_menu_button" on:click={()=>{goto("/logout")}}  style="color:red;">Logout</button>
        
    </div>
    {/if}
</div>




<style>
    .avatar{
        position: relative;
    }
    .avatar .avatar_image{
        width: 45px; 
        height:45px;
        object-fit:cover;
        border-radius:50%;
        cursor: pointer;
    }
    .avatar .avatar_menu{
        position: absolute;

        display: flex;
        opacity: 0;
        z-index: 5;
        background-color: #eee;
        border-radius: 5px;
        right: 10%;
        top:90%;
        height: 250px;
        width: 250px;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        transition: 0.1s;
    }
    .avatar .avatar_menu::before{
        position: absolute;
        top:-1.5%;
        right: 5%;
        transform: rotate(45deg);
        content:"";
        width: 10px;
        height: 10px;
        background-color: #eee;
    }
    .avatar .avatar_menu .avatar_menu_button{
        width: 100%;
        border:none;
        font-size: 17px;
        font-weight: bold;
        padding-top: 10px;
        padding-bottom: 10px;
        background: none;
        
        outline: none;
        cursor: pointer;
        margin-top:15px;
        transition: 0.1s;
    }

    .avatar .avatar_menu .avatar_menu_button:hover{
        box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.39);

    }

    .avatar_menu.visible{
        display: flex;
        opacity: 1;
        transform: translateY(10px);
        box-shadow: 4px 4px 4px rgba(0, 0, 0, 0.534);


    }
</style>


