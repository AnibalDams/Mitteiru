import { describe, expect, test } from "bun:test";
import {
  normalizeJkanimeEpisodeNumber,
  normalizeJkanimeSlug,
  parseJkanimeAnime,
  parseJkanimeCards,
  parseJkanimeCsrf,
  parseJkanimeEmbeddedAnimes,
  parseJkanimeEpisodeCount,
  parseJkanimeEpisodeNumbers,
  parseJkanimeEpisodesJson,
  parseJkanimeInternalId,
  parseJkanimeServers,
} from "../adapters/jkanime.parser";
import {
  animeOnsenBanner,
  animeOnsenCdnBase,
  animeOnsenDetailsUrl,
  animeOnsenPoster,
  animeOnsenWatchUrl,
  normalizeAnimeOnsenEpisodeNumber,
  normalizeAnimeOnsenId,
  parseAnimeOnsenAnime,
  parseAnimeOnsenCatalog,
  parseAnimeOnsenEpisodes,
  parseAnimeOnsenJwtExp,
  parseAnimeOnsenSearch,
  parseAnimeOnsenSearchMeta,
  parseAnimeOnsenSessionToken,
  parseAnimeOnsenVideo,
} from "../adapters/animeonsen.parser";
import { listSources } from "../registry";
import { measureHealth } from "../health";
import { SourceBlockedError } from "../errors";
import { selectEpisodes } from "../selection";

const jkanimeCtx = { sourceId: "jkanime", baseUrl: "https://jkanime.net" };
const animeonsenCtx = {
  sourceId: "animeonsen",
  baseUrl: "https://www.animeonsen.xyz",
};

