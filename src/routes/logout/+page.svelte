<script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    
    import { deleteCookie } from "svelte-cookie";
    onMount(()=>{
        deleteCookie("profileId")
        deleteCookie("profileId")
        deleteCookie("profileName")
        deleteCookie("profileName")
        deleteCookie("profileImage")
        deleteCookie("profileImage")
        goto("/")
    })
</script>