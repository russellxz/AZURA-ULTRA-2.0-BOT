const fs = require("fs");
const chalk = require("chalk");

// 📂 Ruta del archivo de configuración
const configFilePath = "./config.json";

// 🔹 Si `config.json` no existe, crearlo con el prefijo por defecto
if (!fs.existsSync(configFilePath)) {
    fs.writeFileSync(configFilePath, JSON.stringify({ prefix: "." }, null, 2));
}

// 🔹 Leer configuración desde `config.json`
const config = JSON.parse(fs.readFileSync(configFilePath, "utf-8"));

// 🔥 Prefijo global desde archivo de configuración
global.prefix = config.prefix || ".";

// Lista de Owners
global.owner = [
    ["15167096032", "Owner", true],
    ["115724051816605"],
    ["5491151545427"],
    ["595986172767"],
    ["507660673766"],
    ["50768888457"],
    ["584125778026"],
    ["5492266613038"],
    ["5841235528"],
    ["573242402359"],
    ["5217294888993"],
    ["5214437863111"],
    ["50768888888"],
    ["50582340051"],
    ["5217441298510"],
    ["5491155983299"],
    ["5493795319022"],
    ["5217821153974"],
    ["584163393168"],
    ["16475584916"],
    ["5216865268215"],
    ["5215639850287"],
    ["15167096032"],
    ["573012686632"],
    ["50498273976"]
];


// ✅ Lista de prefijos permitidos
global.allowedPrefixes = [
    ".", "!", "#", "?", "-", "+", "*", "~", "$", "&", "%", "=", "🔥", "💀", "✅", "🥰",
    "💎", "🐱", "🐶", "🌟", "🎃", "🍕", "🍔", "🍑", "🛠️", "📌", "⚡", "🚀", "👀", "💡", "💣", "💯", "😎", "☠️", "👾"
];

global.modoPrivado = false; // El modo privado está desactivado por defecto

// 🔍 Función para verificar si un usuario es Owner
global.isOwner = (user) => {
    user = user.replace(/[^0-9]/g, ""); // Limpiar número
    return global.owner.some(owner => owner[0] === user);
};

