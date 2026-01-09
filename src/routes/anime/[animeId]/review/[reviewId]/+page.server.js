import axios from 'axios'
 import {PUBLIC_API_URL} from "$env/static/public"
export async function load({cookies, params}){
    let userId = cookies.get("userId")


    try {
        const review = await axios(`${PUBLIC_API_URL}/anime/${params.animeId}/review/${params.reviewId}`);
        const anime = await axios(`${PUBLIC_API_URL}/anime/${params.animeId}`);
    
        return {userId, review:review.data.reviews, anime:anime.data.animes}
    } catch (error) {
        return {error:true, userId:userId, errorMessage:error.message}
    }
}