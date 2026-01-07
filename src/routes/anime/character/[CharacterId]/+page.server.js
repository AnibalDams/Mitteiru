import axios from "axios";
import { PUBLIC_API_URL } from "$env/static/public";

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
    const character = await axios(
      `${PUBLIC_API_URL}/character/${params.CharacterId}`
    );
    if (character.data.characters) {
      const relatedAnimes = await axios(
        `${PUBLIC_API_URL}/character/${params.CharacterId}/relatedAnimes`
      );
      character.data.characters.relatedAnimes = relatedAnimes.data.animes;
      return {
        status: 200,
        userId,
        character: character.data.characters,
      };
    } else {
      return {
        userId,
      };
    }
  } catch (error) {
    return {
      userId,
      error: true,
      errorMessage1: error.message,
      errorMessage2: error.response.data.error,
    };
  }
}
