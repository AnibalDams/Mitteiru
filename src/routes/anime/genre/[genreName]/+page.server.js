import axios from "axios";
 import {PUBLIC_API_URL} from "$env/static/public"
async function getTenGenres() {
  try {
    let tenGenres = [];
    const allGenres = await axios(`${PUBLIC_API_URL}/anime/genre/d/all`);
    if (allGenres.status === 200) {
      for (let i = 0; i < allGenres.data.genres.length; i++) {
        const genre = allGenres.data.genres[i].name;
        tenGenres.push(genre);

      }
      return tenGenres;
    }
  } catch (error) {
    console.error(error.message);
  }
}

export async function load({ params, cookies }) {
  const userId = cookies.get("userId");

  try {
    const animesWithTheGenre = await axios(
      `${PUBLIC_API_URL}/anime/genre/${params.genreName}`
    );

    const tenGenres = await getTenGenres();

    return {
      genreName: params.genreName,
      animes: animesWithTheGenre.data.animes,
      userId,
      tenGenres,
      status: 200,
    };
  } catch (error) {
    if (error.message === "Request failed with status code 404") {
      const tenGenres = await getTenGenres();

      console.error(error.message);
      return { status: 404, userId, genreName: params.genreName, tenGenres };
    }
  }

  return { genreName: params.genreName };
}
