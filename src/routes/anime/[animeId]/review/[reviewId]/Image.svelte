<script>
    export let href = "";
    export let title = undefined;
    export let text = "";
  </script>
  
  <img
    src={href}
    {title}
    alt={text}
  />


  <style>
    img{
        max-width: 100%;
        object-fit: cover;
        
        padding-top: 20px;
        padding-bottom: 20px;
    }
  </style>