describe("jkanime parser", () => {
  test("normaliza slug y episodio", () => {
    expect(normalizeJkanimeSlug("https://jkanime.net/naruto/")).toBe("naruto");
    expect(normalizeJkanimeSlug("/one-piece/")).toBe("one-piece");
    expect(normalizeJkanimeEpisodeNumber("12")).toBe(12);
    expect(normalizeJkanimeEpisodeNumber("https://jkanime.net/naruto/12/")).toBe(12);
    expect(() => normalizeJkanimeSlug("directorio")).toThrow();
    expect(() => normalizeJkanimeSlug("../admin")).toThrow();
    expect(() => normalizeJkanimeEpisodeNumber("0")).toThrow();
  });

  test("parsea tarjetas del directorio", () => {
    const html = `
      <div class="anime__item">
        <a href="/naruto/">
          <div class="anime__item__pic set-bg" data-setbg="https://cdn.example/naruto.jpg"></div>
        </a>
        <div class="anime__item__text">
          <h5><a href="/naruto/">Naruto</a></h5>
          <ul><li>TV</li></ul>
        </div>
      </div>
      <a href="/directorio/">Directorio</a>
    `;

    const page = parseJkanimeCards(html, jkanimeCtx, 1);
    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.externalId).toBe("naruto");
    expect(page.items[0]?.title).toBe("Naruto");
    expect(page.items[0]?.poster).toBe("https://cdn.example/naruto.jpg");
    expect(page.items[0]?.url).toBe("https://jkanime.net/naruto/");
  });

  test("parsea la ficha del anime", () => {
    const html = `
      <html>
        <head><meta property="og:image" content="https://cdn.example/poster.jpg" /></head>
        <body>
          <h1 class="title">Naruto</h1>
          <div class="anime__details__pic" data-setbg="https://cdn.example/naruto.jpg"></div>
          <div class="anime__details__text">
            <p>Una historia de ninjas.</p>
            <p>Año: 2002</p>
            <p>Estudio: Pierrot</p>
            <p>En emisión</p>
          </div>
          <a href="/genero/accion/">Acción</a>
          <a href="/naruto/1/">1</a>
          <a href="/naruto/2/">2</a>
        </body>
      </html>
    `;

    const anime = parseJkanimeAnime(html, "naruto", jkanimeCtx);
    expect(anime.title).toBe("Naruto");
    expect(anime.poster).toBe("https://cdn.example/naruto.jpg");
    expect(anime.year).toBe("2002");
    expect(anime.studio).toBe("Pierrot");
    expect(anime.status).toBe("ongoing");
    expect(anime.genres).toEqual(["Acción"]);
    expect(anime.episodeCount).toBe(2);
  });

  test("extrae números de episodio de enlaces y data attributes", () => {
    const html = `
      <a href="/naruto/1/">1</a>
      <a href="/naruto/2/">2</a>
      <button data-episode="3"></button>
      <a href="/naruto/2/">2 bis</a>
    `;
    expect(parseJkanimeEpisodeNumbers(html, "naruto")).toEqual([1, 2, 3]);
  });

  test("parsea servidores y descarta anuncios", () => {
    const html = `
      <iframe src="https://jkanime.net/um.php?e=abc123"></iframe>
      <iframe src="https://google.com/ads"></iframe>
      <a data-server="StreamTape" href="https://streamtape.com/e/xyz">StreamTape</a>
      <script>var url = "https://cdn.example/ep.m3u8";</script>
    `;

    const servers = parseJkanimeServers(html, jkanimeCtx);
    expect(servers.map((server) => server.url)).toContain(
      "https://jkanime.net/um.php?e=abc123",
    );
    expect(servers.map((server) => server.url)).toContain(
      "https://streamtape.com/e/xyz",
    );
    expect(servers.map((server) => server.url)).toContain(
      "https://cdn.example/ep.m3u8",
    );
    expect(servers.some((server) => server.url.includes("google"))).toBe(false);
    expect(servers.find((server) => server.url.endsWith(".m3u8"))?.kind).toBe("hls");
  });

  test("parsea la ficha del layout actual (anime_data)", () => {
    const html = `
      <div class="anime__details__content">
        <div class="anime_pic"><img src="https://cdn.example/boruto.jpg" /></div>
        <h3>Boruto: Naruto Next Generations</h3>
        <p class="scroll">Una secuela de Naruto.</p>
        <div class="anime_data">
          <ul>
            <li><span>Tipo:</span> Serie</li>
            <li><span>Generos:</span> <a href="/genero/accion/">Accion</a></li>
            <li><span>Studios:</span> <a href="/studio/1/">Pierrot</a></li>
            <li><span>Temporada:</span> Primavera 2017</li>
            <li><span>Episodios:</span> 293</li>
            <li><span>Estado:</span> <div>Concluido</div></li>
          </ul>
        </div>
      </div>
    `;

    const anime = parseJkanimeAnime(html, "boruto", jkanimeCtx);
    expect(anime.title).toBe("Boruto: Naruto Next Generations");
    expect(anime.poster).toBe("https://cdn.example/boruto.jpg");
    expect(anime.synopsis).toBe("Una secuela de Naruto.");
    expect(anime.studio).toBe("Pierrot");
    expect(anime.year).toBe("2017");
    expect(anime.status).toBe("finished");
    expect(anime.episodeCount).toBe(293);
    expect(anime.type).toBe("Serie");
  });

  test("parsea el JSON embebido del directorio", () => {
    const html = `
      <script>
        var animes = {"current_page":1,"data":[
          {"id":1,"title":"Naruto","synopsis":"Ninjas","image":"https://cdn.example/naruto.jpg","slug":"naruto","type":"TV","status":"finished","estado":"Concluido","url":"https://jkanime.net/naruto/"},
          {"id":2,"title":"Directorio","slug":"directorio","type":"TV","status":"airing"}
        ],"next_page_url":"https://jkanime.net/directorio?p=2","per_page":30,"total":5056};
      </script>
    `;

    const page = parseJkanimeEmbeddedAnimes(html, jkanimeCtx, 1);
    expect(page).toBeDefined();
    expect(page?.items).toHaveLength(1);
    expect(page?.items[0]?.externalId).toBe("naruto");
    expect(page?.items[0]?.status).toBe("finished");
    expect(page?.hasNextPage).toBe(true);
  });

  test("extrae id interno, csrf y contador de episodios", () => {
    const html = `
      <meta name="csrf-token" content="token123" />
      <div id="guardar-anime" data-anime="2034"></div>
      <li><span>Episodios:</span> 293</li>
    `;

    expect(parseJkanimeInternalId(html)).toBe("2034");
    expect(parseJkanimeCsrf(html)).toBe("token123");
    expect(parseJkanimeEpisodeCount(html)).toBe(293);
  });

  test("parsea la respuesta AJAX de episodios", () => {
    const payload = {
      total: 293,
      data: [
        { number: 1, id: 34477, image: "thumb01.jpg" },
        { number: 2, id: 34478, image: "https://cdn.example/thumb2.jpg" },
      ],
    };

    const result = parseJkanimeEpisodesJson(
      payload,
      "boruto",
      jkanimeCtx,
      "https://cdn.example/poster.jpg",
    );

    expect(result.total).toBe(293);
    expect(result.items.map((episode) => episode.number)).toEqual([1, 2]);
    expect(result.items[0]?.thumbnail).toBe(
      "https://cdn.jkdesa.com/assets/images/animes/video/image_thumb/thumb01.jpg",
    );
    expect(result.items[1]?.thumbnail).toBe("https://cdn.example/thumb2.jpg");
  });

  test("parsea reproductores inyectados como video[N]", () => {
    const html = `
      <a id="btn-show-0" data-id="0" class="servers btn-show" href="#option0">Desu</a>
      <a id="btn-show-1" data-id="1" class="servers btn-show" href="#option1">Magi</a>
      <script>
        video[0] = '<iframe class="player_conte" src="https://jkanime.net/jkplayer/um?e=abc&t=xyz" width="565"></iframe>';
        video[1] = '<iframe class="player_conte" src="https://jkanime.net/jkplayer/umv?e=def&t=xyz"></iframe>';
        video[2] = '<iframe class="player_conte" src="https://jkanime.net/jkplayer/c1?u='+val.remote+'"></iframe>';
      </script>
    `;

    const servers = parseJkanimeServers(html, jkanimeCtx);
    expect(servers).toHaveLength(2);
    expect(servers[0]?.name).toBe("Desu");
    expect(servers[1]?.name).toBe("Magi");
    expect(servers[0]?.url).toContain("/jkplayer/um?e=abc");
    expect(servers[1]?.url).toContain("/jkplayer/umv?e=def");
  });
});

