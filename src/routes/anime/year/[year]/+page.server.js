import axios from "axios"


export async function load({params,cookies}) {
    const userId = cookies.get("userId")

   
    try {
        const animesOfAYear = await axios(`https://mitteiru-backend.onrender.com/anime/d/year/${params.year}`)
        
        

 

        return {year:params.year,animes:animesOfAYear.data.animes,userId,status:200}   

    } catch (error) {
        console.error(error)
        if (error.message==="Request failed with status code 404") {

            console.error(error.message)
            return {status:404,userId,studio:params.studio}
            
        }

    }


    return {genreName:params.genreName}   
}