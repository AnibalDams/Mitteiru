import axios from 'axios'
import {PUBLIC_API_URL} from "$env/static/public"
export async function load({cookies, params}){
    let userId = cookies.get("userId")
    const decodedUser =  await axios.get(`${PUBLIC_API_URL}/user/decode`, {
        headers:{
            Authorization: `Bearer ${userId}`
        }
    })
    const anime = await axios(`${PUBLIC_API_URL}/anime/${params.animeId}`);

    return {userId:decodedUser.data.user, anime:anime.data.animes}
}