describe("animeonsen parser", () => {
  test("normaliza IDs y episodios", () => {
    expect(normalizeAnimeOnsenId("lfrM76YJy8899DUN")).toBe("lfrM76YJy8899DUN");
    expect(
      normalizeAnimeOnsenId("https://www.animeonsen.xyz/details/lfrM76YJy8899DUN"),
    ).toBe("lfrM76YJy8899DUN");
    expect(
      normalizeAnimeOnsenId("https://www.animeonsen.xyz/watch/lfrM76YJy8899DUN?episode=1"),
    ).toBe("lfrM76YJy8899DUN");
    expect(() => normalizeAnimeOnsenId("../../etc/passwd")).toThrow();
    expect(normalizeAnimeOnsenEpisodeNumber("12")).toBe(12);
    expect(() => normalizeAnimeOnsenEpisodeNumber("0")).toThrow();
  });

  test("deriva el JWT de la cookie ao.session", () => {
    const token =
      "eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE3OTM1ODQyOTZ9.signature";
    const shifted = token
      .split("")
      .map((char) => String.fromCharCode(char.charCodeAt(0) - 1))
      .join("");
    const cookie = encodeURIComponent(
      Buffer.from(shifted, "utf8").toString("base64"),
    );

    expect(parseAnimeOnsenSessionToken(cookie)).toBe(token);
    expect(parseAnimeOnsenJwtExp(token)).toBe(1793584296);
  });

  test("parsea los meta tags de búsqueda", () => {
    const html = `
      <meta name="ao-search-origin" content="https://search.animeonsen.xyz/" />
      <meta name="ao-search-token" content="token123" />
    `;
    const meta = parseAnimeOnsenSearchMeta(html);
    expect(meta).toEqual({
      origin: "https://search.animeonsen.xyz",
      token: "token123",
    });
  });

  test("parsea resultados de Meilisearch", () => {
    const payload = {
      hits: [
        {
          content_id: "lfrM76YJy8899DUN",
          content_title: "Dark Summoner to Dekiteiru",
          content_title_en: "I'm Dating a Dark Summoner",
          content_title_jp: "ダークサモナーとデキテイル",
        },
      ],
      offset: 0,
      limit: 30,
      estimatedTotalHits: 1,
    };

    const page = parseAnimeOnsenSearch(payload, animeonsenCtx, 1, 30);
    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.externalId).toBe("lfrM76YJy8899DUN");
    expect(page.items[0]?.title).toBe("I'm Dating a Dark Summoner");
    expect(page.items[0]?.poster).toBe(
      animeOnsenPoster("lfrM76YJy8899DUN"),
    );
    expect(page.items[0]?.url).toBe(
      animeOnsenDetailsUrl("lfrM76YJy8899DUN"),
    );
    expect(page.hasNextPage).toBe(false);
  });

  test("parsea el catálogo v4", () => {
    const payload = {
      cursor: { start: 0, limit: 30, next: [true, 1151] },
      content: [
        {
          content_id: "lfrM76YJy8899DUN",
          content_title: "Dark Summoner to Dekiteiru",
          content_title_en: "I'm Dating a Dark Summoner",
          total_episodes: 4,
          date_added: 1792956447,
        },
      ],
    };

    const page = parseAnimeOnsenCatalog(payload, animeonsenCtx, 1);
    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.episodeCount).toBe(4);
    expect(page.items[0]?.poster).toBe(
      animeOnsenPoster("lfrM76YJy8899DUN"),
    );
    expect(page.hasNextPage).toBe(true);
  });

  test("parsea la ficha extensive", () => {
    const payload = {
      content_id: "lfrM76YJy8899DUN",
      content_title: "Dark Summoner to Dekiteiru",
      content_title_en: "I'm Dating a Dark Summoner",
      is_movie: false,
      total_episodes: 4,
      mal_id: 63509,
      mal_data: {
        synopsis: "Amona, a dark summoner...",
        mean_score: 6.87,
        genres: [
          { id: 4, name: "Comedy" },
          { id: 10, name: "Fantasy" },
        ],
        status: "currently_airing",
        rating: "r+",
        studios: [{ id: 3335, name: "AtoriE" }],
      },
    };

    const anime = parseAnimeOnsenAnime(
      payload,
      "lfrM76YJy8899DUN",
      animeonsenCtx,
    );
    expect(anime.title).toBe("I'm Dating a Dark Summoner");
    expect(anime.altTitle).toBe("Dark Summoner to Dekiteiru");
    expect(anime.synopsis).toBe("Amona, a dark summoner...");
    expect(anime.status).toBe("ongoing");
    expect(anime.episodeCount).toBe(4);
    expect(anime.score).toBe(6.87);
    expect(anime.genres).toEqual(["Comedy", "Fantasy"]);
    expect(anime.studio).toBe("AtoriE");
    expect(anime.type).toBe("TV");
    expect(anime.poster).toBe(animeOnsenPoster("lfrM76YJy8899DUN"));
    expect(anime.banner).toBe(animeOnsenBanner("lfrM76YJy8899DUN"));
  });

  test("parsea episodios y construye la URL de watch", () => {
    const payload = {
      "1": {
        contentTitle_episode_en: "The Dark Summoner and the Stubborn Priest",
        contentTitle_episode_jp: "ダークサモナーと堅物神官",
      },
      "2": {
        contentTitle_episode_en: "The Dark Summoner is Trapped in a Room",
        contentTitle_episode_jp: "ダークサモナーと出られない部屋",
      },
    };

    const episodes = parseAnimeOnsenEpisodes(
      payload,
      "lfrM76YJy8899DUN",
      animeonsenCtx,
    );
    expect(episodes.map((episode) => episode.number)).toEqual([1, 2]);
    expect(episodes[0]?.title).toBe(
      "The Dark Summoner and the Stubborn Priest",
    );
    expect(episodes[0]?.url).toBe(
      animeOnsenWatchUrl("lfrM76YJy8899DUN", 1),
    );
  });

  test("parsea el video DASH y valida la base del CDN", () => {
    const payload = {
      uri: {
        stream:
          "https://cdn.animeonsen.xyz/video/mp4-dash/lfrM76YJy8899DUN/1/manifest.mpd",
        subtitles: {
          "en-US":
            "https://api.animeonsen.xyz/v4/subtitles/lfrM76YJy8899DUN/en-US/1",
        },
      },
    };

    const video = parseAnimeOnsenVideo(payload);
    expect(video.stream).toBe(
      "https://cdn.animeonsen.xyz/video/mp4-dash/lfrM76YJy8899DUN/1/manifest.mpd",
    );
    expect(video.subtitles["en-US"]).toBe(
      "https://api.animeonsen.xyz/v4/subtitles/lfrM76YJy8899DUN/en-US/1",
    );
    expect(animeOnsenCdnBase(video.stream)).toBe(
      "https://cdn.animeonsen.xyz/video/mp4-dash/lfrM76YJy8899DUN/1/",
    );
    expect(
      animeOnsenCdnBase("https://evil.example/video/manifest.mpd"),
    ).toBeUndefined();
  });
});

