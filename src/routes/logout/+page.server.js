import { redirect } from "@sveltejs/kit";

export const load = async ({ cookies }) => {
  cookies.set("userId", undefined, {
    path: "/",
    expires: new Date(0),
  });
};
