<script>
  import { onMount } from "svelte";
    import { getCookie } from "svelte-cookie";

  import DesktoPage from "./components/desktoPage.svelte";
  export let data;

  let profileImage = "";
  let profileName = "";
  let logged="nosesabe";
  onMount(() => {
    let userId = data.userId;
    if (userId && userId.user._id.length > 0){
      logged = "si";
    }else{
      logged = "no";
    }
    profileImage = getCookie("profileImage");
    profileName = getCookie("profileName");
  });
</script>

<DesktoPage data={data} logged={logged} profileImage={profileImage} profileName={profileName}/>