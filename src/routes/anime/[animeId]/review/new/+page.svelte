<script>
  import SvelteMarkdown from "svelte-markdown";
  import Header from "../../../../Header.svelte";
  import Button from "../../../../../components/Button.svelte";
  import { onMount } from "svelte";
  import { getCookie } from "svelte-cookie";
  import { Toaster, toast } from 'svelte-sonner'
  import { goto } from "$app/navigation";
  import axios from "axios";
  import Image from "../[reviewId]/Image.svelte";

  let content = ``;
  let title = "";
  let profileId;
  let profileImage;
  let profileName;
  let logged = "nosesabe";
  export let data;
  onMount(async () => {
    const userId = data.userId;
    if (userId.user && userId.user._id.length > 0) {
      profileId = getCookie("profileId");
      profileImage = getCookie("profileImage");
      profileName = getCookie("profileName");
      if (profileId.length <= 0) {
        goto("/selectprofile");
      }
      logged = "si";
    } else {
      goto("/")

    }
  });

  async function addReview() {
    if (title.length > 0 && content.length > 0) {
      toast.loading("Adding...")
      await axios.post(`https://mitteiru-backend.onrender.com//anime/${data.anime._id}/review/new`,{
        review:content,
        profileImage:profileImage,
        profileId:profileId,
        profileName:profileName,
        title:title
      })
      toast.success("Added")
      goto(`/anime/${data.anime._id}`)
    }else{
      toast.error("Please fill all the fields")
    }
  }
</script>

<Toaster richColors/>
<Header {logged} {profileImage} name={profileName} />
<div style="margin: 10px; display:flex;flex-direction:column;">
  <span style="font-weight: bold;">Title</span>
  <input type="text" placeholder="Title" bind:value={title} />
  <span style="font-weight: bold;">
    Content - <span style="font-weight: bold; color:green;"
      >Markdown Supportted</span
    ></span
  >
  <textarea
    name=""
    bind:value={content}
    style="padding:20px;width: 100%; height:500px; font-size:20px;"
    placeholder={`My thoughts about ${data.anime.name} are...`}
  ></textarea>
  <Button onClick={async()=>await addReview()}>Publish</Button>
</div>
<div style="margin: 10px; font-size:17px; line-height: 28px;">
  <h2 style="margin-bottom: 20px;">Preview</h2>
  <h1 style="margin-bottom:20px;">{title}</h1>
  <SvelteMarkdown source={content} renderers={{image:Image}} options={{gfm:true}}/>
</div>

<style>
  input,
  textarea {
    margin-top: 10px;
    margin-bottom: 10px;
    border: none;
    outline: none;
    padding-left: 30px;
    padding-right: 30px;
    padding-top: 10px;
    line-height: 25px;
    padding-bottom: 10px;
    border-radius: 5px;
    box-shadow: 0px 0px 0px black;
    border: 1px solid black;
    transition: 0.1s;
  }
  input:focus,
  textarea:focus {
    border: 1px solid gray;
    box-shadow: 4px 4px 0px black;
  }
</style>
