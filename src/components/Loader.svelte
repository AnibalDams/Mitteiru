<div class="loader"></div>



<style>
    .loader{
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%,-50%);
        width: 50px;
        height: 50px;
        border: 1px solid black;
        border-radius: 10px;
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