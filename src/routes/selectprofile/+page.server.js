import axios from 'axios'
 import {PUBLIC_API_URL} from "$env/static/public"

export async function load({cookies}){
    let userId = cookies.get("userId")
    let decodedUser = await axios.get(`${PUBLIC_API_URL}/user/decode`, {
        headers:{
            Authorization: `Bearer ${userId}`
        }
    })
    return {userId:decodedUser.data.user}
}