// ⚙️ Función para cambiar y guardar el prefijo en `config.json`
global.setPrefix = (newPrefix) => {
    if (global.allowedPrefixes.includes(newPrefix)) {
        global.prefix = newPrefix;
        config.prefix = newPrefix; // Actualizar el archivo JSON
        fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2)); // Guardar en `config.json`
        console.log(chalk.green(`✅ Prefijo cambiado a: ${chalk.yellow.bold(newPrefix)}`));
    } else {
        console.log(chalk.red(`❌ Prefijo no permitido. Usa uno de estos: ${chalk.blue.bold(global.allowedPrefixes.join(" "))}`));
    }
};
global.verdad = ["¿Alguna vez te ha gustado alguien? ¿Cuánto tiempo?", "¿cual es tu mas grande miedo?", "¿Alguna vez te ha gustado alguien y has sentido a esa persona como tú también?", "¿Cuál es el nombre del exnovio de tu amiga que una vez te gustó en secreto?", "¿Alguna vez has robado el dinero de tu madre/padre? ¿La razón?", "lo que te hace feliz cuando estás triste", "¿Alguna vez has sido amor no correspondido? ¿Si has estado con quién? ¿Cómo se siente brou?", "¿Alguna vez has tenido una aventura con alguien?", "lo más temido", "quién es la persona más influyente en tu vida", "qué orgullo tienes este año", "quién es la persona que puede enfermarte", "quien es la persona que alguna vez te puso cachondo", "(para los musulmanes) ¿nunca has rezado en todo el día?", "¿Quién es el más cercano a su tipo de pareja ideal aquí", "¿Con quién te gusta jugar?", "¿Alguna vez has rechazado a alguien? ¿Por qué?", "Menciona el incidente que te hizo daño y que aún recuerdas", "¿Qué logros has obtenido este año?", "¿Cuál es tu peor hábito en la escuela?", "¿Qué programa de televisión odias más? ¡Da la razón!", "¿Cuál es el vestido más feo (en su opinión) que ha usado y cuándo lo usó?", "¿Qué es lo peor (chisme) que has dicho sobre tu amigo?","¿Qué es lo más vergonzoso de ti?"," ¿Qué es lo primero que ves cuando miras a otra persona (del sexo opuesto)?", "¿Qué es lo primero que te viene a la mente cuando te miras al espejo?","¿Que es lo mas tonto que has hecho en tu vida?"," ¿Cuál es el peor sueño que has tenido?"," ¿Cuál es el sueño más loco que puedes recordar hasta ahora?", " ¿Cuál es tu peor rasgo en tu opinión?", " ¿Qué rasgo te gustaría cambiar de ti mismo?", " ¿Qué rasgo te gustaría cambiar en tu amigo?", " ¿Qué harías si tu novio te dijera que tienes mala nariz o dedos?", " ¿En qué piensas antes de dormir? ej: fantasear con una pareja, etc.", "¿Qué crees que se destaca más de ti?"," ¿Qué parte del cuerpo de tu amigo te gusta más y desearías tener?", "¿Qué parte de tu cuerpo odias más?"," De todas las clases de la escuela, ¿a qué clase le gustaría ingresar y qué clase le gustaría evitar?",  "¡Describe a tu amigo más cercano!"," ¡Descríbete en una palabra!"," ¿Qué películas y canciones te han hecho llorar?", " ¿Qué es algo que has mantenido en secreto hasta ahora y nadie lo ha descubierto?", " ¿Qué es lo más romántico que alguien (del sexo opuesto) te ha hecho o regalado?", "¿Qué es lo más desagradable que has experimentado?", " Si nacieras de nuevo y tuvieras que ser uno de tus amigos, ¿a quién elegirías ser?", " Si tienes superpoder, ¿qué quieres hacer?", " Si el apocalipsis llega pronto, ¿qué haces?", " Si te pidieran que te sometieras a una cirugía plástica con una muestra de rostro de tu compañero de clase, ¿a quién imitarías?", " Alguna vez has robado algo?", "¿Cuándo fue la última vez que lloraste y por qué?", " ¿Cuáles son tus habilidades especiales?", " ¿Cómo te puede gustar la persona que te gusta?", " ¿Cuál crees que es un buen rasgo de tu amigo más cercano que él o ella no conozca?", " ¿Con qué tipo de persona te gustaría casarte algún día?", " En tu opinión, ¿cuál es el trabajo más atractivo para el amigo que está sentado a tu lado? ¿Y por qué?", " ¿Con quién quieres intercambiar por un día? (amigos más cercanos que ambos conocen) y por qué", " ¿Alguna vez has esperado en secreto que la relación de alguien con su novia se rompiera? ¿Quién?", " ¿Prefiere AMIGAS o AMIGOS? ¿Por qué?", " ¿Qué cita recuerdas más y te gusta?", " ¿Qué secretos nunca les has contado a tus amigos hasta ahora?", " ¿Quiénes son sus verdaderos modelos a seguir?", " ¿Cuál de tus amigos crees que es matre?", " ¿Cuál de tus amigos crees que tiene menos corte de pelo?", " ¿Cuál de tus amigos es el más fotogénico?", " ¿Quién es tu mejor ex? ¡¿Y por qué rompieron ?!", " ¿Cómo se llama el artista con el que hablaste en secreto?", " ¿Cómo se llamaba el profesor que te gustaba?", " ¿Cuál es el nombre de la exnovia de tu amigo que te ha gustado en secreto?", " ¿Cuál es el nombre de la persona (del sexo opuesto) que crees que sería divertido ser novia?", " ¿Cuál es el nombre de la persona que odias, pero crees que le gustas a esa persona (no necesariamente del sexo opuesto)?", " ¿Cuál es el nombre de la persona a la que has estado señalando en secreto?", " ¿Quién es la persona (del sexo opuesto) que más se te pasa por la cabeza?", " ¿Quién es la persona más molesta entre tus amigos? ¡la razón!", " ¿A quién de tus amigos crees que debería renovarse?", " ¿Quién está más cerca de tu pareja ideal aquí?", "Padre o madre", "La parte del cuerpo que no te gusta", "¿Alguna vez has hecho trampa?", "¿Alguna vez te han besado?", "¿Qué es lo primero que harías si te despertaras como del sexo opuesto?", "¿Alguna vez has dejado que alguien más se meta en problemas por algo que hiciste?", "¿Qué es lo más embarazoso que has hecho en tu vida?", " ¿Cuál es la razón más ridícula por la que has roto con alguien?", " ¿Cuál es el peor hábito que tienes?", " ¿Cuál crees que es tu mejor característica? ¿Y que es lo peor?", " ¿Cuál es la cosa más valiente que has hecho?", " ¿Cuándo fue la última vez que mojaste la cama?", " ¿Con qué sueñas más sobre dormir?", " Si va a ganar dinero ilegalmente, ¿cómo lo hace?", " ¿Qué cosas infantiles sigues haciendo?", " ¿Qué es lo que más te impresiona?", " Si se le permitiera usar solo 3 palabras durante el resto de la noche a partir de ahora, ¿cuál sería?", " Si fueras un dictador, ¿qué ley promulgarías primero?", "Si vivieras durante la era nazi, ¿quién serías?", "¿Cuál fue la experiencia más vergonzosa en la escuela o el año pasado?", "¿Cuál es el mayor error de tu vida?", "¿Qué no harías nunca, incluso si supieras que solo te quedan 12 horas de vida?", " ¿Qué delitos ha cometido?", " Cuéntame un secreto de tu infancia.", " ¿Cuál es su mayor representante (secreto)?", " ¿Qué quieres hacer con (x persona), si luego puedes borrar su memoria (él,…)?", " ¿Qué es lo peor que le has hecho a alguien?", " ¿Quién te gusta más?", "¿Alguna vez te has enamorado de alguno de los presentes?", " Si fueras un vampiro, ¿a cuál de nosotros morderías ahora?", " ¿Ha defecado alguna vez en público?", " ¿Cuál es tu fantasía más oscura?", " ¿Qué es lo mejor que has tenido con alguien más?", " ¿Cuál es el mayor desvío para ti?", " ¿Qué es lo que más te gusta de tu cuerpo y qué es lo más feo?", " ¿A quien te gustaría ver desnuda?", " ¿Quién en esta ronda puede enamorarte?", " ¿Alguna vez has tenido un sueño erótico donde sucedió alguien de este grupo?", " Si te vas a tatuar en el área genital, ¿que habrá allí?", " ¿Qué es más importante en una relación: el sexo o el amor?", " ¿Crees que el sexo es genial, bueno, bueno, divertido a veces, o realmente no te importa?", " ¿Qué te hace realmente amar?", "¿Cuántas veces a la semana / mes tiene relaciones sexuales y con qué frecuencia desea tener relaciones sexuales?", " ¿Con cuántas parejas sexuales te has acostado?"," ¿Qué parte del cuerpo te hace más?", " ¿Cómo, dónde y con quién estuviste primero?", " ¿Qué importancia tienen para ti los juegos previos prolongados?", " ¿Qué debe hacer un hombre o una mujer para seducirte?", " ¿Alguna vez has tenido sexo con un buen amigo?", " ¿Alguna vez ha tenido relaciones sexuales con alguno de estos grupos, excepto con su pareja?", "¿Qué animal se adapta mejor a ti y por qué?", " ¿Cuál es tu peor cita?", " ¿A quién quieres besar ahora?", " ¿Cuál es tu oscura fantasía secreta?", " ¿Prefieres tatuarte el culo o perforarte la lengua?", " ¿Eres siempre leal?", " ¿Tienes un enamoramiento adolescente?", " ¿De qué persona te enamoraste?", " ¿Con qué celebridad te gustaría salir?", " ¿Cuál fue el momento más embarazoso de tu vida?", " ¿Qué jugador tiene la mano más hermosa?", " ¿Dónde fue tu primer beso?", " ¿A quién del grupo te gustaría besar más?", " ¿Quién en la mesa es quizás el más divertido?", " ¿Cuál es el mayor error de tu vida?", " ¿Te pasó algo vergonzoso en una cita?", " ¿Ha estado alguna vez en contacto con drogas?", " ¿A qué persona quieres besar ahora?", " ¿Cuándo fue la última vez que estuvo borracho?", " ¿Alguna vez has hecho trampa en un examen escolar?", " ¿Has robado algo en el pasado?", " ¿Roncas por la noche?", " ¿Cuales tu cancion favorita?", " ¿Con qué jugadores comerciará durante 1 semana y por qué?", " Te mudaste a una isla desierta, ¿a quién te llevaste de aquí?", " ¿A que temes más?", " ¿Dónde te afeitas en todas partes?", "¿Tienes un apodo?", " ¿Miras en el baño antes de lavarte?", "¿Quién te dio la peor angustia?", " Cuantas veces te has besado", "¿Qué es lo más embarazoso que te ha pasado?", "¿Cuántos chicas/os has besado?", "¿De quien estas enamorado(a) ?", "Que estrella te gusta", "¿Empezaste algo con XY (insertar nombre)?", "Alguna vez has robado algo?"] 

