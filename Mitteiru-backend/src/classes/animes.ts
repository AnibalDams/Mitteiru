import { ObjectId } from "mongodb";
import dbClient from "../libs/dbClient"; // Conexión a la base de datos
import type ReturnData from "../libs/types/returnData"; // Tipos de datos para respuestas
import type { Anime_ as Ianime } from "../libs/types/Anime"; // La "forma" que debe tener un anime
import getRandomInt from "../libs/randomNumber"; // Ayuda para elegir números al azar
import Genre from "./genres";

// Referencia rápida a la colección (tabla) de "anime" en la base de datos
const animeCollection = dbClient.collection<Ianime>("anime");

export class Anime {
  // 1. DEFINICIÓN DE DATOS
  // Aquí declaramos todas las características que tendrá un anime.
  id: string;
  name: string;
  japaneseName: string;
  synopsis: string;
  releaseYear: string;
  studio: string;
  cover: string;
  image: string;
  onGoing: number; // 1 si está en emisión, 0 si terminó
  horizontalImage: string;
  genres: string[];

  // 2. CONSTRUCTOR
  // Esta función se ejecuta cuando haces "new Anime(...)".
  // Rellena la ficha técnica del anime con los datos que le pases.
  public constructor(
    id: string = "",
    name: string = "",
    japaneseName: string = "",
    synopsis: string = "",
    releaseYear: string = "",
    studio: string = "",
    cover: string = "",
    image: string = "",
    onGoing: number = 0,
    horizontalImage: string = "",
    genres: string[] = [""],
  ) {
    this.id = id;
    this.name = name;
    this.japaneseName = japaneseName;
    this.synopsis = synopsis;
    this.releaseYear = releaseYear;
    this.studio = studio;
    this.cover = cover;
    this.image = image;
    this.onGoing = onGoing;
    this.horizontalImage = horizontalImage;
    this.genres = genres;
  }

  static async existAnime(animeId: string): Promise<boolean> {
    try {
      const verifyAnime = await animeCollection.findOne({ _id: new ObjectId(animeId) });
      if (!verifyAnime) {
        return false
      }
      return true
    } catch (error: any) {
      console.error(error)
      return false
    }
  }
  // 3. MÉTODO MAESTRO: GUARDAR / ACTUALIZAR
  // Este método es inteligente:
  // - Si el anime ya existe (por nombre), actualiza sus datos.
  // - Si no existe, crea uno nuevo desde cero.
  async new(): Promise<ReturnData> {
    try {
      // ¿Existe ya un anime con este nombre?
      const verifyAnime = await dbClient
        .collection("anime")
        .findOne({ name: this.name });

      // CASO A: SI EXISTE -> ACTUALIZAMOS
      if (verifyAnime != null) {
        await animeCollection.findOneAndUpdate(
          { name: this.name },
          {
            $set: {
              // Sobrescribimos los datos viejos con los nuevos
              name: this.name,
              japaneseName: this.japaneseName,
              synopsis: this.synopsis,
              releaseYear: this.releaseYear,
              studio: this.studio,
              cover: this.cover,
              image: this.image,
              horizontalImage: this.horizontalImage,
              onGoing: this.onGoing,
            },
          },
        );

        return {
          message: "The anime has been updated successfully",
        };
      }

      // CASO B: NO EXISTE -> CREAMOS UNO NUEVO
      const newAnime = await animeCollection.insertOne({
        name: this.name,
        japaneseName: this.japaneseName,
        synopsis: this.synopsis,
        releaseYear: this.releaseYear,
        studio: this.studio,
        cover: this.cover,
        image: this.image,
        horizontalImage: this.horizontalImage,
        onGoing: this.onGoing,
        genres: this.genres,
        createdAt: new Date().getTime(), // Guardamos la fecha actual
        views: 0, // Empieza con 0 vistas
        likes: 0, // Empieza con 0 likes
      });

      const animeId = newAnime.insertedId;

      // LOGICA DE GÉNEROS
      // Recorremos los géneros (ej: ["Acción", "Romance"])
      for (let i = 0; i < this.genres.length; i++) {
        const genre = this.genres[i];

        // Verificamos si el género existe en la tabla de géneros
        const doesTheGenreExist = await dbClient
          .collection("genres")
          .findOne({ name: genre });

        // Si no existe el género, lo creamos primero
        if (doesTheGenreExist == null) {
          await dbClient.collection("genres").insertOne({ name: genre });
        }

        // Vinculamos este Anime con ese Género en una tabla intermedia
        await dbClient
          .collection("genreAnime")
          .insertOne({ name: genre, animeId: animeId });
      }

      return {
        message: "The anime has been created successfully",
      };
    } catch (error: any) {
      console.error(error);
      return {
        message: "An error has occurred while creating an Anime",
        error: error.message,
      };
    }
  }

