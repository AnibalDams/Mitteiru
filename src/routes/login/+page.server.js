import { redirect, fail } from "@sveltejs/kit";
import axios from "axios";

export async function load({ cookies }) {
  let userId = cookies.get("userId");

  return { userId };
}

export const actions = {
  login: async ({ request, cookies }) => {
    const formData = await request.formData();

    const email = formData.get("email");
    const password = formData.get("password");

    const loginQuery = await axios.post("https://mitteiru-backend.onrender.com/user/login", {
      email,
      password,
      admin: true,
    });
    if (loginQuery.data.message === "Invalid Email" || loginQuery.data.message ==="Invalid Password") {
      return fail(400, { error: true });
    }
    cookies.set("userId", loginQuery.data.user, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
    });
    redirect(302, `/selectprofile`);
  },
};
