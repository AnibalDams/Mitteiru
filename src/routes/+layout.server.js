


export async function load({ cookies }) {
  try {
    let userId = cookies.get("userId");
  
    return { userId };
  } catch (error) {
    return { userId: { user: { _id: "" } } };
  }
}
