import axios from 'axios'

export async function load({cookies}){
    let userId = cookies.get("userId")
    const decodedUser =  await axios.get(`https://mitteiru-backend.onrender.com/user/decode`, {
        headers:{
            Authorization: `Bearer ${userId}`
        }
    })
    return {userId:decodedUser.data.user}
}