<script >
    export let variant = "primary";
    export let marginLeft = 0
    export let marginRight = 0
    export let type="button"
    let button
    
    export let onClick = ()=>{}
</script>

<button
    type={type}
    class={`button ${variant === "primary" ? "button_primary" : variant === "light" ? "button_light" :variant ==="primaryMobile" ? "button_primary_mobile":variant ==="lightMobile" ?"button_light_mobile" :"button_primary"}`}
    style={`margin-left:${marginLeft}; margin-right:${marginRight} `}
    on:click={onClick}

    >
    <span
        class="button_text"
        style={`color:${variant.substring(0,7) === "primary" ? "white" : variant.substring(0,5) === "light" ? "black" : "white"};`}
        ><slot/></span
    >
</button>

<style>
    .button_primary {
        padding: 10px 20px 10px 20px;
        background-color: black;
        border-radius: 5px;
        cursor: pointer;
        transition: 0.1s;
        outline: none;
        border:none;
    }
    .button .button_text {
        font-weight: bold;
        font-size: 15px;
    }
    
    .button_primary:hover {
        box-shadow: 4px 4px 0px black;
    }
    .button_primary_mobile{
        padding: 10px 15px 10px 15px;
        background-color: black;
        border-radius: 5px;
        cursor: pointer;
        transition: 0.1s;
        outline: none;
        border:none;
    }
    .button_primary_mobile:hover{
        opacity: 0.5;
    }
    .button_light {
        padding: 10px 20px 10px 20px;
        background-color: white;
        border:1px solid black;
        box-shadow: 0px 0px 1.5px black;
        border-radius: 5px;
        cursor: pointer;
        transition: 0.1s;
    }
    .button_light:hover{
        box-shadow: 4px 4px 0px black;
    }
    .button_light_mobile{
        padding: 10px 15px 10px 15px;

        background-color: white;
        border:1px solid black;
        box-shadow: 0px 0px 1.5px black;
        border-radius: 5px;
        cursor: pointer;
        transition: 0.1s;
    

    }
    .button_light_mobile:hover{
        opacity: 0.5;
    }
</style>
