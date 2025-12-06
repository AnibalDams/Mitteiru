import axios from 'axios'

export async function load({cookies}){
    let userId = cookies.get("userId")
    let animesFetch = await axios("https://mitteiru-backend.onrender.com//anime/d/all");
    let mostPopularAnimesFetch = await axios(
      "https://mitteiru-backend.onrender.com//anime/d/mostpopular"
    );
    let getMostLikedAnimes = await axios("https://mitteiru-backend.onrender.com//anime/d/mostLiked");
    return {userId, animes:animesFetch.data.animes, mostPopularAnimes: mostPopularAnimesFetch.data.animes, mostLikedAnimes:getMostLikedAnimes.data.animes}
}