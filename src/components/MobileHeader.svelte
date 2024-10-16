<script>
  import { CardStack, MagnifyingGlass } from "radix-icons-svelte";
  import { goto } from "$app/navigation";

    
</script>

<nav class="nav_bar">
    <h1 on:click={()=>goto("/")}>Mitteiru</h1>
    <div class="right_section">
        <a href="/directory" ><CardStack style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%);" color="black" size="15px"/></a>
        <a href="/search/ "><MagnifyingGlass style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%);" color="black" size="15px"/></a>
        <img class="avatar" src="https://i.ibb.co/7JdWD71/Kimi-wa-Houkago-Insomnia-02-Large-05.jpg" alt="">
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
    a{
        position: relative;
        display: inline-block;
        width: 30px;
        height: 30px;
        margin-right: 10px;
        background: none;
        border-radius: 10px;
        border: 1px solid black;
    }
</style>