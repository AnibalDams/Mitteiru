import axios from "axios";

export async function load({ params, cookies }) {
  let userId = cookies.get("userId");

  try {
    const episode = await axios(
      `http://localhost:8000/anime/${params.animeId}/episode/${params.episodeNumber}`
    );

    const allEpisodes = await axios(
      `http://localhost:8000/anime/${params.animeId}/episode/all`
    );
    const anime = await axios(`http://localhost:8000/anime/${params.animeId}`);
    return {
      status: episode.status,
      userId,
      episode: episode.data,
      allEpisodes: allEpisodes.data.episodes,
      anime: anime.data.anime,
      animeId: params.animeId,
    };
  } catch (error) {
    if (error.message === "Request failed with status code 404") {
      return { userId, status: 404 };
    }
  }
}
