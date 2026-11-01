import dbClient from "../libs/dbClient";
import { Anime } from "./animes";
import type { Episode as IEpisode } from "./interfaces/Episodes";
import type ReturnData from "../libs/types/returnData";
import { ObjectId } from "mongodb";
import externalCheck from "../libs/externalChecker";
import { redactEpisodeForPublicApi } from "../libs/playbackPolicy";

const episodeCollection = dbClient.collection<IEpisode>("episodes");

export default class Episode {
  id: string;
  name: string;
  episodeNumber: number;
  thumbnail: string;
  synopsis: string;
  link: string;
  animeId: string;
  profileId:string
  isGlobal:boolean

  constructor(
    id: string = "",
    name: string = "",
    episodeNumber: number = 0,
    thumbnail: string = "",
    synopsis: string = "",
    link: string = "",
    animeId: string = "",
    profileId:string = "",
    isGlobal:boolean = false

  ) {
    this.id = id;
    this.name = name;
    this.episodeNumber = episodeNumber;
    this.synopsis = synopsis;
    this.thumbnail = thumbnail;
    this.link = link;
    this.animeId = animeId;
    this.profileId = profileId
    this.isGlobal = isGlobal
  }
  static async checkEpisode(episideId:any):Promise<boolean>{
    try {
      const episode = await episodeCollection.findOne({_id:new ObjectId(episideId)})
      if (!episode) {
        return false
      }
      return true       
    } catch (error:any) {
      console.error(error)
      return false
    }
  }
  async new(): Promise<ReturnData> {
    try {
      let type = this.link.split(".")[this.link.split(".").length - 1];
      let externalVideo = externalCheck(type);

      const doesTheAnimeExist = await new Anime(this.animeId).getById();

      if (!doesTheAnimeExist.animes) {
        return { message: "The anime does not exist" };
      } else {
        const verifyEpisode = await episodeCollection.findOne({
          episodeNumber: this.episodeNumber,
          animeId: new ObjectId(this.animeId),
        });

        if (verifyEpisode != null) {
          await episodeCollection.findOneAndUpdate(
            { _id: verifyEpisode._id },
            {
              $set: {
                name: this.name,
                synopsis: this.synopsis,
                thumbnail: this.thumbnail,
                link: this.link,
                external: externalVideo,
              },
            },
          );

          return { message: "The episode was added to the anime" };
        }

        await episodeCollection.insertOne({
          name: this.name,
          synopsis: this.synopsis,
          thumbnail: this.thumbnail,
          link: this.link,
          animeId: new ObjectId(this.animeId),
          episodeNumber: this.episodeNumber,
          external: externalVideo,
          profileId:this.profileId,
          isGlobal:this.isGlobal
        });

        return { message: "The episode was added to the anime" };
      }
    } catch (error: any) {
      console.error(error);
      return {
        message: "An error has occurred while adding the episode",
        error: error.message,
      };
    }
  }

  static async getAll(animeId:string): Promise<ReturnData> {
    try {
      const doesTheAnimeExist = await new Anime(animeId).getById();
      if (!doesTheAnimeExist.animes) {
        return { message: "The anime does not exist" };
      }
      const episodes = await episodeCollection
        .find({ animeId: new ObjectId(animeId) })
        .toArray();
      return {
        message: "success",
        episodes: episodes.map((episode) => redactEpisodeForPublicApi(episode)),
      };
    } catch (error: any) {
      return {
        message: "An error has occurred while getting the episodes",
        error: error.message,
      };
    }
  }
  async newComment(
    profileId: string,
    content: string,
    profileName: string,
    profileImage: string,
  ): Promise<ReturnData> {
    try {
      const episode = await episodeCollection.findOne({
        _id: new ObjectId(this.id),
      });
      if (!episode) {
        return { message: "The episode does not exist" };
      }
      await dbClient.collection("comments").insertOne({
        date: new Date().getTime(),
        profileId: profileId,
        content: content,
        profileName: profileName,
        profileImage: profileImage,
        episodeId: new ObjectId(this.id),
      });
      return { message: "Comment added successfully" };
    } catch (error: any) {
      return {
        message: "An error has occurred while adding the comment",
        error: error.message,
      };
    }
  }
  async getComments(): Promise<ReturnData> {
    try {
      const episode = await episodeCollection.findOne({
        _id: new ObjectId(this.id),
      });
      if (!episode) {
        return { message: "The episode does not exist" };
      }
      const comments = await dbClient
        .collection("comments")
        .find({ episodeId: new ObjectId(this.id) })
        .sort({ date: -1 })
        .limit(200)
        .toArray();
      return { message: "success", comments: comments };
    } catch (error: any) {
      return {
        message: "An error has occurred while getting the comments",
        error: error.message,
      };
    }
  }
  async addLikeToComment(
    commentId: string,
    profileId: string,
  ): Promise<ReturnData> {
    try {
      if (!ObjectId.isValid(commentId) || !ObjectId.isValid(profileId)) {
        return { message: "The comment does not exist" };
      }

      // El comentario debe pertenecer al episodio de la URL. Evita crear
      // likes con un episodeId arbitrario y comentarios de otro episodio.
      const comment = await dbClient
        .collection("comments")
        .findOne({
          _id: new ObjectId(commentId),
          episodeId: new ObjectId(this.id),
        });
      if (!comment) {
        return { message: "The comment does not exist" };
      }
      const profile = await dbClient
        .collection("profiles")
        .findOne({ _id: new ObjectId(profileId) });
      if (!profile) {
        return { message: "The profile does not exist" };
      }
      const like = await dbClient.collection("commentLikes").findOne({
        commentId: new ObjectId(commentId),
        profileId: new ObjectId(profileId),
      });
      if (like) {
        await dbClient.collection("commentLikes").deleteOne({ _id: like._id });
        return { message: "The like was removed successfully" };
      }
      await dbClient.collection("commentLikes").insertOne({
        date: new Date().getTime(),
        commentId: new ObjectId(commentId),
        episodeId: new ObjectId(this.id),
        profileId: new ObjectId(profileId),
      });
      return { message: "The like was added successfully" };
    } catch (error: any) {
      return {
        message: "An error has occurred while adding the like to the comment",
        error: error.message,
      };
    }
  }
  async getLikesOfAComment(): Promise<ReturnData> {
    try {
      const commentsLikes = await dbClient
        .collection("commentLikes")
        .find({ episodeId: new ObjectId(this.id) })
        .toArray();
      return {
        message: "Success",
        likesCount: commentsLikes.length,
        commentsLikes: commentsLikes,
      };
    } catch (error: any) {
      return {
        message: "An error has occurred while getting the likes",
        error: error.message,
      };
    }
  }

  static async update(id: string, data: IEpisode): Promise<ReturnData> {
    try {
      const verifyEpisode = await episodeCollection.findOne({
        _id: new ObjectId(id),
      });
      if (!verifyEpisode) {
        return { message: "The episode does not exist" };
      }
      await episodeCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: data },
      );
      return { message: "The episode was updated successfully" };
    } catch (error: any) {
      return { message: "An error has occurred", error: error.message };
    }
  }
  static async delete(id: string): Promise<ReturnData> {
    try {
      const verify = await episodeCollection.findOne({ _id: new ObjectId(id) });
      if (!verify) {
        return { message: "The episode does not exist" };
      }
      await episodeCollection.deleteOne({ _id: new ObjectId(id) });
      return { message: "The episode was deleted successfully" };
    } catch (error: any) {
      return { message: "An error has occurred", error: error.message };
    }
  }
}
