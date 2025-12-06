import axios from "axios";

export async function load({ cookies, params }) {
  let userId = cookies.get("userId");

  
  if (userId && userId.length > 0) {
    const decodedUser = await axios.get(`https://mitteiru-backend.onrender.com/user/decode`, {
      headers: {
        Authorization: `Bearer ${userId}`,
      },
    });
    userId = decodedUser.data.user;
  }
  try {
    const anime = await axios(`https://mitteiru-backend.onrender.com/anime/${params.animeId}`);
    if (anime.data.animes) {
      const episodes = await axios(
        `https://mitteiru-backend.onrender.com/anime/${params.animeId}/episode/all`
      );
      const similarAnimes = (
        await axios(`https://mitteiru-backend.onrender.com/anime/${params.animeId}/similar`)
      ).data.animes;
      const getReview = await axios(`https://mitteiru-backend.onrender.com/anime/${params.animeId}/review/all`)
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
