import type {Request,Response} from "express"
import { Anime } from "../../classes/animes";
import Episode from "../../classes/episodes";
import Character from "../../classes/characters";


export default async function animeFullDetails(req: Request, res: Response){
    try {
        const animeId = req.params.animeId;
        const anime = await new Anime(animeId).getById(true);
        const likes = await new Anime(animeId).getLikes();
        const episodes = await Episode.getAll(animeId);
        const similarAnime = await new Anime(animeId).getSimilar();
        const characters = await Character.getCharacterOfAnAnime(animeId);
        const reviews = await new Anime(animeId).getAllReviews();
        switch(anime.message){
            case "anime found":
                res.statusCode = 200;
                res.json({anime, likes, episodes, similarAnime, characters, reviews});
                break;
            case "no anime found":
                res.statusCode = 404;
                res.json(anime);
                break;
            case "An error has occurred while getting the animes":
                res.statusCode = 500;
                res.json(anime);
                break
            
        }

        
    } catch (error:any) {
        res.statusCode = 500;
        res.json({message: "There was an error", error: error.message})
    
    }
}