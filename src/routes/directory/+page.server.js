import axios from 'axios'
export async function load({cookies}){
    let userId = cookies.get("userId")
    const decodedUser =  await axios.get(`http://localhost:8000/user/decode`, {
        headers:{
            Authorization: `Bearer ${userId}`
        }
    })
    return {userId:decodedUser.data.user}
}