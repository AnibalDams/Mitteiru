<script>
    let classes = "combo_box_options"
    let display = "none"
    let selecteed = "default"
</script>

<div class="combo_box" >
    <span on:mouseover={()=>{
        display = "block"
    }} on:mouseleave={()=>{
        display = classes === "combo_box_options visible"?"block":"none"
    }} on:click={()=>{
        classes = classes === "combo_box_options"?"combo_box_options visible":"combo_box_options" 
    }}>{selecteed}</span>
    <ul class={classes} style={`display:${display}`}>
        <li class="combo_box_option" >Default</li>
        <li class="combo_box_option" on:click={()=>{
            selecteed = "watching"
            classes = "combo_box_options"
            display = "none"
        }}>Watching</li>
        <li class="combo_box_option">finished</li>
        <li class="combo_box_option">want to watch</li>
    </ul>
</div>


<style>
    .combo_box{
        position:relative;

        margin-left:10px;
 
    }
    .combo_box span{
        display: inline-block;
        padding-right: 10px;
        padding-left: 10px;
        padding-top: 3px;
        padding-bottom: 3px;
        cursor: pointer;
        border: 1px solid black;
        border-radius: 5px;
        font-size: 20px;
        transition: 0.1s;

     }
     .combo_box span:hover{
        box-shadow: 4px 4px 0px black;

     }
     .combo_box span:active{
        opacity: 0.5;
     }
     .combo_box .combo_box_options{
        position: absolute;
        opacity: 0;
        top: 110%;
        z-index: 5;
        left: 0;
        width: 200px;
        padding-top: 10px;
        padding-bottom: 10px;
        padding-left: 25px;
        padding-right: 25px;
        background-color: white;
        border: 1px solid black;
        transition:0.1s;
        border-radius: 5px;
        box-shadow: 4px 4px 0px black;
     }
     .combo_box .combo_box_options.visible{
        top: 120%;
        opacity: 1;
     }
     .combo_box .combo_box_options .combo_box_option{
        cursor: pointer;
        margin-top: 10px;
        font-size: 20px;
        list-style: none;
        transition: 0.1s;
     }
     .combo_box .combo_box_options .combo_box_option:hover{
        box-shadow: 4px 0px 0px black;
     }
</style>