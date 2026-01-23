<script>
  // Export props for customization
  export let min = 0;
  export let max = 100;
  export let step = 1;
  export let value = 0; // Use 'value' to bind externally

  // Reactive statement to calculate progress percentage
  // The value will update automatically when 'value', 'min', or 'max' changes
  $: progress = ((value - min) / (max - min)) * 100;
</script>

<div class="range-container">
  <input
    type="range"
    {min}
    {max}
    {step}
    bind:value={value}
    style="--progress: {progress}%;"
    aria-label="Progress Slider"
  />
  <span class="value-display">{value}%</span>
</div>

<style>
  .range-container {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    max-width: 400px;
  }

  input[type="range"] {
    width: 100%;
    /* Use CSS variable to dynamically set background progress */
    background: linear-gradient(to right, #222222 var(--progress), #ddd var(--progress));
    /* Remove default styling for better cross-browser consistency */
    -webkit-appearance: none;
    height: 8px; /* Track height */
    border-radius: 5px;
    outline: none;
    transition: background 0.2s ease-in-out;
  }

  /* Styling for the thumb (Webkit/Blink) */
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    background: black;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
  }

  /* Styling for the thumb (Firefox) */
  input[type="range"]::-moz-range-thumb {
    width: 20px;
    height: 20px;
    background: black;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
  }

  .value-display {
    min-width: 30px;
    text-align: right;
    font-weight: bold;
  }
</style>
