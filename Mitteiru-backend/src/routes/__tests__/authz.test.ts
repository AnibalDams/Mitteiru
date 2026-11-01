import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.NODE_ENV = "test";
process.env.SECRET_KEY = "test-secret-key-with-enough-entropy-123456";

let mongo: MongoMemoryServer;
let app: import("express").Express;
let dbClient: import("mongodb").Db;

let ownerId: ObjectId;
let otherId: ObjectId;
let ownerProfileId: ObjectId;
let otherProfileId: ObjectId;
let adminId: ObjectId;
let animeId: ObjectId;
let episodeId: ObjectId;
let commentId: ObjectId;
let cascadeProfileId: ObjectId;

let ownerToken: string;
let otherToken: string;
let adminToken: string;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.DATABASE = mongo.getUri();

  const auth = await import("../../libs/auth");
  const dbModule = await import("../../libs/dbClient");
  const indexModule = await import("../../../index");

  dbClient = dbModule.default;
  app = indexModule.app;

  ownerId = new ObjectId();
  otherId = new ObjectId();
  ownerProfileId = new ObjectId();
  otherProfileId = new ObjectId();
  adminId = new ObjectId();
  animeId = new ObjectId();
  episodeId = new ObjectId();
  commentId = new ObjectId();
  cascadeProfileId = new ObjectId();

  const password = await bcrypt.hash("Password123!", 4);

  await dbClient.collection("user").insertMany([
    { _id: ownerId, username: "owner", email: "owner@example.com", password },
    { _id: otherId, username: "other", email: "other@example.com", password },
  ]);

  await dbClient.collection("profiles").insertMany([
    { _id: ownerProfileId, name: "Owner", photo: "", userId: ownerId },
    { _id: otherProfileId, name: "Other", photo: "", userId: otherId },
  ]);

  await dbClient.collection("adminUser").insertOne({
    _id: adminId,
    email: "admin@example.com",
    password,
    accepted: true,
  });

  await dbClient.collection("episodes").insertOne({
    _id: episodeId,
    name: "Episodio 1",
    episodeNumber: 1,
    thumbnail: "",
    synopsis: "",
    link: "",
    animeId,
    profileId: "",
    isGlobal: true,
    external: false,
  });

  await dbClient.collection("comments").insertOne({
    _id: commentId,
    date: Date.now(),
    profileId: String(ownerProfileId),
    content: "Comentario de prueba",
    profileName: "Owner",
    profileImage: "",
    episodeId,
  });

  await dbClient.collection("anime").insertOne({
    _id: animeId,
    name: "Test Anime",
    japaneseName: "",
    synopsis: "",
    releaseYear: "2024",
    studio: "Test",
    cover: "",
    image: "",
    horizontalImage: "",
    onGoing: 0,
    createdAt: Date.now(),
    genres: [],
    views: 0,
    likes: 0,
  });

  ownerToken = auth.signUserToken({ sub: String(ownerId), email: "owner@example.com" });
  otherToken = auth.signUserToken({ sub: String(otherId), email: "other@example.com" });
  adminToken = auth.signAdminToken({ sub: String(adminId), email: "admin@example.com" });
}, 180_000);

afterAll(async () => {
  if (dbClient) await dbClient.client.close();
  if (mongo) await mongo.stop();
});

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

describe("autorización de contenido", () => {
  test("anónimo no puede crear anime", async () => {
    const response = await request(app).post("/anime/new").send({ name: "X" });
    expect(response.status).toBe(401);
  });

  test("usuario normal no puede crear anime", async () => {
    const response = await request(app)
      .post("/anime/new")
      .set(bearer(ownerToken))
      .send({ name: "X" });
    expect(response.status).toBe(403);
  });

  test("admin sí puede crear anime", async () => {
    const response = await request(app)
      .post("/anime/new")
      .set(bearer(adminToken))
      .send({
        name: "Nuevo Anime",
        synopsis: "Sinopsis",
        releaseYear: "2026",
        studio: "Studio",
        cover: "https://example.com/cover.jpg",
        image: "https://example.com/image.jpg",
        onGoing: 1,
        genres: ["Action"],
      });
    expect([200, 201]).toContain(response.status);
  });

  test("un usuario no puede dar like con el perfil de otro", async () => {
    const response = await request(app)
      .post(`/anime/${animeId}/like/${otherProfileId}`)
      .set(bearer(ownerToken));
    expect(response.status).toBe(403);
  });

  test("un usuario no puede dar like a un comentario con el perfil de otro", async () => {
    const response = await request(app)
      .post(`/anime/episode/${episodeId}/comment/${commentId}/like/${otherProfileId}`)
      .set(bearer(ownerToken));
    expect(response.status).toBe(403);
  });

  test("no puede likear un comentario usando otro episodio", async () => {
    const otherEpisodeId = new ObjectId();
    const response = await request(app)
      .post(`/anime/episode/${otherEpisodeId}/comment/${commentId}/like/${ownerProfileId}`)
      .set(bearer(ownerToken));
    expect(response.status).toBe(404);
  });

  test("puede likear su propio comentario", async () => {
    const response = await request(app)
      .post(`/anime/episode/${episodeId}/comment/${commentId}/like/${ownerProfileId}`)
      .set(bearer(ownerToken));
    expect([200, 201]).toContain(response.status);
  });

  test("un usuario no puede resenar con el perfil de otro", async () => {
    const response = await request(app)
      .post(`/anime/${animeId}/review/new`)
      .set(bearer(ownerToken))
      .send({
        title: "Titulo",
        review: "Contenido",
        profileId: String(otherProfileId),
      });
    expect(response.status).toBe(403);
  });
});

