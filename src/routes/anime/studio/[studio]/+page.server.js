import axios from "axios"

 import {PUBLIC_API_URL} from "$env/static/public"


export async function load({params,cookies}) {
    const userId = cookies.get("userId")

   
    try {
        const animesOfAStudio = await axios(`${PUBLIC_API_URL}/anime/d/studio/${params.studio}`)
        

 

        return {studio:params.studio,animes:animesOfAStudio.data.animes,userId,status:200}   

    } catch (error) {
        console.error(error)
        if (error.message==="Request failed with status code 404") {

            console.error(error.message)
            return {status:404,userId,studio:params.studio}
            
        }

    }


    return {genreName:params.genreName}   
}