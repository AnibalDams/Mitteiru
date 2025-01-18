<script>
    export let title 
    export let name
    export let avatar
    export let date
    export let content
</script>


<div class="container">
    <div class="top">
        <img src={avatar} alt="" class="avatar">
        <div class="right_content">
            <span class="title">{title}</span>
            <span class="extra_info"><span style="font-weight: bold;">{name}</span> - {date}</span>
        </div>
    </div>
    <p class="content">{content.length>=276?content.substring(0,273)+ "...":content} </p>
</div>




<style>
    .container{
        margin-top: 20px;
        margin-left: 25px;
        height: 214px;
        width: 400px;
        padding: 20px;
        border-radius: 10px;

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