import axios from 'axios'
 import {PUBLIC_API_URL} from "$env/static/public"

export async function load({cookies}){
    let userId = cookies.get("userId")
    let getAnimes = await axios(`${PUBLIC_API_URL}/anime/d/all`);
    let animes = getAnimes.data.animes.sort((a, b) => b.createdAt - a.createdAt);
    return {userId:userId, animes}
}