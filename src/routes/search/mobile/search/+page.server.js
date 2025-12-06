import axios from "axios";


export async function load() {
    const animes = (await axios("https://mitteiru-backend.onrender.com//anime/d/all")).data.animes;

    return {animes}
}