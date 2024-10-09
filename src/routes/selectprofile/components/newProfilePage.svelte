<script>
    import Button from "../../../components/Button.svelte";
    import axios from "axios";
  import MiniLoader from "../../../components/miniLoader.svelte";
    export let userId;
    export let refresh
    const avatars = [
        "https://i.ibb.co/pnkd1F0/itadori.jpg",
        "https://i.ibb.co/6WXRy9h/new-game-001.jpg",
        "https://i.ibb.co/PhD35TJ/avatar.jpg",
        "https://i.ibb.co/BChyQmf/elaina.jpg",
        "https://i.ibb.co/RbGq17Y/The-Great-Jahy-Will-Not-Be-Defeated-10-17-2021.jpg",
        "https://i.ibb.co/0BmPX29/3a95db3e63c3b1482c74092e78e8f214.jpg",
        "https://i.ibb.co/y4M0z05/03kotoha-mitsuboshi-CS-0112rgb.jpg",
        "https://i.ibb.co/RgL46KG/8bdae1042d536c1c1921eec5e0bf40c4.jpg",
        "https://i.ibb.co/ww3pdRS/57f9c4f43709b4bbe0eb3e018253b95c.png",
        "https://i.ibb.co/b7XFdQC/59afdf34673fcfaf6b22272229b122d9.png",
        "https://i.ibb.co/tPZZ5TD/76ded5cf566572b7c2468adab778b7a9.jpg",
        "https://i.ibb.co/6yNzQh1/93b6be8e9e82d2a67ffc935ecbaee7b7.jpg",
        "https://i.ibb.co/NLTfW1b/640.jpg",
        "https://i.ibb.co/XZLMNwQ/838ecd220ab56904af3c95f7e80b6573.jpg",
        "https://i.ibb.co/3hDQSZc/81645-dv-D1-Ac67-Ikp-J.png",
        "https://i.ibb.co/KWRchY0/290836.jpg",
        "https://i.ibb.co/brdQ9Hs/Boku-no-Kokoro-no-Yabai-Yatsu-06-55.jpg",
        "https://i.ibb.co/mCG6Ycj/d55baaeea7677977d61a0509e19dc9dd.jpg",
        "https://i.ibb.co/0XpRZj2/d91a112d9e8a3afcb9df560f501ab79c.jpg",
        "https://i.ibb.co/rbPk7ym/e769c55b9ce0ef74bac3f0d9b99e5c99.jpg",
        "https://i.ibb.co/8rmrVHN/f46786db0303de2789c8185045228a741620725303-full.png",
        "https://i.ibb.co/7W1cQrv/image.jpg",
        "https://i.ibb.co/DW2tD75/Jump-Force-Shinra-Kusakabe.jpg",
        "https://i.ibb.co/4sjm6pD/kaoruhana.jpg",
        "https://i.ibb.co/0XLgCpm/Kimi-wa-Houkago-Insomnia-04-Large-33.jpg",
        "https://i.ibb.co/7JdWD71/Kimi-wa-Houkago-Insomnia-02-Large-05.jpg",
        "https://i.ibb.co/QrsjmG8/maxresdefault-0.jpg",
        "https://i.ibb.co/M1cYfqM/maxresdefault-1.jpg",
        "https://i.ibb.co/7XzQbgN/o0780044314763469521.jpg",
        "https://i.ibb.co/PZJ7TJm/portada-boku-no-kokoro-no-yabai-6.jpg",
        "https://i.ibb.co/N3BzYjH/portada-spy-x-family-79.jpg",
        "https://i.ibb.co/QmLtcDX/qqe1tji.png",
        "https://i.ibb.co/0GyN5Xw/Rin.png",
        "https://i.ibb.co/FYrmW6K/Skip-And-Loafer-Episode-3-But-Why-Tho.jpg",
        "https://i.ibb.co/K5bgZkK/toji-fushiguro-jujutsu-kaisen.jpg",
        "https://i.ibb.co/kSDqqN6/imw-5000-imh-5000-ima-fit-impolicy-Letterbox-imcolor-000000-letterbox-false.gif",
        "https://i.ibb.co/FqvtSpv/NxjWrSr.gif"
    ];
   
    export let name = "";
    export let avatar = "https://mitteiru-backend.onrender.com/static/itadori.jfif";
    export let cancel;
    export let variant = "create"
    let buttonCreatetext =variant=="create"? "create":"update";

    const createProfile = async () => {
        if (name.length > 0) {
            buttonCreatetext = "creating...";
            await axios.post(
                `https://mitteiru-backend.onrender.com/user/${userId}/profile/d/new`,

                {
                    name: name,
                    photo: avatar,
                },
            );
            buttonCreatetext = "Done";
            refresh()
            cancel();
        }
    };
 
</script>

<div class="container">
    <div class="input_container">
        <Button type="button" variant="light" onClick={cancel}>Cancel</Button>

        <input
            type="text"
            placeholder="Who's watching now?"
            bind:value={name}
        />
        <Button type="button" onClick={()=>{
            if(variant == "create" && buttonCreatetext !== "creating..."){
                createProfile()

            }
            }}>{buttonCreatetext}</Button
        ><div style={`margin-left: 5px; opacity:${buttonCreatetext==="creating..."?1:0};transition:0.1s;`}><MiniLoader/></div>
    </div>

    <div class="avatar_container">
        {#each avatars as avatarr}
            <button
                class="avatar"
                type="button"
                on:click={() => {
                    avatar = avatarr;
                }}
            >
                <img
                    style={`${avatar === avatarr ? "border:2px solid black;" : "border:none;"}`}
                    src={avatarr}
                    alt=""
                />
            </button>
        {/each}
    </div>
</div>

<style>
    .container {
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }
    .input_container {
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .avatar_container {
        margin-top: 10px;
        margin-left:10%;
        display: flex;
        justify-content: flex-start;
        flex-direction: row;
        flex-wrap: wrap;

    }
    .avatar {
        width: 200px;
        height: 200px;
        border-radius: 5px;
        margin-right: 10px;
        margin-bottom: 10px;
        background: none;
        border: none;
        outline: none;
        cursor: pointer;
    }
    .avatar img {
        width: 200px;
        height: 200px;
        border-radius: 5px;
        object-fit: cover;
        object-position:center;
        transition: 0.1s;
    }
    .avatar:hover img {
        box-shadow: 4px 4px 0px black;
    }

    input {
        margin-top: 10px;
        margin-right: 10px;
        margin-left: 10px;
        margin-bottom: 10px;
        border: none;
        outline: none;
        padding-left: 30px;
        padding-right: 30px;
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
</style>
