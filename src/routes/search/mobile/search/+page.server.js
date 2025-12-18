import axios from "axios";
 import {PUBLIC_API_URL} from "$env/static/public"


export async function load({cookies}) {
        let userId = cookies.get("userId")
    
    const animes = (await axios(`${PUBLIC_API_URL}/anime/d/all`)).data.animes;

    return {animes,userId}
}