import { z } from "zod";

export const objectId = z
  .string()
  .trim()
  .regex(/^[0-9a-f]{24}$/i, "Identificador inválido");

export const email = z.string().trim().toLowerCase().email().max(254);
export const passwordLogin = z.string().min(1).max(200);
export const passwordSignup = z.string().min(8).max(200);
export const username = z
  .string()
  .trim()
  .min(3)
  .max(32)
  .regex(/^[A-Za-z0-9_.-]+$/, "Solo letras, números, punto, guion y guion bajo");

const booleanish = z
  .union([z.boolean(), z.enum(["true", "false", "1", "0"])])
  .transform((value) => value === true || value === "true" || value === "1");

export const loginSchema = z.object({
  email,
  password: passwordLogin,
});

export const signupSchema = z.object({
  username,
  email,
  password: passwordSignup,
});

export const adminLoginSchema = z.object({
  email,
  password: passwordLogin,
});

export const adminCreateSchema = z.object({
  email,
  password: passwordSignup,
});

export const profileSchema = z.object({
  name: z.string().trim().min(1).max(60),
  photo: z.string().trim().max(2048).optional().default(""),
});

export const listSchema = z.object({
  name: z.string().trim().min(1).max(60),
});

export const reviewSchema = z.object({
  title: z.string().trim().min(1).max(200),
  review: z.string().trim().min(1).max(20000),
  profileId: objectId,
  // Se aceptan por compatibilidad, pero el servidor los ignora y usa la BD.
  profileName: z.string().max(120).optional(),
  profileImage: z.string().max(2048).optional(),
});

export const commentSchema = z.object({
  content: z.string().trim().min(1).max(2000),
  profileId: objectId,
  profileName: z.string().max(120).optional(),
  profileImage: z.string().max(2048).optional(),
});

export const animeSchema = z.object({
  name: z.string().trim().min(1).max(200),
  japaneseName: z.string().trim().max(200).optional().default(""),
  synopsis: z.string().trim().max(20000).optional().default(""),
  releaseYear: z.string().trim().max(20).optional().default(""),
  studio: z.string().trim().max(120).optional().default(""),
  cover: z.string().trim().max(2048).optional().default(""),
  image: z.string().trim().max(2048).optional().default(""),
  horizontalImage: z.string().trim().max(2048).optional().default(""),
  onGoing: z.coerce.number().int().min(0).max(1).optional().default(0),
  genres: z.array(z.string().trim().min(1).max(60)).max(50).optional().default([]),
});

export const animeUpdateSchema = animeSchema.partial();

export const episodeSchema = z.object({
  name: z.string().trim().max(200).optional().default(""),
  episodeNumber: z.coerce.number().int().min(0).max(100000),
  synopsis: z.string().trim().max(20000).optional().default(""),
  thumbnail: z.string().trim().max(2048).optional().default(""),
  link: z.string().trim().max(2048).optional().default(""),
  profileId: z.string().max(24).optional().default(""),
  isGlobal: booleanish.optional().default(true),
});

export const episodeUpdateSchema = episodeSchema.partial();

export const characterSchema = z.object({
  name: z.string().trim().min(1).max(120),
  japaneseName: z.string().trim().max(120).optional().default(""),
  role: z.string().trim().max(80).optional().default(""),
  age: z.string().trim().max(40).optional().default(""),
  gender: z.string().trim().max(40).optional().default(""),
  height: z.string().trim().max(40).optional().default(""),
  extraInformation: z.array(z.unknown()).max(50).optional().default([]),
  description: z.string().trim().max(20000).optional().default(""),
  image: z.string().trim().max(2048).optional().default(""),
  relatedAnimes: z.array(z.string().trim().max(24)).max(50).optional().default([]),
});

export const learningProgressSchema = z.object({
  notes: z.string().max(20000).optional().default(""),
  score: z.coerce.number().min(0).max(100).optional().default(0),
  understandingDegree: z.coerce.number().min(0).max(100).optional().default(0),
});

export const sourceImportSchema = z.object({
  externalId: z.string().trim().min(1).max(200),
  importEpisodes: booleanish.optional(),
  episodeNumbers: z
    .array(z.coerce.number().int().min(1))
    .max(5000)
    .optional(),
  attachToAnimeId: objectId.optional(),
});
