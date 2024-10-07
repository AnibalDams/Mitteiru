<script>
    import Button from "../../../components/Button.svelte";
    import axios from "axios";
    export let userId;
    export let refresh
    const avatars = [
        "https://mitteiru-backend.onrender.com/static/itadori.jfif",
        "https://mitteiru-backend.onrender.com/static/new-game-001.jpg",
        "https://mitteiru-backend.onrender.com/static/avatar.jfif",
        "https://mitteiru-backend.onrender.com/static/elaina.jpeg",
        "https://mitteiru-backend.onrender.com/static/The-Great-Jahy-Will-Not-Be-Defeated-10-17-2021.jpg",
        "https://mitteiru-backend.onrender.com/static/_0f569c2a-4582-4ba9-9d7b-ae0231063f23.jpeg",
        "https://mitteiru-backend.onrender.com/static/3a95db3e63c3b1482c74092e78e8f214.jpg",
        "https://mitteiru-backend.onrender.com/static/03kotoha_mitsuboshi_CS_0112rgb.jpg",
        "https://mitteiru-backend.onrender.com/static/8bdae1042d536c1c1921eec5e0bf40c4.jpg",
        "https://mitteiru-backend.onrender.com/static/37d729ae35622b8fc8de12835a502dec.gif",
        "https://mitteiru-backend.onrender.com/static/57f9c4f43709b4bbe0eb3e018253b95c.png",
        "https://mitteiru-backend.onrender.com/static/59afdf34673fcfaf6b22272229b122d9.png",
        "https://mitteiru-backend.onrender.com/static/76ded5cf566572b7c2468adab778b7a9.jpg",
        "https://mitteiru-backend.onrender.com/static/81EcwigTJML-1024x1536.jpg",
        "https://mitteiru-backend.onrender.com/static/93b6be8e9e82d2a67ffc935ecbaee7b7.jpg",
        "https://mitteiru-backend.onrender.com/static/640.jpg",
        "https://mitteiru-backend.onrender.com/static/838ecd220ab56904af3c95f7e80b6573.jpg",
        "https://mitteiru-backend.onrender.com/static/35730b009d4c2cc15a4b7b8aa43cfe4a.png",
        "https://mitteiru-backend.onrender.com/static/81645-dvD1Ac67IkpJ.png",
        "https://mitteiru-backend.onrender.com/static/290836.jpg",
        "https://mitteiru-backend.onrender.com/static/490925.jpg",
        "https://mitteiru-backend.onrender.com/static/a719a51abe6b4b4455f169b8a24055d4.jpg",
        "https://mitteiru-backend.onrender.com/static/b188008-m1E32k98zx86.jpg",
        "https://mitteiru-backend.onrender.com/static/b268677-w5w4MjfvBK3e.jpg",
        "https://mitteiru-backend.onrender.com/static/bg,f8f8f8-flat,750x,075,f-pad,750x1000,f8f8f8.jpg",
        "https://mitteiru-backend.onrender.com/static/Boku-no-Kokoro-no-Yabai-Yatsu-06-55.jpg",
        "https://mitteiru-backend.onrender.com/static/_c08d7451-365a-4639-8e4a-893a88d23d06.jpeg",
        "https://mitteiru-backend.onrender.com/static/_cc4027eb-653f-4507-984e-3addb9541204.jpeg",
        "https://mitteiru-backend.onrender.com/static/_cf55d49f-1d84-419c-94b1-c696461b3838.jpeg",
        "https://mitteiru-backend.onrender.com/static/d55baaeea7677977d61a0509e19dc9dd.jpg",
        "https://mitteiru-backend.onrender.com/static/d91a112d9e8a3afcb9df560f501ab79c.jpg",
        "https://mitteiru-backend.onrender.com/static/de60ae09d485b069b1214c40ca315bfc.png",
        "https://mitteiru-backend.onrender.com/static/e769c55b9ce0ef74bac3f0d9b99e5c99.jpg",
        "https://mitteiru-backend.onrender.com/static/f46786db0303de2789c8185045228a741620725303_full.png",
        "https://mitteiru-backend.onrender.com/static/Feature---Jujutsu-Kaisen---yuta-okkatsu.jpg",
        "https://mitteiru-backend.onrender.com/static/image.jpg",
        "https://mitteiru-backend.onrender.com/static/Jump-Force-Shinra-Kusakabe.jpg",
        "https://mitteiru-backend.onrender.com/static/kaoruhana.jpg",
        "https://mitteiru-backend.onrender.com/static/Kimi wa Houkago Insomnia - 02 - Large 05.jpg",
        "https://mitteiru-backend.onrender.com/static/Kimi wa Houkago Insomnia - 04 - Large 33.jpg",
        "https://mitteiru-backend.onrender.com/static/m0z0co9fp6491.jpg",
        "https://mitteiru-backend.onrender.com/static/maxresdefault.jpg",
        "https://mitteiru-backend.onrender.com/static/maxresdefault(0).jpg",
        "https://mitteiru-backend.onrender.com/static/maxresdefault(1).jpg",
        "https://mitteiru-backend.onrender.com/static/o0780044314763469521.jpg",
        "https://mitteiru-backend.onrender.com/static/portada_boku-no-kokoro-no-yabai-6.jpg",
        "https://mitteiru-backend.onrender.com/static/portada_spy-x-family-79.jpg",
        "https://mitteiru-backend.onrender.com/static/qqe1tji.png",
        "https://mitteiru-backend.onrender.com/static/reina-maldiciones-Yuta-Okkotsu.jpg",
        "https://mitteiru-backend.onrender.com/static/Rin.png",
        "https://mitteiru-backend.onrender.com/static/Skip-And-Loafer-Episode-3--But-Why-Tho.jpg",
        "https://mitteiru-backend.onrender.com/static/sukuna-prepares-to-open-his-domain-expansion-in-jujutsu-kaisen.jpg",
        "https://mitteiru-backend.onrender.com/static/thumb002.png",
        "https://mitteiru-backend.onrender.com/static/toji-fushiguro-jujutsu-kaisen.jpg",
    ];
   
    export let name = "";
    export let avatar = "https://mitteiru-backend.onrender.com/static/itadori.jfif";
    export let cancel;
    let buttonCreatetext ="update";
    export let profileId;

    const updateProfile = async () => {
        if (name.length > 0) {
            buttonCreatetext = "Updating...";
            await axios.put(
                `https://mitteiru-backend.onrender.com/user/profile/${profileId}`,

                {
                    admin:true,
                    name: name,
                    photo: avatar,
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
            placeholder="The new name of the profile"
            bind:value={name}
        />
        <Button type="button" onClick={()=>{

               if (buttonCreatetext !== "Updating...") {
                updateProfile()
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
