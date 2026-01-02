import axios from 'axios'
import {PUBLIC_API_URL} from "$env/static/public"

export async function load({cookies}){
    let userId = cookies.get("userId")
    let animesFetch = await axios(`${PUBLIC_API_URL}/anime/d/all`);
    let randomAnime = (await axios(`${PUBLIC_API_URL}/anime/d/random`)).data.animes
    let mostPopularAnimesFetch = await axios(
      `${PUBLIC_API_URL}/anime/d/mostpopular`
    );
    let getMostLikedAnimes = await axios(`${PUBLIC_API_URL}/anime/d/mostLiked`);
    return {userId, animes:animesFetch.data.animes, mostPopularAnimes: mostPopularAnimesFetch.data.animes, mostLikedAnimes:getMostLikedAnimes.data.animes, randomAnime}
}