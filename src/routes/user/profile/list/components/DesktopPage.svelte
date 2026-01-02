<script>
    import axios from "axios";
    import AnimeReccomendation from "../../../../../components/AnimeReccomendation.svelte";
    import AnimeCard from "../../../../../components/AnimeCard.svelte";
    import Loader from "../../../../../components/Loader.svelte";
    import Header from "../../../../Header.svelte";
    import getCookie from "$lib/getCookie";
    import { goto } from "$app/navigation";

    import NotFoundError from "../../../../../components/NotFoundError.svelte";
    import ComboBox from "../../../../../components/ComboBox.svelte";
    import IconButton from "./IconButton.svelte";
    import Button from "../../../../../components/Button.svelte";
    import { Chart } from "chart.js/auto";
    import { PUBLIC_API_URL } from "$env/static/public";

    export let loaded = false;
    export let profileId = "";
    export let profileImage = "";
    export let profileName = "";
    export let logged = "nosesabe";
    export let selectedList = "";
    export let lists = [];
    export let animes = [];
    export let isThereAnime = null;
    export let animeRandom;
    export let newListName = "";
    export let createButtonText = "Create";
    export let analyticsPage = false;
    export let listCanvasElement;
    export let listChart;
    export let genreChartCanvas;
    export let genreChart;
    export let animeGenres;
    export let display = false;

    const createNewList = async () => {
        if (newListName.length > 0) {
            createButtonText = "Creating...";

            await axios.post(
                `${PUBLIC_API_URL}/user/profile/${profileId}/list/new`,
                { name: newListName },
            );
            let listsFetch = await axios(
                `${PUBLIC_API_URL}/user/profile/${profileId}/list/all`,
            );
            lists = listsFetch.data.lists;
            createButtonText = "Created";
            newListName = "";

            display = false;
            createButtonText = "Create";
        }
    };
    function createChart() {
        if (analyticsPage) {
            // Usamos Map para un conteo y búsqueda mucho más rápidos (O(1) en promedio)
            const genreCount = new Map();
            const listCount = new Map();
            const processedAnimes = new Set(); // Para evitar procesar animes duplicados

            // --- 1. Procesamiento de géneros ---
            for (const anime of animes) {
                // Si el nombre del anime ya fue procesado, lo saltamos.
                if (processedAnimes.has(anime.name)) {
                    continue;
                }
                processedAnimes.add(anime.name); // Marcamos este anime como procesado

                // Recorremos los géneros del anime actual
                for (const genre of anime.genres) {
                    // Obtenemos el conteo actual (o 0 si no existe) y le sumamos 1
                    const count = (genreCount.get(genre) || 0) + 1;
                    genreCount.set(genre, count);
                }
            }

            // --- 2. Procesamiento de animes por lista ---
            // Primero, mapeamos los nombres de las listas por su ID para fácil acceso
            const listIdToName = new Map();
            for (const list of lists) {
                listIdToName.set(list._id, list.name);
                listCount.set(list.name, 0); // Inicializamos el contador de cada lista en 0
            }

            // Contamos los animes en cada lista
            for (const anime of animes) {
                if (listIdToName.has(anime.listId)) {
                    const listName = listIdToName.get(anime.listId);
                    // Incrementamos el contador para esa lista
                    const count = listCount.get(listName) + 1;
                    listCount.set(listName, count);
                }
            }

            // --- 3. Preparación de datos para los gráficos ---
            // Extraemos los datos de los Map para pasarlos a Chart.js
            const genreLabels = [...genreCount.keys()];
            const genreData = [...genreCount.values()];
            const listLabels = [...listCount.keys()];
            const listData = [...listCount.values()];

            // --- 4. Creación de los gráficos (esta parte es igual) ---
            const genreChartCtx = genreChartCanvas.getContext("2d");
            const listChartCtx = listCanvasElement.getContext("2d");

            if (listChart) {
                listChart.destroy();
            }
            if (genreChart) {
                genreChart.destroy();
            }
            listChart = new Chart(listChartCtx, {
                type: "doughnut",
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: "top",
                        },
                        title: {
                            display: true,
                            text: "Amount of animes per list",
                        },
                    },
                },
                data: {
                    labels: listLabels,
                    datasets: [
                        {
                            label: "Animes",
                            data: listData,
                        },
                    ],
                },
            });
            genreChart = new Chart(genreChartCtx, {
                type: "doughnut",
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: "top",
                        },
                        title: {
                            display: true,
                            text: "Distribution of genres",
                        },
                    },
                },
                data: {
                    labels: genreLabels,
                    datasets: [
                        {
                            label: "Animes",
                            data: genreData,
                        },
                    ],
                },
            });
        }
    }
</script>

<svelte:head>
    <title>Your List</title>
