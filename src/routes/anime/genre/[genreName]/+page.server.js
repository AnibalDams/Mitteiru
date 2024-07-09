import axios from "axios"


async function getTenGenres(){
    try {
        let tenGenres = []
        const allGenres = await axios("http://localhost:8000/anime/genre/all")
        if(allGenres.status===200){
        
            for (let i = 0; i < allGenres.data.genres.length; i++) {
                const element = allGenres.data.genres[i][1];
                
                if (tenGenres.length<=10) {
                    tenGenres.push(element)
                }
            }
        return tenGenres
        }
    } catch (error) {
        console.error(error.message)
    }
}

export async function load({params,cookies}) {
    const userId = cookies.get("userId")

   
    try {
        const animesWithTheGenre = await axios(`http://localhost:8000/anime/genre/${params.genreName}`)
        

        const tenGenres = await getTenGenres()



        return {genreName:params.genreName,animes:animesWithTheGenre.data.animes,userId,tenGenres,status:200}   

    } catch (error) {

        if (error.message==="Request failed with status code 404") {
            const tenGenres = await getTenGenres()

            console.error(error.message)
            return {status:404,userId,genreName:params.genreName,tenGenres}
            
        }

    }


    return {genreName:params.genreName}   
}