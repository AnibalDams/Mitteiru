<script>
  import { CardStack, MagnifyingGlass } from "radix-icons-svelte";
  import { goto } from "$app/navigation";
  import { getCookie } from "svelte-cookie";
    import { onMount } from "svelte";

    let visible = false
    let profileImage
    onMount(()=>{
        profileImage = getCookie("profileImage")
    
    })
</script>

<nav class="nav_bar">
    <h1 on:click={()=>goto("/")}>Mitteiru</h1>
    <div style="display: flex; gap: 10px;">
                <a href="/directory" class="link"><CardStack  color="black" size="15px"/>  Directory</a>
        <a href="/search/mobile/search"class="link"><MagnifyingGlass  color="black" size="15px"/>  Search</a>
    </div>
    <div class="right_section">

        <div class="profile">
            <img class="avatar" on:click={()=>visible=visible?false:true} src={profileImage} alt="">
            <div class="dropdown_menu" style={`display:${visible ? "flex" : "none"};`}>
                <a href="/user/profile/list">My list</a>
                <a href="/user/profile/history">History</a>
                <a href="/selectprofile">Change Profile</a>
                <a href="/logout" style="color: red;">Logout</a>
            </div>
        </div>
    </div>
</nav>




<style>
    .nav_bar{
        display: flex;
        padding-top: 20px;
        padding-bottom: 20px;
        max-width: 100%;
        margin-left: 10px;
        margin-right: 10px;
        justify-content: space-between;
        align-items: center;
    }
    .nav_bar h1{
        font-size: 20px;
    }
    .nav_bar .right_section{
        display: flex;
        justify-content: center;
        align-items: center;

    }
    .nav_bar img.avatar{
        width: 50px;
        height: 50px;
        border-radius: 50%;
        object-fit: cover;
    }
    a.link{
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100px;
        height: 30px;
        margin-right: 10px;
        background: none;
        border-radius: 10px;
        border: 1px solid black;
        text-decoration: none;
        color: black;
        font-size: 15px
    }
    .nav_bar .profile{
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 150px;
    }
    .nav_bar .dropdown_menu{
        position: absolute;
        height: 170px;
        top: 120%;
        left: 0;
        width: 100%;
       
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 10px;
        background-color: #333;
        border-radius:10px ;
    }
    .nav_bar .dropdown_menu a{
        color: #eee;
        text-decoration: none;
        font-size: 15px;
        font-weight: bold;
        padding: 5px;
    }
</style>