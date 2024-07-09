<script>
  export let variant = "primary";
  export let marginLeft = 0;
  export let marginRight = 0;
  export let type = "button";

  export let onClick = () => {};
</script>

<button
  {type}
  class={`button ${variant === "primary" ? "button_primary" : variant === "light" ? "button_light" : "button_primary"}`}
  style={`margin-left:${marginLeft}; margin-right:${marginRight} `}
  on:click={onClick}
>
  <span
    class="button_text"
    style={`color:${variant === "primary" ? "white" : variant === "light" ? "black" : "white"};`}
    ><slot /></span
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
    border: none;
  }
  .button .button_text {
    font-weight: bold;
    font-size: 14px;
  }
  .button_primary:hover {
    box-shadow: 4px 4px 0px black;
  }

  .button_light {
    padding: 10px 20px 10px 20px;
    background-color: white;
    border: 1px solid black;
    box-shadow: 0px 0px 1.5px black;
    border-radius: 5px;
    cursor: pointer;
    transition: 0.1s;
  }
  .button_light:hover {
    box-shadow: 4px 4px 0px black;
  }
</style>
