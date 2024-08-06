<script context="module">
    import Button from "./Button.svelte";
</script>

<div class="container" style={`background-image: linear-gradient(to top, #fff, transparent),linear-gradient(to bottom, #fff, transparent), url('http://localhost:8000/static/The-Great-Jahy-Will-Not-Be-Defeated-10-17-2021.jpg');`}>

    <h1 class="title">The great Jahy Will Not Be Defeated!</h1>
    <p class="synopsis">Once feared as the Demon king's aide, Jahy loses her powers after a magical attack. Stranded in the human world with a child's form, she must work menial jobs and gather mytic gems to regain her former glory and restore the Demon Realm</p>
    <div class="actions">
        <Button variant="primaryMobile">Watch Now!</Button>
        <Button variant="lightMobile">More Details</Button>
    </div>
</div>


<style>
    .container{
        display: flex;
        flex-direction: column;
        justify-content: center;
        max-width: 100%;
        height: 400px;
        padding-left:10px;
        background-repeat: no-repeat;
        background-position: center;
        background-size: cover;
    }
    .container h1.title{
        font-size:40px;
    }
    .container p.synopsis{
        display: inline-block;
        max-width: 80%;

    }
    .container .actions{
        margin-top: 15px;
    }
</style>