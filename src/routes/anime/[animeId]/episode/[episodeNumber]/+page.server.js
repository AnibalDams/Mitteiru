import axios from "axios";

export async function load({ params, cookies }) {
  let userId = cookies.get("userId");

  try {
    let comments = [];
    let commentsLikes = [];
    const episodeNumber = Number(params.episodeNumber);
    let episode = {};
    const allEpisodes = await axios(
      `http://localhost:8000/anime/${params.animeId}/episode/all`
    );
    if (allEpisodes.data.episodes) {
      for (let i = 0; i < allEpisodes.data.episodes.length; i++) {
        const episodeI = allEpisodes.data.episodes[i];

        if (episodeI.episodeNumber === episodeNumber) {
          episode = episodeI;
        }
      }
      comments = await axios(
        `http://localhost:8000/anime/episode/${episode._id}/comment/all`
      );
      commentsLikes = await axios(
        `http://localhost:8000/anime/episode/${episode._id}/comment/likes/all`
      );
      console.log(commentsLikes.data);
    }

    const anime = await axios(`http://localhost:8000/anime/${params.animeId}`);
    return {
      status: episode.status,
      userId,
      episode: episode,
      comments: comments.data.comments,
      commentsLikes: commentsLikes.data,
      allEpisodes: allEpisodes.data.episodes,
      anime: anime.data.animes,
      animeId: params.animeId,
    };
  } catch (error) {
    console.log(error);
    if (error.message === "Request failed with status code 404") {
      return { userId, status: 404 };
    }
  }
}
