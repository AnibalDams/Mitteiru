import axios from "axios";
import { PUBLIC_API_URL } from "$env/static/public";

export async function load({ cookies, params }) {
  const start = performance.now();
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
    const fullData = await axios(`${PUBLIC_API_URL}/anime/${params.animeId}/fullDetails`);

    if (fullData.data.anime) {
      const randomnumber =
        Math.round(Math.random() * (fullData.data.similarAnime.animes.length - 1)) + 1 - 1;
      const similarAnime = fullData.data.similarAnime.animes[randomnumber];
      const end = performance.now();
      console.log(`Time taken: ${(end - start)/1000} seconds`);
      return {
        status: 200,
        userId,
        anime: fullData.data.anime.animes,
        genres: fullData.data.anime.animes.genres,
        episodes: fullData.data.episodes.episodes,
        reviews: fullData.data.reviews.reviews,
        profileLikes: fullData.data.likes.profiles,
        likes: fullData.data.likes.likesCount,
        characters: fullData.data.characters.characters,
        similarAnime,
      };
    } else {
      return {
        userId,
      };
    }
  } catch (error) {
    console.log(error)
    return {
      userId,
      error: true,
      errorMessage1: error.message,
      errorMessage2: error.response,
    };
  }
}
