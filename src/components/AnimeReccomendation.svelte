<script>
  import Button from './Button.svelte'
  import GenreShip from './GenreShip.svelte';
import { goto } from "$app/navigation";

  export let animeData =[]
  export let animeGenres=[]

</script>


<div class="container" style={`background-image: linear-gradient(to top, #fff, transparent),linear-gradient(to bottom, #fff, transparent), url('http://localhost:8000/static/${animeData[6]}');`}>
  <div class="content">
      <h1 class="content_title">{animeData[1]}</h1>
      <div class="content_genres">
          {#each animeGenres as genre}
          <GenreShip genre={genre[1]}/>
              
          {/each}

       </div>
       <p class="content_description">{animeData[2]}</p>
       <div class="content_buttons">
          <Button variant="light" marginRight={"5px"} onClick={()=>{goto(`/anime/${animeData[0]}/episode/1`)}}>Watch now</Button>
          <Button onClick={()=>goto(`/anime/${animeData[0]}`)}>More details</Button>
       </div>
  
      </div>

</div>


<style>
  
  .container{
      width: 100%;
      height: 500px;
      background-position: center;
      background-size: cover;
      display:flex;
      justify-content: flex-start;
      align-items: center;
  }
  h1.content_title{
      font-size: 2.5rem;
  }
  .container .content{
      margin: 10px;
      display: flex;
      flex-direction: column;
      max-width: 60%;
  }
  .container .content .content_genres{
      margin-top:15px;
      margin-bottom:25px;
  }

  .container .content .content_description{
      font-size: 18px;
      font-weight: 500;
      color: #111;
  }
  .container .content .content_buttons{
      margin-top: 20px;
      display: flex;
  }
</style>