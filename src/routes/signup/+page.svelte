<script>
    import Button from "../../components/Button.svelte";
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { Toaster, toast } from "svelte-sonner";

    let username = "";
    let email = "";
    let password = "";
    let logged = "nosesabe";
    export let form;
    export let data;
    onMount(() => {
        let userCookie = data.userId;
        if (userCookie && userCookie.length > 0) {
            goto("/");
        } else {
            logged = false;
        }
    
        if (form) {
            if (form.username) {
                toast.error("The username is already taken",{position:"top-center"});
            }
            if (form.email) {
                toast.error("The email is already taken",{position:"top-center"});
            }
        }
    });
</script>

<svelte:head>
    <title>Signup</title>
</svelte:head>

<Toaster richColors />
{#if logged === false}
    <form method="POST" class="container" action="?/signup">
        <!-- {#if form?.username}
            <p class="error">The username is already taken</p>
        {:else if form?.email}
            <p class="error">The email is already taken</p>
        {/if} -->
        <h2 class="title">Sign up</h2>
        <input
            type="text"
            bind:value={username}
            name="username"
            class="input"
            placeholder="username"
            required
        />
        <input
            type="email"
            bind:value={email}
            class="input"
            name="email"
            placeholder="email"
            required
        />
        <input
            type="password"
            bind:value={password}
            class="input"
            name="password"
            placeholder="password"
            required
        />

        <Button type="submit">Sign up</Button>
        <span style="display:inline-block; margin-top: 20px; font-weight:bold;"
            >Do you already have an account? <a
                href="/login"
                style="color:blue;text-decoration:none;">Log in!</a
            ></span
        >
    </form>
{/if}

<style>
    .container {
        width: 100%;
        height: 500px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }

    .input {
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
        box-shadow: 4px 4px 0px black;
        border: 1px solid black;
        transition: 0.1s;
    }
    .input:focus {
        border: 1px solid gray;
        box-shadow: 4px 4px 0px gray;
    }

    .error {
        margin-top: 10px;
        margin-bottom: 10px;
        color: red;
        font-weight: bold;
    }
</style>