describe("registro y salud", () => {
  test("registra las fuentes activas con su contrato", () => {
    const sources = listSources();
    const ids = sources.map((source) => source.id);
    expect(ids).toContain("animeonsen");
    expect(ids).toContain("jkanime");
    expect(ids).not.toContain("animepahe");

    for (const source of sources) {
      expect(typeof source.search).toBe("function");
      expect(typeof source.getAnime).toBe("function");
      expect(typeof source.getEpisodes).toBe("function");
      expect(source.baseUrl.startsWith("https://")).toBe(true);
    }
  });

  test("measureHealth no lanza y reporta bloqueo", async () => {
    const health = await measureHealth("animeonsen", async () => {
      throw new SourceBlockedError("animeonsen", "Cloudflare bloqueó");
    });

    expect(health.status).toBe("blocked");
    expect(health.sourceId).toBe("animeonsen");
    expect(health.message).toContain("Cloudflare");
  });
});

describe("selección de episodios", () => {
  const episodes = [
    { sourceId: "x", externalId: "1", number: 1 },
    { sourceId: "x", externalId: "2", number: 2 },
    { sourceId: "x", externalId: "3", number: 3 },
  ];

  test("devuelve todos si no hay selección", () => {
    expect(selectEpisodes(episodes).selected).toHaveLength(3);
  });

  test("un array vacío significa ninguno", () => {
    expect(selectEpisodes(episodes, []).selected).toHaveLength(0);
  });

  test("filtra y cuenta omitidos", () => {
    const result = selectEpisodes(episodes, [1, 3, 99]);
    expect(result.selected.map((episode) => episode.number)).toEqual([1, 3]);
    expect(result.skipped).toBe(1);
  });
});