describe("IDOR en perfiles y listas", () => {
  test("no puede listar perfiles de otro usuario", async () => {
    const response = await request(app)
      .get(`/user/${otherId}/profile/d/all`)
      .set(bearer(ownerToken));
    expect(response.status).toBe(403);
  });

  test("sí puede listar sus propios perfiles", async () => {
    const response = await request(app)
      .get(`/user/${ownerId}/profile/d/all`)
      .set(bearer(ownerToken));
    expect(response.status).toBe(200);
    expect(response.body.profiles).toHaveLength(1);
  });

  test("no puede borrar un perfil ajeno", async () => {
    const response = await request(app)
      .delete(`/user/profile/${otherProfileId}/delete`)
      .set(bearer(ownerToken));
    expect(response.status).toBe(403);
  });

  test("borrar un perfil elimina su contenido personal", async () => {
    await dbClient.collection("profiles").insertOne({
      _id: cascadeProfileId,
      name: "Cascade",
      photo: "",
      userId: ownerId,
    });
    await dbClient.collection("comments").insertOne({
      date: Date.now(),
      profileId: String(cascadeProfileId),
      content: "comentario temporal",
      profileName: "Cascade",
      profileImage: "",
      episodeId,
    });
    await dbClient.collection("reviews").insertOne({
      review: "reseña temporal",
      animeId,
      title: "tmp",
      profileId: String(cascadeProfileId),
      profileName: "Cascade",
      profileImage: "",
      createdAt: Date.now(),
    });
    await dbClient.collection("likes").insertOne({
      animeId,
      profileId: cascadeProfileId,
    });
    await dbClient.collection("learningProgress").insertOne({
      profileId: String(cascadeProfileId),
      animeId: String(animeId),
      notes: "tmp",
    });
    await dbClient.collection("episodeLearningProgress").insertOne({
      profileId: String(cascadeProfileId),
      animeId: String(animeId),
      episodeId: String(episodeId),
      notes: "tmp",
    });

    const response = await request(app)
      .delete(`/user/profile/${cascadeProfileId}/delete`)
      .set(bearer(ownerToken));
    expect(response.status).toBe(200);

    const [comments, reviews, likes, progress, episodeProgress] =
      await Promise.all([
        dbClient.collection("comments").countDocuments({
          profileId: String(cascadeProfileId),
        }),
        dbClient.collection("reviews").countDocuments({
          profileId: String(cascadeProfileId),
        }),
        dbClient.collection("likes").countDocuments({
          profileId: cascadeProfileId,
        }),
        dbClient.collection("learningProgress").countDocuments({
          profileId: String(cascadeProfileId),
        }),
        dbClient.collection("episodeLearningProgress").countDocuments({
          profileId: String(cascadeProfileId),
        }),
      ]);

    expect([comments, reviews, likes, progress, episodeProgress]).toEqual([
      0, 0, 0, 0, 0,
    ]);
  });

  test("no puede leer el historial ajeno", async () => {
    const response = await request(app)
      .get(`/user/profile/${otherProfileId}/history`)
      .set(bearer(ownerToken));
    expect(response.status).toBe(403);
  });
});

describe("sesión y datos expuestos", () => {
  test("/me exige token y no devuelve el hash", async () => {
    expect((await request(app).get("/me")).status).toBe(401);

    const response = await request(app).get("/me").set(bearer(ownerToken));
    expect(response.status).toBe(200);
    expect(response.body.user).not.toHaveProperty("password");
    expect(response.body.profiles).toHaveLength(1);
  });

  test("login inválido devuelve 401 genérico", async () => {
    const response = await request(app)
      .post("/user/login")
      .send({ email: "owner@example.com", password: "incorrecta" });
    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Credenciales inválidas");
  });

  test("login válido devuelve un token", async () => {
    const response = await request(app)
      .post("/user/login")
      .send({ email: "owner@example.com", password: "Password123!" });
    expect(response.status).toBe(200);
    expect(typeof response.body.user).toBe("string");
  });

  test("listado de usuarios es solo admin y sin password", async () => {
    expect((await request(app).get("/user/d/all?page=1&limit=10").set(bearer(ownerToken))).status).toBe(403);

    const response = await request(app)
      .get("/user/d/all?page=1&limit=10")
      .set(bearer(adminToken));
    expect(response.status).toBe(200);
    expect(response.body.user[0]).not.toHaveProperty("password");
  });

  test("crear administrador exige token de admin", async () => {
    expect(
      (
        await request(app)
          .post("/admin/new")
          .send({ email: "nuevo@example.com", password: "Password123!" })
      ).status,
    ).toBe(401);
  });

  test("logout de usuario invalida el token", async () => {
    const logout = await request(app)
      .post("/user/logout")
      .set(bearer(otherToken));
    expect(logout.status).toBe(200);

    const me = await request(app).get("/me").set(bearer(otherToken));
    expect(me.status).toBe(401);
  });

  test("logout de admin invalida el token", async () => {
    const logout = await request(app)
      .post("/admin/logout")
      .set(bearer(adminToken));
    expect(logout.status).toBe(200);

    const me = await request(app).get("/admin/me").set(bearer(adminToken));
    expect([401, 403]).toContain(me.status);
  });
});

