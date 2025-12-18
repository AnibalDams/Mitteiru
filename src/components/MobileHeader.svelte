<script>
    import { CardStack, MagnifyingGlass } from "radix-icons-svelte";
    import { goto } from "$app/navigation";
    import { getCookie } from "svelte-cookie";
    import { onMount } from "svelte";

    let visible = false;
    export let profileImage =
        "https://i.ibb.co/Tx5165mR/1000-F-160282536-phkm-QJ06k-Ty-A8m-AYn-CXv-WKrfup1-HJVCz.jpg";
    export let logged = "no";

    // Cerrar menú al hacer clic fuera (opcional pero recomendado)
    const toggleMenu = () => (visible = !visible);
</script>

<nav class="nav_bar">
    <h1 on:click={() => goto("/")} class="logo">Mitteiru</h1>

    <div class="center_section">
        <a href="/directory" class="link">
            <CardStack size="18px" />
            <span>Directory</span>
        </a>
        <a href="/search/mobile/search" class="right_section link">
            <MagnifyingGlass size="18px" />
            <span>Search</span>
        </a>
    </div>

    <div class="profile_container">
        <img
            class="avatar"
            on:click={toggleMenu}
            src={logged == "no"
                ? "https://i.ibb.co/Tx5165mR/1000-F-160282536-phkm-QJ06k-Ty-A8m-AYn-CXv-WKrfup1-HJVCz.jpg"
                : profileImage}
            alt="Profile"
        />

        {#if visible}
            <div class="dropdown_menu">
                {#if logged == "no"}
                    <a href="/login">Login</a>
                    <a href="/signup">Register</a>
                {:else}
                    <a href="/user/profile/list">My list</a>
                    <a href="/user/profile/history">History</a>
                    <a href="/selectprofile">Change Profile</a>
                    <hr />
                    <a href="/logout" class="logout">Logout</a>
                {/if}
            </div>
        {/if}
    </div>
</nav>

<style>
    /* 1. Base de la Nav: Uso de box-sizing para evitar que el padding sume al ancho */
    .nav_bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 20px;
        background-color: white;
        box-sizing: border-box;
        width: 100%;
        position: relative;
        gap: 10px;
    }

    .logo {
        font-size: 1.2rem;
        cursor: pointer;
        margin: 0;
        white-space: nowrap; /* Evita que el nombre se parta en dos líneas */
    }

    /* 2. Sección central: Flexible */
    .center_section {
        display: flex;
        gap: 10px;
        flex-grow: 1; /* Permite que el centro ocupe el espacio disponible */
        justify-content: center;
    }

    /* 3. Links: Sin anchos fijos */
    a.link {
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 5px 12px; /* Padding en lugar de width fijo */
        border-radius: 8px;
        border: 1px solid black;
        text-decoration: none;
        color: black;
        font-size: 14px;
        transition: background 0.2s;
        white-space: nowrap;
    }

    /* 4. Perfil y Dropdown */
    .profile_container {
        position: relative; /* Importante para que el dropdown se posicione respecto a esto */
        display: flex;
        align-items: center;
    }

    .avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
        cursor: pointer;
        border: 2px solid transparent;
    }

    .avatar:hover {
        border-color: #ddd;
    }

    .dropdown_menu {
        position: absolute;
        top: calc(100% + 10px);
        right: 0; /* Alineado a la derecha para que no se salga de la pantalla */
        width: 160px;
        background-color: #333;
        border-radius: 10px;
        display: flex;
        flex-direction: column;
        padding: 10px 0;
        z-index: 100;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .dropdown_menu a {
        color: #eee;
        text-decoration: none;
        font-size: 14px;
        padding: 10px 20px;
    }

    .dropdown_menu a:hover {
        background-color: #444;
    }

    hr {
        border: 0;
        border-top: 1px solid #555;
        margin: 5px 0;
    }

    .logout {
        color: #ff5555 !important;
    }

    /* 5. RESPONSIVIDAD (Media Queries) */

    /* Para móviles pequeños */
    @media (max-width: 600px) {
        .logo {
            font-size: 1rem;
        }

        /* Ocultamos el texto de los botones para ahorrar espacio, dejamos solo iconos */
        a.link span {
            display: none;
        }

        a.link {
            padding: 8px;
            border-radius: 50%; /* Convertir en botones circulares */
        }

        .center_section {
            gap: 5px;
        }
    }

    /* Para pantallas muy pequeñas */
    @media (max-width: 400px) {
        .nav_bar {
            padding: 10px;
        }
    }
</style>
