import axios from "axios"


export async function load({ cookies, params }) {
    let userId = cookies.get("userId")
    try{
    const anime = await axios(`https://mitteiru-backend.onrender.com/anime/${params.animeId}`)
    const episodes = await axios(`https://mitteiru-backend.onrender.com/anime/${params.animeId}/episode/all`)
    const similarAnimes = (await axios(`https://mitteiru-backend.onrender.com/anime/${params.animeId}/similar`)).data.animes
    const randomnumber = (Math.round(Math.random() * (similarAnimes.length - 1)) + 1)-1;
    const similarAnime = similarAnimes[randomnumber]
    return { status:200,userId, anime: anime.data.animes, genres: anime.data.genres,episodes: episodes.data.episodes, similarAnime}
    }catch(error){
        if (error.message==="Request failed with status code 404") {
            return {userId,status:404}
        }

    }

}