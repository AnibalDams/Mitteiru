import { ObjectId } from "mongodb";

export default interface EpisodeLearningProgress {
    _id?:string|ObjectId
    episodeId:string|ObjectId
    animeId:string|ObjectId
    profileId:string|ObjectId
    score:number
    notes:string
    understandingDegree:number   
    createdAt:Date
    updatedAt:Date
}