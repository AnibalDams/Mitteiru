import axios from 'axios'

export async function load({cookies}){
    let userId = cookies.get("userId")
    let animesFetch = await axios("http://localhost:8000/anime/d/all");
    let mostPopularAnimesFetch = await axios(
      "http://localhost:8000/anime/d/mostpopular"
    );
    let getMostLikedAnimes = await axios("http://localhost:8000/anime/d/mostLiked");
    return {userId, animes:animesFetch.data.animes, mostPopularAnimes: mostPopularAnimesFetch.data.animes, mostLikedAnimes:getMostLikedAnimes.data.animes}
}