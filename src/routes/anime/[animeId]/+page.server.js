import axios from "axios";
import { get } from "svelte/store";
import {PUBLIC_API_URL} from "$env/static/public"

export async function load({ cookies, params }) {
  let userId = cookies.get("userId");

  
  if (userId && userId.length > 0) {
    const decodedUser = await axios.get(`${PUBLIC_API_URL}/user/decode`, {
      headers: {
        Authorization: `Bearer ${userId}`,
      },
    });
    userId = decodedUser.data.user;
  }
  try {
    const anime = await axios(`${PUBLIC_API_URL}/anime/${params.animeId}`);
    if (anime.data.animes) {
          let getLikes = await axios(
      `${PUBLIC_API_URL}/anime/${params.animeId}/likes/count`,
    );
      const episodes = await axios(
        `${PUBLIC_API_URL}/anime/${params.animeId}/episode/all`
      );
      const similarAnimes = (
        await axios(`${PUBLIC_API_URL}/anime/${params.animeId}/similar`)
      ).data.animes;
      const getReview = await axios(`${PUBLIC_API_URL}/anime/${params.animeId}/review/all`)
      const randomnumber =
        Math.round(Math.random() * (similarAnimes.length - 1)) + 1 - 1;
      const similarAnime = similarAnimes[randomnumber];
      return {
        status: 200,
        userId,
        anime: anime.data.animes,
        genres: anime.data.genres,
        episodes: episodes.data.episodes,
        reviews:getReview.data.reviews,
        profileLikes: getLikes.data.profiles,
        likes:getLikes.data.likesCount,
        similarAnime,
      };
    } else {
      return {
        
        userId}
    }
  } catch (error) {
    return {userId, error:true, errorMessage1:error.message, errorMessage2:error.response.data.error}
  }
}