global.reto = ["comer 2 cucharadas de arroz sin guarniciones, si se está arrastrando se puede beber", "derrama gente que te hace pausar", "llama a crush ahora y envíarle quiero terminar ahora y manda cartura al grupos", "soltar solo emoticón cada vez que escribes en grupo durante 1 día.", "di ¡Bienvenido a Quién Quiere Ser Millonario! a todos los grupos que tengas", "canta el coro de la última canción que tocaste", "Golpea la mesa (que está en casa) hasta que te regañen por hacer ruido", "Dile a la gente al azar _Me acaban de decir que primero era tu gemelo, nos separamos, luego me hice una cirugía plástica. Y esto es lo más ciyusss_", "menciona el nombre de tu ex", "¡haz 1 rima con (teta, culo) para los miembros grupo 😂!", "envía el contacto de tu novia/o al grupo","Chatea con personas al azar con lenguaje cheto y luego enviar aquí", "cuenta tu propia versión de las cosas vergonzosas", "etiqueta a la persona que odias","Fingir estar poseído, por ejemplo: poseído por perro, poseído por saltamontes, poseído por refrigerador, etc.","cambiar nombre a *SOY BURRO* por 24 horas", "grita *SOY GAY* frente a tu casa", "¡dime tu tipo de novio!", "Di *estoy enamorado de ti, ¿quieres ser mi novia?* al sexo opuesto, la última vez que chateaste (enviar captura), espera a que te responda, si es así, déjalo aquí", "Manda un audio cantado la vaca loca", "bromea con tu ex y di *te amo, por favor vuelve* ¡sin decir atrévete!", "cambiar tu nombre a *Soy gay* por 5 horas", "ponerte de foto de perfil la primera que salga el tu galeria, durante 3 días", "enviar una nota de voz diciendo ¿puedo llamarte bebé?", "¡Di *ERES TAN HERMOSO, NO MIENTEN* a los chicos!", "dile a un miembro del grupo randow (TE AMO)", "Actúa como una gallina delante de tus padres", "Toma un libro al azar y lee una página en voz alta, y envíalo aquí", "Abre la puerta de tu casa y aúlla como un lobo durante 10 segundos", "Tómate una selfie vergonzosa y pégala en tu foto de perfil", "Que el grupo elija una palabra y una canción conocida. Tienes que cantar esa canción y enviarla en nota de voz", "Cuéntame la historia más triste que conozcas", "haz un video bailado (dame tu cosita) y ponlo en estado durante 5 minutos", "Muestre las últimas cinco personas a las que envió mensajes de texto y lo que decían los mensajes", "ponga su nombre completo en el estado durante 5 horas", "haz un video de baile corto sin ningún filtro solo con música y ponlo en tu estado durante 5 horas", "Llama a tu mejor amiga, perra", "pon tu foto sin filtro en tu estado durante 10 minutos", "di que amo a LoliBot en nota de voz 😂", "Envíale un mensaje a tu ex y dile que todavía me gustas", "Llama a Crush/novia ahora y haz una captura de pantalla aquí", "Accede al chat personal de uno de los miembros del grupo y dile (puto/a) 😂", "dile ERES HERMOSO/GUAPO a una de las personas que está en la parte superior de tu lista de favoritos o la primera persona en tu lista de chat", "pon la foto de tu enamorado en el estado con el título: Tiene pito corto 😂", "cambio de nombre a SOY GAY durante 5 horas", "chatea con cualquier contacto en whatsapp y di que seré tu novio/novia durante 5 horas", "enviar una nota de voz que diga que estoy enamorado de ti, ¿quieres ser mi novia/novio o no? a cualquier persona aleatoria del grupo (si eres una chica, elige un chico, si un chico elige una chica", "Golpea tu trasero apenas envía el sonido de una bofetada a través de la nota de voz 🤣", "indique su tipo de novia/novia y envíe la foto aquí con el título, la niña/niño más feo del mundo", "grita bravooooooooo y envía aquí a través de nota de voz", "toma tu cara y envíala aquí", "Envía tu foto con un pie de foto, soy lesbiana", "grita cabrón delante de tu mamá/papá", "cambiar el nombre a soy idiota por 3 horas", "di que amor al propietario del bot elrebelde por audio 😆", "envía la foto de tu novia/novia aquí", "haga cualquier video de desafío de baile tiktok y póngalo en estado, puede eliminarlo después de 5 horas", "rompe con tu mejor amigo durante 5 horas sin decirle que es un reto", "dile a uno de tus amigos que lo amas y que quieres casarte con él/ella, sin decirle que es un desafío", "Escriba Me siento cachondo y póngalo en estado, puede eliminarlo solo después de 5 horas", "escriba soy lesbiana y póngalo en estado, puede eliminarlo solo después de 5 horas", "ponga el nombre de su padre en el estado durante 5 horas", "envíe palabras abusivas en cualquier grupo, excepto en este grupo, y envíe una prueba de captura de pantalla aquí"]


//---------------[ IDs de canales ]----------------

global.ch = {
ch1: '120363266665814365@newsletter', //AzuraUltra
ch2: '120363301598733462@newsletter', //SkyUltraPlus 
ch3: '120363160031023229@newsletter', //Infinity-Wa
ch4: '120363374372683775@newsletter', //🌹 Pσҽƚιx ✨ Sƚҽʅʅαɾ 😎 Fυɳ
ch5: '120363343811229130@newsletter', //◟𖥻🗿៹┊My Honest Reaction
ch6: '120363418194182743@newsletter', //𝐊𝐮𝐫𝐨𝐭𝐚𝐤𝐚-𝐌𝐃
ch7: '120363307551724976@newsletter', //🪼 FRASES, MEMES Y CONSEJOS PARA TUS ESTADOS 🪼
ch8: '120363385983031660@newsletter', //🐼 Evolution App
}

//------------------------------------------------

// 🔄 Exportar configuraciones
module.exports = { isOwner: global.isOwner, setPrefix: global.setPrefix, allowedPrefixes: global.allowedPrefixes };