</svelte:head>
{#if loaded}
    {#if !isThereAnime}
        <Header {logged} {profileImage} name={profileName} />

        <NotFoundError
            text={`You don't have any anime here... `}
            image={`${PUBLIC_API_URL}/static/WhatsApp Image 2025-01-15 at 4.20.42 PM.jpeg`}
            link={true}
            linkText="Try adding one!"
            linkDirection="/directory"
        />
    {:else}
        <Header {logged} {profileImage} name={profileName} />
        <AnimeReccomendation animeData={animeRandom} {animeGenres} />

        <h2 style="margin:10px; display:flex; align-items:center; ">
            Your lists. Let's watch something! <ComboBox
                selecteed={$selectedList}
                data={lists}
            />
            <IconButton
                on:click={() => (display = display == true ? false : true)}
            />
            {#if display}<input
                    bind:value={newListName}
                    placeholder="Insert a name for the list"
                />

                <Button
                    marginLeft="10px"
                    onClick={() => createNewList(newListName)}
                    ><svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="20px"
                        viewBox="0 -960 960 960"
                        width="20px"
                        fill="#fff"
                        ><path
                            d="M444-444H240v-72h204v-204h72v204h204v72H516v204h-72v-204Z"
                        /></svg
                    >{createButtonText}</Button
                >{/if}
            <button
                class="analyticsButton"
                title="Visualize your list stats"
                on:click={() => {
                    analyticsPage = analyticsPage ? false : true;
                    if (analyticsPage) {
                        createChart();
                    }
                }}
                ><svg
                    xmlns="http://www.w3.org/2000/svg"
                    style="margin-right: 3px;"
                    height="20px"
                    viewBox="0 -960 960 960"
                    width="20px"
                    fill="#000000e6"
                    ><path
                        d="M441-82Q287-97 184-211T81-480q0-155 103-269t257-129v120q-104 14-172 93t-68 185q0 106 68 185t172 93v120Zm80 0v-120q94-12 159-78t79-160h120q-14 143-114.5 243.5T521-82Zm238-438q-14-94-79-160t-159-78v-120q143 14 243.5 114.5T879-520H759Z"
                    /></svg
                >{analyticsPage ? "Hide Analytics" : "Show Analytics"}</button
            >
        </h2>
        <div
            class="anime_card_container"
            style={`display:${analyticsPage ? "none" : "flex"};`}
        >
            {#if animes.find((e) => e.listId === $selectedList)}
                {#each animes as anime}
                    {#if anime.listId === $selectedList}
                        <AnimeCard animeData={anime} />
                    {/if}
                {/each}
            {:else}
                <div
                    style="display:flex; justify-content:center; align-items:center; width:100%; height: 500px;"
                >
                    <img
                        src={`${PUBLIC_API_URL}/static/notFound.png`}
                        style="width: 400px; height:400px;"
                        alt="animes not found"
                    />
                </div>
            {/if}
        </div>
        <div
            class="chartContainer"
            style={`visibility: ${analyticsPage ? "visible" : "hidden"}`}
        >
            <div class="chartItem" style="margin-right: 30px;">
                <canvas bind:this={listCanvasElement}></canvas>
            </div>
            <div class="chartItem">
                <canvas bind:this={genreChartCanvas}></canvas>
            </div>
        </div>
    {/if}
{:else}
    <div
        style="width:100%;height:100%; display:flex; justify-content:center;margin-top:100px;"
    >
        <Loader />
    </div>
{/if}

<style>
    .anime_card_container {
        display: flex;
        align-items: center;
        flex-direction: row;
        flex-wrap: wrap;
        margin-left: 10px;
        margin-top: 20px;
    }
    input {
        margin-left: 10px;
        border: none;
        outline: none;
        padding-left: 10px;
        padding-right: 10px;
        font-weight: bold;
        padding-top: 10px;
        padding-bottom: 10px;
        border-radius: 5px;
        box-shadow: 4px 4px 0px black;
        border: 1px solid black;
        transition: 0.1s;
    }
    input:focus {
        border: 1px solid gray;
        box-shadow: 4px 4px 0px gray;
    }
    div.chartContainer {
        display: block;
        width: 100%;
        margin-top: 50px;
        display: flex;
        justify-content: center;
        align-items: center;
        padding-bottom: 30px;
    }
    button.analyticsButton {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: 10px;
        padding-left: 20px;
        padding-right: 20px;
        padding-top: 5px;
        padding-bottom: 5px;
        border: 1px solid black;
        border-radius: 5px;
        font-size: 20px;
        font-weight: bold;
        background: none;
        cursor: pointer;
        transition: 0.1s;
    }
    button.analyticsButton:hover {
        box-shadow: 4px 4px 1px black;
    }
    canvas {
        width: 400px;
        height: 400px;
    }
</style>
