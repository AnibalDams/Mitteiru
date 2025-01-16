import axios from "axios";

export async function load({ cookies, params }) {
  let userId = cookies.get("userId");

  
  if (userId && userId.length > 0) {
    const decodedUser = await axios.get(`http://localhost:8000/user/decode`, {
      headers: {
        Authorization: `Bearer ${userId}`,
      },
    });
    userId = decodedUser.data.user;
  }
  try {
    const anime = await axios(`http://localhost:8000/anime/${params.animeId}`);
    if (anime.data.animes) {
      const episodes = await axios(
        `http://localhost:8000/anime/${params.animeId}/episode/all`
      );
      const similarAnimes = (
        await axios(`http://localhost:8000/anime/${params.animeId}/similar`)
      ).data.animes;
  
      const randomnumber =
        Math.round(Math.random() * (similarAnimes.length - 1)) + 1 - 1;
      const similarAnime = similarAnimes[randomnumber];
      return {
        status: 200,
        userId,
        anime: anime.data.animes,
        genres: anime.data.genres,
        episodes: episodes.data.episodes,
        similarAnime,
      };
    } else {
      return {userId}
    }
  } catch (error) {
    return {userId, error:true, errorMessage1:error.message, errorMessage2:error.response.data.error}
  }
}
