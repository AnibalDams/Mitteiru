<script>
  import SvelteMarkdown from "svelte-markdown";
  import Header from "../../../../Header.svelte";
  import { onMount } from "svelte";
  import {getCookie} from 'svelte-cookie'

  let markDown = ``
 let profileId
 let profileImage
 let profileName
 let logged = "nosesabe"
 export let data
  onMount(async()=>{
    const userId = data.userId;
      

      if (userId&&userId.user._id.length >0)  {
    
        profileId = getCookie("profileId");
        profileImage = getCookie("profileImage");
        profileName = getCookie("profileName");
        if (profileId.length <= 0) {
          goto("/selectprofile");
        }
        logged = "si"
  }else{
    logged = "no"
  }
})

</script>
<Header {logged} {profileImage} name={profileName} />
<div style="margin: 10px;">
  
  <span style="font-weight: bold; color:green;">Markdown Supportted</span>
  <textarea name="" bind:value={markDown} style=" padding:20px;width: 100%; height:500px; font-size:20px;"></textarea></div>
<div style="margin: 10px;">
  <h2 style="margin-bottom: 20px;">Preview</h2>
  <SvelteMarkdown source={markDown}/></div>


<style>
  textarea{
        margin-top: 10px;
        margin-bottom: 10px;
        border: none;
        outline: none;
        padding-left: 30px;
        padding-right: 30px;
        font-weight: bold;
        padding-top: 10px;
        padding-bottom: 10px;
        border-radius: 5px;
        box-shadow: 0px 0px 0px black;
        border:1px solid black;
        transition: 0.1s;
  }
  textarea:focus{
        border:1px solid gray;
        box-shadow: 4px 4px 0px black;
        


    }
</style>