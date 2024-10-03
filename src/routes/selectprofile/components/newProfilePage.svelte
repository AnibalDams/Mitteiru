<script>
    import Button from "../../../components/Button.svelte";
    import axios from "axios";
    export let userId;
    export let refresh
    const avatars = [
        "http://localhost:8000/static/itadori.jfif",
        "http://localhost:8000/static/new-game-001.jpg",
        "http://localhost:8000/static/avatar.jfif",
        "http://localhost:8000/static/elaina.jpeg",
        "http://localhost:8000/static/The-Great-Jahy-Will-Not-Be-Defeated-10-17-2021.jpg",
        "http://localhost:8000/static/_0f569c2a-4582-4ba9-9d7b-ae0231063f23.jpeg",
        "http://localhost:8000/static/3a95db3e63c3b1482c74092e78e8f214.jpg",
        "http://localhost:8000/static/03kotoha_mitsuboshi_CS_0112rgb.jpg",
        "http://localhost:8000/static/8bdae1042d536c1c1921eec5e0bf40c4.jpg",
        "http://localhost:8000/static/37d729ae35622b8fc8de12835a502dec.gif",
        "http://localhost:8000/static/57f9c4f43709b4bbe0eb3e018253b95c.png",
        "http://localhost:8000/static/59afdf34673fcfaf6b22272229b122d9.png",
        "http://localhost:8000/static/76ded5cf566572b7c2468adab778b7a9.jpg",
        "http://localhost:8000/static/81EcwigTJML-1024x1536.jpg",
        "http://localhost:8000/static/93b6be8e9e82d2a67ffc935ecbaee7b7.jpg",
        "http://localhost:8000/static/640.jpg",
        "http://localhost:8000/static/838ecd220ab56904af3c95f7e80b6573.jpg",
        "http://localhost:8000/static/35730b009d4c2cc15a4b7b8aa43cfe4a.png",
        "http://localhost:8000/static/81645-dvD1Ac67IkpJ.png",
        "http://localhost:8000/static/290836.jpg",
        "http://localhost:8000/static/490925.jpg",
        "http://localhost:8000/static/a719a51abe6b4b4455f169b8a24055d4.jpg",
        "http://localhost:8000/static/b188008-m1E32k98zx86.jpg",
        "http://localhost:8000/static/b268677-w5w4MjfvBK3e.jpg",
        "http://localhost:8000/static/bg,f8f8f8-flat,750x,075,f-pad,750x1000,f8f8f8.jpg",
        "http://localhost:8000/static/Boku-no-Kokoro-no-Yabai-Yatsu-06-55.jpg",
        "http://localhost:8000/static/_c08d7451-365a-4639-8e4a-893a88d23d06.jpeg",
        "http://localhost:8000/static/_cc4027eb-653f-4507-984e-3addb9541204.jpeg",
        "http://localhost:8000/static/_cf55d49f-1d84-419c-94b1-c696461b3838.jpeg",
        "http://localhost:8000/static/d55baaeea7677977d61a0509e19dc9dd.jpg",
        "http://localhost:8000/static/d91a112d9e8a3afcb9df560f501ab79c.jpg",
        "http://localhost:8000/static/de60ae09d485b069b1214c40ca315bfc.png",
        "http://localhost:8000/static/e769c55b9ce0ef74bac3f0d9b99e5c99.jpg",
        "http://localhost:8000/static/f46786db0303de2789c8185045228a741620725303_full.png",
        "http://localhost:8000/static/Feature---Jujutsu-Kaisen---yuta-okkatsu.jpg",
        "http://localhost:8000/static/image.jpg",
        "http://localhost:8000/static/Jump-Force-Shinra-Kusakabe.jpg",
        "http://localhost:8000/static/kaoruhana.jpg",
        "http://localhost:8000/static/Kimi wa Houkago Insomnia - 02 - Large 05.jpg",
        "http://localhost:8000/static/Kimi wa Houkago Insomnia - 04 - Large 33.jpg",
        "http://localhost:8000/static/m0z0co9fp6491.jpg",
        "http://localhost:8000/static/maxresdefault.jpg",
        "http://localhost:8000/static/maxresdefault(0).jpg",
        "http://localhost:8000/static/maxresdefault(1).jpg",
        "http://localhost:8000/static/o0780044314763469521.jpg",
        "http://localhost:8000/static/portada_boku-no-kokoro-no-yabai-6.jpg",
        "http://localhost:8000/static/portada_spy-x-family-79.jpg",
        "http://localhost:8000/static/qqe1tji.png",
        "http://localhost:8000/static/reina-maldiciones-Yuta-Okkotsu.jpg",
        "http://localhost:8000/static/Rin.png",
        "http://localhost:8000/static/Skip-And-Loafer-Episode-3--But-Why-Tho.jpg",
        "http://localhost:8000/static/sukuna-prepares-to-open-his-domain-expansion-in-jujutsu-kaisen.jpg",
        "http://localhost:8000/static/thumb002.png",
        "http://localhost:8000/static/toji-fushiguro-jujutsu-kaisen.jpg",
    ];
   
    export let name = "";
    export let avatar = "http://localhost:8000/static/itadori.jfif";
    export let cancel;
    export let variant = "create"
    let buttonCreatetext =variant=="create"? "create":"update";
    export let profileId;

    const createProfile = async () => {
        if (name.length > 0) {
            buttonCreatetext = "creating...";
            await axios.post(
                `http://localhost:8000/user/${userId}/profile/d/new`,

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
    const updateProfile = async () => {
        if (name.length > 0) {
            buttonCreatetext = "creating...";
            await axios.put(
                `http://localhost:8000/user/profile/${profileId}`,

                {
                    name: name,
                    photo: avatar,
                    userId,
                },
            );
            buttonCreatetext = "Done";
            refresh()
            cancel();
        }
    }

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
        >
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
