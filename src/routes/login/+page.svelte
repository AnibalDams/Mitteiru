<script>
    import Button from "../../components/Button.svelte";
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { Toaster, toast } from "svelte-sonner";

    export let data
    let email=""
    let password=""
    let logged = "nosesabe"
    export let form
    
    onMount(()=>{
        
        if ( data.userId && data.userId.length> 0) {
            
            goto("/")
            
        } else{
            logged = false
        }
        if (form) {
           if(form.error){
            toast.error("Invalid email or password",{
                position:"top-center"
            })
           } 
        }
    })
</script>

<svelte:head>
    <title>Login</title>
</svelte:head>
<Toaster richColors/>
{#if logged === false}
<form method="POST" class="container" action="?/login">
    <!-- {#if form?.error}
        <p class="error">Invalid email or password</p>
    

    {/if} -->
    <h2 class="title">Login</h2>
    <input type="email" bind:value={email} class="input" name="email" placeholder="email" required/>
    <input type="password" bind:value={password} class="input" name="password" placeholder="password" required/>

    <Button type="submit">Login</Button>
    <span style="display:inline-block; margin-top: 20px; font-weight:bold;">You don't have an account? <a href="/signup" style="color:blue;text-decoration:none;">Create one!</a></span>
</form>
{/if}


<style>
.container{
    width: 100%;
    height: 400px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}


.input{
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
        border:1px solid black;
        transition: 0.1s;
    }
    .input:focus{
        border:1px solid gray;
        box-shadow: 4px 4px 0px gray;


    }

    .error{
        margin-top: 10px;
        margin-bottom: 10px;
        color: red;
        font-weight: bold;
    }

</style>



