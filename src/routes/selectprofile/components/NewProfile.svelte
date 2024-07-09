<script>
  export let onClick;
</script>

<button type="button" on:click={onClick}> + </button>

<style>
  button {
    width: 200px;
    height: 200px;
    font-size: 25px;

    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 5px;
    cursor: pointer;
    background: rgba(202, 202, 202, 0.308);
    outline: none;
    border: none;
    transition: 0.1s;
  }
  button:hover {
    box-shadow: 4px 4px 0px black;
    border: 1px solid black;
  }
</style>
