/**
 * Descripción: Configuración y documentación completa de todas las rutas para la aplicación.
 *
 * Notas importantes:
 * - La segmentación "/d/" (por ejemplo, en "/anime/d/all" o "/anime/d/mostPopular")
 *   se utiliza para evitar colisiones con rutas paramaterizadas (que usan ":param").
 *   Esto asegura que las rutas fijas se resuelvan sin conflicto con rutas dinámicas.
 *
 * - En la ruta DELETE para eliminar un anime de una lista ("/user/profile/list/:listId/anime/:animeId"),
 *   no se solicita el profileId porque el listId es suficiente para identificar la lista de manera única.
 */

import { Router } from "express";
import { htmlPage } from "../libs/page";

import { requireAdmin, requireAuth } from "../libs/auth";
import { requireSourcesEnabled } from "../libs/sourcesGate";
import {
  adminAuthLimiter,
  authLimiter,
  contentLimiter,
  signupLimiter,
} from "../libs/rateLimit";
import { validateBody } from "../libs/validate";
import {
  adminCreateSchema,
  adminLoginSchema,
  animeSchema,
  animeUpdateSchema,
  characterSchema,
  commentSchema,
  episodeSchema,
  episodeUpdateSchema,
  learningProgressSchema,
  listSchema,
  loginSchema,
  profileSchema,
  reviewSchema,
  signupSchema,
} from "../libs/schemas";
import { getAdminMe, getMe } from "./GET/me";

// ---------------------------
// Importación de módulos POST
// ---------------------------
import newAnime from "./POST/newAnime"; // Crea un nuevo anime.
import addEpisode from "./POST/addEpisode"; // Agrega un episodio a un anime.
import signUp from "./POST/signUp"; // Registra un nuevo usuario.
import login from "./POST/login"; // Permite el inicio de sesión del usuario.
import newProfile from "./POST/newProfile"; // Crea un nuevo perfil para un usuario.
import newList from "./POST/newList"; // Crea una nueva lista para un perfil.
import addAnimeToList from "./POST/addToListAnime"; // Agrega un anime a una lista.
import addToHistory from "./POST/addToHistory"; // Añade un episodio al historial de visualización.
import newComment from "./POST/newComment"; // Publica un nuevo comentario.
import addLikeToAnime from "./POST/addLike"; // Agrega un "like" a un anime.
import addReview from "./POST/addReview"; // Crea una reseña para un anime.
import addLikeToComment from "./POST/addLikeToComment"; // Agrega un "like" a un comentario.
import addCharacterToAnime from "./POST/addCharacter"; // Agrega un personaje a un anime
import newAdminUser from "./POST/newAdminUser"; // Agrega un nuevo administrador sin ser aceptado aun
import adminLogin from "./POST/adminLogin"; // Login para usuarios administradores
import addLearningProgress from "./POST/addLearningProgress"; // Agrega un progreso de aprendizaje a un anime (para estudiantes de japones)
import { logoutAdmin, logoutUser } from "./POST/logout"; // Invalida sesiones

