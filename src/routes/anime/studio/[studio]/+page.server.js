import axios from "axios"


export async function load({params,cookies}) {
    const userId = cookies.get("userId")

   
    try {
        const animesOfAStudio = await axios(`http://localhost:8000/anime/d/studio/${params.studio}`)
        
        console.log(animesOfAStudio.data)

 

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