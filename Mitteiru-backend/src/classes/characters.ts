import type {
  Character as Icharacter,
  ExtraInformation as IextraInformation,
} from "./interfaces/Character";
import type ReturnData from "../libs/types/returnData";
import dbClient from "../libs/dbClient";
import verifyFields from "../libs/fieldsVerifier";
import { Anime } from "./animes";
import type { Anime_ as Ianime } from "../libs/types/Anime";
import { ObjectId } from "mongodb";

let characterCollection = dbClient.collection<Icharacter>("characters");
export default class Character {
  animeId: string;
  name: string;
  japaneseName: string;
  role: string;
  age: string;
  gender: string;
  height: string;
  extraInformation: IextraInformation[];
  description: string;
  image: string;
  likes: number;
  relatedAnimes: string[];

  constructor(
    animeId: string = "",
    name: string = "",
    japaneseName: string = "",
    role: string = "",
    age: string = "",
    gender: string = "",
    height: string = "",
    extraInformation: IextraInformation[] = [],
    description: string = "",
    image: string = "",
    likes: number = 0,
    relatedAnimes: string[] = [],
  ) {
    this.animeId = animeId;
    this.name = name;
    this.japaneseName = japaneseName;
    this.role = role;
    this.age = age;
    this.gender = gender;
    this.height = height;
    this.extraInformation = extraInformation;
    this.description = description;
    this.image = image;
    this.likes = likes;
    this.relatedAnimes = relatedAnimes;
  }

  async new(): Promise<ReturnData> {
    try {
      const verifyAnime = await new Anime(this.animeId).getById();
      if (!verifyAnime.animes) {
        return { message: "Anime not found" };
      }

      const newCharacter: Icharacter = {
        animeId: this.animeId,
        name: this.name,
        japaneseName: this.japaneseName,
        role: this.role,
        age: this.age,
        gender: this.gender,
        height: this.height,
        extraInformation: this.extraInformation,
        description: this.description,
        image: this.image,
        likes: this.likes,
        relatedAnimes: this.relatedAnimes,
      };
      if (
        !verifyFields([
          this.animeId,
          this.name,
          this.japaneseName,
          this.age,
          this.gender,
          this.height,
          this.description,
          this.relatedAnimes,
        ])
      ) {
        return { message: "All fields are required" };
      }
      await characterCollection.insertOne(newCharacter);
      return { message: "success" };
    } catch (error: any) {
      console.error(error);
      return { message: "An error has occurred", error: error.message };
    }
  }
  static async getById(characterId: string): Promise<ReturnData> {
    try {
      const character = await characterCollection.findOne({
        _id: new ObjectId(characterId),
      });
      if (!character) {
        return { message: "Character not found" };
      }
      return { message: "Success", characters: character as Icharacter };
    } catch (error) {
      return {
        message: "An error has occurred while getting the character",
        error: (error as Error).message,
      };
    }
  }
  static async getCharacterOfAnAnime(animeId: string): Promise<ReturnData> {
    try {
      const anime = await new Anime(animeId).getById();
      let characters: Icharacter[] = [];
      if (!anime) {
        return { message: "Anime not found" };
      }
      const dbCharacters = await characterCollection
        .find({ relatedAnimes: animeId })
        .toArray();

      return { message: "Success", characters: dbCharacters };
    } catch (error: any) {
      return {
        message: "An error has occurred while getting the character",
        error: error.message,
      };
    }
  }

  static async getRelatedAnimesInformation(
    characterId: string,
  ): Promise<ReturnData> {
    try {
      const character = await characterCollection.findOne({
        _id: new ObjectId(characterId),
      });
      if (!character) {
        return { message: "Character not found" };
      }
      let relatedAnimesInfo: Ianime[] = [];
      for (const animeId of character.relatedAnimes) {
        const animeData = await new Anime(animeId).getById();
        if (animeData.animes) {
          relatedAnimesInfo.push(animeData.animes as Ianime);
        }
      }
      return { message: "Success", animes: relatedAnimesInfo };
    } catch (error: any) {
      return {
        message: "An error has occurred while getting related animes",
        error: error.message,
      };
    }
  }
}
