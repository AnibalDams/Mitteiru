import axios from "axios"


export async function load({ params, cookies }) {
    let userId = cookies.get("userId")


    try {

        const episodeNumber = Number(params.episodeNumber)
        let episode ={}
        const allEpisodes = await axios(`http://localhost:8000/anime/${params.animeId}/episode/all`)
        console.log(episodeNumber)
        if (allEpisodes.data.episodes) {
            for (let i = 0; i < allEpisodes.data.episodes.length; i++) {
                const episodeI = allEpisodes.data.episodes[i];
                console.log(episodeI)
                if (episodeI.episode_number === episodeNumber) {
                    episode = episodeI
                }
                
            }            
        }
        const anime = await axios(`http://localhost:8000/anime/${params.animeId}`)
        console.log(episode)
        return {status:episode.status, userId, episode: episode, allEpisodes: allEpisodes.data.episodes, anime: anime.data.animes, animeId: params.animeId }



    } catch (error) {
        console.log(error)
        if(error.message ==="Request failed with status code 404"){
            return {userId,status:404}

        }
        
    }

}


