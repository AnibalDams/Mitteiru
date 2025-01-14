import axios from "axios";


export async function load() {
    const animes = (await axios("http://localhost:8000/anime/d/all")).data.animes;

    return {animes}
}