// ---------------------------
// Importación de módulos GET
// ---------------------------
import getAllAnimes from "./GET/getAllAnimes"; // Obtiene todos los animes.
import getAnimeById from "./GET/getAnimeById"; // Obtiene detalles de un anime específico.
import getEpisodes from "./GET/getEpisodes"; // Lista los episodios de un anime.
import getMostPopularAnime from "./GET/getMostPopularAnime"; // Obtiene el anime más popular.
import getSimilarAnimes from "./GET/getSimilarAnime"; // Lista animes similares.
import getAllProfiles from "./GET/getAllProfiles"; // Lista todos los perfiles de usuario.
import getLists from "./GET/getList"; // Obtiene todas las listas de un perfil.
import getAnimesInList from "./GET/getAnimesInList"; // Lista los animes de una lista específica.
import getAnimesOfAGenre from "./GET/getAnimesOfAGenre"; // Obtiene animes de un género específico.
import getAllGenres from "./GET/getAllGenres"; // Obtiene todos los géneros de anime.
import getAnimesOfAnStudio from "./GET/getAnimesOfAnStudio"; // Lista animes de un estudio específico.
import getAnimeOfAyear from "./GET/getAnimesOfAYear"; // Obtiene animes de un año específico.
import getFilteredAnimes from "./GET/getFilteredAnimes"; // Obtiene animes filtrados y paginados.
import getHistory from "./GET/getHistory"; // Muestra el historial de visualización de un perfil.
import getLikes from "./GET/getrLikes"; // Cuenta los "likes" de un anime.
import getAnimesWithMostLikes from "./GET/getAnimesWithMostLikes"; // Lista los animes con mayor cantidad de "likes".
import getReviews from "./GET/getAllReviews"; // Obtiene todas las reseñas de un anime.
import getReviewById from "./GET/getReviewById"; // Obtiene una reseña específica de un anime.
import decodeToken from "./GET/decodeToken"; // Decodifica el token del usuario.
import getCommentLikes from "./GET/getCommentLikes"; // Obtiene tanto el conteo de likes de un episodio, y los perfiles que le han dado like
import getCharacterOfAnAnime from "./POST/getCharacters"; // Obtiene los personajes de un anime en especifico
import getCharacterRelatedAnime from "./GET/getCharacterRelatedAnime"; // Obtiene los animes relacionados a un personaje
import getCharacterById from "./GET/getCharacterById"; // Obtiene un personaje por su ID
import getRandomAnime from "./GET/getRandomAnime"; // Obtiene un anime random de la base de datos
import getComments from "./GET/getComments"; // Obtiene los comentarios de un episodio.
import getAllUsers from "./GET/getAllUser"; // Obtiene todos los usuarios por paginacion
import getAnimesCount from "./GET/getAnimeCount"; // Obtiene el total de animes en la base de datos
import getLearningProgress from "./GET/getLearningProgress"; // Obtiene el progreso de aprendizaje de un anime


// ------------------------------
// Importación de módulos DELETE
// ------------------------------
import removeAnimeFromList from "./DELETE/removeFromList"; // Elimina un anime de una lista.
import deleteProfile from "./DELETE/deleteProfile"; // Elimina un perfil de usuario.
import deleteAnime from "./DELETE/deleteAnime"; // Eliminar un anime
import deleteEpisode from "./DELETE/deleteEpisode"; // Elimina el episodio de un anime
import deleteUser from "./DELETE/deleteUser"; // Elimina un usuario y todos sus datos de la base de datos

// ---------------------------
// Importación de módulos PUT
// ---------------------------
import updateProfile from "./PUT/updateProfile"; // Actualiza información de un perfil.
import updateAnime from "./PUT/updateAnime"; // Actualiza información de un anime.
import updateEpisode from "./PUT/updateEpisode"; // Actualiza informacion de un episodio
import getTenLatest from "./GET/getTenLatest";
import animeFullDetails from "./GET/animeFullDetails";
import addEpisodeLearningProgress from "./POST/addEpisodeLearningProgress";

// ---------------------------
// Importación de fuentes externas
// ---------------------------
import sourceRateLimit from "../libs/sourceRateLimit";
import { playbackLimiter } from "../libs/rateLimit";
import listSources from "./sources/listSources";
import searchSource from "./sources/searchSource";
import getSourceCatalog from "./sources/getCatalog";
import getSourceAnime from "./sources/getSourceAnime";
import getSourceEpisodes from "./sources/getSourceEpisodes";
import getSourceServers from "./sources/getSourceServers";
import sourceHealth from "./sources/sourceHealth";
import importAnimeFromSource from "./sources/importAnime";
import getAnimeSources from "./sources/getAnimeSources";
import refreshEpisodeServersHandler from "./sources/refreshEpisodeServers";
import { getManifest, getSegment } from "./sources/playback";

// Crear el Router principal de Express
const route = Router();