  // Trae los últimos 10 animes agregados (para la página de inicio)
  async getTenLatest(): Promise<ReturnData> {
    try {
      const animes = await animeCollection.find().limit(10).sort({
        createdAt: -1,
      }).toArray();
      return { message: "animes found", animes: animes };
    } catch (error: any) {
      console.log(error);
      return {
        message: "An error has occurred while getting animes",
        error: error.message,
      };
    }
  }

  static async getAll(): Promise<ReturnData> {
    try {
      const animes = (await animeCollection.find().limit(1000).toArray()).sort(
        (a, b) => b.createdAt - a.createdAt,
      );
      return { message: "animes found", animes: animes };
    } catch (error: any) {
      console.log(error);
      return {
        message: "An error has occurred while getting animes",
        error: error.message,
      };
    }
  }

  // Selecciona un anime aleatorio de toda la base de datos
  static async getRandomAnime(): Promise<ReturnData> {
    try {
      // $sample es un truco de MongoDB para sacar items al azar
      const cursor = animeCollection.aggregate([{ $sample: { size: 1 } }]);
      const result = (await cursor.toArray()) as Ianime[];

      if (result.length === 0) {
        return { message: "No anime found", error: "Collection is empty" };
      }

      const selectedAnime = result[0];

      // Ordenamos los géneros alfabéticamente para que se vean bonitos
      if (selectedAnime.genres && Array.isArray(selectedAnime.genres)) {
        selectedAnime.genres.sort();
      }

      return { message: "success", animes: selectedAnime };
    } catch (error: any) {
      return { message: "An error has occurred", error: error.message };
    }
  }

  // Busca un anime por su ID único.
  // El incremento de vistas es explícito: solo la ruta pública de detalle lo activa.
  async getById(trackView = false): Promise<ReturnData> {
    try {
      const anime: any = trackView
        ? await animeCollection.findOneAndUpdate(
            { _id: new ObjectId(this.id) },
            { $inc: { views: 1 } },
            { returnDocument: "after" },
          )
        : await animeCollection.findOne({ _id: new ObjectId(this.id) });
      if (anime === null) {
        return { message: "no anime found" };
      }

      if (Array.isArray(anime.genres)) anime.genres.sort();

      return { message: "anime found", animes: anime };
    } catch (error: any) {
      console.error(error);
      return {
        message: "An error has occurred while getting the animes",
        error: error.message,
      };
    }
  }

  // Filtra animes por estudio de animación (ej. "MAPPA")
  async getAnimesOfAnStudio(): Promise<ReturnData> {
    try {
      const animes = (
        await animeCollection.find({ studio: this.studio }).toArray()
      ).sort((a, b) => b.createdAt - a.createdAt);
      return { message: "success", animes: animes };
    } catch (error: any) {
      console.error(error);
      return {
        message: "An error has occurred while getting the animes",
        error: error.message,
      };
    }
  }

