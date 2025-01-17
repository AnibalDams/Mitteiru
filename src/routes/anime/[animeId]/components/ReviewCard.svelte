
<div class="container">
    <div class="top">
        <img src="https://i.ibb.co/PhD35TJ/avatar.jpg" alt="" class="avatar">
        <div class="right_content">
            <span class="title">This anime is incredible</span>
            <span class="extra_info"><span style="font-weight: bold;">Anibal</span> - 2025-10-25</span>
        </div>
    </div>
    <p class="content">The way this anime handles character growth is phenomenal. Every episode adds layers of depth to the protagonists, making their journey feel incredibly authentic and engaging. The animation quality is consistently outstanding, especially during the crucial emotional scenes...    </p>
</div>




<style>
    .container{
        margin-top: 20px;
        width: 400px;
        padding: 20px;
        border-radius: 10px;
        border: 1px solid #444;

        cursor: pointer;
        transition: 0.1s;
    }
    .container:hover{

        box-shadow: 4px 4px 0px black;


    }
    .container .top{
        display: flex;
        align-items: center;
    }
    .container .top .avatar{
        width: 50px;
        height: 50px;
        object-fit: cover;
        border-radius: 50%;
    }
    .container .top .right_content{
        margin-left: 20px;
        display: flex;
        flex-direction: column;
    }
    .container .top .right_content span.title{
        font-size: 20px;
        font-weight: bold;
        color: #333;
    }
    .container .top .right_content span.extra_info{
        font-weight: thin;
        color: #666;
    }
    .container .content{
        display: inline-block;
        margin-top: 10px;
        color: #444;
    }
</style>