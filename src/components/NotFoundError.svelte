<script>
    export let link = false
    export let text = "404 Not found"
    export let linkText=""
    export let linkDirection="/"
    export let image
</script>


<div class="not_found_c">
    
    <img src={image} alt="" srcset="">
   
    {#if !link}
    <span class="not_found_text">{text}</span>
    
    {:else}
    <span class="not_found_text">{text} <a href={linkDirection} class="link">{linkText}</a></span>

    {/if}
    
   
</div>



<style>

    
.not_found_c{
        width: 100%;
        height: 500px;
        position: relative;
    }

    .not_found_c img{
        width: 200px;
        height: 200px;
        position: absolute;
        top: 50%;
        right: 50%;
        transform: translate(50%,-50%);
    }
    .not_found_c span.not_found_text{
        display: inline-block;

        position: absolute;
        font-weight: bold;
        top: 75%;
        right: 50%;
        transform: translate(50%,-50%);


    }
    .link{
        display: inline-block;
        text-decoration: none;
        font-weight: bold;
        color:blue;
    }

</style>