describe("motor de fuentes deshabilitado en producción", () => {
  const originalAppEnv = process.env.APP_ENV;
  const originalSourcesEnabled = process.env.SOURCES_ENABLED;

  beforeAll(() => {
    process.env.APP_ENV = "production";
    process.env.SOURCES_ENABLED = "false";
  });

  afterAll(() => {
    if (originalAppEnv === undefined) delete process.env.APP_ENV;
    else process.env.APP_ENV = originalAppEnv;
    if (originalSourcesEnabled === undefined) delete process.env.SOURCES_ENABLED;
    else process.env.SOURCES_ENABLED = originalSourcesEnabled;
  });

  const paths = [
    "/sources",
    "/sources/jkanime/health",
    "/sources/jkanime/search?q=naruto",
    "/sources/jkanime/catalog?sort=popular",
    "/sources/jkanime/anime/naruto",
    "/sources/jkanime/anime/naruto/episodes",
    "/sources/jkanime/anime/naruto/episode/1/servers",
    "/sources/animeonsen/playback/token/manifest.mpd",
    "/sources/animeonsen/playback/token/segment.m4s",
    `/anime/${animeId}/sources`,
  ];

  for (const path of paths) {
    test(`GET ${path} responde 404`, async () => {
      const response = await request(app).get(path);
      expect(response.status).toBe(404);
    });
  }

  test("import responde 404 antes de auth/DB", async () => {
    const response = await request(app)
      .post("/sources/jkanime/import")
      .send({ externalId: "naruto" });
    expect(response.status).toBe(404);
  });

  test("refresh responde 404 antes de auth/DB", async () => {
    const response = await request(app).post(
      `/anime/episode/${episodeId}/servers/refresh`,
    );
    expect(response.status).toBe(404);
  });

  test("getEpisodes mantiene JKAnime legacy visible", async () => {
    const jkanimeEpisodeId = new ObjectId();
    await dbClient.collection("episodes").insertOne({
      _id: jkanimeEpisodeId,
      name: "Episodio JKAnime",
      episodeNumber: 98,
      thumbnail: "",
      synopsis: "",
      link: "https://jkanime.net/test/98/",
      animeId,
      profileId: "",
      isGlobal: true,
      external: true,
      sourceId: "jkanime",
      servers: [{ id: "s1", name: "JK", url: "https://jkanime.net/x", kind: "embed" }],
    });

    const response = await request(app).get(`/anime/${animeId}/episode/all`);
    expect(response.status).toBe(200);

    const episode = response.body.episodes.find(
      (item: { _id: string }) => String(item._id) === String(jkanimeEpisodeId),
    );
    expect(episode.link).toBe("https://jkanime.net/test/98/");
    expect(episode.servers).toHaveLength(1);
    expect(episode.sourceId).toBe("jkanime");
    expect(episode.legacyPlayback).toBe(true);
    expect(episode.externalUnavailable).toBeUndefined();
  });

  test("getEpisodes redacta AnimeOnsen", async () => {
    const animeonsenEpisodeId = new ObjectId();
    await dbClient.collection("episodes").insertOne({
      _id: animeonsenEpisodeId,
      name: "Episodio AnimeOnsen",
      episodeNumber: 97,
      thumbnail: "",
      synopsis: "",
      link: "https://cdn.animeonsen.xyz/watch/97",
      animeId,
      profileId: "",
      isGlobal: true,
      external: true,
      sourceId: "animeonsen",
      servers: [
        {
          id: "s1",
          name: "AnimeOnsen",
          url: "https://cdn.animeonsen.xyz/watch/97",
          kind: "embed",
        },
      ],
    });

    const response = await request(app).get(`/anime/${animeId}/episode/all`);
    expect(response.status).toBe(200);

    const episode = response.body.episodes.find(
      (item: { _id: string }) => String(item._id) === String(animeonsenEpisodeId),
    );
    expect(episode.link).toBe("");
    expect(episode.servers).toEqual([]);
    expect(episode.sourceId).toBeUndefined();
    expect(episode.external).toBe(false);
    expect(episode.externalUnavailable).toBe(true);
  });
});
