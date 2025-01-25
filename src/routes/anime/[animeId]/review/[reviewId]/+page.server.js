import axios from 'axios'
export async function load({cookies, params}){
    let userId = cookies.get("userId")


    try {
        const decodedUser =  await axios.get(`http://localhost:8000/user/decode`, {
            headers:{
                Authorization: `Bearer ${userId}`
            }
        })
        const review = await axios(`http://localhost:8000/anime/${params.animeId}/review/${params.reviewId}`);
        const anime = await axios(`http://localhost:8000/anime/${params.animeId}`);
    
        return {userId:decodedUser.data.user, review:review.data.reviews, anime:anime.data.animes}
    } catch (error) {
        return {error:true, userId:userId, errorMessage:error.message}
    }
}