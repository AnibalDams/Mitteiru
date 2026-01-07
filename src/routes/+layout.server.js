import axios from "axios";
import { PUBLIC_API_URL } from "$env/static/public";

export async function load({ cookies }) {
  try {
    let userId = cookies.get("userId");
    if (userId) {
      const decodedUser = await axios.get(`${PUBLIC_API_URL}/user/decode`, {
        headers: {
          Authorization: `Bearer ${userId}`,
        },
      });
      if (decodedUser.status != 200) {
        return { userId: { user: { _id: "" } } };
      }
      return {
        userId: decodedUser.data.user
          ? decodedUser.data.user
          : { user: { _id: "" } },
      };
    }
    return { userId: { user: { _id: "" } } };
  } catch (error) {
    return { userId: { user: { _id: "" } } };
  }
}
