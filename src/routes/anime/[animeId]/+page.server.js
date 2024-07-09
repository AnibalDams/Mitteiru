import axios from "axios"


export async function load({ cookies, params }) {
    let userId = cookies.get("userId")
    let status
    try{

    const anime = await axios(`http://localhost:8000/anime/${params.animeId}`)

  
    const episodes = await axios(`http://localhost:8000/anime/${params.animeId}/episode/all`)
    const similarAnimeId = (await axios(`http://localhost:8000/anime/${params.animeId}/similar`)).data.animes[0]
    let similarAnime = false
    if (similarAnimeId!== undefined) {
        similarAnime = (await axios(`http://localhost:8000/anime/${similarAnimeId[0]}`)).data.anime
    }
    return { status:200,userId, anime: anime.data.anime, genres: anime.data.genres, episodes: episodes.data.episodes,similarAnime}

    }catch(error){
        if (error.message==="Request failed with status code 404") {
            return {userId,status:404}
        }

    }

}