// ================================
// Rutas GET - Consultas de datos
// ================================

// Ruta raíz: envía una página HTML básica.
route.get("/", (req, res) => {
  res.send(htmlPage);
});

// Decodificar token del usuario.
route.get("/user/decode", requireAuth, decodeToken);

// Datos de la sesión actual (usuario + perfiles propios).
route.get("/me", requireAuth, getMe);

// Datos de la sesión de administrador.
route.get("/admin/me", requireAdmin, getAdminMe);

// -------------------------------
// Fuentes externas (scraping estandarizado)
// -------------------------------

// Listado de fuentes registradas. `?health=true` ejecuta health checks.
route.get("/sources", requireSourcesEnabled, sourceRateLimit, listSources);

// Estado de una fuente concreta.
route.get("/sources/:sourceId/health", requireSourcesEnabled, sourceRateLimit, sourceHealth);

// Búsqueda remota.
route.get("/sources/:sourceId/search", requireSourcesEnabled, sourceRateLimit, searchSource);

// Catálogo remoto (popular | latest).
route.get("/sources/:sourceId/catalog", requireSourcesEnabled, sourceRateLimit, getSourceCatalog);

// Ficha remota de un anime.
route.get("/sources/:sourceId/anime/:externalId", requireSourcesEnabled, sourceRateLimit, getSourceAnime);

// Episodios remotos de un anime.
route.get(
  "/sources/:sourceId/anime/:externalId/episodes",
  requireSourcesEnabled,
  sourceRateLimit,
  getSourceEpisodes,
);

// Servidores/embeds de un episodio remoto.
route.get(
  "/sources/:sourceId/anime/:externalId/episode/:episodeExternalId/servers",
  requireSourcesEnabled,
  sourceRateLimit,
  getSourceServers,
);

// Importar (crear/actualizar) un anime y sus episodios en la base local.
route.post(
  "/sources/:sourceId/import",
  requireSourcesEnabled,
  sourceRateLimit,
  requireAdmin,
  importAnimeFromSource,
);

// Mapeos de un anime local a sus fuentes externas.
route.get("/anime/:animeId/sources", requireSourcesEnabled, getAnimeSources);

// Proxy de playback DASH (AnimeOnsen): manifiesto y segmentos.
route.get(
  "/sources/animeonsen/playback/:token/manifest.mpd",
  requireSourcesEnabled,
  playbackLimiter,
  getManifest,
);
route.get(
  "/sources/animeonsen/playback/:token/:file",
  requireSourcesEnabled,
  playbackLimiter,
  getSegment,
);

// Refrescar servidores de un episodio ya importado.
route.post(
  "/anime/episode/:episodeId/servers/refresh",
  requireSourcesEnabled,
  sourceRateLimit,
  requireAdmin,
  refreshEpisodeServersHandler,
);

// -------------------------------
// Rutas de Animes (GET)
// -------------------------------

// Detalles de un anime específico (ruta dinámica por :animeId).
route.get("/anime/:animeId", getAnimeById);

// Informacion completa de un anime
route.get("/anime/:animeId/fullDetails", animeFullDetails);


// Obtener todos los animes.
// Se utiliza "/d/" para rutas fijas, evitando conflicto con los parámetros.
route.get("/anime/d/all", getAllAnimes);

// Obtiene los ultimos 10 animes agregatos
route.get("/anime/d/latest", getTenLatest);

// Obtiene la cantidad de animes disponibles

route.get("/anime/d/count", getAnimesCount);

// Obtener un anime random
route.get("/anime/d/random", getRandomAnime);

// Obtener el anime más popular.
route.get("/anime/d/mostPopular", getMostPopularAnime);

// Obtener animes de un estudio específico.
route.get("/anime/d/studio/:studio", getAnimesOfAnStudio);

// Obtener animes de un año específico.
route.get("/anime/d/year/:year", getAnimeOfAyear);

// Obtener animes filtrados y paginados (nuevo endpoint unificado).
// Query params: genre, studio, year, status (0|1), sort (newest|popular|score), page, limit
route.get("/anime/d/filtered", getFilteredAnimes);

