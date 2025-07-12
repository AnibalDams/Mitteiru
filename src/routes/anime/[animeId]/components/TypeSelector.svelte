<script>
    let option1Selected = true
    let option2Selected
    export let option1Click
    export let option2Click
</script>

<div class="container">
    <span on:click={()=>{
        option2Selected = false
        option1Selected = true
        option1Click()
    }} class={option1Selected?"selected":""}>Slides</span>
    <span on:click={()=>{
        option1Selected = false
        option2Selected = true
        option2Click()
    }} class={option2Selected?"selected":""}>Grid</span>
</div>


<style>
    div.container{
        display: inline-block;
        margin-left: 10px;
    }
span{
        display: inline-block;
        padding-left: 10px;
        padding-right: 10px;
        padding-top: 5px;
        padding-bottom: 5px;
        cursor: pointer;
        font-size: 15px;
    }
    span.selected{
        border: 1px solid black;
        border-radius: 5px;
    }

</style>