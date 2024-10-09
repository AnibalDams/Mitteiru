<div class="loader"></div>



<style>
    .loader{
        transform: translate(-50%,-50%);
        width: 20px;
        height: 20px;
        border: 1px solid black;
        border-radius: 5px;
        animation-duration: 2s;
        animation-name: load;
        animation-timing-function: ease-out;
        animation-iteration-count: infinite;
    }


    @keyframes load{
        from{
            transform: rotate(0deg);
        }
        to{
            transform: rotate(360deg);
        }
    }
</style>