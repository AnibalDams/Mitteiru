export let htmlPage = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mitteiru</title>
</head>
<style>
    *{
        font-family: Calibri;
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }
    .navBar{
        display: flex;
        margin: 10px;
        padding: 20px;
        justify-content: center;
        align-items: center;

    }
    .navBar span{
        font-weight: bold;
        font-size: 18px;
    }

    main.main_content{
        height: 500px;
        display: flex;
        background-image: linear-gradient(to top, white, transparent), linear-gradient(to bottom, white, transparent), url('https://img.freepik.com/foto-gratis/personaje-estilo-anime-espacio_23-2151134100.jpg');
        background-position: center;
        background-size: cover;
        justify-content: center;
        align-items: center;
    }
</style>
<body>
   <nav class="navBar">
    <span>Welcome to the mitteriru API!</span>
   </nav>

   <main class="main_content">
    <h1>The API that your anime app needs!</h1>
   </main>
</body>
</html>

`;
