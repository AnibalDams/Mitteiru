export async function load({cookies}){
    let userId = cookies.get("userId")

    return {userId}
}