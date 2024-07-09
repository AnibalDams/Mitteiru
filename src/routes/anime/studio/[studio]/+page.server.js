import axios from "axios";

export async function load({ params, cookies }) {
  const userId = cookies.get("userId");

  try {
    const animesOfAStudio = await axios(
      `http://localhost:8000/anime/studio/${params.studio}`
    );

    return {
      studio: params.studio,
      animes: animesOfAStudio.data.animes,
      userId,
      status: 200,
    };
  } catch (error) {
    if (error.message === "Request failed with status code 404") {
      console.error(error.message);
      return { status: 404, userId, studio: params.studio };
    }
  }

  return { genreName: params.genreName };
}
