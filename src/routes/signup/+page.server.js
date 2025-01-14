import { redirect, fail } from "@sveltejs/kit";
import axios from "axios";
import { setCookie, getCookie } from "svelte-cookie";

export async function load({ cookies }) {
  let userId = cookies.get("userId");

  return { userId };
}

export const actions = {
  signup: async ({ request, cookies }) => {
    const formData = await request.formData();

    const username = formData.get("username");
    const email = formData.get("email");
    const password = formData.get("password");

    const signupQuery = await axios.post("http://localhost:8000/user/new", {
      username,
      email,
      password,
      admin: true,
    });
    if (signupQuery.data.message === "Username already used") {
      return fail(400, { username: true });
    } else if (signupQuery.data.message === "email already used") {
      return fail(400, { email: true });
    }
    const user = await axios.post("http://localhost:8000/user/login", {
      email,
      password,
    });
    cookies.set("userId", user.data.user, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
    });
    redirect(302, `/selectprofile`);
  },
};
