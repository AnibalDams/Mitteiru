import axios from 'axios'
 import {PUBLIC_API_URL} from "$env/static/public"

export async function load({cookies}){
    let userId = cookies.get("userId")
    let getAnimes = await axios(`${PUBLIC_API_URL}/anime/d/all`);
    let animes = getAnimes.data.animes.sort((a, b) => b.createdAt - a.createdAt);

    const decodedUser =  await axios.get(`${PUBLIC_API_URL}/user/decode`, {
        headers:{
            Authorization: `Bearer ${userId}`
        }
    })
    return {userId:decodedUser.data.user, animes}
}