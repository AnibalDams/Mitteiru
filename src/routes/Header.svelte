<script>
  import Button from "../components/Button.svelte";
  import SearchBar from "../components/SearchBar.svelte";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { getCookie, deleteCookie } from "svelte-cookie";
  import Avatar from "../components/Avatar.svelte";
  export let logged = "nosesabe";
  export let profileImage = "nosesabe";
  export let name = "";
  export let searchPage = false;
  export let searchPageAction = null;
  onMount(() => {
    //logged = getCookie("userId").length > 0 ? true:false
  });
</script>

<nav class="nav_bar">
  <ul class="nav_bar_links_container">
    <li class="nav_bar_link"><a href="/">Home</a></li>
    <li class="nav_bar_link"><a href="/directory">Directory</a></li>
  </ul>
  <div class="nav_bar_search">
    <SearchBar {searchPage} {searchPageAction} />
  </div>
  {#if logged === "no"}
    <div class="nav_bar_loginSigup_buttons">
      <Button
        variant="light"
        marginRight={"5px"}
        onClick={() => {
          goto("/signup");
        }}>Sign up</Button
      >
      <Button
        onClick={() => {
          goto("/login");
        }}>Login</Button
      >
    </div>
  {:else if logged === "si"}
    {#if profileImage.length > 0}
      <Avatar image={profileImage} {name} />
    {:else}
      <Button onClick={() => goto("/selectprofile")}>Select a profile</Button>
    {/if}
  {:else}
    <div style="width: 100px;"></div>
  {/if}
</nav>

<style>
  .nav_bar {
    margin: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .nav_bar .nav_bar_links_container {
    display: flex;
    flex-direction: row;
    align-items: center;
  }
  .nav_bar .nav_bar_links_container .nav_bar_link {
    list-style: none;
    margin-right: 10px;
  }
  a {
    position: relative;

    text-decoration: none;
    font-weight: bold;
    color: rgba(0, 0, 0, 0.8);
  }

  a::after {
    content: "";
    position: absolute;
    margin-top: 1px;
    opacity: 0;
    width: 100%;
    top: 120%;
    right: 0;
    left: 0;
    height: 2px;
    background-color: black;
    transition: 0.1s;
  }
  .nav_bar .nav_bar_links_container .nav_bar_link:hover a::after {
    top: 100%;
    opacity: 1;
  }
  .nav_bar .nav_bar_loginSigup_buttons {
    display: flex;
    flex-direction: row;
    align-items: center;
  }
</style>
