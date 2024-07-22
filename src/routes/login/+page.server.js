import { redirect, fail } from "@sveltejs/kit";
import axios from "axios";

export async function load({ cookies }) {
  let userId = cookies.get("userId");
  console.log(userId);
  return { userId };
}

export const actions = {
  login: async ({ request, cookies }) => {
    const formData = await request.formData();

    const email = formData.get("email");
    const password = formData.get("password");

    const loginQuery = await axios.post("http://localhost:8000/user/login", {
      email,
      password,
      admin: true,
    });
    if (loginQuery.data.message === "Invalid email or password") {
      return fail(400, { error: true });
    }
    cookies.set("userId", loginQuery.data.user.id, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
    });
    redirect(302, `/selectprofile`);
  },
};