// Obtener animes con más "likes".
route.get("/anime/d/mostLiked", getAnimesWithMostLikes);

// Obtener animes similares a uno específico.
route.get("/anime/:animeId/similar", getSimilarAnimes);

// Contar "likes" de un anime.
route.get("/anime/:animeId/likes/count", getLikes);
 
// Animes de un género específico.
route.get("/anime/genre/:genre", getAnimesOfAGenre);

// Obtener todos los géneros de anime.
route.get("/anime/genre/d/all", getAllGenres);

// Obtener todas las reseñas de un anime.
route.get("/anime/:animeId/review/all", getReviews);

// Obtener una reseña específica de un anime.
route.get("/anime/:animeId/review/:reviewId", getReviewById);

// Obtener personajes de un anime en especifico

route.get("/anime/:animeId/character/all", getCharacterOfAnAnime);

// Obtener el progreso de aprendizaje de un anime (para estudiantes de japones)
route.get("/anime/:animeId/learningProgress/:profileId", requireAuth, getLearningProgress)


// Obtener los animes relacionados a un personaje
route.get("/character/:id/relatedAnimes", getCharacterRelatedAnime);

// Obtener un personaje por su ID
route.get("/character/:id", getCharacterById);

// -------------------------------
// Rutas de Episodios (GET)
// -------------------------------
 
// Obtener todos los episodios de un anime.
route.get("/anime/:animeId/episode/all", getEpisodes);

// Obtener todos los comentarios de un episodio.
route.get("/anime/episode/:episodeId/comment/all", getComments);

// Obtiene los likes de un episodio
route.get("/anime/episode/:episodeId/comment/likes/all", getCommentLikes);

// -------------------------------
// Rutas de Perfiles (GET)
// -------------------------------

// Obtener todos los perfiles asociados a un usuario.
route.get("/user/:userId/profile/d/all", requireAuth, getAllProfiles);

// Obtener el historial de visualización de un perfil.
route.get("/user/profile/:profileId/history", requireAuth, getHistory);

// -------------------------------
// Rutas de Listas (GET)
// -------------------------------

// Obtener todas las listas de un perfil.
route.get("/user/profile/:profileId/list/all", requireAuth, getLists);

// Obtener todos los animes contenidos en una lista específica.
route.get("/user/profile/:profileId/list/anime/all", requireAuth, getAnimesInList);

// ================================
// Rutas POST - Creación y modificación de datos
// ================================

// --- Operaciones sobre Animes ---
// Crear un nuevo anime.
route.post("/anime/new", requireAdmin, validateBody(animeSchema), newAnime);

// Agregar un "like" a un anime para un perfil específico.
route.post(
  "/anime/:animeId/like/:profileId",
  requireAuth,
  contentLimiter,
  addLikeToAnime,
);

// Agregar una nueva reseña a un anime.
route.post(
  "/anime/:animeId/review/new",
  requireAuth,
  contentLimiter,
  validateBody(reviewSchema),
  addReview,
);

// --- Operaciones sobre Episodios ---
// Agregar un nuevo episodio a un anime.
route.post("/anime/:animeId/episode/new", requireAdmin, validateBody(episodeSchema), addEpisode);

// Crear un nuevo comentario para un episodio.
route.post(
  "/anime/episode/:episodeId/comment/new",
  requireAuth,
  contentLimiter,
  validateBody(commentSchema),
  newComment,
);

// Agregar un "like" a un comentario.
route.post(
  "/anime/episode/:episodeId/comment/:commentId/like/:profileId",
  requireAuth,
  contentLimiter,
  addLikeToComment,
);

// Agregar un personaje al anime
route.post("/anime/:animeId/character/new", requireAdmin, validateBody(characterSchema), addCharacterToAnime);

// Agregar progreso de aprendizaje en anime
route.post("/anime/:animeId/learningProgress/:profileId", requireAuth, contentLimiter, validateBody(learningProgressSchema), addLearningProgress)