  // Trae los 12 animes más vistos (Top Popular)
  async getMostPopular(): Promise<ReturnData> {
    try {
      const animes = await animeCollection
        .find()
        .sort({ views: -1 }) // -1 significa orden descendente (mayor a menor)
        .limit(12)
        .toArray();

      return { message: "success", animes: animes };
    } catch (error: any) {
      console.error(error);
      return {
        message: "An error has occurred while getting the animes",
        error: error.message,
      };
    }
  }

  // Algoritmo de recomendación
  // 1. Mira los géneros del anime actual.
  // 2. Elige uno al azar.
  // 3. Busca otros animes con ese género.
  async getSimilar(): Promise<ReturnData> {
    try {
      const targetId = new ObjectId(this.id);

      // 1. PROYECCIÓN: Traer SOLO el array de géneros de la base de datos.
      // Esto ahorra ancho de banda y memoria RAM al no cargar toda la data del anime.
      const currentAnime = await animeCollection.findOne(
        { _id: targetId },
        { projection: { genres: 1 } }
      );

      if (!currentAnime || !currentAnime.genres || currentAnime.genres.length === 0) {
        return { message: "No anime found or no genres available" };
      }

      // 2. Elegir un género al azar
      const randomGenre = currentAnime.genres[Math.floor(Math.random() * currentAnime.genres.length)];

      // 3. AGGREGATION PIPELINE: Dejar que MongoDB filtre y seleccione al azar.
      const similarAnimes = await animeCollection.aggregate([
        {
          $match: {
            genres: randomGenre,      // Que contenga el género aleatorio
            _id: { $ne: targetId }    // Que NO sea el anime que estamos viendo
          }
        },
        {
          $sample: { size: 1 }        // Magia pura: MongoDB selecciona 1 documento al azar de los que coinciden
        }
      ]).toArray();

      if (similarAnimes.length === 0) {
        return { message: "No similar animes found" };
      }

      return { message: "success", animes: similarAnimes[0] as Ianime };
    } catch (error: any) {
      console.error(error);
      return {
        message: "An error has occurred while getting the similar Animes",
        error: error.message,
      };
    }
  }

  // Filtro simple por año de lanzamiento
  async getAnimesOfAYear(): Promise<ReturnData> {
    try {
      const animes = await animeCollection
        .find({ releaseYear: this.releaseYear })
        .toArray();
      return { message: "Success", animes: animes };
    } catch (error: any) {
      console.error(error);
      return {
        message: "An error has occurred while getting the animes",
        error: error.message,
      };
    }
  }

  // Interruptor de "Me gusta"
  // Si ya le diste like, te lo quita. Si no, te lo pone.
  async addLike(profileId: string): Promise<ReturnData> {
    try {
      // Verifica si este usuario ya le dio like a este anime
      const verifyLike = await dbClient.collection("likes").findOne({
        profileId: new ObjectId(profileId),
        animeId: new ObjectId(this.id),
      });

      // CASO: YA TIENE LIKE -> LO QUITAMOS (Dislike)
      if (verifyLike != null) {
        await dbClient.collection("likes").findOneAndDelete({
          profileId: new ObjectId(profileId),
          animeId: new ObjectId(this.id),
        });
        // Operación atómica: evita condiciones de carrera con likes simultáneos.
        await animeCollection.updateOne(
          { _id: new ObjectId(this.id), likes: { $gt: 0 } },
          { $inc: { likes: -1 } },
        );
        return { message: "success 1" }; // Indica que se quitó el like
      }

      // CASO: NO TIENE LIKE -> LO AGREGAMOS
      await dbClient.collection("likes").insertOne({
        animeId: new ObjectId(this.id),
        profileId: new ObjectId(profileId),
      });
      await animeCollection.updateOne(
        { _id: new ObjectId(this.id) },
        { $inc: { likes: 1 } },
      );

      return { message: "success 2" }; // Indica que se agregó el like
    } catch (error: any) {
      console.error(error);
      return {
        message: "An error has occurred while adding the like",
        error: error.message,
      };
    }
  }

