<script>
    import { onMount } from 'svelte';
    
    let classes = "combo_box_options"
    let display = "none"
    export let data = [[0,"",0]]
    import {selectedList} from '../routes/user/profile/list/store'
   
    let text = ""
    export let action = ()=>{}
    onMount(()=>{
        for (let i = 0; i < data.length; i++) {
            const list = data[i];
            if(list[0] === $selectedList){
                text = list[1]
            }
            
        }
    })
    
</script>

<div class="combo_box" >
    <span on:mouseover={()=>{
        display = "block"
    }} on:mouseleave={()=>{
        display = classes === "combo_box_options visible"?"block":"none"
    }} on:click={()=>{
        classes = classes === "combo_box_options"?"combo_box_options visible":"combo_box_options" 
    }}>{text}</span>
    <ul class={classes} style={`display:${display}`}>
        {#each data as listName}
            <li class="combo_box_option" on:click={()=>{
                
                classes = "combo_box_options"
                display = "none"
                $selectedList = listName[0]
                text = listName[1]
                
                action()
            }}>{listName[1]}</li>            
        {/each}


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
        padding-bottom: 15px;
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