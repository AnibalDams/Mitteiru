import axios from 'axios'
export async function load({cookies, params}){
    let userId = cookies.get("userId")


    try {
        const decodedUser =  await axios.get(`https://mitteiru-backend.onrender.com/user/decode`, {
            headers:{
                Authorization: `Bearer ${userId}`
            }
        })
        const review = await axios(`https://mitteiru-backend.onrender.com/anime/${params.animeId}/review/${params.reviewId}`);
        const anime = await axios(`https://mitteiru-backend.onrender.com/anime/${params.animeId}`);
    
        return {userId:decodedUser.data.user, review:review.data.reviews, anime:anime.data.animes}
    } catch (error) {
        return {error:true, userId:userId, errorMessage:error.message}
    }
}