  // Obtiene la cantidad de likes y la lista de usuarios que dieron like
  async getLikes(): Promise<ReturnData> {
    try {
      const anime: any = await animeCollection.findOne({
        _id: new ObjectId(this.id),
      });
      if (!anime) {
        return { message: "Anime not found" };
      }
      const profilesLiked = await dbClient
        .collection("likes")
        .find({ animeId: new ObjectId(this.id) })
        .toArray();

      return {
        message: "Success",
        likesCount: anime.likes ?? 0,
        profiles: profilesLiked,
      };
    } catch (error: any) {
      console.error(error);
      return { message: "An error has occurred", error: error.message };
    }
  }

  // Ranking de animes con más "Me gusta"
  async getMostLiked(): Promise<ReturnData> {
    try {
      const mostLikedAnimes = await animeCollection
        .find()
        .limit(10)
        .sort({ likes: -1 })
        .toArray();
      return { message: "success", animes: mostLikedAnimes };
    } catch (error: any) {
      console.error(error);
      return {
        message: "An error has occurred while getting the most liked animes",
        error: error.message,
      };
    }
  }

  // Agrega un comentario/reseña a un anime
  async addReview(
    review: string,
    title: string,
    profileId: string,
    profileName: string,
    profileImage: string,
  ): Promise<ReturnData> {
    try {
      const result = await dbClient.collection("reviews").insertOne({
        review: review,
        animeId: this.id,
        title,
        profileId,
        profileName,
        profileImage,
        createdAt: new Date().getTime(),
      });
      return { message: "Success", reviewId: result.insertedId.toString() };
    } catch (error: any) {
      console.error(error);
      return {
        message: "There was an error while adding the review",
        error: error.message,
      };
    }
  }

  // Obtiene todas las reseñas de este anime, las más nuevas primero
  async getAllReviews(): Promise<ReturnData> {
    try {
      const reviews = await dbClient
        .collection("reviews")
        .find({ animeId: this.id })
        .sort({ createdAt: -1 })
        .limit(200)
        .toArray();
      return { message: "Success", reviews: reviews };
    } catch (error: any) {
      return {
        message: "There was an error while getting the reviews",
        error: error.message,
      };
    }
  }

  // Obtiene una reseña específica por su ID
  async getReviewById(reviewId: string): Promise<ReturnData> {
    try {
      const review = await dbClient
        .collection("reviews")
        .findOne({ animeId: this.id, _id: new ObjectId(reviewId) });
      if (review == null) {
        return { message: "Review not found" };
      }
      return { message: "Success", reviews: review };
    } catch (error: any) {
      return {
        message: "There was an error while getting the review",
        error: error.message,
      };
    }
  }

  // MÉTODOS ESTÁTICOS DE ADMINISTRACIÓN
  // Se pueden usar sin crear un objeto nuevo, útiles para paneles de admin.

  // Actualizar un anime específico dada su ID y los nuevos datos
  static async update(id: string, data: Ianime): Promise<ReturnData> {
    try {
      const verifyAnime = await animeCollection.findOne({
        _id: new ObjectId(id),
      });
      if (!verifyAnime) {
        return { message: "Anime not found" };
      }
      await animeCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: data },
      );

      return { message: "success" };
    } catch (error: any) {
      return { message: "An error has occurred", error: error.message };
    }
  }

  // Eliminar un anime de la base de datos
  static async delete(id: string): Promise<ReturnData> {
    try {
      const verifyAnime = await animeCollection.findOne({
        _id: new ObjectId(id),
      });
      if (!verifyAnime) {
        return { message: "Anime not found" };
      }
      await animeCollection.findOneAndDelete({ _id: new ObjectId(id) });
      return { message: "success" };
    } catch (error: any) {
      return { message: "An error has occurred", error: error.message };
    }
  }

  // Contabilizar la cantidad de animes en la base de datos
  static async count() {
    try {
      const animeCount = await animeCollection.countDocuments();
      return { message: "success", count: animeCount };
    } catch (error: any) {
      return { message: "An error has occurred", error: error.message };
    }
  }
}