// Agregar progreso de aprendizaje en episodio de un anime
route.post("/anime/:animeId/episode/:episodeId/learningProgress/:profileId", requireAuth, contentLimiter, validateBody(learningProgressSchema), addEpisodeLearningProgress)


// ================================
// Rutas PUT - Actualización de datos
// ================================

// Actualizar información de un anime.
route.put("/anime/:animeId", requireAdmin, validateBody(animeUpdateSchema), updateAnime);

// Actualizar información de un episodio
route.put("/anime/episode/:episodeId", requireAdmin, validateBody(episodeUpdateSchema), updateEpisode);

// ================================
// Rutas DELETE - Eliminación de datos
// ================================

// Eliminar un anime
route.delete("/anime/:animeId", requireAdmin, deleteAnime);

// Eliminar un episodio determinado
route.delete("/anime/episode/:episodeId", requireAdmin, deleteEpisode);

// --- Operaciones sobre Usuarios ---

// ================================
// Rutas GET - Consultas de datos
// ================================
route.get("/user/d/all", requireAdmin, getAllUsers);

// ================================
// Rutas POST - Creación y modificación de datos
// ================================

// Registro de un nuevo usuario.
route.post("/user/new", signupLimiter, validateBody(signupSchema), signUp);

// Inicio de sesión.
route.post("/user/login", authLimiter, validateBody(loginSchema), login);

// Cierre de sesión: invalida todos los tokens emitidos para este usuario.
route.post("/user/logout", requireAuth, logoutUser);

// ================================
// Rutas DELETE - Eliminación de datos
// ================================

route.delete("/user/:userId", requireAdmin, deleteUser);

// --- Operaciones sobre Perfiles ---
// Crear un nuevo perfil para un usuario.
route.post(
  "/user/:userId/profile/d/new",
  requireAuth,
  contentLimiter,
  validateBody(profileSchema),
  newProfile,
);

// Agregar un episodio al historial de visualización de un perfil.
route.post(
  "/user/profile/:profileId/history/:animeId/:episodeNumber/add",
  requireAuth,
  contentLimiter,
  addToHistory,
);

// --- Operaciones sobre Listas ---
// Crear una nueva lista para un perfil.
route.post(
  "/user/profile/:profileId/list/new",
  requireAuth,
  contentLimiter,
  validateBody(listSchema),
  newList,
);

// Agregar un anime a una lista.
route.post(
  "/anime/:animeId/list/:listId/add",
  requireAuth,
  contentLimiter,
  addAnimeToList,
);

// -- Operaciones sobre Administradores --
// Crear un nuevo usuario administrador (solo un admin autenticado).
route.post("/admin/new", requireAdmin, validateBody(adminCreateSchema), newAdminUser);

// Login para ingreso del administrador
route.post("/admin/login", adminAuthLimiter, validateBody(adminLoginSchema), adminLogin);

// Cierre de sesión del administrador: invalida todos sus tokens.
route.post("/admin/logout", requireAdmin, logoutAdmin);

// ================================
// Rutas DELETE - Eliminación de datos
// ================================

// --- Operaciones sobre Perfiles ---
// Eliminar un perfil.
route.delete(
  "/user/profile/:profileId/delete",
  requireAuth,
  contentLimiter,
  deleteProfile,
);

// --- Operaciones sobre Listas ---
// Eliminar un anime de una lista.
// Se omite el profileId en la ruta, ya que el listId identifica de forma única la lista.
route.delete(
  "/user/profile/list/:listId/anime/:animeId",
  requireAuth,
  contentLimiter,
  removeAnimeFromList,
);

// ================================
// Rutas PUT - Actualización de datos
// ================================

// Actualizar información de un perfil.
route.put(
  "/user/profile/:profileId",
  requireAuth,
  contentLimiter,
  validateBody(profileSchema),
  updateProfile,
);

// Exportar el Router para uso en la aplicación
export default route;
