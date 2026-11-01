import type { NextFunction, Request, Response } from "express";
import EpisodeLearningProgress from "../../classes/EpisodeLearningProgress";
import { currentUser } from "../../libs/auth";
import { requireOwnedProfile } from "../../libs/ownership";


export default async function addEpisodeLearningProgress(req:Request, res:Response, next: NextFunction){
    try {
        const {animeId, episodeId,profileId} = req.params
        const {notes,score,understandingDegree}= req.body
        const user = currentUser(res)
        await requireOwnedProfile(profileId, user.sub)
        const add = await new EpisodeLearningProgress(episodeId, animeId,profileId, score,notes,understandingDegree).add() 
        res.statusCode = add.statusCode??200
        res.json(add)
    } catch (error) {
        next(error)
    }
}