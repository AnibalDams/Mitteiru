import axios from 'axios'
export async function load({cookies, params}){
    let userId = cookies.get("userId")
    const decodedUser =  await axios.get(`https://mitteiru-backend.onrender.com//user/decode`, {
        headers:{
            Authorization: `Bearer ${userId}`
        }
    })
    const anime = await axios(`https://mitteiru-backend.onrender.com//anime/${params.animeId}`);

    return {userId:decodedUser.data.user, anime:anime.data.animes}
}