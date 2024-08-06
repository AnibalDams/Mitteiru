<script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";

    import { deleteCookie } from "svelte-cookie";
    onMount(() => {
        document.cookie = "profileId=;max-age=-1;path=/;";
        document.cookie = "profileName=;max-age=-1;path=/;";
        document.cookie = "profileImage=;max-age=-1;path=/;";

        goto("/");
    });
</script>
