import axios from 'axios'
export async function load({cookies, params}){
    let userId = cookies.get("userId")
    const decodedUser =  await axios.get(`http://localhost:8000/user/decode`, {
        headers:{
            Authorization: `Bearer ${userId}`
        }
    })
    const anime = await axios(`http://localhost:8000/anime/${params.animeId}`);

    return {userId:decodedUser.data.user, anime:anime.data.animes}
}