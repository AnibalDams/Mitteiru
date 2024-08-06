<script>
    import {Plus} from 'radix-icons-svelte'
</script>



<button on:click >
    <Plus size={18}/>
</button>

<style>
    button{
        display: flex;
        margin-left: 5px;
        padding:10px;
        border-radius: 50%;
        background: none;
        border: none;
        outline: none;
        cursor: pointer;
    }
    button:hover{
        background-color: #eee;
    }
</style>