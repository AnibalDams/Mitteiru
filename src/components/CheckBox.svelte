<script>
    import {Check} from 'radix-icons-svelte'

    export let checked;
    export let text =""
    export let onClick = ()=>{}
    export let selected = ()=>{}
    export let notSelected = ()=>{}
</script>

<div class="check_box" on:click={()=>{
    if(checked){
        selected()
        checked = false 
    }else{
        notSelected()
        checked = true
    }
    
    }}>
    <div class={checked?"checked":"not_checked"}>
        {#if checked}
        <Check color="#fff"/>
        {/if}
    </div>
    <span class="check_box_text">{text}</span>
</div>


<style>
    .check_box{
        display: flex;
        align-items: center;
        cursor:pointer;
        padding-top: 10px;
        padding-bottom: 10px;
        margin-top:5px;
        border-radius: 10px;
    }
    .check_box:hover{
        opacity:0.5;
    }
    .check_box .checked{
        display: flex;
        align-items: center;
        padding:5px;
        background-color: black;
        border-radius:5px ;
        margin-right: 10px;
    }
    .check_box .not_checked{
        display: flex;
        align-items: center;
        padding:10px;
        border: 1px solid black;
        border-radius:5px ;
        margin-right: 10px;
    }
    .check_box .check_box_text{
        font-weight: bold;
    }

</style>