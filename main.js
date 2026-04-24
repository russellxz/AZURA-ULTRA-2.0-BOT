
const fs = require("fs");
const chalk = require("chalk");
const { isOwner, setPrefix, allowedPrefixes } = require("./config");
const axios = require("axios");
const fetch = require("node-fetch");
const FormData = require("form-data");
// const { downloadContentFromMessage } = require("@whiskeysockets/baileys"); // ← ESM: reemplazado por helper dinámico
const os = require("os");
const { execSync } = require("child_process");
const path = require("path");
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid, writeExif, toAudio } = require('./libs/fuctions');
const activeSessions = new Set();
const stickersDir = "./stickers";
const stickersFile = "./stickers.json";

// Parche ESM Baileys: helper para descargar media y obtener Buffer
async function downloadMedia(node, type) {
  const m = await import('@whiskeysockets/baileys');
  const stream = await m.downloadContentFromMessage(node, type);
  let buf = Buffer.alloc(0);
  for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
  return buf;
}

function isUrl(string) {
  const regex = /^(https?:\/\/[^\s]+)/g;
  return regex.test(string);
}

const filePath = path.resolve('./activossubbots.json');
global.cachePlay10 = {}; // Guardará los datos de play10 por ID de mensaje
// Crear archivo con estructura inicial si no existe
if (!fs.existsSync(filePath)) {
  const estructuraInicial = {
    antilink: {}
    // futuro: modoAdmins: {}, antiarabe: {}
  };

  fs.writeFileSync(filePath, JSON.stringify(estructuraInicial, null, 2));
  console.log("✅ Archivo activossubbots.json creado correctamente.");
}
//retrimgir👇
const rePath = path.resolve("./re.json");
let comandosRestringidos = {};
if (fs.existsSync(rePath)) {
  try {
    comandosRestringidos = JSON.parse(fs.readFileSync(rePath, "utf-8"));
  } catch (e) {
    console.error("❌ Error al leer re.json:", e);
    comandosRestringidos = {};
  }
}
//retringir 👆
global.zrapi = `ex-9bf9dc0318`;
global.generatingCode = false;

if (!fs.existsSync(stickersDir)) fs.mkdirSync(stickersDir, { recursive: true });
if (!fs.existsSync(stickersFile)) fs.writeFileSync(stickersFile, JSON.stringify({}, null, 2));
//para los subot
const rutaLista = path.join(__dirname, "listasubots.json");

// Verificar y crear el archivo si no existe
if (!fs.existsSync(rutaLista)) {
  fs.writeFileSync(rutaLista, JSON.stringify([], null, 2));
  console.log("✅ Archivo listasubots.json creado.");
} else {
  console.log("📂 Archivo listasubots.json ya existe.");
}
//para los subot
const prefixPath = path.resolve("prefixes.json");

// Crear archivo si no existe
if (!fs.existsSync(prefixPath)) {
  fs.writeFileSync(prefixPath, JSON.stringify({}, null, 2));
  console.log("✅ prefixes.json creado correctamente.");
} else {
  console.log("✅ prefixes.json ya existe.");
}
//grupo subot
const grupoPath = path.resolve("grupo.json");

// Verifica si el archivo existe, si no lo crea vacío con estructura básica
if (!fs.existsSync(grupoPath)) {
  fs.writeFileSync(grupoPath, JSON.stringify({}, null, 2));
  console.log("✅ grupo.json creado correctamente.");
} else {
  console.log("✅ grupo.json ya existe.");
}
//bienvemidad personalizada
const welcomePath = path.join(__dirname, 'welcome.json');

if (!fs.existsSync(welcomePath)) {
  fs.writeFileSync(welcomePath, JSON.stringify({}, null, 2));
  console.log("✅ Archivo welcome.json creado exitosamente.");
}

//grupo subot
const rpgFile = "./rpg.json";
if (!fs.existsSync(rpgFile)) {
    const rpgDataInicial = { usuarios: {}, tiendaMascotas: [], tiendaPersonajes: [], mercadoPersonajes: [] };
    fs.writeFileSync(rpgFile, JSON.stringify(rpgDataInicial, null, 2));
}
let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));
function saveRpgData() {
    fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));
}

const configFilePath = "./config.json";
function loadPrefix() {
    if (fs.existsSync(configFilePath)) {
        let configData = JSON.parse(fs.readFileSync(configFilePath, "utf-8"));
        global.prefix = configData.prefix || ".";
    } else {
        global.prefix = ".";
    }
}
loadPrefix();
console.log(`📌 Prefijo actual: ${global.prefix}`);

const guarFilePath = "./guar.json";
if (!fs.existsSync(guarFilePath)) fs.writeFileSync(guarFilePath, JSON.stringify({}, null, 2));

function saveMultimedia(key, data) {
    let guarData = JSON.parse(fs.readFileSync(guarFilePath, "utf-8"));
    guarData[key] = data;
    fs.writeFileSync(guarFilePath, JSON.stringify(guarData, null, 2));
}
function getMultimediaList() {
    return JSON.parse(fs.readFileSync(guarFilePath, "utf-8"));
}
function isValidPrefix(prefix) {
    return typeof prefix === "string" && (prefix.length === 1 || (prefix.length > 1 && [...prefix].length === 1));
}
function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
async function fetchJson(url, options = {}) {
    const res = await fetch(url, options);
    return res.json();
}
async function remini(imageData, operation) {
    return new Promise(async (resolve, reject) => {
        const availableOperations = ["enhance", "recolor", "dehaze"];
        if (!availableOperations.includes(operation)) operation = availableOperations[0];
        const baseUrl = `https://inferenceengine.vyro.ai/${operation}.vyro`;
        const formData = new FormData();
        formData.append("image", Buffer.from(imageData), { filename: "enhance_image_body.jpg", contentType: "image/jpeg" });
        formData.append("model_version", 1, {
            "Content-Transfer-Encoding": "binary",
            contentType: "multipart/form-data; charset=utf-8"
        });
        formData.submit({
            url: baseUrl,
            host: "inferenceengine.vyro.ai",
            path: `/${operation}`,
            protocol: "https:",
            headers: {
                "User-Agent": "okhttp/4.9.3",
                "Connection": "Keep-Alive",
                "Accept-Encoding": "gzip"
            }
        }, function (err, res) {
            if (err) return reject(err);
            const chunks = [];
            res.on("data", chunk => chunks.push(chunk));
            res.on("end", () => resolve(Buffer.concat(chunks)));
            res.on("error", reject);
        });
    });
}
async function isAdmin(sock, chatId, sender) {
    try {
        const groupMetadata = await sock.groupMetadata(chatId);
        const admins = groupMetadata.participants.filter(p => p.admin).map(p => p.id);
        return admins.includes(sender.replace(/[^0-9]/g, '') + "@s.whatsapp.net");
    } catch (error) {
        console.error("⚠️ Error verificando administrador:", error);
        return false;
    }
}
function savePrefix(newPrefix) {
    global.prefix = newPrefix;
    fs.writeFileSync("./config.json", JSON.stringify({ prefix: newPrefix }, null, 2));
    console.log(chalk.green(`✅ Prefijo cambiado a: ${chalk.yellow.bold(newPrefix)}`));
}
async function handleDeletedMessage(sock, msg) {
    if (!global.viewonce) return;
    const chatId = msg.key.remoteJid;
    const deletedMessage = msg.message;
    if (deletedMessage) {
        await sock.sendMessage(chatId, {
            text: `⚠️ *Mensaje eliminado reenviado:*

${deletedMessage.conversation || deletedMessage.extendedTextMessage?.text || ''}`
        });
        if (deletedMessage.imageMessage) {
            const imageBuffer = await downloadMedia(deletedMessage.imageMessage, 'image');
            await sock.sendMessage(chatId, { image: imageBuffer }, { quoted: msg });
        } else if (deletedMessage.audioMessage) {
            const audioBuffer = await downloadMedia(deletedMessage.audioMessage, 'audio');
            await sock.sendMessage(chatId, { audio: audioBuffer }, { quoted: msg });
        } else if (deletedMessage.videoMessage) {
            const videoBuffer = await downloadMedia(deletedMessage.videoMessage, 'video');
            await sock.sendMessage(chatId, { video: videoBuffer }, { quoted: msg });
        }
    }
}
function loadPlugins() {
    const plugins = [];
    const pluginDir = path.join(__dirname, 'plugins');
    if (!fs.existsSync(pluginDir)) return plugins;
    const files = fs.readdirSync(pluginDir).filter(f => f.endsWith('.js'));
    for (const file of files) {
        const plugin = require(path.join(pluginDir, file));
        if (plugin && plugin.command) plugins.push(plugin);
    }
    return plugins;
}

const plugins = loadPlugins();

async function handleCommand(sock, msg, command, args, sender) {
    const lowerCommand = command.toLowerCase();
    const text = args.join(" ");
    global.viewonce = true;

    sock.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path)
            ? path
            : /^data:.*?\/.*?;base64,/i.test(path)
                ? Buffer.from(path.split`,`[1], 'base64')
                : /^https?:\/\//.test(path)
                    ? await (await getBuffer(path))
                    : fs.existsSync(path)
                        ? fs.readFileSync(path)
                        : Buffer.alloc(0);
        let buffer;
        if (options && (options.packname || options.author)) {
            buffer = await writeExifImg(buff, options);
        } else {
            buffer = await imageToWebp(buff);
        }
        await sock.sendMessage(jid, { sticker: { url: buffer }, ...options }, {
            quoted: quoted ? quoted : msg,
            ephemeralExpiration: 24 * 60 * 100,
            disappearingMessagesInChat: 24 * 60 * 100
        });
        return buffer;
    };

    const plugin = plugins.find(p => p.command.includes(lowerCommand));
    if (plugin) {
        return plugin(msg, {
            conn: sock,
            text,
            args,
            command: lowerCommand,
            usedPrefix: global.prefix
        });
    }

    switch (lowerCommand) {

        
case "menuaudio": {
    try {
        // Reacción antes de enviar el menú
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "📂", key: msg.key } 
        });

        // Verificar si el archivo guar.json existe
        if (!fs.existsSync("./guar.json")) {
            return sock.sendMessage(
                msg.key.remoteJid,
                { text: "❌ *Error:* No hay multimedia guardado aún. Usa `.guar` para guardar algo primero." },
                { quoted: msg }
            );
        }

        // Leer archivo guar.json
        let guarData = JSON.parse(fs.readFileSync("./guar.json", "utf-8"));
        
        let listaMensaje = `┏━━━━━━━━━━━━━━━┓
┃  📂 *MENÚ DE MULTIMEDIA*  
┃  🔑 *Palabras Clave Guardadas*  
┗━━━━━━━━━━━━━━━┛

📌 *¿Cómo recuperar un archivo guardado?*  
Usa el comando:  
➡️ _${global.prefix}g palabra_clave_  
( *o puedes solo escribirlas tambien y bot las envia tambien* ) 

📂 *Lista de palabras clave guardadas:*  
━━━━━━━━━━━━━━━━━━━\n`;

        let claves = Object.keys(guarData);
        
        if (claves.length === 0) {
            listaMensaje += "🚫 *No hay palabras clave guardadas.*\n";
        } else {
            claves.forEach((clave, index) => {
                listaMensaje += `*${index + 1}.* ${clave}\n`;
            });
        }

        listaMensaje += `\n━━━━━━━━━━━━━━━━━━━  
📥 *Otros Comandos de Multimedia*  

${global.prefix}guar → Guarda archivos con una clave.  
${global.prefix}g → Recupera archivos guardados.  
${global.prefix}kill → Elimina un archivo guardado.  

💡 *Azura Ultra sigue mejorando. Pronto más funciones.*  
⚙️ *Desarrollado por Russell xz* 🚀`;

        // Enviar el menú con video como GIF
        await sock.sendMessage2(msg.key.remoteJid,
  {
    image: { url: "https://cdn.russellxz.click/4eb44cfb.jpeg" }, 
    caption: listaMensaje 
  },
  msg
)
    } catch (error) {
        console.error("❌ Error al enviar el menú2:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Ocurrió un error al mostrar el menú2. Inténtalo de nuevo.*" 
        }, { quoted: msg });
    }
    break;
}    
       case 'nsfwwaifu': {
  const chatId = msg.key.remoteJid;

  // Reacción de carga
  await sock.sendMessage(chatId, {
    react: { text: '🔄', key: msg.key }
  });

  try {
    const axios = require('axios');
    // Llamada a la API
    const res = await axios.get('https://api.waifu.pics/nsfw/waifu');
    const imageUrl = res.data.url;

    // Enviar la imagen
    await sock.sendMessage(chatId, {
      image: { url: imageUrl },
      caption: '💖 Aquí tienes tu Waifu NSFW 💖'
    }, { quoted: msg });

    // Reacción de éxito
    await sock.sendMessage(chatId, {
      react: { text: '✅', key: msg.key }
    });

  } catch (err) {
    console.error('❌ Error en comando nsfwwaifu:', err);
    await sock.sendMessage(chatId, {
      text: '❌ No pude obtener una Waifu en este momento. Intenta más tarde.'
    }, { quoted: msg });
  }
}
break; 
case 'pack2': {
  const chatId = msg.key.remoteJid;

  // URLs de ejemplo
  const urls = [
    'https://telegra.ph/file/c0da7289bee2d97048feb.jpg',
    'https://telegra.ph/file/b8564166f9cac4d843db3.jpg',
    'https://telegra.ph/file/6e1a6dcf1c91bf62d3945.jpg',
    'https://telegra.ph/file/0224c1ecf6b676dda3ac0.jpg',
    'https://telegra.ph/file/b71b8f04772f1b30355f1.jpg'
  ];

  // Función para elegir una URL al azar
  const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const imageUrl = getRandom(urls);

  try {
    // Reacción de carga
    await sock.sendMessage(chatId, {
      react: { text: '🔄', key: msg.key }
    });

    // Enviar la imagen
    await sock.sendMessage(chatId, {
      image: { url: imageUrl },
      caption: '🥵 Aquí tienes más pack 😏'
    }, { quoted: msg });

    // Reacción de éxito
    await sock.sendMessage(chatId, {
      react: { text: '✅', key: msg.key }
    });

  } catch (err) {
    console.error('❌ Error en comando pack2:', err);
    await sock.sendMessage(chatId, {
      text: '❌ Ocurrió un error al enviar la imagen.'
    }, { quoted: msg });
  }
}
break;
      
case "modoadmins": {
  try {
    const chatId = msg.key.remoteJid;
    const isGroup = chatId.endsWith("@g.us");
    const senderId = msg.key.participant || msg.key.remoteJid;
    const senderNum = senderId.replace(/[^0-9]/g, "");
    const isBotMessage = msg.key.fromMe;

    if (!isGroup) {
      await sock.sendMessage(chatId, {
        text: "❌ Este comando solo se puede usar en grupos."
      }, { quoted: msg });
      break;
    }

    // Obtener metadata del grupo
    const metadata = await sock.groupMetadata(chatId);

    // Buscar el participante exacto (ya sea @lid o número real)
    const participant = metadata.participants.find(p => p.id === senderId);
    const isAdmin = participant?.admin === "admin" || participant?.admin === "superadmin";
    const isOwner = global.owner.some(([id]) => id === senderNum);

    if (!isAdmin && !isOwner && !isBotMessage) {
      await sock.sendMessage(chatId, {
        text: "❌ Solo administradores o el owner pueden usar este comando."
      }, { quoted: msg });
      break;
    }

    const messageText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
    const args = messageText.trim().split(" ").slice(1);

    if (!["on", "off"].includes(args[0])) {
      await sock.sendMessage(chatId, {
        text: "✳️ Usa correctamente:\n\n.modoadmins on / off"
      }, { quoted: msg });
      break;
    }

    const fs = require("fs");
    const path = require("path");
    const activosPath = path.join(__dirname, "activos.json");
    const activos = fs.existsSync(activosPath)
      ? JSON.parse(fs.readFileSync(activosPath))
      : {};

    activos.modoAdmins = activos.modoAdmins || {};

    if (args[0] === "on") {
      activos.modoAdmins[chatId] = true;
    } else {
      delete activos.modoAdmins[chatId];
    }

    fs.writeFileSync(activosPath, JSON.stringify(activos, null, 2));

    await sock.sendMessage(chatId, {
      text: `👑 Modo admins *${args[0] === "on" ? "activado" : "desactivado"}* en este grupo.`
    }, { quoted: msg });

  } catch (err) {
    console.error("❌ Error en modoadmins:", err);
    await sock.sendMessage(msg.key.remoteJid, {
      text: "❌ Ocurrió un error al cambiar el modo admins."
    }, { quoted: msg });
  }
  break;
}
case 'tourl': {
    const fs = require('fs');
    const path = require('path');
    const FormData = require('form-data');
    const axios = require('axios');
    const ffmpeg = require('fluent-ffmpeg');
    const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    const m = {
        reply: (text) => sock.sendMessage(msg.key.remoteJid, { text }, { quoted: msg }),
        react: (emoji) => sock.sendMessage(msg.key.remoteJid, { react: { text: emoji, key: msg.key } })
    };

    if (!quotedMsg) {
        await m.reply('⚠️ *Responde a una imagen, video, sticker, nota de voz o audio para subirlo.*');
        break;
    }

    await m.react('☁️');

    let rawPath = null;
    let finalPath = null;

    try {
        let typeDetected = null;
        let mediaMessage = null;

        if (quotedMsg.imageMessage) {
            typeDetected = 'image';
            mediaMessage = quotedMsg.imageMessage;
        } else if (quotedMsg.videoMessage) {
            typeDetected = 'video';
            mediaMessage = quotedMsg.videoMessage;
        } else if (quotedMsg.stickerMessage) {
            typeDetected = 'sticker';
            mediaMessage = quotedMsg.stickerMessage;
        } else if (quotedMsg.audioMessage) {
            typeDetected = 'audio';
            mediaMessage = quotedMsg.audioMessage;
        } else {
            throw new Error('❌ Solo se permiten imágenes, videos, stickers, audios o notas de voz.');
        }

        const tmpDir = path.join(__dirname, 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

        const originalMime =
            typeDetected === 'sticker'
                ? 'image/webp'
                : (mediaMessage.mimetype || 'application/octet-stream');

        const rawExt =
            typeDetected === 'sticker'
                ? 'webp'
                : (originalMime.split('/')[1]?.split(';')[0] || 'bin');

        rawPath = path.join(tmpDir, `${Date.now()}_input.${rawExt}`);

        const stream = await downloadContentFromMessage(
            mediaMessage,
            typeDetected === 'sticker' ? 'sticker' : typeDetected
        );

        const writeStream = fs.createWriteStream(rawPath);
        for await (const chunk of stream) {
            writeStream.write(chunk);
        }
        writeStream.end();

        await new Promise((resolve, reject) => {
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
        });

        const stats = fs.statSync(rawPath);
        const maxSize = 200 * 1024 * 1024;

        if (stats.size > maxSize) {
            fs.unlinkSync(rawPath);
            rawPath = null;
            throw new Error('⚠️ El archivo excede el límite de 200MB.');
        }

        finalPath = rawPath;
        let finalMime = originalMime;
        let finalName = path.basename(finalPath);

        const isAudioToConvert =
            typeDetected === 'audio' &&
            ['ogg', 'm4a', 'mpeg'].includes(rawExt);

        if (isAudioToConvert) {
            finalPath = path.join(tmpDir, `${Date.now()}_converted.mp3`);

            await new Promise((resolve, reject) => {
                ffmpeg(rawPath)
                    .audioCodec('libmp3lame')
                    .toFormat('mp3')
                    .on('end', resolve)
                    .on('error', reject)
                    .save(finalPath);
            });

            if (fs.existsSync(rawPath)) {
                fs.unlinkSync(rawPath);
                rawPath = null;
            }

            finalMime = 'audio/mpeg';
            finalName = path.basename(finalPath);
        }

        const uploadToRussell = async (filePath) => {
            const form = new FormData();
            form.append('file', fs.createReadStream(filePath));

            const res = await axios.post('https://cdn.russellxz.click/upload.php', form, {
                headers: form.getHeaders()
            });

            if (!res.data || !res.data.url) {
                throw new Error('No se pudo subir a CDN Russell.');
            }

            return res.data.url;
        };

        const uploadToAdoFiles = async (filePath, filename, mimetype) => {
            const base64 = fs.readFileSync(filePath, { encoding: 'base64' });

            const payload = {
                filename,
                data: base64,
                mimetype,
                expiration: 'never'
            };

            const res = await axios.post('https://cdn.adoolab.xyz/api/upload', payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!res.data || !res.data.url) {
                throw new Error('No se pudo subir a AdoFiles.');
            }

            return res.data.url;
        };

        const [russellRes, adoRes] = await Promise.allSettled([
            uploadToRussell(finalPath),
            uploadToAdoFiles(finalPath, finalName, finalMime)
        ]);

        const okRussell = russellRes.status === 'fulfilled' ? russellRes.value : null;
        const okAdo = adoRes.status === 'fulfilled' ? adoRes.value : null;

        if (!okRussell && !okAdo) {
            const err1 = russellRes.status === 'rejected' ? russellRes.reason?.message : '';
            const err2 = adoRes.status === 'rejected' ? adoRes.reason?.message : '';
            throw new Error(`Fallaron ambos servicios.
- RussellCDN: ${err1}
- AdoFiles: ${err2}`);
        }

        let replyText = '✅ *Archivo subido exitosamente:*

';

        if (okRussell) {
            replyText += `*CDN Russell:*
${okRussell}

`;
        }

        if (okAdo) {
            replyText += `*AdoFiles:*
${okAdo}

`;
        }

        if (!okRussell && russellRes.status === 'rejected') {
            replyText += `*CDN Russell Failed:* ${russellRes.reason?.message}
`;
        }

        if (!okAdo && adoRes.status === 'rejected') {
            replyText += `*AdoFiles Failed:* ${adoRes.reason?.message}
`;
        }

        await m.reply(replyText.trim());
        await m.react('✅');

    } catch (err) {
        await m.reply(`❌ *Error:* ${err.message}`);
        await m.react('❌');
    } finally {
        try {
            if (rawPath && fs.existsSync(rawPath)) fs.unlinkSync(rawPath);
            if (finalPath && finalPath !== rawPath && fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
        } catch {}
    }

    break;
}
      
case "modoprivado": {
  try {
    const senderNumber = (msg.key.participant || msg.key.remoteJid).replace(/[@:\-s.whatsapp.net]/g, "");
    const isBotMessage = msg.key.fromMe;

    if (!isOwner(senderNumber) && !isBotMessage) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Este comando es solo para el *dueño del bot*."
      }, { quoted: msg });
      break;
    }

    const messageText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
    const args = messageText.trim().split(" ").slice(1);

    if (!["on", "off"].includes(args[0])) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "✳️ Usa correctamente:\n\n.modoprivado on / off"
      }, { quoted: msg });
      break;
    }

    const fs = require("fs");
    const path = require("path");
    const activosPath = path.join(__dirname, "activos.json");
    const activos = fs.existsSync(activosPath)
      ? JSON.parse(fs.readFileSync(activosPath))
      : {};

    activos.modoPrivado = args[0] === "on";
    fs.writeFileSync(activosPath, JSON.stringify(activos, null, 2));

    await sock.sendMessage(msg.key.remoteJid, {
      text: `🔐 Modo privado *${args[0] === "on" ? "activado" : "desactivado"}*.`
    }, { quoted: msg });

  } catch (err) {
    console.error("❌ Error en modoprivado:", err);
    await sock.sendMessage(msg.key.remoteJid, {
      text: "❌ Ocurrió un error al activar el modo privado."
    }, { quoted: msg });
  }
  break;
}
      




case 'tovideo': {
  const fs = require('fs');
  const path = require('path');
  const axios = require('axios');
  const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
  const { spawn } = require('child_process');
  const FormData = require('form-data');
  const { promisify } = require('util');
  const { pipeline } = require('stream');
  const streamPipeline = promisify(pipeline);

  // Validar que se responda a un sticker
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage;
  if (!quoted) {
    await sock.sendMessage(msg.key.remoteJid, {
      text: "⚠️ Responde a un sticker para convertirlo a video."
    }, { quoted: msg });
    break;
  }

  await sock.sendMessage(msg.key.remoteJid, {
    react: { text: "⏳", key: msg.key }
  });

  try {
    const tmpDir = path.join(__dirname, 'tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

    const inputPath = path.join(tmpDir, `${Date.now()}.webp`);
    const outputPath = path.join(tmpDir, `${Date.now()}_out.mp4`);

    // Descargar el sticker
    const stream = await downloadContentFromMessage(quoted, 'sticker');
    const writer = fs.createWriteStream(inputPath);
    for await (const chunk of stream) writer.write(chunk);
    writer.end();

    // Subir a russell.click
    const form = new FormData();
    form.append("file", fs.createReadStream(inputPath));
    const upload = await axios.post("https://cdn.russellxz.click/upload.php", form, {
      headers: form.getHeaders()
    });

    if (!upload.data?.url) throw new Error("No se pudo subir el sticker.");

    // Pasar la URL a la API para convertir a video
    const conv = await axios.get(`https://api.neoxr.eu/api/webp2mp4?url=${encodeURIComponent(upload.data.url)}&apikey=russellxz`);
    const videoUrl = conv.data?.data?.url;
    if (!videoUrl) throw new Error("No se pudo convertir el sticker a video.");

    // Descargar el video convertido
    const res = await axios.get(videoUrl, { responseType: 'stream' });
    const tempMp4 = path.join(tmpDir, `${Date.now()}_orig.mp4`);
    await streamPipeline(res.data, fs.createWriteStream(tempMp4));

    // Convertir con ffmpeg para compatibilidad
    await new Promise((resolve, reject) => {
      const ff = spawn('ffmpeg', ['-i', tempMp4, '-c:v', 'libx264', '-preset', 'fast', '-pix_fmt', 'yuv420p', outputPath]);
      ff.on('exit', code => code === 0 ? resolve() : reject(new Error("Error en ffmpeg")));
    });

    // Enviar el video final
    await sock.sendMessage(msg.key.remoteJid, {
      video: fs.readFileSync(outputPath),
      mimetype: 'video/mp4',
      caption: '✅ Sticker convertido a video.\n\n© Azura Ultra 2.0'
    }, { quoted: msg });

    fs.unlinkSync(inputPath);
    fs.unlinkSync(tempMp4);
    fs.unlinkSync(outputPath);

    await sock.sendMessage(msg.key.remoteJid, {
      react: { text: "✅", key: msg.key }
    });

  } catch (e) {
    console.error(e);
    await sock.sendMessage(msg.key.remoteJid, {
      text: `❌ *Error:* ${e.message}`
    }, { quoted: msg });
    await sock.sendMessage(msg.key.remoteJid, {
      react: { text: "❌", key: msg.key }
    });
  }

  break;
}

case 'carga': {
  if (!isOwner) {
    await sock.sendMessage(msg.key.remoteJid, {
      text: "⛔ Este comando es solo para el Owner."
    }, { quoted: msg });
    break;
  }

  const fs = require('fs');
  const { exec } = require('child_process');
  const lastRestarterFile = "./lastRestarter.json";

  // Verificar si existe el archivo; si no, crearlo.
  if (!fs.existsSync(lastRestarterFile)) {
    fs.writeFileSync(lastRestarterFile, JSON.stringify({ chatId: "" }, null, 2));
  }

  exec('git pull', (error, stdout, stderr) => {
    if (error) {
      sock.sendMessage(msg.key.remoteJid, {
        text: `❌ Error al actualizar: ${error.message}`
      }, { quoted: msg });
      return;
    }
    const output = stdout || stderr;
    if (output.includes("Already up to date")) {
      sock.sendMessage(msg.key.remoteJid, {
        text: `✅ Actualización completada: Ya está al día.`
      }, { quoted: msg });
    } else {
      const message = `✅ Actualización completada:\n\n${output}\n\n🔄 Reiniciando el servidor...`;
      
      // Enviar reacción de reinicio
      sock.sendMessage(msg.key.remoteJid, {
        react: { text: "🔄", key: msg.key }
      });
      
      // Enviar mensaje de notificación
      sock.sendMessage(msg.key.remoteJid, {
        text: message
      }, { quoted: msg });
      
      // Guardar el chat del último restarter
      fs.writeFileSync(lastRestarterFile, JSON.stringify({ chatId: msg.key.remoteJid }, null, 2));
      
      // Reiniciar el bot (asegúrate de usar un gestor de procesos que lo reactive)
      setTimeout(() => {
        process.exit(1);
      }, 3000);
    }
  });
  break;
}
        
      
case 'whatmusic': {
    const fs = require('fs');
    const path = require('path');
    const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
    const { promisify } = require('util');
    const { pipeline } = require('stream');
    const axios = require('axios');
    const yts = require('yt-search');
    const ffmpeg = require('fluent-ffmpeg');
    const quAx = require('./libs/upload.js');

    const streamPipeline = promisify(pipeline);

    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quotedMsg || (!quotedMsg.audioMessage && !quotedMsg.videoMessage)) {
        await sock.sendMessage(msg.key.remoteJid, {
            text: "✳️ Responde a un *audio* (MP3) o *video* (MP4) para identificar la canción."
        }, { quoted: msg });
        break;
    }

    await sock.sendMessage(msg.key.remoteJid, {
        react: { text: '🔎', key: msg.key }
    });

    try {
        const tmpDir = path.join(__dirname, 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

        const fileExtension = quotedMsg.audioMessage ? 'mp3' : 'mp4';
        const inputPath = path.join(tmpDir, `${Date.now()}_input.${fileExtension}`);

        const stream = await downloadContentFromMessage(
            quotedMsg.audioMessage || quotedMsg.videoMessage,
            quotedMsg.audioMessage ? 'audio' : 'video'
        );
        const writable = fs.createWriteStream(inputPath);
        for await (const chunk of stream) writable.write(chunk);
        writable.end();

        const uploadResponse = await quAx(inputPath);
        if (!uploadResponse.status || !uploadResponse.result.url) throw new Error("No se pudo subir el archivo.");

        const apiKey = "russellxz";
        const apiUrl = `https://api.neoxr.eu/api/whatmusic?url=${encodeURIComponent(uploadResponse.result.url)}&apikey=${apiKey}`;
        const { data } = await axios.get(apiUrl);

        if (!data.status || !data.data) throw new Error("No se pudo identificar la canción.");

        const { title, artist, album, release } = data.data;
        const search = await yts(`${title} ${artist}`);
        const video = search.videos[0];
        if (!video) throw new Error("No se encontró la canción en YouTube.");

        const videoUrl = video.url;
        const thumbnail = video.thumbnail;
        const fduration = video.timestamp;
        const views = video.views.toLocaleString();
        const channel = video.author.name || 'Desconocido';

        const banner = `
╔══════════════════╗
║  ✦ 𝘼𝙕𝙐𝙍𝘼 𝙐𝙇𝙏𝙍𝘼 𝟮.𝟬 𝗕𝗢𝗧 ✦
╚══════════════════╝

🎵 *Canción detectada:*  
╭───────────────╮  
├ 📌 *Título:* ${title}
├ 👤 *Artista:* ${artist}
├ 💿 *Álbum:* ${album}
├ 📅 *Lanzamiento:* ${release}
├ 🔎 *Buscando:* ${video.title}
├ ⏱️ *Duración:* ${fduration}
├ 👁️ *Vistas:* ${views}
├ 📺 *Canal:* ${channel}
├ 🔗 *Link:* ${videoUrl}
╰───────────────╯

⏳ *Espere un momento, descargando la canción...*
═════════════════════`;

        await sock.sendMessage(msg.key.remoteJid, {
            image: { url: thumbnail },
            caption: banner
        }, { quoted: msg });

        // Descargar desde YouTube en MP3
        const res = await axios.get(`https://api.neoxr.eu/api/youtube?url=${encodeURIComponent(videoUrl)}&type=audio&quality=128kbps&apikey=${apiKey}`);
        if (!res.data.status || !res.data.data?.url) throw new Error("No se pudo obtener el audio.");
        const audioUrl = res.data.data.url;

        const downloadPath = path.join(tmpDir, `${Date.now()}_raw.mp3`);
        const finalPath = path.join(tmpDir, `${Date.now()}_fixed.mp3`);

        // Descargar el audio
        const audioRes = await axios.get(audioUrl, { responseType: 'stream' });
        const audioStream = fs.createWriteStream(downloadPath);
        await streamPipeline(audioRes.data, audioStream);

        // Reparar con ffmpeg
        await new Promise((resolve, reject) => {
            ffmpeg(downloadPath)
                .audioCodec('libmp3lame')
                .audioBitrate('128k')
                .save(finalPath)
                .on('end', resolve)
                .on('error', reject);
        });

        // Enviar el audio procesado
        await sock.sendMessage(msg.key.remoteJid, {
            audio: fs.readFileSync(finalPath),
            mimetype: 'audio/mpeg',
            fileName: `${title}.mp3`
        }, { quoted: msg });

        fs.unlinkSync(inputPath);
        fs.unlinkSync(downloadPath);
        fs.unlinkSync(finalPath);

        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: '✅', key: msg.key }
        });

    } catch (err) {
        console.error(err);
        await sock.sendMessage(msg.key.remoteJid, {
            text: `❌ *Error:* ${err.message}`
        }, { quoted: msg });

        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: '❌', key: msg.key }
        });
    }

    break;
}

case 'whatmusic6': {
    const fs = require('fs');
    const path = require('path');
    const axios = require('axios');
    const ffmpeg = require('fluent-ffmpeg');
    const FormData = require('form-data');
    const { promisify } = require('util');
    const { pipeline } = require('stream');
    const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
    const yts = require('yt-search');

    const streamPipeline = promisify(pipeline);
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    if (!quotedMsg || (!quotedMsg.audioMessage && !quotedMsg.videoMessage)) {
        await sock.sendMessage(msg.key.remoteJid, {
            text: "✳️ Responde a una nota de voz, audio o video para identificar la canción."
        }, { quoted: msg });
        break;
    }

    await sock.sendMessage(msg.key.remoteJid, {
        react: { text: '🔍', key: msg.key }
    });

    try {
        const tmpDir = path.join(__dirname, 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
        const fileExt = quotedMsg.audioMessage ? 'mp3' : 'mp4';
        const inputPath = path.join(tmpDir, `${Date.now()}.${fileExt}`);

        // Descargar el archivo
        const stream = await downloadContentFromMessage(
            quotedMsg.audioMessage || quotedMsg.videoMessage,
            quotedMsg.audioMessage ? 'audio' : 'video'
        );
        const writer = fs.createWriteStream(inputPath);
        for await (const chunk of stream) writer.write(chunk);
        writer.end();

        // Subir a russellxz.click
        const form = new FormData();
        form.append('file', fs.createReadStream(inputPath));
        form.append('expiry', '3600');

        const upload = await axios.post('https://cdn.russellxz.click/upload.php', form, {
            headers: form.getHeaders()
        });

        if (!upload.data || !upload.data.url) throw new Error('No se pudo subir el archivo');
        const fileUrl = upload.data.url;

        // Buscar canción en la API de neoxr
        const apiURL = `https://api.neoxr.eu/api/whatmusic?url=${encodeURIComponent(fileUrl)}&apikey=russellxz`;
        const res = await axios.get(apiURL);
        if (!res.data.status || !res.data.data) throw new Error('No se pudo identificar la canción');

        const { title, artist, album, release } = res.data.data;

        // Buscar en YouTube
        const ytSearch = await yts(`${title} ${artist}`);
        const video = ytSearch.videos[0];
        if (!video) throw new Error("No se encontró la canción en YouTube");

        const banner = `
╔══════════════════╗
║ ✦ 𝘼𝙕𝙐𝙍𝘼 𝙐𝙇𝙏𝙍𝘼 𝟮.𝟬 𝗕𝗢𝗧 ✦
╚══════════════════╝

🎵 *Canción detectada:*  
╭───────────────╮  
├ 📌 *Título:* ${title}
├ 👤 *Artista:* ${artist}
├ 💿 *Álbum:* ${album}
├ 📅 *Lanzamiento:* ${release}
├ 🔎 *Buscando:* ${video.title}
├ ⏱️ *Duración:* ${video.timestamp}
├ 👁️ *Vistas:* ${video.views.toLocaleString()}
├ 📺 *Canal:* ${video.author.name}
├ 🔗 *Link:* ${video.url}
╰───────────────╯

⏳ *Espere un momento, descargando la canción...*`;

        await sock.sendMessage(msg.key.remoteJid, {
            image: { url: video.thumbnail },
            caption: banner
        }, { quoted: msg });

        // Descargar el audio desde YouTube
        const ytRes = await axios.get(`https://api.neoxr.eu/api/youtube?url=${encodeURIComponent(video.url)}&type=audio&quality=128kbps&apikey=russellxz`);
        const audioURL = ytRes.data.data.url;

        const rawPath = path.join(tmpDir, `${Date.now()}_raw.m4a`);
        const finalPath = path.join(tmpDir, `${Date.now()}_final.mp3`);

        const audioRes = await axios.get(audioURL, { responseType: 'stream' });
        await streamPipeline(audioRes.data, fs.createWriteStream(rawPath));

        // Convertir con FFmpeg a MP3
        await new Promise((resolve, reject) => {
            ffmpeg(rawPath)
                .audioCodec('libmp3lame')
                .audioBitrate('128k')
                .save(finalPath)
                .on('end', resolve)
                .on('error', reject);
        });

        await sock.sendMessage(msg.key.remoteJid, {
            audio: fs.readFileSync(finalPath),
            mimetype: 'audio/mpeg',
            fileName: `${title}.mp3`
        }, { quoted: msg });

        fs.unlinkSync(inputPath);
        fs.unlinkSync(rawPath);
        fs.unlinkSync(finalPath);

        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: '✅', key: msg.key }
        });

    } catch (err) {
        console.error(err);
        await sock.sendMessage(msg.key.remoteJid, {
            text: `❌ *Error:* ${err.message}`
        }, { quoted: msg });
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: '❌', key: msg.key }
        });
    }

    break;
}
        
case 'ff2': {
    const fs = require('fs');
    const path = require('path');
    const ffmpeg = require('fluent-ffmpeg');
    const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
    const { promisify } = require('util');
    const { pipeline } = require('stream');
    const streamPipeline = promisify(pipeline);

    // Validación: el usuario debe citar un audio o documento mp3
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const audioMsg = quotedMsg?.audioMessage;
    const docMsg = quotedMsg?.documentMessage;
    const isAudioDoc = docMsg?.mimetype?.startsWith("audio");

    if (!audioMsg && !isAudioDoc) {
        await sock.sendMessage(msg.key.remoteJid, {
            text: `✳️ Responde a un *audio* o *mp3 dañado* para repararlo.`
        }, { quoted: msg });
        break;
    }

    await sock.sendMessage(msg.key.remoteJid, {
        react: { text: '🎧', key: msg.key }
    });

    try {
        const tmpDir = path.join(__dirname, 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

        const inputPath = path.join(tmpDir, `${Date.now()}_raw.mp3`);
        const outputPath = path.join(tmpDir, `${Date.now()}_fixed.mp3`);

        const stream = await downloadContentFromMessage(audioMsg ? audioMsg : docMsg, 'audio');
        const writable = fs.createWriteStream(inputPath);
        for await (const chunk of stream) {
            writable.write(chunk);
        }
        writable.end();

        const startTime = Date.now();

        // Reparar el audio con ffmpeg
        await new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .audioCodec('libmp3lame')
                .audioBitrate('128k')
                .format('mp3')
                .save(outputPath)
                .on('end', resolve)
                .on('error', reject);
        });

        const endTime = ((Date.now() - startTime) / 1000).toFixed(1);

        await sock.sendMessage(msg.key.remoteJid, {
            audio: fs.readFileSync(outputPath),
            mimetype: 'audio/mpeg',
            fileName: `audio_reparado.mp3`,
            ptt: audioMsg?.ptt || false,
            caption: `✅ *Audio reparado exitosamente*\n⏱️ *Tiempo de reparación:* ${endTime}s\n\n© Azura Ultra 2.0`
        }, { quoted: msg });

        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);

        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: '✅', key: msg.key }
        });

    } catch (err) {
        console.error(err);
        await sock.sendMessage(msg.key.remoteJid, {
            text: `❌ *Error:* ${err.message}`
        }, { quoted: msg });

        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: '❌', key: msg.key }
        });
    }

    break;
}
case 'tag': {
  try {
    const chatId = msg.key.remoteJid;
    const senderJid = msg.key.participant || msg.key.remoteJid;
    const senderNum = senderJid.replace(/[^0-9]/g, "");
    const botNumber = sock.user?.id.split(":")[0].replace(/[^0-9]/g, "");

    // Verificar que se use en un grupo
    if (!chatId.endsWith("@g.us")) {
      await sock.sendMessage(chatId, { text: "⚠️ Este comando solo se puede usar en grupos." }, { quoted: msg });
      return;
    }

    // Verificar si es admin o el mismo bot
    const metadata = await sock.groupMetadata(chatId);
    const participant = metadata.participants.find(p => p.id.includes(senderNum));
    const isAdmin = participant?.admin === "admin" || participant?.admin === "superadmin";
    const isBot = botNumber === senderNum;

    if (!isAdmin && !isBot) {
      return await sock.sendMessage(chatId, {
        text: "❌ Solo los administradores del grupo o el bot pueden usar este comando."
      }, { quoted: msg });
    }

    const allMentions = metadata.participants.map(p => p.id);
    let messageToForward = null;
    let hasMedia = false;

    if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
      const quoted = msg.message.extendedTextMessage.contextInfo.quotedMessage;

      if (quoted.conversation) {
        messageToForward = { text: quoted.conversation };
      } else if (quoted.extendedTextMessage?.text) {
        messageToForward = { text: quoted.extendedTextMessage.text };
      } else if (quoted.imageMessage) {
        const stream = await downloadContentFromMessage(quoted.imageMessage, "image");
        let buffer = Buffer.alloc(0);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        const mimetype = quoted.imageMessage.mimetype || "image/jpeg";
        const caption = quoted.imageMessage.caption || "";
        messageToForward = { image: buffer, mimetype, caption };
        hasMedia = true;
      } else if (quoted.videoMessage) {
        const stream = await downloadContentFromMessage(quoted.videoMessage, "video");
        let buffer = Buffer.alloc(0);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        const mimetype = quoted.videoMessage.mimetype || "video/mp4";
        const caption = quoted.videoMessage.caption || "";
        messageToForward = { video: buffer, mimetype, caption };
        hasMedia = true;
      } else if (quoted.audioMessage) {
        const stream = await downloadContentFromMessage(quoted.audioMessage, "audio");
        let buffer = Buffer.alloc(0);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        const mimetype = quoted.audioMessage.mimetype || "audio/mp3";
        messageToForward = { audio: buffer, mimetype };
        hasMedia = true;
      } else if (quoted.stickerMessage) {
        const stream = await downloadContentFromMessage(quoted.stickerMessage, "sticker");
        let buffer = Buffer.alloc(0);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        messageToForward = { sticker: buffer };
        hasMedia = true;
      } else if (quoted.documentMessage) {
        const stream = await downloadContentFromMessage(quoted.documentMessage, "document");
        let buffer = Buffer.alloc(0);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        const mimetype = quoted.documentMessage.mimetype || "application/pdf";
        const caption = quoted.documentMessage.caption || "";
        messageToForward = { document: buffer, mimetype, caption };
        hasMedia = true;
      }
    }

    if (!hasMedia && args.join(" ").trim().length > 0) {
      messageToForward = { text: args.join(" ") };
    }

    if (!messageToForward) {
      await sock.sendMessage(chatId, { text: "⚠️ Debes responder a un mensaje o proporcionar un texto para reenviar." }, { quoted: msg });
      return;
    }

    await sock.sendMessage(chatId, {
      ...messageToForward,
      mentions: allMentions
    }, { quoted: msg });

  } catch (error) {
    console.error("❌ Error en el comando tag:", error);
    await sock.sendMessage(msg.key.remoteJid, {
      text: "❌ Ocurrió un error al ejecutar el comando tag."
    }, { quoted: msg });
  }
  break;
}      



case 'linia': {
  const fs = require("fs");
  const path = require("path");

  if (!isOwner) {
    await sock.sendMessage(msg.key.remoteJid, {
      text: "⛔ Este comando es solo para el *Owner*."
    }, { quoted: msg });
    break;
  }

  const buscar = args[0];
  if (!buscar) {
    await sock.sendMessage(msg.key.remoteJid, {
      text: "📍 Especifica el comando que deseas buscar.\n\nEjemplo: *.linia play*"
    }, { quoted: msg });
    break;
  }

  const archivoMain = path.join(__dirname, "main.js");

  if (!fs.existsSync(archivoMain)) {
    await sock.sendMessage(msg.key.remoteJid, {
      text: "❌ No se encontró el archivo *main.js*."
    }, { quoted: msg });
    break;
  }

  const contenido = fs.readFileSync(archivoMain, "utf-8");
  const lineas = contenido.split("\n");
  let lineaEncontrada = -1;

  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i].trim();
    const regex = new RegExp(`^case ['"\`]${buscar}['"\`]:`);
    if (regex.test(linea)) {
      lineaEncontrada = i + 1; // porque queremos número de línea 1-based
      break;
    }
  }

  if (lineaEncontrada !== -1) {
    await sock.sendMessage(msg.key.remoteJid, {
      text: `✅ El comando *${buscar}* fue encontrado en la línea *${lineaEncontrada}* de *main.js*.`
    }, { quoted: msg });
  } else {
    await sock.sendMessage(msg.key.remoteJid, {
      text: `❌ El comando *${buscar}* no se encontró en *main.js*.`
    }, { quoted: msg });
  }

  break;
}
        
  case 'ff': {
    const fs = require('fs');
    const path = require('path');
    const ffmpeg = require('fluent-ffmpeg');
    const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
    const { promisify } = require('util');
    const { pipeline } = require('stream');
    const streamPipeline = promisify(pipeline);

    // Validación: el usuario debe citar un video
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quotedMsg || !quotedMsg.videoMessage) {
        await sock.sendMessage(msg.key.remoteJid, {
            text: `✳️ Responde a un *video* para optimizarlo para WhatsApp.`
        }, { quoted: msg });
        break;
    }

    await sock.sendMessage(msg.key.remoteJid, {
        react: { text: '🔧', key: msg.key }
    });

    try {
        const tmpDir = path.join(__dirname, 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

        const rawPath = path.join(tmpDir, `${Date.now()}_raw.mp4`);
        const finalPath = path.join(tmpDir, `${Date.now()}_fixed.mp4`);

        // Descargar el video citado
        const stream = await downloadContentFromMessage(quotedMsg.videoMessage, 'video');
        const writable = fs.createWriteStream(rawPath);
        for await (const chunk of stream) {
            writable.write(chunk);
        }
        writable.end();

        const startTime = Date.now();

        // Conversión con ffmpeg para compatibilidad
        await new Promise((resolve, reject) => {
            ffmpeg(rawPath)
                .outputOptions([
                    '-c:v libx264',
                    '-preset fast',
                    '-crf 28',
                    '-c:a aac',
                    '-b:a 128k',
                    '-movflags +faststart'
                ])
                .save(finalPath)
                .on('end', resolve)
                .on('error', reject);
        });

        const endTime = ((Date.now() - startTime) / 1000).toFixed(1);

        await sock.sendMessage(msg.key.remoteJid, {
            video: fs.readFileSync(finalPath),
            mimetype: 'video/mp4',
            fileName: `video_optimo.mp4`,
            caption: `✅ *Video optimizado para WhatsApp*\n⏱️ *Conversión:* ${endTime}s\n\n© Azura Ultra 2.0`
        }, { quoted: msg });

        fs.unlinkSync(rawPath);
        fs.unlinkSync(finalPath);

        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: '✅', key: msg.key }
        });

    } catch (err) {
        console.error(err);
        await sock.sendMessage(msg.key.remoteJid, {
            text: `❌ *Error:* ${err.message}`
        }, { quoted: msg });

        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: '❌', key: msg.key }
        });
    }

    break;
}
      
case "git": {
    try {
        // Verificar que el comando solo lo use el owner
        if (!isOwner(sender)) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: "⚠️ *Solo el propietario puede usar este comando.*"
            }, { quoted: msg });
            return;
        }

        // Verificar si se proporcionó un comando
        if (!args[0]) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: "⚠️ *Debes especificar el nombre de un comando.*\nEjemplo: `.git rest`"
            }, { quoted: msg });
            return;
        }

        // Leer el archivo main.js
        const mainFilePath = "./main.js";
        if (!fs.existsSync(mainFilePath)) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: "❌ *Error:* No se encontró el archivo de comandos."
            }, { quoted: msg });
            return;
        }

        // Leer el contenido del archivo main.js
        const mainFileContent = fs.readFileSync(mainFilePath, "utf-8");

        // Buscar el comando solicitado
        const commandName = args[0].toLowerCase();
        const commandRegex = new RegExp(`case\\s+['"]${commandName}['"]:\\s*([\\s\\S]*?)\\s*break;`, "g");
        const match = commandRegex.exec(mainFileContent);

        if (!match) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ *Error:* No se encontró el comando *${commandName}* en el archivo main.js.`
            }, { quoted: msg });
            return;
        }

        // Extraer el código del comando
        const commandCode = `📜 *Código del comando ${commandName}:*\n\n\`\`\`${match[0]}\`\`\``;

        // Enviar el código como mensaje
        await sock.sendMessage(msg.key.remoteJid, {
            text: commandCode
        }, { quoted: msg });

    } catch (error) {
        console.error("❌ Error en el comando git:", error);
        await sock.sendMessage(msg.key.remoteJid, {
            text: "❌ *Error al obtener el código del comando.*"
        }, { quoted: msg });
    }
    break;
}




      
      
      case 'tiktoksearch': {
    const axios = require('axios');

    if (!args.length) {
        await sock.sendMessage(msg.key.remoteJid, { 
            text: `⚠️ *Uso incorrecto.*\n📌 Ejemplo: \`${global.prefix}tiktoksearch <query>\`` 
        }, { quoted: msg });
        return;
    }

    const query = args.join(' ');
    const apiUrl = `https://api.dorratz.com/v2/tiktok-s?q=${encodeURIComponent(query)}`;

    await sock.sendMessage(msg.key.remoteJid, { 
        react: { text: "⏳", key: msg.key } 
    });

    try {
        const response = await axios.get(apiUrl);

        if (response.data.status !== 200 || !response.data.data || response.data.data.length === 0) {
            return await sock.sendMessage(msg.key.remoteJid, { 
                text: "No se encontraron resultados para tu consulta." 
            }, { quoted: msg });
        }

        const results = response.data.data.slice(0, 5);

        const resultText = results.map((video, index) => `
📌 *Resultado ${index + 1}:*
📹 *Título:* ${video.title}
👤 *Autor:* ${video.author.nickname} (@${video.author.username})
👀 *Reproducciones:* ${video.play.toLocaleString()}
❤️ *Me gusta:* ${video.like.toLocaleString()}
💬 *Comentarios:* ${video.coment.toLocaleString()}
🔗 *Enlace:* ${video.url}
        `).join('\n');

        await sock.sendMessage(msg.key.remoteJid, { 
            text: `🔍 *Resultados de búsqueda en TikTok para "${query}":*\n\n${resultText}` 
        }, { quoted: msg });

        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "✅", key: msg.key } 
        });

    } catch (error) {
        console.error("❌ Error en el comando .tiktoksearch:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Ocurrió un error al procesar tu solicitud.*" 
        }, { quoted: msg });

        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "❌", key: msg.key } 
        });
    }
    break;
}
        case 'dalle': {
    const axios = require('axios');

    if (!args.length) {
        await sock.sendMessage(msg.key.remoteJid, { 
            text: `⚠️ *Uso incorrecto.*\n📌 Ejemplo: \`${global.prefix}dalle Gato en la luna\`` 
        }, { quoted: msg });
        return;
    }

    const text = args.join(' ');
    const apiUrl = `https://api.hiuraa.my.id/ai-img/imagen?text=${encodeURIComponent(text)}`;

    await sock.sendMessage(msg.key.remoteJid, { 
        react: { text: "⏳", key: msg.key } 
    });

    try {
        const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });

        if (!response.data) {
            throw new Error('No se pudo generar la imagen.');
        }

        const imageBuffer = Buffer.from(response.data, 'binary');

        await sock.sendMessage(msg.key.remoteJid, { 
            image: imageBuffer,
            caption: `🖼️ *Imagen generada para:* ${text}`,
            mimetype: 'image/jpeg'
        }, { quoted: msg });

        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "✅", key: msg.key } 
        });

    } catch (error) {
        console.error("❌ Error en el comando .dalle:", error.message);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: `❌ *Error al generar la imagen:*\n_${error.message}_` 
        }, { quoted: msg });

        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "❌", key: msg.key } 
        });
    }
    break;
}
        


        
case 'play3': {
    const fetch = require('node-fetch');
    const axios = require('axios');

    const apis = {
        delirius: 'https://delirius-apiofc.vercel.app/',
        ryzen: 'https://apidl.asepharyana.cloud/',
        rioo: 'https://restapi.apibotwa.biz.id/'
    };

    await sock.sendMessage(msg.key.remoteJid, { react: { text: "🎶", key: msg.key } });

    if (!text) {
        await sock.sendMessage(msg.key.remoteJid, {
            text: `⚠️ Escribe lo que deseas buscar en Spotify.\nEjemplo: *${global.prefix}play3* Marshmello - Alone`
        }, { quoted: msg });
        break;
    }

    try {
        const res = await axios.get(`${apis.delirius}search/spotify?q=${encodeURIComponent(text)}&limit=1`);
        if (!res.data.data || res.data.data.length === 0) {
            throw '❌ No se encontraron resultados en Spotify.';
        }

        const result = res.data.data[0];
        const img = result.image;
        const url = result.url;
        const info = `⧁ 𝙏𝙄𝙏𝙐𝙇𝙊: ${result.title}
⧁ 𝘼𝙍𝙏𝙄𝙎𝙏𝘼: ${result.artist}
⧁ 𝘿𝙐𝙍𝘼𝘾𝙄𝙊́𝙉: ${result.duration}
⧁ 𝙋𝙐𝘽𝙇𝙄𝘾𝘼𝘿𝙊: ${result.publish}
⧁ 𝙋𝙊𝙋𝙐𝙇𝘼𝙍𝙄𝘿𝘼𝘿: ${result.popularity}
⧁ 𝙀𝙉𝙇𝘼𝘾𝙀: ${url}

🎶 *Azura Ultra  esta enviando tu música...*`.trim();

        await sock.sendMessage(msg.key.remoteJid, {
            image: { url: img },
            caption: info
        }, { quoted: msg });

        const sendAudio = async (link) => {
            await sock.sendMessage(msg.key.remoteJid, {
                audio: { url: link },
                fileName: `${result.title}.mp3`,
                mimetype: 'audio/mpeg'
            }, { quoted: msg });
        };

        // Intento 1
        try {
            const res1 = await fetch(`${apis.delirius}download/spotifydl?url=${encodeURIComponent(url)}`);
            const json1 = await res1.json();
            return await sendAudio(json1.data.url);
        } catch (e1) {
            // Intento 2
            try {
                const res2 = await fetch(`${apis.delirius}download/spotifydlv3?url=${encodeURIComponent(url)}`);
                const json2 = await res2.json();
                return await sendAudio(json2.data.url);
            } catch (e2) {
                // Intento 3
                try {
                    const res3 = await fetch(`${apis.rioo}api/spotify?url=${encodeURIComponent(url)}`);
                    const json3 = await res3.json();
                    return await sendAudio(json3.data.response);
                } catch (e3) {
                    // Intento 4
                    try {
                        const res4 = await fetch(`${apis.ryzen}api/downloader/spotify?url=${encodeURIComponent(url)}`);
                        const json4 = await res4.json();
                        return await sendAudio(json4.link);
                    } catch (e4) {
                        await sock.sendMessage(msg.key.remoteJid, {
                            text: `❌ No se pudo descargar el audio.\nError: ${e4.message}`
                        }, { quoted: msg });
                    }
                }
            }
        }

    } catch (err) {
        console.error(err);
        await sock.sendMessage(msg.key.remoteJid, {
            text: `❌ Ocurrió un error: ${err.message || err}`
        }, { quoted: msg });
    }

    break;
}
      
case 'play5': {
    const yts = require('yt-search');
    const axios = require('axios');
    const fs = require('fs');
    const path = require('path');
    const { pipeline } = require('stream');
    const { promisify } = require('util');
    const ffmpeg = require('fluent-ffmpeg');

    const streamPipeline = promisify(pipeline);

    const formatAudio = ['mp3', 'm4a', 'webm', 'acc', 'flac', 'opus', 'ogg', 'wav'];

    const ddownr = {
        download: async (url, format) => {
            if (!formatAudio.includes(format)) {
                throw new Error('Formato no soportado.');
            }

            const config = {
                method: 'GET',
                url: `https://p.oceansaver.in/ajax/download.php?format=${format}&url=${encodeURIComponent(url)}&api=dfcb6d76f2f6a9894gjkege8a4ab232222`,
                headers: {
                    'User-Agent': 'Mozilla/5.0'
                }
            };

            const response = await axios.request(config);
            if (response.data && response.data.success) {
                const { id, title, info } = response.data;
                const downloadUrl = await ddownr.cekProgress(id);
                return { title, downloadUrl, thumbnail: info.image, uploader: info.author, duration: info.duration, views: info.views, video_url: info.video_url };
            } else {
                throw new Error('No se pudo obtener la información del audio.');
            }
        },
        cekProgress: async (id) => {
            const config = {
                method: 'GET',
                url: `https://p.oceansaver.in/ajax/progress.php?id=${id}`,
                headers: {
                    'User-Agent': 'Mozilla/5.0'
                }
            };

            while (true) {
                const response = await axios.request(config);
                if (response.data?.success && response.data.progress === 1000) {
                    return response.data.download_url;
                }
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    };

    if (!text) {
        await sock.sendMessage(msg.key.remoteJid, {
            text: `✳️ Usa el comando correctamente:\n\n📌 Ejemplo: *${global.prefix}play5* La Factoria - Perdoname`
        }, { quoted: msg });
        break;
    }

    await sock.sendMessage(msg.key.remoteJid, {
        react: { text: '⏳', key: msg.key }
    });

    try {
        const search = await yts(text);
        if (!search.videos || search.videos.length === 0) {
            throw new Error('No se encontraron resultados.');
        }

        const video = search.videos[0];
        const { title, url, timestamp, views, author, thumbnail } = video;

        const infoMessage = `
╔══════════════════╗
║  ✦ 𝘼𝙕𝙐𝙍𝘼 𝙐𝙇𝙏𝙍𝘼 BOT 2.0 ✦   
╚══════════════════╝

📀 *𝙄𝙣𝙛𝙤 𝙙𝙚𝙡 𝙫𝙞𝙙𝙚𝙤:*  
╭───────────────╮  
├ 🎼 *Título:* ${title}
├ ⏱️ *Duración:* ${timestamp}
├ 👁️ *Vistas:* ${views.toLocaleString()}
├ 👤 *Autor:* ${author.name}
└ 🔗 *Enlace:* ${url}
╰───────────────╯

📥 *Opciones de Descarga:*  
┣ 🎵 *Audio:* _${global.prefix}play5 ${text}_  
┣ 🎵 *Audio de spotify:* _${global.prefix}play3 ${text}_
┣ 🎥 *video:* _${global.prefix}play6 ${text}_  
┗ 🎥 *Video:* _${global.prefix}play4 ${text}_

⏳ *Espera un momento...*  
⚙️ *Azura Ultra 2.0 está procesando tu música...*

═════════════════════  
     𖥔 𝗔𝘇𝘂𝗋𝗮 𝗨𝗹𝘁𝗋𝗮 2.0 BOT 𖥔
═════════════════════`;

        await sock.sendMessage(msg.key.remoteJid, {
            image: { url: thumbnail },
            caption: infoMessage
        }, { quoted: msg });

        const { downloadUrl } = await ddownr.download(url, 'mp3');

        const tmpDir = path.join(__dirname, 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
        const rawPath = path.join(tmpDir, `${Date.now()}_raw.mp3`);
        const finalPath = path.join(tmpDir, `${Date.now()}_compressed.mp3`);

        const audioRes = await axios.get(downloadUrl, {
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });

        await streamPipeline(audioRes.data, fs.createWriteStream(rawPath));

        // Compresión del audio con ffmpeg
        await new Promise((resolve, reject) => {
            ffmpeg(rawPath)
                .audioBitrate('128k')
                .format('mp3')
                .on('end', resolve)
                .on('error', reject)
                .save(finalPath);
        });

        await sock.sendMessage(msg.key.remoteJid, {
            audio: fs.readFileSync(finalPath),
            mimetype: 'audio/mpeg',
            fileName: `${title}.mp3`
        }, { quoted: msg });

        fs.unlinkSync(rawPath);
        fs.unlinkSync(finalPath);

        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: '✅', key: msg.key }
        });

    } catch (err) {
        console.error(err);
        await sock.sendMessage(msg.key.remoteJid, {
            text: `❌ *Error Talvez excede el límite de 99MB:* ${err.message}`
        }, { quoted: msg });

        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: '❌', key: msg.key }
        });
    }

    break;
}
      
case 'play6': {
    const yts = require('yt-search');
    const axios = require('axios');
    const fs = require('fs');
    const path = require('path');
    const { pipeline } = require('stream');
    const { promisify } = require('util');
    const ffmpeg = require('fluent-ffmpeg');
    const streamPipeline = promisify(pipeline);

    const formatVideo = ['240', '360', '480', '720'];

    const ddownr = {
        download: async (url, format) => {
            if (!formatVideo.includes(format)) {
                throw new Error('Formato de video no soportado.');
            }

            const config = {
                method: 'GET',
                url: `https://p.oceansaver.in/ajax/download.php?format=${format}&url=${encodeURIComponent(url)}&api=dfcb6d76f2f6a9894gjkege8a4ab232222`,
                headers: {
                    'User-Agent': 'Mozilla/5.0'
                }
            };

            const response = await axios.request(config);
            if (response.data && response.data.success) {
                const { id, title, info } = response.data;
                const downloadUrl = await ddownr.cekProgress(id);
                return {
                    title,
                    downloadUrl,
                    thumbnail: info.image,
                    uploader: info.author,
                    duration: info.duration,
                    views: info.views,
                    video_url: info.video_url
                };
            } else {
                throw new Error('No se pudo obtener la información del video.');
            }
        },
        cekProgress: async (id) => {
            const config = {
                method: 'GET',
                url: `https://p.oceansaver.in/ajax/progress.php?id=${id}`,
                headers: {
                    'User-Agent': 'Mozilla/5.0'
                }
            };

            while (true) {
                const response = await axios.request(config);
                if (response.data?.success && response.data.progress === 1000) {
                    return response.data.download_url;
                }
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    };

    if (!text) {
        await sock.sendMessage(msg.key.remoteJid, {
            text: `✳️ Usa el comando correctamente:\n\n📌 Ejemplo: *${global.prefix}play6* La Factoria - Perdoname`
        }, { quoted: msg });
        break;
    }

    await sock.sendMessage(msg.key.remoteJid, {
        react: { text: '⏳', key: msg.key }
    });

    try {
        const search = await yts(text);
        if (!search.videos || search.videos.length === 0) {
            throw new Error('No se encontraron resultados.');
        }

        const video = search.videos[0];
        const { title, url, timestamp, views, author, thumbnail } = video;

        // Convertimos duración a minutos
        const durParts = timestamp.split(':').map(Number);
        const minutes = durParts.length === 3
            ? durParts[0] * 60 + durParts[1]
            : durParts[0];

        // Selección de calidad según duración
        let quality = '360';
        if (minutes <= 3) quality = '720';
        else if (minutes <= 5) quality = '480';
        else quality = '360';

        const infoMessage = `
╔══════════════════╗
║✦ 𝘼𝙕𝙐𝙍𝘼 𝙐𝙇𝙏𝙍𝘼 2.0 BOT  ✦   
╚══════════════════╝

📀 *𝙄𝙣𝙛𝙤 𝙙𝙚𝙡 𝙫𝙞𝙙𝙚𝙤:*  
╭───────────────╮  
├ 🎼 *Título:* ${title}
├ ⏱️ *Duración:* ${timestamp}
├ 👁️ *Vistas:* ${views.toLocaleString()}
├ 👤 *Autor:* ${author.name}
└ 🔗 *Enlace:* ${url}
╰───────────────╯

📥 *Opciones de Descarga:*  
┣ 🎵 *Audio:* _${global.prefix}play ${text}_  
┣ 🎵 *Audio de spotify:* _${global.prefix}play3 ${text}_
┣ 🎥 *video:* _${global.prefix}play2 ${text}_
┗ 🎥 *Video:* _${global.prefix}play6 ${text}_

⏳ *Espera un momento...*  
⚙️ *Azura Ultra 2.0 está procesando tu video...*

═════════════════════  
     𖥔 𝗔𝘇𝘂𝗋𝗮 𝗨𝗹𝘁𝗋𝗮 2.0 BOT𖥔
═════════════════════`;

        await sock.sendMessage(msg.key.remoteJid, {
            image: { url: thumbnail },
            caption: infoMessage
        }, { quoted: msg });

        const { downloadUrl } = await ddownr.download(url, quality);

        const tmpDir = path.join(__dirname, 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
        const rawPath = path.join(tmpDir, `${Date.now()}_raw.mp4`);
        const finalPath = path.join(tmpDir, `${Date.now()}_compressed.mp4`);

        const videoRes = await axios.get(downloadUrl, {
            responseType: 'stream',
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        await streamPipeline(videoRes.data, fs.createWriteStream(rawPath));

        // Ajuste dinámico de compresión
        let crf = 26;
        let bVideo = '600k';
        let bAudio = '128k';
        if (minutes <= 2) {
            crf = 24; bVideo = '800k';
        } else if (minutes > 5) {
            crf = 28; bVideo = '400k'; bAudio = '96k';
        }

        await new Promise((resolve, reject) => {
            ffmpeg(rawPath)
                .videoCodec('libx264')
                .audioCodec('aac')
                .outputOptions([
                    '-preset', 'veryfast',
                    `-crf`, `${crf}`,
                    `-b:v`, bVideo,
                    `-b:a`, bAudio,
                    '-movflags', '+faststart'
                ])
                .on('end', resolve)
                .on('error', reject)
                .save(finalPath);
        });

        const finalText = `🎬 Aquí tiene su video en calidad ${quality}p.

Disfrútelo y continúe explorando el mundo digital.

© Azura Ultra 2.0 Bot`;

        await sock.sendMessage(msg.key.remoteJid, {
            video: fs.readFileSync(finalPath),
            mimetype: 'video/mp4',
            fileName: `${title}.mp4`,
            caption: finalText
        }, { quoted: msg });

        fs.unlinkSync(rawPath);
        fs.unlinkSync(finalPath);

        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: '✅', key: msg.key }
        });

    } catch (err) {
        console.error(err);
        await sock.sendMessage(msg.key.remoteJid, {
            text: `❌ *Error Talvez excede el límite de 99MB:* ${err.message}`
        }, { quoted: msg });
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: '❌', key: msg.key }
        });
    }

    break;
}

case 'play1': {
    const yts = require('yt-search');
    const axios = require('axios');
    const fs = require('fs');
    const path = require('path');
    const { pipeline } = require('stream');
    const { promisify } = require('util');
    const ffmpeg = require('fluent-ffmpeg');
    const streamPipeline = promisify(pipeline);

    const formatAudio = ['mp3', 'm4a', 'webm', 'acc', 'flac', 'opus', 'ogg', 'wav'];

    const ddownr = {
        download: async (url, format) => {
            if (!formatAudio.includes(format)) {
                throw new Error('Formato no soportado.');
            }

            const config = {
                method: 'GET',
                url: `https://p.oceansaver.in/ajax/download.php?format=${format}&url=${encodeURIComponent(url)}&api=dfcb6d76f2f6a9894gjkege8a4ab232222`,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            };

            const response = await axios.request(config);
            if (response.data && response.data.success) {
                const { id, title, info } = response.data;
                const downloadUrl = await ddownr.cekProgress(id);
                return { title, downloadUrl, thumbnail: info.image };
            } else {
                throw new Error('No se pudo obtener la info del video.');
            }
        },
        cekProgress: async (id) => {
            const config = {
                method: 'GET',
                url: `https://p.oceansaver.in/ajax/progress.php?id=${id}`,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            };

            while (true) {
                const response = await axios.request(config);
                if (response.data?.success && response.data.progress === 1000) {
                    return response.data.download_url;
                }
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    };

    await sock.sendMessage(msg.key.remoteJid, { react: { text: "🎶", key: msg.key } });

    try {
        if (!text || text.trim() === "") {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `⚠️ Escribe por favor el nombre de la canción.\nEjemplo: *${global.prefix}play1 Boza Yaya*`
            }, { quoted: msg });
            return;
        }

        const search = await yts(text);
        if (!search.videos || search.videos.length === 0) {
            throw new Error('No se encontraron resultados.');
        }

        const video = search.videos[0];
        const { title, url, thumbnail } = video;

        const { downloadUrl } = await ddownr.download(url, 'mp3');

        const tmpDir = path.join(__dirname, 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
        const rawPath = path.join(tmpDir, `${Date.now()}_raw.mp3`);
        const finalPath = path.join(tmpDir, `${Date.now()}_compressed.mp3`);

        const audioRes = await axios.get(downloadUrl, {
            responseType: 'stream',
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        await streamPipeline(audioRes.data, fs.createWriteStream(rawPath));

        await new Promise((resolve, reject) => {
            ffmpeg(rawPath)
                .audioBitrate('128k')
                .format('mp3')
                .on('end', resolve)
                .on('error', reject)
                .save(finalPath);
        });

        await sock.sendMessage(msg.key.remoteJid, {
            audio: fs.readFileSync(finalPath),
            fileName: `${title}.mp3`,
            mimetype: "audio/mpeg",
            contextInfo: {
                externalAdReply: {
                    title: title,
                    body: "αʑυrα υℓτrα 2.0 вστ",
                    mediaType: 1,
                    previewType: "PHOTO",
                    thumbnailUrl: thumbnail,
                    showAdAttribution: true,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: msg });

        fs.unlinkSync(rawPath);
        fs.unlinkSync(finalPath);

    } catch (error) {
        console.error(error);
        await sock.sendMessage(msg.key.remoteJid, {
            text: "⚠️ Hubo un pequeño error Talvez excede el límite de 99MB:("
        }, { quoted: msg });
    }

    break;
}


case 'copiarpg': {
    try {
        // Reacción de archivo listo 📁
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "📁", key: msg.key }
        });

        // Verificar si es owner
        if (!isOwner(sender)) {
            return sock.sendMessage(msg.key.remoteJid, {
                text: "⛔ *Solo el propietario del bot puede usar este comando.*"
            }, { quoted: msg });
        }

        const fs = require("fs");
        const filePath = "./rpg.json";

        if (!fs.existsSync(filePath)) {
            return sock.sendMessage(msg.key.remoteJid, {
                text: "❌ *El archivo rpg.json no existe.*"
            }, { quoted: msg });
        }

        await sock.sendMessage(msg.key.remoteJid, {
            document: fs.readFileSync(filePath),
            fileName: "rpg.json",
            mimetype: "application/json",
            caption: "📂 *Aquí tienes el archivo RPG actualizado*"
        }, { quoted: msg });

    } catch (error) {
        console.error("❌ Error en .copiarpg:", error);
        await sock.sendMessage(msg.key.remoteJid, {
            text: "❌ *Ocurrió un error al enviar el archivo RPG.*"
        }, { quoted: msg });
    }
    break;
}
      
case 'robar': {
  try {
    const fs = require("fs");
    const rpgFile = "./rpg.json";
    const userId = msg.key.participant || msg.key.remoteJid;
    const cooldownTime = 10 * 60 * 1000; // 10 minutos

    // 🥷 Reacción inicial
    await sock.sendMessage(msg.key.remoteJid, {
      react: { text: "🥷", key: msg.key }
    });

    // Verificar si el archivo existe
    if (!fs.existsSync(rpgFile)) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: "❌ *Los datos del RPG no están disponibles.*"
      }, { quoted: msg });
    }

    let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

    // Verificar que el ladrón esté registrado
    if (!rpgData.usuarios[userId]) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: `❌ *No tienes una cuenta registrada en el gremio Azura Ultra.*\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.`
      }, { quoted: msg });
    }

    let usuario = rpgData.usuarios[userId];

    // Verificar que el ladrón tenga vida
    if (usuario.vida <= 0) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: `🚑 *¡No puedes robar! Tu vida es 0.*\n💉 Usa \`${global.prefix}hospital\` para curarte.`
      }, { quoted: msg });
    }

    let tiempoActual = Date.now();
    if (usuario.cooldowns?.robar && (tiempoActual - usuario.cooldowns.robar) < cooldownTime) {
      let tiempoRestante = ((usuario.cooldowns.robar + cooldownTime - tiempoActual) / (60 * 1000)).toFixed(1);
      return sock.sendMessage(msg.key.remoteJid, {
        text: `⏳ *Debes esperar ${tiempoRestante} minutos antes de volver a robar.*`
      }, { quoted: msg });
    }

    // Obtener ID de la víctima por mención o cita
    let targetId = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
                   msg.message?.extendedTextMessage?.contextInfo?.participant;

    if (!targetId) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: `⚠️ *Debes citar o mencionar al usuario que deseas robar.*\n📌 Ejemplo: \`${global.prefix}robar @usuario\``
      }, { quoted: msg });
    }

    // Verificar si la víctima está registrada
    if (!rpgData.usuarios[targetId]) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: `❌ *El usuario al que intentas robar no está registrado en el RPG.*`
      }, { quoted: msg });
    }

    // Agregamos el ID para poder usarlo en las menciones
    let victima = {
      ...rpgData.usuarios[targetId],
      id: targetId
    };

    // Calcular si el robo tiene éxito
    let exito = Math.random() < 0.5;
    let vidaPerdida = exito
      ? Math.floor(Math.random() * (10 - 5 + 1)) + 5
      : Math.floor(Math.random() * (20 - 10 + 1)) + 10;

    usuario.vida = Math.max(0, usuario.vida - vidaPerdida);

    let xpRobado = 0;
    let diamantesRobados = 0;

    if (exito) {
      xpRobado = Math.floor(Math.random() * (3000 - 500 + 1)) + 500;

      if (victima.diamantes > 0) {
        diamantesRobados = Math.min(victima.diamantes, Math.floor(Math.random() * (1500 - 20 + 1)) + 20);
      } else {
        xpRobado += Math.floor(Math.random() * (1000 - 300 + 1)) + 300;
      }

      usuario.experiencia += xpRobado;
      usuario.diamantes += diamantesRobados;

      victima.diamantes = Math.max(0, victima.diamantes - diamantesRobados);
      victima.experiencia = Math.max(0, victima.experiencia - xpRobado);
    } else {
      let xpPerdido = Math.floor(Math.random() * (1000 - 300 + 1)) + 300;
      usuario.experiencia = Math.max(0, usuario.experiencia - xpPerdido);
    }

    // Resultado del robo
    const textosExito = [
      `🥷 *${usuario.nombre} robó exitosamente a @${victima.id.split('@')[0]}.*\n💎 *Diamantes robados:* ${diamantesRobados}\n✨ *XP robada:* ${xpRobado}`,
      `💰 *¡Plan maestro! ${usuario.nombre} engañó a @${victima.id.split('@')[0]} y se fue con el botín.*\n💎 *Diamantes:* ${diamantesRobados}\n🎯 *XP:* ${xpRobado}`,
      `🚀 *Sigiloso como un ninja, ${usuario.nombre} despojó a @${victima.id.split('@')[0]}.*\n💎 *Diamantes:* ${diamantesRobados}\n🧠 *XP:* ${xpRobado}`
    ];
    const textosFracaso = [
      `🚨 *¡${usuario.nombre} fue atrapado intentando robar y recibió un castigo!*\n❤️ *Vida perdida:* ${vidaPerdida}`,
      `❌ *Intento fallido... ${usuario.nombre} quiso robar a @${victima.id.split('@')[0]} pero fue descubierto.*\n❤️ *Vida perdida:* ${vidaPerdida}`
    ];

    const mensajeResultado = exito
      ? textosExito[Math.floor(Math.random() * textosExito.length)]
      : textosFracaso[Math.floor(Math.random() * textosFracaso.length)];

    await sock.sendMessage(msg.key.remoteJid, {
      text: mensajeResultado,
      mentions: [userId, targetId]
    }, { quoted: msg });

    // Posibilidad de subir habilidad
    let habilidadesArray = Object.keys(usuario.habilidades || {});
    if (habilidadesArray.length > 0 && Math.random() < 0.3) {
      let habilidadSubida = habilidadesArray[Math.floor(Math.random() * habilidadesArray.length)];
      usuario.habilidades[habilidadSubida].nivel += 1;
      await sock.sendMessage(msg.key.remoteJid, {
        text: `🌟 *¡${usuario.nombre} ha mejorado su habilidad!*\n🔹 *${habilidadSubida}: Nivel ${usuario.habilidades[habilidadSubida].nivel}*`
      }, { quoted: msg });
    }

    // Subida de nivel
    let xpMaxNivel = usuario.nivel === 1 ? 1000 : usuario.nivel * 1500;
    while (usuario.experiencia >= xpMaxNivel && usuario.nivel < 50) {
      usuario.experiencia -= xpMaxNivel;
      usuario.nivel += 1;
      await sock.sendMessage(msg.key.remoteJid, {
        text: `🎉 *¡${usuario.nombre} ha subido al nivel ${usuario.nivel}! 🏆*`
      }, { quoted: msg });
      xpMaxNivel = usuario.nivel * 1500;
    }

    // Subida de rango
    const rangos = [
      { nivel: 1, rango: "🌟 Novato" },
      { nivel: 5, rango: "⚔️ Ladrón Aprendiz" },
      { nivel: 10, rango: "🔥 Criminal Experto" },
      { nivel: 20, rango: "👑 Maestro del Robo" },
      { nivel: 30, rango: "🌀 Señor del Crimen" },
      { nivel: 40, rango: "💀 Rey de los Ladrones" },
      { nivel: 50, rango: "🚀 Legendario" }
    ];

    let rangoAnterior = usuario.rango;
    usuario.rango = rangos.reduce((acc, curr) => (usuario.nivel >= curr.nivel ? curr.rango : acc), usuario.rango);

    if (usuario.rango !== rangoAnterior) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: `🎖️ *¡${usuario.nombre} ha subido de rango a ${usuario.rango}!*`
      }, { quoted: msg });
    }

    usuario.cooldowns = usuario.cooldowns || {};
    usuario.cooldowns.robar = tiempoActual;

    // Guardar cambios
    fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));
    
  } catch (error) {
    console.error("❌ Error en el comando .robar:", error);
    await sock.sendMessage(msg.key.remoteJid, {
      text: "❌ *Ocurrió un error al intentar robar. Inténtalo de nuevo más tarde.*"
    }, { quoted: msg });
  }
  break;
}
      
case 'tran':
case 'transferir': {
  await sock.sendMessage(msg.key.remoteJid, { react: { text: "💱", key: msg.key } });

  const amount = parseInt(args[0]);
  if (!amount || amount <= 0) {
    return await sock.sendMessage(msg.key.remoteJid, { text: `⚠️ Uso correcto: \`${global.prefix}tran <cantidad>\` (cita o menciona al usuario).` }, { quoted: msg });
  }

  const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
  const quotedParticipant = msg.message.extendedTextMessage?.contextInfo?.participant;
  const targetJid = mentioned || quotedParticipant;
  if (!targetJid) {
    return await sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Debes citar o mencionar al usuario al que quieres transferir." }, { quoted: msg });
  }

  const senderJid = `${sender}@s.whatsapp.net`;
  if (senderJid === targetJid) {
    return await sock.sendMessage(msg.key.remoteJid, { text: "⚠️ No puedes transferirte a ti mismo." }, { quoted: msg });
  }

  const rpgFile = "./rpg.json";
  const rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));
  const usuarios = rpgData.usuarios || {};

  // Validar que remitente y destinatario estén registrados
  if (!usuarios[senderJid]) {
    return await sock.sendMessage(msg.key.remoteJid, { text: `❌ No estás registrado en el gremio. Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` }, { quoted: msg });
  }
  if (!usuarios[targetJid]) {
    return await sock.sendMessage(msg.key.remoteJid, { text: `❌ El usuario @${targetJid.split("@")[0]} no está registrado en el gremio.` }, { quoted: msg, mentions: [targetJid] });
  }

  const senderBalance = usuarios[senderJid].diamantes || 0;
  if (senderBalance < amount) {
    return await sock.sendMessage(msg.key.remoteJid, { text: `❌ No tienes suficientes diamantes. Tu saldo actual: ${senderBalance}` }, { quoted: msg });
  }

  // Realizar transferencia
  usuarios[senderJid].diamantes -= amount;
  usuarios[targetJid].diamantes += amount;
  fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

  await sock.sendMessage(msg.key.remoteJid, {
    text: `✅ Transferencia exitosa de *${amount}* diamante(s) a @${targetJid.split("@")[0]}.\n💎 Tu nuevo saldo: ${usuarios[senderJid].diamantes}`,
    mentions: [targetJid]
  }, { quoted: msg });

  await sock.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });
  break;
}
case 'yts': 
case 'ytsearch': {
    const axios = require('axios');

    if (!args.length) {
        await sock.sendMessage(msg.key.remoteJid, { 
            text: `⚠️ *Uso incorrecto.*\n📌 Ejemplo: \`${global.prefix}yts <query>\`` 
        }, { quoted: msg });
        return;
    }

    const query = args.join(' ');
    const apiUrl = `https://api.dorratz.com/v3/yt-search?query=${encodeURIComponent(query)}`;

    await sock.sendMessage(msg.key.remoteJid, { 
        react: { text: "⏳", key: msg.key } 
    });

    try {
        const response = await axios.get(apiUrl);
        const { data } = response.data;

        if (!data || data.length === 0) {
            throw new Error('No se encontraron resultados para el texto proporcionado.');
        }

        let results = `🎬 *Resultados de búsqueda para:* ${query}\n\n`;
        results += data.slice(0, 5).map((video, index) => `
🔹 *Resultado ${index + 1}:*
   > *Título:* ${video.title}
   > *Canal:* ${video.author.name}
   > *Publicado en:* ${video.publishedAt}
   > *Duración:* ${video.duration}
   > *Vistas:* ${video.views.toLocaleString()}
   > *Enlace:* ${video.url}
        `).join('\n\n');

        const thumbnail = data[0].thumbnail;

        await sock.sendMessage(msg.key.remoteJid, { 
            image: { url: thumbnail },
            caption: results,
            mimetype: 'image/jpeg'
        }, { quoted: msg });

        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "✅", key: msg.key } 
        });

    } catch (error) {
        console.error("❌ Error en el comando .yts:", error.message);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: `❌ *Error al buscar en YouTube:*\n_${error.message}_` 
        }, { quoted: msg });

        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "❌", key: msg.key } 
        });
    }
    break;
}
case 'gifvideo': {
    try {
        // Reacción inicial
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "🎞️", key: msg.key }
        });

        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (!quoted || !quoted.videoMessage) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: "⚠️ *Responde a un video para convertirlo en estilo GIF largo.*"
            }, { quoted: msg });
            return;
        }

        // Descargar el video citado
        const stream = await downloadContentFromMessage(quoted.videoMessage, "video");
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // Enviar como video estilo GIF largo (sin audio)
        await sock.sendMessage(msg.key.remoteJid, {
            video: buffer,
            gifPlayback: true,
            caption: "🎬 *Video convertido a estilo GIF largo* (sin audio)"
        }, { quoted: msg });

    } catch (error) {
        console.error("❌ Error en .gifvideo:", error);
        await sock.sendMessage(msg.key.remoteJid, {
            text: "❌ *Ocurrió un error al procesar el video.*"
        }, { quoted: msg });
    }
    break;
}
      
case 'gremio': {
    try {
        const rpgFile = "./rpg.json";

        // 🔄 Reacción inicial
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "🏰", key: msg.key }
        });

        // Verificar si existe el archivo RPG
        if (!fs.existsSync(rpgFile)) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "❌ *El gremio aún no tiene miembros.* Usa `" + global.prefix + "rpg <nombre> <edad>` para registrarte." 
            }, { quoted: msg });
            return;
        }

        // Leer datos del RPG
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        if (!rpgData.usuarios || Object.keys(rpgData.usuarios).length === 0) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "📜 *No hay miembros registrados en el Gremio Azura Ultra.*\nUsa `" + global.prefix + "rpg <nombre> <edad>` para unirte." 
            }, { quoted: msg });
            return;
        }

        let miembros = Object.values(rpgData.usuarios);
        miembros.sort((a, b) => b.nivel - a.nivel); // Orden por nivel descendente

        // Encabezado del mensaje con el total al principio
        let listaMiembros = 
`╔══════════════════╗  
║ 🏰 *Gremio Azura Ultra* 🏰 ║  
╚══════════════════╝  

📋 *Total de miembros registrados:* ${miembros.length}\n`;

        // Lista detallada de cada usuario
        miembros.forEach((usuario, index) => {
            const numMascotas = usuario.mascotas ? usuario.mascotas.length : 0;
            const numPersonajes = usuario.personajes ? usuario.personajes.length : 0;

            listaMiembros += `\n════════════════════\n`;
            listaMiembros += `🔹 *${index + 1}.* ${usuario.nombre}\n`;
            listaMiembros += `   🏅 *Rango:* ${usuario.rango}\n`;
            listaMiembros += `   🎚️ *Nivel:* ${usuario.nivel}\n`;
            listaMiembros += `   🎂 *Edad:* ${usuario.edad} años\n`;
            listaMiembros += `   🐾 *Mascotas:* ${numMascotas}\n`;
            listaMiembros += `   🎭 *Personajes:* ${numPersonajes}\n`;
        });

        // Enviar resultado con fondo animado
        await sock.sendMessage(msg.key.remoteJid, { 
            video: { url: "https://cdn.dorratz.com/files/1740565316697.mp4" }, 
            gifPlayback: true, 
            caption: listaMiembros 
        }, { quoted: msg });

    } catch (error) {
        console.error("❌ Error en el comando .gremio:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Hubo un error al obtener la lista del gremio. Inténtalo de nuevo.*" 
        }, { quoted: msg });
    }
    break;
}
      
case 'infogrupo': {
  // Verifica que el comando se ejecute en un grupo
  if (!msg.key.remoteJid.endsWith("@g.us")) {
    await sock.sendMessage(msg.key.remoteJid, { 
      text: "⚠️ *Este comando solo funciona en grupos.*" 
    }, { quoted: msg });
    return;
  }
  
  // Envía reacción inicial
  await sock.sendMessage(msg.key.remoteJid, { 
    react: { text: "🔍", key: msg.key } 
  });
  
  try {
    // Obtiene la metadata del grupo
    let meta = await sock.groupMetadata(msg.key.remoteJid);
    let subject = meta.subject || "Sin nombre";
    let description = meta.desc || "No hay descripción.";
    
    // Construye el mensaje de información del grupo
    let messageText = `*Información del Grupo:*\n\n*Nombre:* ${subject}\n*Descripción:* ${description}`;
    
    // Envía el mensaje con la información
    await sock.sendMessage(msg.key.remoteJid, { text: messageText }, { quoted: msg });
    
    // Envía reacción final de éxito
    await sock.sendMessage(msg.key.remoteJid, { 
      react: { text: "✅", key: msg.key } 
    });
  } catch (err) {
    console.error("Error en el comando infogrupo:", err);
    await sock.sendMessage(msg.key.remoteJid, { 
      text: "❌ *Error al obtener la información del grupo.*" 
    }, { quoted: msg });
  }
  break;
}
      
          case 'tiktokstalk': {
    const fetch = require('node-fetch');

    if (!text) {
        return sock.sendMessage(msg.key.remoteJid, {
            text: `⚠️ *Uso incorrecto.*\n\n📌 *Ejemplo:* *${global.prefix}tiktokstalk russellxzpty*`
        }, { quoted: msg });
    }

    const username = text.trim();
    const apiUrl = `https://api.dorratz.com/v3/tiktok-stalk?username=${encodeURIComponent(username)}`;

    await sock.sendMessage(msg.key.remoteJid, {
        react: { text: '⏳', key: msg.key }
    });

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Error de la API: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.userInfo) {
            throw new Error("No se pudo obtener la información del usuario.");
        }

        const userInfo = data.userInfo;

        const caption = `*Información de TikTok:*\n\n` +
                        `👤 *Nombre:* ${userInfo.nombre}\n` +
                        `📌 *Usuario:* @${userInfo.username}\n` +
                        `🆔 *ID:* ${userInfo.id}\n` +
                        `📝 *Bio:* ${userInfo.bio}\n` +
                        `✅ *Verificado:* ${userInfo.verificado ? 'Sí' : 'No'}\n` +
                        `👥 *Seguidores:* ${userInfo.seguidoresTotales}\n` +
                        `👀 *Siguiendo:* ${userInfo.siguiendoTotal}\n` +
                        `❤️ *Me gusta totales:* ${userInfo.meGustaTotales}\n` +
                        `🎥 *Videos totales:* ${userInfo.videosTotales}\n` +
                        `🤝 *Amigos totales:* ${userInfo.amigosTotales}\n\n` +
                        `✨ *Información obtenida por Azura Ultra 2.0 Bot*`;

        await sock.sendMessage(msg.key.remoteJid, {
            image: { url: userInfo.avatar },
            caption: caption,
            mimetype: 'image/jpeg'
        }, { quoted: msg });

        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: '✅', key: msg.key }
        });

    } catch (error) {
        console.error("❌ Error en el comando .tiktokstalk:", error);
        await sock.sendMessage(msg.key.remoteJid, {
            text: `❌ *Ocurrió un error:* ${error.message}\n\n🔹 Inténtalo de nuevo más tarde.`
        }, { quoted: msg });

        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: '❌', key: msg.key }
        });
    }
    break;
}  
case 'vision2':
case 'visión2': {
    const fetch = require('node-fetch');

    if (!args.length) {
        await sock.sendMessage(msg.key.remoteJid, { 
            text: `⚠️ *Uso incorrecto.*\n📌 Ejemplo: \`${global.prefix}visión mujer cabello plateado\`` 
        }, { quoted: msg });
        return;
    }

    const query = args.join(" ");
    const apiUrl = `https://api.neoxr.eu/api/ai-anime?q=${encodeURIComponent(query)}&apikey=russellxz`;

    await sock.sendMessage(msg.key.remoteJid, { 
        react: { text: "⏳", key: msg.key } 
    });

    try {
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`Error de la API: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.status || !data.data || !data.data.url) {
            throw new Error("No se pudo generar la imagen.");
        }

        const imageUrl = data.data.url;
        const caption = `🎨 *Prompt:* ${data.data.prompt}\n🔗 *Enlace de la imagen:* ${imageUrl}`;

        await sock.sendMessage(msg.key.remoteJid, { 
            image: { url: imageUrl },
            caption: caption,
            mimetype: 'image/png'
        }, { quoted: msg });

        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "✅", key: msg.key } 
        });

    } catch (error) {
        console.error("❌ Error en el comando .visión:", error.message);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: `❌ *Error al generar la imagen:*\n_${error.message}_\n\n🔹 Inténtalo más tarde.` 
        }, { quoted: msg });

        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "❌", key: msg.key } 
        });
    }
    break;
}
case 'spotify': {
    const fetch = require('node-fetch');

    if (!text) {
        await sock.sendMessage(msg.key.remoteJid, {
            text: `⚠️ *Uso incorrecto del comando.*\n\n📌 *Ejemplo:* *${global.prefix}spotify* https://open.spotify.com/track/3NDEO1QeVlxskfRHHGm7KS`
        }, { quoted: msg });
        return;
    }

    if (!/^https?:\/\/(www\.)?open\.spotify\.com\/track\//.test(text)) {
        return sock.sendMessage(msg.key.remoteJid, {
            text: `⚠️ *Enlace no válido.*\n\n📌 Asegúrate de ingresar una URL de Spotify válida.\n\nEjemplo: *${global.prefix}spotify* https://open.spotify.com/track/3NDEO1QeVlxskfRHHGm7KS`
        }, { quoted: msg });
    }

    await sock.sendMessage(msg.key.remoteJid, {
        react: { text: '⏳', key: msg.key }
    });

    try {
        const apiUrl = `https://api.neoxr.eu/api/spotify?url=${encodeURIComponent(text)}&apikey=russellxz`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`Error de la API: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.status || !data.data || !data.data.url) {
            throw new Error("No se pudo obtener el enlace de descarga.");
        }

        const songInfo = data.data;

        const caption = `🎵 *Título:* ${songInfo.title}\n` +
                        `🎤 *Artista:* ${songInfo.artist.name}\n` +
                        `⏱️ *Duración:* ${songInfo.duration}\n` +
                        `🔗 *Enlace de descarga:* ${songInfo.url}`;

        await sock.sendMessage(msg.key.remoteJid, {
            image: { url: songInfo.thumbnail },
            caption: caption,
            mimetype: 'image/jpeg'
        }, { quoted: msg });

        const audioResponse = await fetch(songInfo.url);
        if (!audioResponse.ok) {
            throw new Error("No se pudo descargar el archivo de audio.");
        }

        const audioBuffer = await audioResponse.buffer();

        await sock.sendMessage(msg.key.remoteJid, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            fileName: `${songInfo.title}.mp3`
        }, { quoted: msg });

        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: '✅', key: msg.key }
        });

    } catch (error) {
        console.error("❌ Error en el comando .spotify:", error);
        await sock.sendMessage(msg.key.remoteJid, {
            text: `❌ *Ocurrió un error:* ${error.message}\n\n🔹 Inténtalo de nuevo más tarde.`
        }, { quoted: msg });

        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: '❌', key: msg.key }
        });
    }
    break;
}
case 'mediafire': {
    const fetch = require('node-fetch');

    if (!text) {
        await sock.sendMessage(msg.key.remoteJid, { 
            text: `⚠️ *Uso incorrecto.*\n📌 Ejemplo: \`${global.prefix}mediafire https://www.mediafire.com/file/ejemplo/file.zip\`` 
        }, { quoted: msg });
        return;
    }

    if (!/^https?:\/\/(www\.)?mediafire\.com/.test(text)) {
        await sock.sendMessage(msg.key.remoteJid, { 
            text: `⚠️ *Enlace no válido.*\n📌 Asegúrate de ingresar una URL de MediaFire válida.\n\nEjemplo: \`${global.prefix}mediafire https://www.mediafire.com/file/ejemplo/file.zip\`` 
        }, { quoted: msg });
        return;
    }

    await sock.sendMessage(msg.key.remoteJid, { 
        react: { text: '⏳', key: msg.key } 
    });

    const mediafireUrl = text;

    try {
        const apiUrl = `https://api.neoxr.eu/api/mediafire?url=${encodeURIComponent(mediafireUrl)}&apikey=russellxz`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`Error de la API: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.status || !data.data || !data.data.url) {
            throw new Error("No se pudo obtener el enlace de descarga.");
        }

        const fileInfo = data.data;
        const fileResponse = await fetch(fileInfo.url);
        if (!fileResponse.ok) {
            throw new Error("No se pudo descargar el archivo.");
        }

        const fileBuffer = await fileResponse.buffer();
        const caption = `📂 *Nombre del archivo:* ${fileInfo.title}\n` +
                        `📦 *Tamaño:* ${fileInfo.size}\n` +
                        `📏 *Tipo:* ${fileInfo.mime}\n` +
                        `🔗 *Extensión:* ${fileInfo.extension}\n`;

        await sock.sendMessage(msg.key.remoteJid, { 
            text: caption 
        }, { quoted: msg });
        await sock.sendMessage(msg.key.remoteJid, {
            document: fileBuffer,
            mimetype: fileInfo.mime,
            fileName: fileInfo.title
        }, { quoted: msg });

        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: '✅', key: msg.key } 
        });

    } catch (error) {
        console.error("❌ Error en el comando .mediafire:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: `❌ *Ocurrió un error al procesar la solicitud:*\n_${error.message}_\n\n🔹 Inténtalo de nuevo más tarde.` 
        }, { quoted: msg });

        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: '❌', key: msg.key } 
        });
    }
    break;
}
                
                        
            


case 'totalper': {
  try {
    // Agrega una reacción para indicar que el comando se ha activado
    await sock.sendMessage(msg.key.remoteJid, { react: { text: "🔢", key: msg.key } });
    
    const fs = require('fs');
    const rpgFile = "./rpg.json";
    if (!fs.existsSync(rpgFile)) {
      await sock.sendMessage(msg.key.remoteJid, { text: "❌ No se encontró el archivo de RPG." }, { quoted: msg });
      return;
    }
    
    // Carga de datos RPG
    let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));
    
    // Cuenta la cantidad de personajes en la tienda
    let totalStore = Array.isArray(rpgData.tiendaPersonajes) ? rpgData.tiendaPersonajes.length : 0;
    
    // Cuenta la cantidad de personajes en las carteras de los usuarios
    let totalUsers = 0;
    if (rpgData.usuarios && typeof rpgData.usuarios === "object") {
      for (let user in rpgData.usuarios) {
        if (rpgData.usuarios[user].personajes && Array.isArray(rpgData.usuarios[user].personajes)) {
          totalUsers += rpgData.usuarios[user].personajes.length;
        }
      }
    }
    
    let totalCharacters = totalStore + totalUsers;
    
    let messageText = `📊 *TOTAL DE PERSONAJES EN EL SISTEMA* 📊\n\n`;
    messageText += `*En la tienda:* ${totalStore}\n`;
    messageText += `*En las carteras de usuarios:* ${totalUsers}\n`;
    messageText += `─────────────────────────\n`;
    messageText += `*Total:* ${totalCharacters}`;
    
    // Envía el mensaje con los resultados
    await sock.sendMessage(msg.key.remoteJid, { text: messageText }, { quoted: msg });
    
    // Reacción final de éxito
    await sock.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });
  } catch (error) {
    console.error("Error en el comando totalper:", error);
    await sock.sendMessage(msg.key.remoteJid, { text: "❌ Ocurrió un error al calcular el total de personajes." }, { quoted: msg });
  }
  break;
}
            
// Comando para cambiar la foto del perfil del bot
case 'botfoto': {
  // Verifica que el usuario sea owner
  if (!global.isOwner(sender)) {
    await sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Solo el owner puede usar este comando." });
    return;
  }
  // Envía una reacción para indicar que se activó el comando
  await sock.sendMessage(msg.key.remoteJid, { react: { text: "📸", key: msg.key } });
  
  // Verifica que se haya respondido a un mensaje que contenga una imagen
  let quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (!quotedMsg || !quotedMsg.imageMessage) {
    await sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Debes responder a un mensaje que contenga una imagen para actualizar la foto del bot." });
    return;
  }
  
  try {
    // Descarga la imagen del mensaje citado
    const stream = await downloadContentFromMessage(quotedMsg.imageMessage, 'image');
    let buffer = Buffer.alloc(0);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }
    // Actualiza la foto del bot usando su ID (sock.user.id)
    await sock.updateProfilePicture(sock.user.id, buffer);
    await sock.sendMessage(msg.key.remoteJid, { text: "✅ Foto del bot actualizada correctamente." });
    // Reacción final de éxito
    await sock.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });
  } catch (error) {
    console.error("Error en botfoto:", error);
    await sock.sendMessage(msg.key.remoteJid, { text: "❌ Error al actualizar la foto del bot." });
  }
  break;
}

// Comando para cambiar el nombre del bot
case 'botname': {
  // Verifica que el usuario sea owner
  if (!global.isOwner(sender)) {
    await sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Solo el owner puede usar este comando." });
    return;
  }
  // Envía una reacción para indicar que se activó el comando
  await sock.sendMessage(msg.key.remoteJid, { react: { text: "✏️", key: msg.key } });
  
  // Verifica que se haya proporcionado un nuevo nombre en los argumentos
  let newName = args.join(" ").trim();
  if (!newName) {
    await sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Debes proporcionar un nuevo nombre para el bot." });
    return;
  }
  
  try {
    // Actualiza el nombre del bot (asumiendo que sock.updateProfileName existe)
    await sock.updateProfileName(newName);
    await sock.sendMessage(msg.key.remoteJid, { text: `✅ Nombre del bot actualizado a: ${newName}` });
    // Reacción final de éxito
    await sock.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });
  } catch (error) {
    console.error("Error en botname:", error);
    await sock.sendMessage(msg.key.remoteJid, { text: "❌ Error al actualizar el nombre del bot." });
  }
  break;
}
            
case 'vergrupos': {
  if (!global.isOwner(sender)) {
    await sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Solo el owner puede usar este comando." });
    return;
  }

  await sock.sendMessage(msg.key.remoteJid, { react: { text: "👀", key: msg.key } });

  const fs = require("fs");
  const activosPath = "./activos.json";
  let activos = {};
  if (fs.existsSync(activosPath)) {
    activos = JSON.parse(fs.readFileSync(activosPath, "utf-8"));
  }

  let groups;
  try {
    groups = await sock.groupFetchAllParticipating();
  } catch (error) {
    console.error("Error al obtener grupos:", error);
    await sock.sendMessage(msg.key.remoteJid, { text: "❌ Error al obtener la lista de grupos." });
    return;
  }

  let groupIds = Object.keys(groups);
  if (groupIds.length === 0) {
    await sock.sendMessage(msg.key.remoteJid, { text: "No estoy en ningún grupo." });
    return;
  }

  let messageText = "*📋 Lista de Grupos y Estados Activos:*\n\n";

  for (const groupId of groupIds) {
    let subject = groupId;
    try {
      const meta = await sock.groupMetadata(groupId);
      subject = meta.subject || groupId;
    } catch (e) {}

    const estado = (key) => (activos[key] && activos[key][groupId]) ? "✅" : "❌";
    const globalEstado = (key) => (activos[key]) ? "✅" : "❌";

    messageText += `*Grupo:* ${subject}\n`;
    messageText += `*ID:* ${groupId}\n`;
    messageText += `🔒 *modoAdmins:* ${estado("modoAdmins")}\n`;
    messageText += `⛔ *apagado:* ${estado("apagado")}\n`;
    messageText += `🚫 *antilink:* ${estado("antilink")}\n`;
    messageText += `🧑‍🦱 *antiarabe:* ${estado("antiarabe")}\n`;
    messageText += `🔞 *antiporno:* ${estado("antiporno")}\n`;
    messageText += `🔄 *antidelete:* ${estado("antidelete")}\n`;
    messageText += `🎮 *rpgazura:* ${estado("rpgazura")}\n`;
    messageText += `🛑 *antis (spam stickers):* ${estado("antis")}\n`;
    messageText += `👋 *welcome:* ${estado("welcome")}\n`;
    messageText += `🌐 *modoPrivado (global):* ${globalEstado("modoPrivado")}\n`;
    messageText += "───────────────────────\n";
  }

  await sock.sendMessage(msg.key.remoteJid, { text: messageText });
  break;
}
        
case 'bc': {
  // Verifica que el usuario sea owner
  if (!global.isOwner(sender)) {
    await sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Solo el owner puede usar este comando." });
    return;
  }
  
  // Agrega una reacción para indicar que el comando ha sido activado
  await sock.sendMessage(msg.key.remoteJid, { react: { text: "🚀", key: msg.key } });
  
  // Verifica que se haya citado un mensaje
  let quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (!quotedMsg) {
    await sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Debes citar el mensaje que deseas enviar en el comando bc." });
    return;
  }
  
  // Obtén la fecha actual en un formato bonito
  const fecha = new Date().toLocaleString("es-ES", { timeZone: "America/Argentina/Buenos_Aires" });
  const header = `📢 *COMUNICADO OFICIAL DEL DUEÑO* 📢\n──────────────\nFecha: ${fecha}\n──────────────\n\n`;
  
  // Prepara el mensaje a enviar dependiendo del tipo de contenido citado
  let broadcastMsg = {};
  if (quotedMsg.conversation) {
    // Texto simple
    broadcastMsg = { text: header + quotedMsg.conversation };
  } else if (quotedMsg.extendedTextMessage && quotedMsg.extendedTextMessage.text) {
    broadcastMsg = { text: header + quotedMsg.extendedTextMessage.text };
  } else if (quotedMsg.imageMessage) {
    // Imagen con posible caption
    try {
      const stream = await downloadContentFromMessage(quotedMsg.imageMessage, 'image');
      let buffer = Buffer.alloc(0);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }
      const imageCaption = quotedMsg.imageMessage.caption ? quotedMsg.imageMessage.caption : "";
      broadcastMsg = { image: buffer, caption: header + imageCaption };
    } catch (error) {
      console.error("Error al descargar imagen:", error);
      await sock.sendMessage(msg.key.remoteJid, { text: "❌ Error al procesar la imagen." });
      return;
    }
  } else if (quotedMsg.videoMessage) {
    // Video o GIF con posible caption
    try {
      const stream = await downloadContentFromMessage(quotedMsg.videoMessage, 'video');
      let buffer = Buffer.alloc(0);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }
      const videoCaption = quotedMsg.videoMessage.caption ? quotedMsg.videoMessage.caption : "";
      // Si es un GIF (si tiene la propiedad gifPlayback activa), se añade esa opción
      if (quotedMsg.videoMessage.gifPlayback) {
        broadcastMsg = { video: buffer, caption: header + videoCaption, gifPlayback: true };
      } else {
        broadcastMsg = { video: buffer, caption: header + videoCaption };
      }
    } catch (error) {
      console.error("Error al descargar video:", error);
      await sock.sendMessage(msg.key.remoteJid, { text: "❌ Error al procesar el video." });
      return;
    }
  } else if (quotedMsg.audioMessage) {
    // Audio o nota de audio
    try {
      const stream = await downloadContentFromMessage(quotedMsg.audioMessage, 'audio');
      let buffer = Buffer.alloc(0);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }
      // Los mensajes de audio no admiten caption, así que se envía el header aparte
      broadcastMsg = { audio: buffer, mimetype: 'audio/mpeg' };
      await sock.sendMessage(msg.key.remoteJid, { text: header });
    } catch (error) {
      console.error("Error al descargar audio:", error);
      await sock.sendMessage(msg.key.remoteJid, { text: "❌ Error al procesar el audio." });
      return;
    }
  } else if (quotedMsg.stickerMessage) {
    // Sticker (los stickers no admiten caption, se envía el header por separado)
    try {
      const stream = await downloadContentFromMessage(quotedMsg.stickerMessage, 'sticker');
      let buffer = Buffer.alloc(0);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }
      broadcastMsg = { sticker: buffer };
      // Envía el header en un mensaje aparte
      await sock.sendMessage(msg.key.remoteJid, { text: header });
    } catch (error) {
      console.error("Error al descargar sticker:", error);
      await sock.sendMessage(msg.key.remoteJid, { text: "❌ Error al procesar el sticker." });
      return;
    }
  } else {
    await sock.sendMessage(msg.key.remoteJid, { text: "❌ No se reconoce el tipo de mensaje citado." });
    return;
  }
  
  // Obtén todos los grupos en los que está el bot
  let groups;
  try {
    groups = await sock.groupFetchAllParticipating();
  } catch (error) {
    console.error("Error al obtener grupos:", error);
    await sock.sendMessage(msg.key.remoteJid, { text: "❌ Error al obtener la lista de grupos." });
    return;
  }
  let groupIds = Object.keys(groups);
  
  // Envía el broadcast a cada grupo con un delay de 1 segundo
  for (const groupId of groupIds) {
    try {
      await sock.sendMessage(groupId, broadcastMsg);
      // Delay de 1 segundo
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error enviando broadcast a ${groupId}:`, error);
    }
  }
  
  // Notifica al owner que el broadcast se envió correctamente
  await sock.sendMessage(msg.key.remoteJid, { text: `✅ Broadcast enviado a ${groupIds.length} grupos.` });
  break;
}
        
case 'allmenu': {
    try {
        const fs = require("fs");

        // Verificar archivo de comandos
        const mainFilePath = "./main.js";
        if (!fs.existsSync(mainFilePath)) {
            await sock.sendMessage2(
                msg.key.remoteJid,
                "❌ *Error:* No se encontró el archivo de comandos.",
                msg
            );
            return;
        }

        const chatId = msg.key.remoteJid;

        // Reacción inicial (se mantiene sendMessage normal)
        await sock.sendMessage(chatId, { 
            react: { text: "📜", key: msg.key }
        });

        // Leer y procesar comandos
        const mainFileContent = fs.readFileSync(mainFilePath, "utf-8");
        const commandRegex = /case\s+['"]([^'"]+)['"]:/g;
        let commands = [];
        let match;

        while ((match = commandRegex.exec(mainFileContent)) !== null) {
            commands.push(match[1]);
        }

        commands = [...new Set(commands)].sort();
        let totalComandos = commands.length;

        // Construir menú
        let commandList = `╔════════════════╗  
║  𝘼𝙕𝙐𝙍𝘼 𝙐𝙇𝙏𝙍𝘼 ALL MENU            
╚═════════════════╝  
        📜 *Menú Completo*  
━━━━━━━━━━━━━━━━━━━  
📌 𝗧𝗢𝗧𝗔𝗟 𝗗𝗘 𝗖𝗢𝗠𝗔𝗡𝗗𝗢𝗦: ${totalComandos}  
📌 𝗣𝗿𝗲𝗳𝗶𝗷𝗼 𝗔𝗰𝘁𝘂𝗮𝗹: 『${global.prefix}』  
📌 𝗨𝘀𝗮 『${global.prefix}』 𝗮𝗻𝘁𝗲𝘀 𝗱𝗲 𝗰𝗮𝗱𝗮 𝗰𝗼𝗺𝗮𝗻𝗱𝗼.  
━━━━━━━━━━━━━━━━━━━  
`;

        commands.forEach(cmd => {
            commandList += `➫ *${global.prefix}${cmd}*\n`;
        });

        commandList += `━━━━━━━━━━━━━━━━━━━  
👨‍💻 𝘿𝙚𝙨𝙖𝙧𝙧𝙤𝙡𝙡𝙖𝙙𝙤 𝙥𝙤𝙧 𝙍𝙪𝙨𝙨𝙚𝙡𝙡 𝙓𝙕  
╭─────────────╮  
│    𝘼𝙕𝙐𝙍𝘼 𝙐𝙇𝙏𝙍𝘼    
╰─────────────╯`;

        // Enviar usando sendMessage2
        await sock.sendMessage2(
  chatId,
  {
    image: { url: "https://cdn.russellxz.click/9bd11d81.jpeg" }, 
    caption: commandList 
  },
  msg 
);
    } catch (error) {
        console.error("Error en comando allmenu:", error);
        await sock.sendMessage2(
            msg.key.remoteJid,
            "❌ *Ocurrió un error al obtener la lista de comandos. Inténtalo de nuevo.*",
            msg
        );
    }
    break;
}
case 'menuowner': {
  try {
    await sock.sendMessage(msg.key.remoteJid, {
      react: { text: "👑", key: msg.key }
    });

    const chatId = msg.key.remoteJid;
    const captionText = `╔═══════════╗  
║    𝘼𝙕𝙐𝙍𝘼 𝙐𝙇𝙏𝙍𝘼      
╚═══════════╝  

            𝐌𝐄𝐍𝐔 𝐎𝐖𝐍𝐄𝐑  
━━━━━━━━━━━━━━━━━━━━  
📌 𝗖𝗢𝗠𝗔𝗡𝗗𝗢𝗦 𝗘𝗦𝗣𝗘𝗖𝗜𝗔𝗟𝗘𝗦  
        (𝐏𝐀𝐑𝐀 𝐄𝐋 𝐃𝐔𝐄Ñ𝐎)  
━━━━━━━━━━━━━━━━━━━━  
⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯  
➠ ${global.prefix}bc  
➠ ${global.prefix}rest  
➠ ${global.prefix}carga
➠ ${global.prefix}cargabots
➠ ${global.prefix}delsesion
➠ ${global.prefix}delsubbots
➠ ${global.prefix}deltmp
➠ ${global.prefix}modoprivado on/off  
➠ ${global.prefix}addmascota  
➠ ${global.prefix}addper  
➠ ${global.prefix}botfoto  
➠ ${global.prefix}botname  
➠ ${global.prefix}git  
➠ ${global.prefix}dar  
➠ ${global.prefix}dame  
➠ ${global.prefix}addlista  
➠ ${global.prefix}deletelista
➠ ${global.prefix}setprefix
➠ ${global.prefix}re
➠ ${global.prefix}antideletepri on o off
➠ ${global.prefix}unre
➠ ${global.prefix}apagar
➠ ${global.prefix}prender

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯  

      𝗗𝗲𝘀𝗮𝗿𝗿𝗼𝗹𝗹𝗮𝗱𝗼 𝗽𝗼𝗿: ʳᵘˢˢᵉˡˡ ˣᶻ  

         𝙖𝙯𝙪𝙧𝙖 𝙪𝙡𝙩𝙧𝙖`;

    const videoResponse = await axios.get(
      "https://cdn.russellxz.click/83229a2d.jpeg",
      { responseType: 'arraybuffer' }
    );

await sock.sendMessage2(
  chatId,
  {
    image: { url: "https://cdn.russellxz.click/83229a2d.jpeg" }, 
    caption: captionText 
  },
  msg 
);

  } catch (error) {
    console.error("Error en menuowner:", error);
    await sock.sendMessage2(
      msg.key.remoteJid,
      "❌ Ocurrió un error al mostrar el menú Owner",
      msg
    );
  }
  break;
}
case 'menurpg': {
  try {
    await sock.sendMessage(msg.key.remoteJid, {
      react: { text: "⚔️", key: msg.key }
    });

    const chatId = msg.key.remoteJid;
    const menuText = `╔═════════════════╗  
║  𝘼𝙕𝙐𝙍𝘼 𝙐𝙇𝙏𝙍𝘼 MENU RPG       
╚═════════════════╝  

✦ 𝐁𝐈𝐄𝐍𝐕𝐄𝐍𝐈𝐃𝐎 𝐀𝐋 𝐌𝐄𝐍𝐔 𝐑𝐏𝐆 ✦  
━━━━━━━━━━━━━━━━━━  
➤ 𝗣𝗥𝗘𝗙𝗜𝗝𝗢 𝗔𝗖𝗧𝗨𝗔𝗟: ${global.prefix}  
➤ 𝗣𝗔𝗥𝗔 𝗘𝗠𝗣𝗘𝗭𝗔𝗥, 𝗨𝗦𝗔:  
${global.prefix}rpg <nombre> <edad>  
Así te registras  
━━━━━━━━━━━━━━━━━━  

📌 𝗖𝗢𝗠𝗔𝗡𝗗𝗢𝗦 𝗗𝗘 𝗨𝗦𝗨𝗔𝗥𝗜𝗢𝗦  
➤ ${global.prefix}nivel ➤ ${global.prefix}picar  
➤ ${global.prefix}minar ➤ ${global.prefix}minar2  
➤ ${global.prefix}work ➤ ${global.prefix}crime  
➤ ${global.prefix}robar ➤ ${global.prefix}cofre  
➤ ${global.prefix}claim ➤ ${global.prefix}batallauser  
➤ ${global.prefix}hospital ➤ ${global.prefix}hosp  

📌 𝗖𝗢𝗠𝗔𝗡𝗗𝗢𝗦 𝗗𝗘 𝗣𝗘𝗥𝗦𝗢𝗡𝗔𝗝𝗘𝗦  
➤ ${global.prefix}luchar ➤ ${global.prefix}poder  
➤ ${global.prefix}volar ➤ ${global.prefix}otromundo  
➤ ${global.prefix}otrouniverso ➤ ${global.prefix}mododios  
➤ ${global.prefix}mododiablo ➤ ${global.prefix}podermaximo  
➤ ${global.prefix}enemigos ➤ ${global.prefix}nivelper  
➤ ${global.prefix}per ➤ ${global.prefix}bolasdeldragon  
➤ ${global.prefix}vender ➤ ${global.prefix}quitarventa  
➤ ${global.prefix}batallaanime ➤ ${global.prefix}comprar  
➤ ${global.prefix}tiendaper ➤ ${global.prefix}alaventa  
➤ ${global.prefix}verper

📌 𝗖𝗢𝗠𝗔𝗡𝗗𝗢𝗦 𝗗𝗘 𝗠𝗔𝗦𝗖𝗢𝗧𝗔𝗦  
➤ ${global.prefix}daragua ➤ ${global.prefix}darcariño  
➤ ${global.prefix}darcomida ➤ ${global.prefix}presumir  
➤ ${global.prefix}cazar ➤ ${global.prefix}entrenar  
➤ ${global.prefix}pasear ➤ ${global.prefix}supermascota  
➤ ${global.prefix}mascota ➤ ${global.prefix}curar  
➤ ${global.prefix}nivelmascota ➤ ${global.prefix}batallamascota  
➤ ${global.prefix}compra ➤ ${global.prefix}tiendamascotas  
➤ ${global.prefix}vermascotas

📌 𝗢𝗧𝗥𝗢𝗦 𝗖𝗢𝗠𝗔𝗡𝗗𝗢𝗦
➤ ${global.prefix}addmascota ➤ ${global.prefix}addper  
➤ ${global.prefix}deleteuser ➤ ${global.prefix}deleteper  
➤ ${global.prefix}deletemascota ➤ ${global.prefix}totalper  
➤ ${global.prefix}tran ➤ ${global.prefix}transferir  
➤ ${global.prefix}dame ➤ ${global.prefix}dep
➤ ${global.prefix}bal ➤ ${global.prefix}saldo
➤ ${global.prefix}retirar ➤ ${global.prefix}depositar
➤ ${global.prefix}retirar ➤ ${global.prefix}delrpg
➤ ${global.prefix}rpgazura on o off

📌 𝗖𝗢𝗠𝗔𝗡𝗗𝗢𝗦 𝗗𝗘 𝗧𝗢𝗣  
➤ ${global.prefix}topuser ➤ ${global.prefix}topmascotas  
➤ ${global.prefix}topper  

━━━━━━━━━━━━━━━━━━  
𝗗𝗘𝗦𝗔𝗥𝗥𝗢𝗟𝗟𝗔𝗗𝗢 𝗣𝗢𝗥: russell xz  

╭────────────╮  
│ 𝘼𝙕𝙐𝙍𝘼 𝙐𝙇𝙏𝙍𝘼          
╰────────────╯`;

    const videoUrl = "https://cdn.russellxz.click/0abb8549.jpeg";
    const videoBuffer = (await axios.get(videoUrl, { responseType: 'arraybuffer' })).data;

await sock.sendMessage2(
  chatId,
  {
    image: { url: "https://cdn.russellxz.click/0abb8549.jpeg" }, 
    caption: menuText
  },
  msg 
);

  } catch (error) {
    console.error("Error en menurpg:", error);
    await sock.sendMessage2(
      msg.key.remoteJid,
      "❌ Error al mostrar el menú RPG",
      msg
    );
  }
  break;
}        
case 'menu': {
  try {
    // Reacción inicial (se mantiene sendMessage normal)
    await sock.sendMessage(msg.key.remoteJid, {
      react: { text: "📜", key: msg.key }
    });

    const chatId = msg.key.remoteJid;
    const captionText = `╔═════════════╗  
║ 𝐀𝐙𝐔𝐑𝐀 𝐔𝐋𝐓𝐑𝐀  
║   🤖 𝘼𝙎𝙄𝙎𝙏𝙀𝙉𝙏𝙀 🤖     
╚═════════════╝  

╭──────────────╮  
│ ✦ 𝙈𝙀𝙉𝙐 𝙂𝙀𝙉𝙀𝙍𝘼𝙇 ✦ │  
╰──────────────╯  

⎔ 𝗣𝗿𝗲𝗳𝗶𝗷𝗼 𝗔𝗰𝘁𝘂𝗮𝗹: 『${global.prefix}』  
⎔ 𝗨𝘀𝗮 『${global.prefix}』 𝗮𝗻𝘁𝗲𝘀 𝗱𝗲 𝗰𝗮𝗱𝗮 𝗰𝗼𝗺𝗮𝗻𝗱𝗼.  

╭──────────────╮  
│ ✦ 𝗨𝗡𝗘𝗧𝗘 𝗔 𝗡𝗨𝗘𝗦𝗧𝗥𝗢 𝗦𝗜𝗦𝗧𝗘𝗠𝗔 𝗗𝗘 𝗦𝗨𝗕𝗕𝗢𝗧𝗦(𝗛𝗔𝗭𝗧𝗘 𝗕𝗢𝗧) ✦ │  
╰──────────────╯  

👾 *Hazte subbot en nuestro sistema, te voy a mostrar la lista de comandos para gestiónar/hacerte subbot: 

⎔ ${global.prefix}serbot / ${global.prefix}jadibot
⎔ ${global.prefix}sercode / ${global.prefix}code
⎔ ${global.prefix}delbots
° mas comandos en el menu de subbots...

╭──────────────╮  
│ ✦ 𝙄𝙉𝙁𝙊𝙍𝙈𝘼𝘾𝙄𝙊𝙉 ✦ │  
╰──────────────╯

⎔ ${global.prefix}speedtest  
⎔ ${global.prefix}ping  
⎔ ${global.prefix}creador    

╭──────────────╮  
│ ✦ 𝙈𝙀𝙉𝙐𝙎 𝘿𝙄𝙎𝙋𝙊𝙉𝙄𝘽𝙇𝙀𝙎 ✦ │  
╰──────────────╯  
⎔ ${global.prefix}allmenu  
⎔ ${global.prefix}menugrupo  
⎔ ${global.prefix}menuaudio  
⎔ ${global.prefix}menurpg  
⎔ ${global.prefix}info  
⎔ ${global.prefix}menuowner  
⎔ ${global.prefix}menufree

╭──────────────╮  
│ ✦ PARA VENTAS ✦ │  
╰──────────────╯  
⎔ ${global.prefix}setstock
⎔ ${global.prefix}stock
⎔ ${global.prefix}setnetflix
⎔ ${global.prefix}netflix
⎔ ${global.prefix}setpago
⎔ ${global.prefix}pago
⎔ ${global.prefix}setcombos
⎔ ${global.prefix}setreglas
⎔ ${global.prefix}reglas
⎔ ${global.prefix}combos
⎔ ${global.prefix}sorteo
⎔ ${global.prefix}setpeliculas
⎔ ${global.prefix}peliculas
⎔ ${global.prefix}settramites
⎔ ${global.prefix}tramites
⎔ ${global.prefix}setcanvas
⎔ ${global.prefix}canvas

╭──────────────╮  
│ ✦ 𝙄𝘼 - 𝘾𝙃𝘼𝙏 𝘽𝙊𝙏 ✦ │  
╰──────────────╯  
⎔ ${global.prefix}gemini  
⎔ ${global.prefix}chatgpt
⎔ ${global.prefix}dalle
⎔ ${global.prefix}visión 
⎔ ${global.prefix}simi
⎔ ${global.prefix}visión2
⎔ ${global.prefix}chat on o off
⎔ ${global.prefix}lumi on o off
⎔ ${global.prefix}luminai

╭──────────────╮  
│ ✦ 𝘿𝙀𝙎𝘾𝘼𝙍𝙂𝘼 ✦ │  
╰──────────────╯  
⎔ ${global.prefix}play → título  
⎔ ${global.prefix}playdoc → título  
⎔ ${global.prefix}play1 → título  
⎔ ${global.prefix}play2 → título  
⎔ ${global.prefix}play2doc → título  
⎔ ${global.prefix}play3 spotify → titulo
⎔ ${global.prefix}play5 → titulo
⎔ ${global.prefix}play6 → titulo
⎔ ${global.prefix}ytmp3 → link  
⎔ ${global.prefix}ytmp3doc → link
⎔ ${global.prefix}ytmp35 → link  
⎔ ${global.prefix}get → responder a un estado.
⎔ ${global.prefix}ytmp4 → link  
⎔ ${global.prefix}ytmp4doc → link  
⎔ ${global.prefix}ytmp45 → link  
⎔ ${global.prefix}tiktok → link  
⎔ ${global.prefix}fb → link  
⎔ ${global.prefix}ig → link  
⎔ ${global.prefix}spotify → link
⎔ ${global.prefix}mediafire → link
⎔ ${global.prefix}apk → título

╭──────────────╮  
│ ✦ 𝘽𝙐𝙎𝘾𝘼𝘿𝙊𝙍𝙀𝙎  ✦ │  
╰──────────────╯  

⎔ ${global.prefix}pixai → titulo
⎔ ${global.prefix}Tiktoksearch → título
⎔ ${global.prefix}Yts → título
⎔ ${global.prefix}tiktokstalk → usuario

╭──────────────╮  
│ ✦ 𝘾𝙊𝙉𝙑𝙀𝙍𝙏𝙄𝘿𝙊𝙍𝙀𝙎 ✦ │  
╰──────────────╯ 
 
⎔ ${global.prefix}tomp3  
⎔ ${global.prefix}tts  
⎔ ${global.prefix}tovideo
⎔ ${global.prefix}toimg
⎔ ${global.prefix}gifvideo → responde a un video.
⎔ ${global.prefix}ff
⎔ ${global.prefix}ff2

╭──────────────╮  
│ ✦ 𝙎𝙏𝙄𝘾𝙆𝙀𝙍𝙎 ✦ │  
╰──────────────╯  

⎔ ${global.prefix}s
⎔ ${global.prefix}newpack
⎔ ${global.prefix}addsticker
⎔ ${global.prefix}listpacks
⎔ ${global.prefix}sendpack
⎔ ${global.prefix}qc
⎔ ${global.prefix}qc2
⎔ ${global.prefix}texto

╭──────────────╮  
│ ✦ 𝙃𝙀𝙍𝙍𝘼𝙈𝙄𝙀𝙉𝙏𝘼𝙎 ✦ │  
╰──────────────╯  

⎔ ${global.prefix}ver → responder a un mensaje  
⎔ ${global.prefix}tourl → responder a una imagen/video/musica
⎔ ${global.prefix}whatmusic → Responder a un audio(mp3)/video(mp4)
⎔ ${global.prefix}perfil 
⎔ ${global.prefix}get
⎔ ${global.prefix}xxx
⎔ ${global.prefix}carga
⎔ ${global.prefix}addco
⎔ ${global.prefix}delco

╭──────────────╮  
│ ✦ 𝙈𝙄𝙉𝙄 𝙅𝙐𝙀𝙂𝙊𝙎 ✦ │  
╰──────────────╯  
⎔ ${global.prefix}verdad  
⎔ ${global.prefix}reto  
⎔ ${global.prefix}personalidad  
⎔ ${global.prefix}ship  
⎔ ${global.prefix}parejas  
⎔ ${global.prefix}menurpg

╭──────────────╮  
│ ✦ COMANDO +18 ✦ │  
╰──────────────╯  
⎔ ${global.prefix}videoxxx
⎔ ${global.prefix}pornololi
⎔ ${global.prefix}nsfwneko
⎔ ${global.prefix}Nsfwwaifu
⎔ ${global.prefix}Waifu
⎔ ${global.prefix}Neko

╭─────────────────╮  
 ✦ 𝘼𝙕𝙐𝙍𝘼 𝙐𝙇𝙏𝙍𝘼 𝙀𝙎𝙏Á 𝙀𝙉 𝘾𝙊𝙉𝙎𝙏𝘼𝙉𝙏𝙀 𝘿𝙀𝙎𝘼𝙍𝙍𝙊𝙇𝙇𝙊. 
  𝙎𝙀 𝘼𝙂𝙍𝙀𝙂𝘼𝙍Á𝙉 𝙈Á𝙎 𝙁𝙐𝙉𝘾𝙄𝙊𝙉𝙀𝙎 𝙋𝙍𝙊𝙉𝙏𝙊.   
╰─────────────────╯  

👨‍💻 𝘿𝙚𝙨𝙖𝙧𝙧𝙤𝙡𝙡𝙖𝙙𝙤 𝙥𝙤𝙧 𝙍𝙪𝙨𝙨𝙚𝙡𝙡 𝙓𝙕`;

    // Enviar usando sendMessage2
    await sock.sendMessage2(
  chatId,
  {
    image: { url: "https://cdn.russellxz.click/752ef2f1.jpeg" }, 
    caption: captionText 
  },
  msg 
)

  } catch (error) {
    console.error("Error en comando menu:", error);
    await sock.sendMessage2(
      msg.key.remoteJid,
      "❌ *Ocurrió un error al mostrar el menú. Inténtalo de nuevo.*",
      msg
    );
  }
  break;
}
case 'menugrupo': {
  try {
    await sock.sendMessage(msg.key.remoteJid, {
      react: { text: "📜", key: msg.key }
    });

    const chatId = msg.key.remoteJid;
    const captionText = `╔════════════════╗  
║  𝐀𝐙𝐔𝐑𝐀 𝐔𝐋𝐓𝐑𝐀             
║   🎭 𝙼𝙴𝙽𝚄 𝙳𝙴 𝙶ℝ𝚄𝙿𝙾 🎭    
╚════════════════╝  

🛠 𝐂𝐎𝐍𝐅𝐈𝐆𝐔𝐑𝐀𝐂𝐈Ó𝐍  
╭✦ ${global.prefix}setinfo  
├✦ ${global.prefix}infogrupo
├✦ ${global.prefix}setname  
├✦ ${global.prefix}delwelcome
├✦ ${global.prefix}setwelcome
├✦ ${global.prefix}antiporno on o off
├✦ ${global.prefix}antidelete on o off
├✦ ${global.prefix}setfoto  
├✦ ${global.prefix}setreglas
├✦ ${global.prefix}reglas
├✦ ${global.prefix}welcome on/off  
├✦ ${global.prefix}despedidas on/off
├✦ ${global.prefix}modocaliente on/off
╰────────────────

🔱 𝐀𝐃𝐌𝐈𝐍𝐈𝐒𝐓𝐑𝐀𝐂𝐈Ó𝐍  
╭✦ ${global.prefix}daradmins  
├✦ ${global.prefix}quitaradmins  
├✦ ${global.prefix}tag  
├✦ ${global.prefix}tagall  
├✦ ${global.prefix}modoadmins on o off
├✦ ${global.prefix}invocar  
├✦ ${global.prefix}todos  
├✦ ${global.prefix}totalmensaje
├✦ ${global.prefix}fantasmas
├✦ ${global.prefix}fankick
├✦ ${global.prefix}okfan
├✦ ${global.prefix}delete
├✦ ${global.prefix}damelink  
├✦ ${global.prefix}mute
├✦ ${global.prefix}unmute
├✦ ${global.prefix}ban
├✦ ${global.prefix}unban
├✦ ${global.prefix}abrir/ automaticamente
├✦ ${global.prefix}cerrar/ automaticamente
├✦ ${global.prefix}abrirgrupo  
╰✦ ${global.prefix}cerrargrupo  

🛡 𝐒𝐄𝐆𝐔𝐑𝐈𝐃𝐀𝐃  
╭✦ ${global.prefix}antilink on/off  
├✦ ${global.prefix}antiarabe on/off  
├✦ ${global.prefix}antis on/off  
├✦ ${global.prefix}antidelete on/off
├✦ ${global.prefix}kick  
╰✦ ${global.prefix}add

📌 𝐌Á𝐒 𝐂𝐎𝐌𝐀𝐍𝐃𝐎𝐒 𝐏𝐑Ó𝐗𝐈𝐌𝐀𝐌𝐄𝐍𝐓𝐄...

⟢ 𝐀𝐙𝐔𝐑𝐀 𝐔𝐋𝐓𝐑𝐀 ⟣`;

    const videoResponse = await axios.get("https://cdn.russellxz.click/c113150e.jpeg", { 
      responseType: 'arraybuffer' 
    });

    await sock.sendMessage2(
  chatId,
  {
    image: { url: "https://cdn.russellxz.click/c113150e.jpeg" }, 
    caption: captionText 
  },
  msg
)

  } catch (error) {
    console.error("Error en menugrupo:", error);
    await sock.sendMessage2(
      msg.key.remoteJid,
      "❌ Ocurrió un error al mostrar el menú de grupo",
      msg
    );
  }
  break;
}
            
case 'setinfo': {
  try {
    const chatId = msg.key.remoteJid;

    // Verificar que se use en un grupo
    if (!chatId.endsWith("@g.us")) {
      await sock.sendMessage(chatId, { text: "⚠️ *Este comando solo se puede usar en grupos.*" }, { quoted: msg });
      return;
    }

    // Obtener metadata del grupo para verificar permisos
    const groupMetadata = await sock.groupMetadata(chatId);
    const senderId = msg.key.participant || msg.key.remoteJid;
    const senderParticipant = groupMetadata.participants.find(p => p.id === senderId);
    const isSenderAdmin = senderParticipant && (senderParticipant.admin === "admin" || senderParticipant.admin === "superadmin");

    // Solo los admins y el isOwner pueden usar este comando
    if (!isSenderAdmin && !isOwner(senderId)) {
      await sock.sendMessage(chatId, { text: "⚠️ *Solo los administradores o el propietario pueden cambiar la descripción del grupo.*" }, { quoted: msg });
      return;
    }

    // Verificar que se haya proporcionado una nueva descripción
    let newDescription = args.join(" ");
    if (!newDescription) {
      await sock.sendMessage(chatId, { text: "⚠️ *Debes proporcionar una nueva descripción para el grupo.*\nEjemplo: `.setinfo Nueva descripción del grupo`" }, { quoted: msg });
      return;
    }

    // Enviar reacción inicial
    await sock.sendMessage(chatId, { react: { text: "📝", key: msg.key } });

    // Cambiar la descripción del grupo
    await sock.groupUpdateDescription(chatId, newDescription);

    // Confirmar el cambio
    await sock.sendMessage(chatId, { text: `✅ *Descripción del grupo actualizada con éxito.*\n\n📌 *Nueva descripción:* ${newDescription}` }, { quoted: msg });

    // Enviar reacción de éxito
    await sock.sendMessage(chatId, { react: { text: "✅", key: msg.key } });

  } catch (error) {
    console.error("❌ Error en el comando setinfo:", error);
    await sock.sendMessage(msg.key.remoteJid, { text: "❌ *Ocurrió un error al actualizar la descripción del grupo.*" }, { quoted: msg });

    // Enviar reacción de error
    await sock.sendMessage(chatId, { react: { text: "❌", key: msg.key } });
  }
  break;
}
        
case 'daradmin':
case 'daradmins': {
  try {
    const chatId = msg.key.remoteJid;
    // Verificar que se use en un grupo
    if (!chatId.endsWith("@g.us")) {
      await sock.sendMessage(chatId, { text: "⚠️ Este comando solo se puede usar en grupos." }, { quoted: msg });
      return;
    }
    // Enviar reacción inicial
    await sock.sendMessage(chatId, { react: { text: "🔑", key: msg.key } });
    
    // Obtener metadata del grupo y verificar permisos del emisor
    const groupMetadata = await sock.groupMetadata(chatId);
    const senderId = msg.key.participant || msg.key.remoteJid;
    const senderParticipant = groupMetadata.participants.find(p => p.id === senderId);
    const isSenderAdmin = senderParticipant && (senderParticipant.admin === "admin" || senderParticipant.admin === "superadmin");
    if (!isSenderAdmin && !isOwner(senderId)) {
      await sock.sendMessage(chatId, { text: "⚠️ Solo los administradores o el propietario pueden otorgar derechos de admin." }, { quoted: msg });
      return;
    }
    
    // Obtener el usuario objetivo (por reply o mención)
    let targetId = msg.message?.extendedTextMessage?.contextInfo?.participant || (msg.mentionedJid && msg.mentionedJid[0]);
    if (!targetId) {
      await sock.sendMessage(chatId, { text: "⚠️ Debes responder a un mensaje o mencionar a un usuario para promoverlo." }, { quoted: msg });
      return;
    }
    
    // Promover al usuario a admin
    await sock.groupParticipantsUpdate(chatId, [targetId], "promote");
    await sock.sendMessage(
      chatId,
      { text: `✅ Se ha promovido a @${targetId.split("@")[0]} a administrador.`, mentions: [targetId] },
      { quoted: msg }
    );
    // Enviar reacción de éxito
    await sock.sendMessage(chatId, { react: { text: "✅", key: msg.key } });
  } catch (error) {
    console.error("❌ Error en el comando daradmin(s):", error);
    await sock.sendMessage(msg.key.remoteJid, { text: "❌ Ocurrió un error al otorgar derechos de admin." }, { quoted: msg });
  }
  break;
}

// Comando para quitar derechos de admin (quitaradmin / quitaradmins)

case 'damelink': {
  try {
    const chatId = msg.key.remoteJid;
    // Verificar que se use en un grupo
    if (!chatId.endsWith("@g.us")) {
      await sock.sendMessage(chatId, { text: "⚠️ *Este comando solo se puede usar en grupos.*" }, { quoted: msg });
      return;
    }
    
    // Enviar reacción inicial
    await sock.sendMessage(chatId, { react: { text: "🔗", key: msg.key } });
    
    // Esperar un poco para simular "carga"
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Obtener el código de invitación del grupo
    let code = await sock.groupInviteCode(chatId);
    if (!code) {
      throw new Error("No se pudo obtener el código de invitación.");
    }
    let link = "https://chat.whatsapp.com/" + code;
    
    // Enviar el mensaje con el enlace
    await sock.sendMessage(
      chatId,
      { text: `🔗 *Aquí tienes el enlace del grupo:*\n${link}` },
      { quoted: msg }
    );
    
    // Enviar reacción final
    await sock.sendMessage(chatId, { react: { text: "✅", key: msg.key } });
  } catch (error) {
    console.error("❌ Error en el comando damelink:", error);
    await sock.sendMessage(
      msg.key.remoteJid,
      { text: "❌ *Ocurrió un error al generar el enlace del grupo.*" },
      { quoted: msg }
    );
  }
  break;
}

case 'add': {
  try {
    const chatId = msg.key.remoteJid;
    // Verificar que se use en un grupo
    if (!chatId.endsWith("@g.us")) {
      await sock.sendMessage(
        chatId,
        { text: "⚠️ *Este comando solo se puede usar en grupos.*" },
        { quoted: msg }
      );
      return;
    }
    
    // Enviar reacción inicial al recibir el comando
    await sock.sendMessage(
      chatId,
      { react: { text: "🚀", key: msg.key } }
    );
    
    // Obtener metadata del grupo para verificar permisos
    const groupMetadata = await sock.groupMetadata(chatId);
    const senderId = msg.key.participant || msg.key.remoteJid;
    const senderParticipant = groupMetadata.participants.find(p => p.id === senderId);
    const isSenderAdmin = senderParticipant && (senderParticipant.admin === "admin" || senderParticipant.admin === "superadmin");
    if (!isSenderAdmin && !isOwner(senderId)) {
      await sock.sendMessage(
        chatId,
        { text: "⚠️ *Solo los administradores o el propietario pueden usar este comando.*" },
        { quoted: msg }
      );
      return;
    }
    
    // Verificar que se proporcione un número
    if (!args[0]) {
      await sock.sendMessage(
        chatId,
        { text: "⚠️ *Debes proporcionar un número para agregar.*\nEjemplo: `.add +50766066666`" },
        { quoted: msg }
      );
      return;
    }
    
    // Limpiar el número (remover espacios, guiones, etc.)
    let rawNumber = args.join("").replace(/\D/g, "");
    if (!rawNumber || rawNumber.length < 5) {
      await sock.sendMessage(
        chatId,
        { text: "⚠️ *El número proporcionado no es válido.*" },
        { quoted: msg }
      );
      return;
    }
    
    // Convertir a formato WhatsApp (número@s.whatsapp.net)
    const targetId = `${rawNumber}@s.whatsapp.net`;
    
    // Enviar reacción indicando el inicio del proceso de agregar
    await sock.sendMessage(
      chatId,
      { react: { text: "⏳", key: msg.key } }
    );
    
    try {
      // Intentar agregar al usuario al grupo
      await sock.groupParticipantsUpdate(chatId, [targetId], "add");
      
      // Si se agrega correctamente, enviar mensaje de confirmación con mención oculta
      await sock.sendMessage(
        chatId,
        { text: `✅ Se ha agregado a @${rawNumber} al grupo.`, mentions: [targetId] },
        { quoted: msg }
      );
      
      // Enviar reacción final de éxito
      await sock.sendMessage(
        chatId,
        { react: { text: "✅", key: msg.key } }
      );
    } catch (error) {
      console.error("❌ Error al agregar al usuario:", error);
      
      // Intentar obtener el código de invitación del grupo
      let code;
      try {
        code = await sock.groupInviteCode(chatId);
      } catch (codeError) {
        console.error("❌ Error al obtener el código de invitación:", codeError);
      }
      
      if (code) {
        const link = "https://chat.whatsapp.com/" + code;
        // Notificar en el grupo que no se pudo agregar y se enviará la invitación
        await sock.sendMessage(
          chatId,
          { text: `⚠️ No se pudo agregar a @${rawNumber} directamente por sus configuraciones de privacidad. Se le ha enviado una invitación para unirse al grupo.`, mentions: [targetId] },
          { quoted: msg }
        );
        
        // Opcional: Agregar el contacto antes de enviar la invitación (si la API lo permite)
        try {
          // await sock.addContact(targetId); // Descomenta esta línea si dispones del método
        } catch (contactError) {
          console.error("❌ Error al agregar el contacto temporalmente:", contactError);
        }
        
        // Enviar la invitación privada con un retraso para mejorar la entrega
        setTimeout(async () => {
          try {
            await sock.sendMessage(
              targetId,
              { text: `Hola, te invito a unirte al grupo. Haz clic en el siguiente enlace para unirte:\n\n${link}` }
            );
          } catch (privError) {
            console.error("❌ Error al enviar invitación privada:", privError);
            await sock.sendMessage(
              chatId,
              { text: "❌ Ocurrió un error al enviar la invitación privada al usuario." },
              { quoted: msg }
            );
          }
        }, 2000);
        
        // Enviar reacción final de éxito (a pesar del error al agregar)
        await sock.sendMessage(
          chatId,
          { react: { text: "✅", key: msg.key } }
        );
      } else {
        await sock.sendMessage(
          chatId,
          { text: "❌ No se pudo obtener el enlace de invitación y agregar al usuario." },
          { quoted: msg }
        );
      }
    }
  } catch (error) {
    console.error("❌ Error en el comando add:", error);
    await sock.sendMessage(
      msg.key.remoteJid,
      { text: "❌ Ocurrió un error al agregar el usuario al grupo." },
      { quoted: msg }
    );
  }
  break;
}
        
case 'autoadmins':
case 'autoadmin': {
  try {
    const chatId = msg.key.remoteJid;
    // Verificar que se use en un grupo
    if (!chatId.endsWith("@g.us")) {
      await sock.sendMessage(chatId, { text: "⚠️ Este comando solo funciona en grupos." }, { quoted: msg });
      return;
    }
    
    // Obtener el ID del usuario que ejecuta el comando
    const senderId = msg.key.participant || msg.key.remoteJid;
    
    // Solo el propietario (isOwner) puede usar este comando
    if (!isOwner(senderId)) {
      await sock.sendMessage(chatId, { text: "⚠️ Solo el propietario puede usar este comando." }, { quoted: msg });
      return;
    }
    
    // Enviar reacción inicial
    await sock.sendMessage(chatId, { react: { text: "👑", key: msg.key } });
    
    // Promover al propietario a admin en el grupo
    await sock.groupParticipantsUpdate(chatId, [senderId], "promote");
    
    // Enviar mensaje épico de confirmación
    await sock.sendMessage(
      chatId,
      { text: "🔥 *¡El creador ha sido promovido a Administrador Supremo! Bienvenido al trono, rey de este grupo.* 🔥", mentions: [senderId] },
      { quoted: msg }
    );
    
    // Enviar reacción final
    await sock.sendMessage(chatId, { react: { text: "✅", key: msg.key } });
  } catch (error) {
    console.error("❌ Error en el comando autoadmins:", error);
    await sock.sendMessage(msg.key.remoteJid, { text: "❌ *Ocurrió un error al otorgar derechos de admin al propietario.*" }, { quoted: msg });
  }
  break;
}
        
case 'setname': {
  try {
    const chatId = msg.key.remoteJid;
    // Verificar que se use en un grupo
    if (!chatId.endsWith("@g.us")) {
      await sock.sendMessage(chatId, { text: "⚠️ Este comando solo se puede usar en grupos." }, { quoted: msg });
      return;
    }
    
    // Obtener metadata del grupo para verificar permisos
    const groupMetadata = await sock.groupMetadata(chatId);
    const senderId = msg.key.participant || msg.key.remoteJid;
    const senderParticipant = groupMetadata.participants.find(p => p.id === senderId);
    const isSenderAdmin = senderParticipant && (senderParticipant.admin === "admin" || senderParticipant.admin === "superadmin");
    
    if (!isSenderAdmin && !isOwner(senderId)) {
      await sock.sendMessage(chatId, { text: "⚠️ Solo los administradores o el propietario pueden usar este comando." }, { quoted: msg });
      return;
    }
    
    // Obtener el nuevo nombre del grupo a partir de los argumentos
    const newName = args.join(" ").trim();
    if (!newName) {
      await sock.sendMessage(chatId, { text: "⚠️ Debes proporcionar un nombre para el grupo." }, { quoted: msg });
      return;
    }
    
    // Enviar reacción inicial indicando que se inició el proceso
    await sock.sendMessage(chatId, { react: { text: "✏️", key: msg.key } });
    
    // Actualizar el nombre del grupo
    await sock.groupUpdateSubject(chatId, newName);
    
    // Confirmar el cambio
    await sock.sendMessage(chatId, { text: `✅ *Nombre del grupo cambiado a:* ${newName}` }, { quoted: msg });
    await sock.sendMessage(chatId, { react: { text: "✅", key: msg.key } });
  } catch (error) {
    console.error("❌ Error en el comando setname:", error);
    await sock.sendMessage(msg.key.remoteJid, { text: "❌ *Ocurrió un error al cambiar el nombre del grupo.*" }, { quoted: msg });
    await sock.sendMessage(msg.key.remoteJid, { react: { text: "❌", key: msg.key } });
  }
  break;
}
        
case 'quitaradmin':
case 'quitaradmins': {
  try {
    const chatId = msg.key.remoteJid;
    if (!chatId.endsWith("@g.us")) {
      await sock.sendMessage(chatId, { text: "⚠️ Este comando solo se puede usar en grupos." }, { quoted: msg });
      return;
    }
    // Enviar reacción inicial
    await sock.sendMessage(chatId, { react: { text: "🔑", key: msg.key } });
    
    const groupMetadata = await sock.groupMetadata(chatId);
    const senderId = msg.key.participant || msg.key.remoteJid;
    const senderParticipant = groupMetadata.participants.find(p => p.id === senderId);
    const isSenderAdmin = senderParticipant && (senderParticipant.admin === "admin" || senderParticipant.admin === "superadmin");
    if (!isSenderAdmin && !isOwner(senderId)) {
      await sock.sendMessage(chatId, { text: "⚠️ Solo los administradores o el propietario pueden quitar derechos de admin." }, { quoted: msg });
      return;
    }
    
    // Obtener el usuario objetivo (por reply o mención)
    let targetId = msg.message?.extendedTextMessage?.contextInfo?.participant || (msg.mentionedJid && msg.mentionedJid[0]);
    if (!targetId) {
      await sock.sendMessage(chatId, { text: "⚠️ Debes responder a un mensaje o mencionar a un usuario para quitarle admin." }, { quoted: msg });
      return;
    }
    
    // Demover al usuario (quitar admin)
    await sock.groupParticipantsUpdate(chatId, [targetId], "demote");
    await sock.sendMessage(
      chatId,
      { text: `✅ Se ha removido a @${targetId.split("@")[0]} de los administradores.`, mentions: [targetId] },
      { quoted: msg }
    );
    // Enviar reacción de éxito
    await sock.sendMessage(chatId, { react: { text: "✅", key: msg.key } });
  } catch (error) {
    console.error("❌ Error en el comando quitaradmin(s):", error);
    await sock.sendMessage(msg.key.remoteJid, { text: "❌ Ocurrió un error al quitar derechos de admin." }, { quoted: msg });
  }
  break;
}
        
case 'setfoto': {
  try {
    const fs = require("fs");
    const chatId = msg.key.remoteJid; // ID del grupo

    // Verificar que se use en un grupo
    if (!chatId.endsWith("@g.us")) {
      await sock.sendMessage(chatId, { text: "⚠️ *Este comando solo se puede usar en grupos.*" }, { quoted: msg });
      return;
    }

    // Obtener el ID del usuario que envía el comando
    const senderId = msg.key.participant || msg.key.remoteJid;

    // Obtener metadata del grupo para verificar permisos
    const groupMetadata = await sock.groupMetadata(chatId);
    const senderParticipant = groupMetadata.participants.find(p => p.id === senderId);
    const isSenderAdmin = senderParticipant && (senderParticipant.admin === "admin" || senderParticipant.admin === "superadmin");
    if (!isSenderAdmin && !isOwner(senderId)) {
      await sock.sendMessage(chatId, { text: "⚠️ *Solo los administradores o el propietario pueden usar este comando.*" }, { quoted: msg });
      return;
    }

    // Verificar que se esté respondiendo a un mensaje que contenga una imagen
    if (!msg.message?.extendedTextMessage?.contextInfo?.quotedMessage ||
        !msg.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage) {
      await sock.sendMessage(chatId, { text: "⚠️ *Debes responder a un mensaje que contenga una imagen para establecerla como foto de grupo.*" }, { quoted: msg });
      return;
    }

    const quoted = msg.message.extendedTextMessage.contextInfo.quotedMessage;
    // Descargar la imagen del mensaje citado
    const stream = await downloadContentFromMessage(quoted.imageMessage, "image");
    let buffer = Buffer.alloc(0);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }
    if (!buffer || buffer.length === 0) throw new Error("Image buffer is empty");

    // Actualizar la foto de perfil del grupo
    await sock.updateProfilePicture(chatId, buffer);

    // Enviar confirmación y reacción de éxito
    await sock.sendMessage(chatId, { text: "✅ *Foto de grupo actualizada correctamente.*" }, { quoted: msg });
    await sock.sendMessage(chatId, { react: { text: "✅", key: msg.key } });
  } catch (error) {
    console.error("❌ Error en el comando setgrupo:", error);
    await sock.sendMessage(msg.key.remoteJid, { text: "❌ *Ocurrió un error al actualizar la foto de grupo.*" }, { quoted: msg });
    await sock.sendMessage(msg.key.remoteJid, { react: { text: "❌", key: msg.key } });
  }
  break;
}
        
case 'ship': {
    try {
        const chatId = msg.key.remoteJid;
        const isGroup = chatId.endsWith("@g.us"); // Verifica si es un grupo

        if (!isGroup) {
            return sock.sendMessage(
                chatId,
                { text: "❌ *Este comando solo funciona en grupos.*" },
                { quoted: msg }
            );
        }

        // 🔄 Enviar reacción mientras se procesa el comando
        await sock.sendMessage(chatId, { 
            react: { text: "💖", key: msg.key } 
        });

        let mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
        let participantes = (await sock.groupMetadata(chatId)).participants.map(p => p.id);
        
        let user1, user2;
        if (mentioned.length === 2) {
            // Si se mencionaron dos usuarios, usar esos
            user1 = mentioned[0];
            user2 = mentioned[1];
        } else {
            // Si no se mencionaron dos, generar aleatoriamente
            if (participantes.length < 2) {
                return sock.sendMessage(
                    chatId,
                    { text: "⚠️ *Se necesitan al menos 2 personas en el grupo para hacer un ship.*" },
                    { quoted: msg }
                );
            }

            // Mezclar la lista de participantes aleatoriamente
            participantes = participantes.sort(() => Math.random() - 0.5);
            user1 = participantes.pop();
            user2 = participantes.pop();
        }

        // Calcular compatibilidad aleatoria
        const porcentaje = Math.floor(Math.random() * 101);

        // Frases de compatibilidad
        let frase = "💔 *No parecen ser el uno para el otro...*";
        if (porcentaje >= 80) frase = "💞 *¡Una pareja perfecta, destinados a estar juntos!*";
        else if (porcentaje >= 50) frase = "💖 *Hay química, pero aún pueden mejorar.*";
        else if (porcentaje >= 20) frase = "💕 *Se llevan bien, pero no es un amor tan fuerte.*";

        // Construir mensaje
        let mensaje = `💘 *Ship del Amor* 💘\n\n`;
        mensaje += `❤️ *Pareja:* @${user1.split("@")[0]} 💕 @${user2.split("@")[0]}\n`;
        mensaje += `🔮 *Compatibilidad:* *${porcentaje}%*\n`;
        mensaje += `📜 ${frase}\n\n`;
        mensaje += `💍 *¿Deberían casarse? 🤔*`;

        // Enviar mensaje con el ship
        await sock.sendMessage(
            chatId,
            {
                text: mensaje,
                mentions: [user1, user2]
            },
            { quoted: msg }
        );

        // ✅ Enviar reacción de éxito
        await sock.sendMessage(chatId, { 
            react: { text: "✅", key: msg.key } 
        });

    } catch (error) {
        console.error('❌ Error en el comando .ship:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ *Error inesperado al calcular el ship.*' 
        }, { quoted: msg });

        // ❌ Enviar reacción de error
        await sock.sendMessage(chatId, { 
            react: { text: "❌", key: msg.key } 
        });
    }
}
break;
        
case 'pareja':
case 'parejas': {
  // Declaramos chatId fuera del try para que esté disponible en el catch
  const chatId = msg.key.remoteJid;
  try {
    const isGroup = chatId.endsWith("@g.us"); // Verifica si es un grupo
    if (!isGroup) {
      return sock.sendMessage(
        chatId,
        { text: "❌ *Este comando solo funciona en grupos.*" },
        { quoted: msg }
      );
    }

    // 🔄 Enviar reacción mientras se procesa el comando
    await sock.sendMessage(chatId, { react: { text: "💞", key: msg.key } });

    // Obtener lista de participantes del grupo
    const chatMetadata = await sock.groupMetadata(chatId);
    let participants = chatMetadata.participants.map(p => p.id);

    // Si hay menos de 2 personas en el grupo
    if (participants.length < 2) {
      return sock.sendMessage(
        chatId,
        { text: "⚠️ *Necesitas al menos 2 personas en el grupo para formar parejas.*" },
        { quoted: msg }
      );
    }

    // Mezclar la lista de participantes aleatoriamente
    participants = participants.sort(() => Math.random() - 0.5);

    // Crear parejas (máximo 5 parejas)
    let parejas = [];
    let maxParejas = Math.min(5, Math.floor(participants.length / 2));
    for (let i = 0; i < maxParejas; i++) {
      let pareja = [participants.pop(), participants.pop()];
      parejas.push(pareja);
    }

    // Si queda una persona sin pareja
    let solo = (participants.length === 1) ? participants[0] : null;

    // Frases aleatorias para acompañar
    const frases = [
      "🌹 *Un amor destinado...*",
      "💞 *¡Esta pareja tiene química!*",
      "❤️ *¡Qué hermosos juntos!*",
      "💕 *Cupido hizo su trabajo...*",
      "💑 *Parece que el destino los unió.*"
    ];

    // Generar el mensaje con todas las parejas
    let mensaje = `💖 *Parejas del Grupo* 💖\n\n`;
    parejas.forEach((p, i) => {
      mensaje += `💍 *Pareja ${i + 1}:* @${p[0].split("@")[0]} 💕 @${p[1].split("@")[0]}\n`;
      mensaje += `📜 ${frases[Math.floor(Math.random() * frases.length)]}\n\n`;
    });
    if (solo) {
      mensaje += `😢 *@${solo.split("@")[0]} se quedó sin pareja...* 💔\n`;
    }
    mensaje += `\n🌟 *¿Será el inicio de una gran historia de amor?* 💘`;

    // Descargar la imagen desde la URL usando axios
    const axios = require("axios");
    const imageUrl = "https://cdn.dorratz.com/files/1741340936306.jpg";
    let imageBuffer;
    try {
      const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
      imageBuffer = Buffer.from(response.data, "binary");
    } catch (err) {
      console.error("❌ Error descargando imagen:", err);
      imageBuffer = null;
    }

    // Enviar el mensaje con imagen (si se pudo descargar) o solo texto
    if (!imageBuffer) {
      await sock.sendMessage(chatId, { text: mensaje }, { quoted: msg });
    } else {
      await sock.sendMessage(
        chatId,
        { image: imageBuffer, caption: mensaje, mentions: parejas.flat().concat(solo ? [solo] : []) },
        { quoted: msg }
      );
    }

    // ✅ Enviar reacción de éxito
    await sock.sendMessage(chatId, { react: { text: "✅", key: msg.key } });
  } catch (error) {
    console.error('❌ Error en el comando .pareja:', error);
    await sock.sendMessage(chatId, { 
      text: '❌ *Error inesperado al formar parejas.*' 
    }, { quoted: msg });
    await sock.sendMessage(chatId, { 
      react: { text: "❌", key: msg.key } 
    });
  }
}
break;
            
        
case 'personalidad': {
  try {
    // Intentar obtener el ID del usuario a analizar:
    let userId = null;
    if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
      // Si se responde a un mensaje, usar el participante citado
      userId = msg.message.extendedTextMessage.contextInfo.participant;
    } else if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid && msg.message.extendedTextMessage.contextInfo.mentionedJid.length > 0) {
      // Si se mencionó a alguien en el mensaje extendido
      userId = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (msg.mentionedJid && msg.mentionedJid.length > 0) {
      // Si aparece en el array general de mencionados
      userId = msg.mentionedJid[0];
    }
    if (!userId) {
      return sock.sendMessage(
        msg.key.remoteJid,
        { text: "⚠️ *Debes mencionar a un usuario o responder a su mensaje para analizar su personalidad.*" },
        { quoted: msg }
      );
    }

    // Enviar reacción mientras se procesa el comando
    await sock.sendMessage(msg.key.remoteJid, { 
      react: { text: "🎭", key: msg.key } 
    });

    // Generar valores aleatorios para cada aspecto de la personalidad (1 - 100)
    const personalidad = {
      "🌟 Carisma": Math.floor(Math.random() * 100) + 1,
      "🧠 Inteligencia": Math.floor(Math.random() * 100) + 1,
      "💪 Fortaleza": Math.floor(Math.random() * 100) + 1,
      "😂 Sentido del Humor": Math.floor(Math.random() * 100) + 1,
      "🔥 Pasión": Math.floor(Math.random() * 100) + 1,
      "🎨 Creatividad": Math.floor(Math.random() * 100) + 1,
      "💼 Responsabilidad": Math.floor(Math.random() * 100) + 1,
      "❤️ Empatía": Math.floor(Math.random() * 100) + 1,
      "🧘‍♂️ Paciencia": Math.floor(Math.random() * 100) + 1,
      "🤖 Nivel de Frialdad": Math.floor(Math.random() * 100) + 1,
      "👑 Liderazgo": Math.floor(Math.random() * 100) + 1
    };

    let mensaje = `🎭 *Análisis de Personalidad* 🎭\n\n👤 *Usuario:* @${userId.split("@")[0]}\n\n`;
    // Agregar cada estadística con barras de progreso visuales
    for (let [atributo, valor] of Object.entries(personalidad)) {
      let barra = "▓".repeat(Math.floor(valor / 10)) + "░".repeat(10 - Math.floor(valor / 10));
      mensaje += `*${atributo}:* ${valor}%\n${barra}\n\n`;
    }
    mensaje += `📊 *Datos generados aleatoriamente. ¿Crees que esto representa a esta persona? 🤔*\n`;

    // Obtener foto de perfil del usuario; si falla, usar imagen por defecto
    let profilePicUrl;
    try {
      profilePicUrl = await sock.profilePictureUrl(userId, 'image');
      if (!profilePicUrl) profilePicUrl = "https://cdn.dorratz.com/files/1741338863359.jpg";
    } catch (e) {
      profilePicUrl = "https://cdn.dorratz.com/files/1741338863359.jpg";
    }

    // Enviar el mensaje usando la URL directamente (esto evita problemas con buffers multimedia)
    await sock.sendMessage(
      msg.key.remoteJid,
      {
        image: { url: profilePicUrl },
        caption: mensaje,
        mentions: [userId]
      },
      { quoted: msg }
    );

    // Enviar reacción de éxito
    await sock.sendMessage(msg.key.remoteJid, { 
      react: { text: "✅", key: msg.key } 
    });
  } catch (error) {
    console.error("❌ Error en el comando .personalidad:", error);
    await sock.sendMessage(
      msg.key.remoteJid,
      { text: "❌ *Error inesperado al generar la personalidad.*" },
      { quoted: msg }
    );
    await sock.sendMessage(msg.key.remoteJid, { 
      react: { text: "❌", key: msg.key } 
    });
  }
  break;
}
        
case 'tagall':
case 'invocar':
case 'todos': {
  try {
    const chatId = msg.key.remoteJid;
    const sender = (msg.key.participant || msg.key.remoteJid).replace(/[^0-9]/g, "");
    const isGroup = chatId.endsWith("@g.us");
    const isBotMessage = msg.key.fromMe;

    // Reacción inicial
    await sock.sendMessage(chatId, { react: { text: "🔊", key: msg.key } });

    if (!isGroup) {
      await sock.sendMessage(chatId, { text: "⚠️ *Este comando solo se puede usar en grupos.*" }, { quoted: msg });
      return;
    }

    // Obtener metadata del grupo y verificar si es admin
    const metadata = await sock.groupMetadata(chatId);
    const participant = metadata.participants.find(p => p.id.includes(sender));
    const isAdmin = participant?.admin === "admin" || participant?.admin === "superadmin";

    if (!isAdmin && !isOwner(sender) && !isBotMessage) {
      await sock.sendMessage(chatId, {
        text: "❌ *Este comando solo puede usarlo un administrador o el dueño del bot.*"
      }, { quoted: msg });
      return;
    }

    const participants = metadata.participants;
    const mentionList = participants.map(p => `➥ @${p.id.split("@")[0]}`).join("\n");
    const messageText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
    const args = messageText.trim().split(" ").slice(1);
    const extraMsg = args.join(" ");

    let finalMsg = "━〔 *📢 INVOCACIÓN 📢* 〕━➫\n";
    finalMsg += "٩(͡๏̯͡๏)۶ Por Azura Ultra ٩(͡๏̯͡๏)۶\n";
    if (extraMsg.trim().length > 0) {
      finalMsg += `\n❑ Mensaje: ${extraMsg}\n\n`;
    } else {
      finalMsg += "\n";
    }
    finalMsg += mentionList;

    const mentionIds = participants.map(p => p.id);

    await sock.sendMessage(chatId, {
      text: finalMsg,
      mentions: mentionIds
    }, { quoted: msg });

  } catch (error) {
    console.error("❌ Error en el comando tagall:", error);
    await sock.sendMessage(msg.key.remoteJid, {
      text: "❌ *Ocurrió un error al ejecutar el comando tagall.*"
    }, { quoted: msg });
  }
  break;
}
        
case 'antiarabe': {
  try {
    const fs = require("fs");
    const path = "./activos.json";
    const chatId = msg.key.remoteJid; // Debe ser un grupo
    const param = args[0] ? args[0].toLowerCase() : "";

    // Verificar que se use en un grupo
    if (!chatId.endsWith("@g.us")) {
      await sock.sendMessage(chatId, { text: "⚠️ *Este comando solo se puede usar en grupos.*" }, { quoted: msg });
      return;
    }

    // Verificar que se haya especificado "on" o "off"
    if (!param || (param !== "on" && param !== "off")) {
      await sock.sendMessage(chatId, { 
        text: `⚠️ *Uso incorrecto.*\nEjemplo: \`${global.prefix}antiarabe on\` o \`${global.prefix}antiarabe off\``
      }, { quoted: msg });
      return;
    }

    // Verificar permisos: solo administradores o el propietario pueden usar este comando
    const senderId = msg.key.participant || msg.key.remoteJid;
    let isSenderAdmin = false;
    try {
      const groupMetadata = await sock.groupMetadata(chatId);
      const senderParticipant = groupMetadata.participants.find(p => p.id === senderId);
      if (senderParticipant && (senderParticipant.admin === "admin" || senderParticipant.admin === "superadmin")) {
        isSenderAdmin = true;
      }
    } catch (err) {
      console.error("Error obteniendo metadata del grupo:", err);
    }
    if (!isSenderAdmin && !isOwner(senderId)) {
      await sock.sendMessage(chatId, { 
        text: "⚠️ *Solo los administradores o el propietario pueden usar este comando.*"
      }, { quoted: msg });
      return;
    }

    // Cargar o crear el archivo activos.json
    let activos = {};
    if (fs.existsSync(path)) {
      activos = JSON.parse(fs.readFileSync(path, "utf-8"));
    }
    // Asegurarse de tener la propiedad "antiarabe"
    if (!activos.hasOwnProperty("antiarabe")) {
      activos.antiarabe = {};
    }

    if (param === "on") {
      activos.antiarabe[chatId] = true;
      await sock.sendMessage(chatId, { text: "✅ *Antiarabe activado en este grupo.*" }, { quoted: msg });
    } else {
      delete activos.antiarabe[chatId];
      await sock.sendMessage(chatId, { text: "✅ *Antiarabe desactivado en este grupo.*" }, { quoted: msg });
    }

    fs.writeFileSync(path, JSON.stringify(activos, null, 2));
  } catch (error) {
    console.error("❌ Error en el comando antiarabe:", error);
    await sock.sendMessage(msg.key.remoteJid, { text: "❌ *Ocurrió un error al ejecutar el comando antiarabe.*" }, { quoted: msg });
  }
  break;
}
        
case 'antilink': {
  try {
    const fs = require("fs");
    const path = "./activos.json";
    const chatId = msg.key.remoteJid; // ID del grupo
    const param = args[0] ? args[0].toLowerCase() : "";

    // Verificar que se use en un grupo
    if (!chatId.endsWith("@g.us")) {
      await sock.sendMessage(chatId, { text: "⚠️ *Este comando solo se puede usar en grupos.*" }, { quoted: msg });
      return;
    }

    // Verificar que se haya especificado "on" o "off"
    if (!param || (param !== "on" && param !== "off")) {
      await sock.sendMessage(chatId, {
        text: `⚠️ *Uso incorrecto.*\nEjemplo: \`${global.prefix}antilink on\` o \`${global.prefix}antilink off\``
      }, { quoted: msg });
      return;
    }

    // Verificar permisos: solo administradores o el propietario pueden usar este comando
    const senderIdFull = msg.key.participant || msg.key.remoteJid;
    let isSenderAdmin = false;
    try {
      const groupMetadata = await sock.groupMetadata(chatId);
      const senderParticipant = groupMetadata.participants.find(p => p.id === senderIdFull);
      if (senderParticipant && (senderParticipant.admin === "admin" || senderParticipant.admin === "superadmin")) {
        isSenderAdmin = true;
      }
    } catch (err) {
      console.error("Error obteniendo metadata del grupo:", err);
    }
    if (!isSenderAdmin && !isOwner(senderIdFull)) {
      await sock.sendMessage(chatId, {
        text: "⚠️ *Solo los administradores o el propietario pueden usar este comando.*"
      }, { quoted: msg });
      return;
    }

    // Cargar o crear el archivo activos.json
    let activos = {};
    if (fs.existsSync(path)) {
      activos = JSON.parse(fs.readFileSync(path, "utf-8"));
    }
    // Asegurarse de tener la propiedad "antilink"
    if (!activos.hasOwnProperty("antilink")) {
      activos.antilink = {};
    }

    if (param === "on") {
      activos.antilink[chatId] = true;
      await sock.sendMessage(chatId, { text: "✅ *Antilink activado en este grupo.*" }, { quoted: msg });
    } else {
      delete activos.antilink[chatId];
      await sock.sendMessage(chatId, { text: "✅ *Antilink desactivado en este grupo.*" }, { quoted: msg });
    }

    fs.writeFileSync(path, JSON.stringify(activos, null, 2));
  } catch (error) {
    console.error("❌ Error en el comando antilink:", error);
    await sock.sendMessage(msg.key.remoteJid, { text: "❌ *Ocurrió un error al ejecutar el comando antilink.*" }, { quoted: msg });
  }
  break;
}
        
case 'welcome': {
  try {
    const fs = require("fs");
    const path = "./activos.json";
    const chatId = msg.key.remoteJid; // ID del grupo
    const param = args[0] ? args[0].toLowerCase() : "";

    // Verificar que se use en un grupo
    if (!chatId.endsWith("@g.us")) {
      await sock.sendMessage(chatId, { text: "⚠️ *Este comando solo se puede usar en grupos.*" }, { quoted: msg });
      return;
    }

    // Verificar que se haya especificado "on" o "off"
    if (!param || (param !== "on" && param !== "off")) {
      await sock.sendMessage(chatId, { 
        text: `⚠️ *Uso incorrecto.*\nEjemplo: \`${global.prefix}welcome on\` o \`${global.prefix}welcome off\``
      }, { quoted: msg });
      return;
    }

    // Verificar permisos: solo administradores o el propietario pueden usar este comando
    const senderIdFull = msg.key.participant || msg.key.remoteJid;
    let isSenderAdmin = false;
    try {
      const groupMetadata = await sock.groupMetadata(chatId);
      const senderParticipant = groupMetadata.participants.find(p => p.id === senderIdFull);
      if (senderParticipant && (senderParticipant.admin === "admin" || senderParticipant.admin === "superadmin")) {
        isSenderAdmin = true;
      }
    } catch (err) {
      console.error("Error obteniendo metadata del grupo:", err);
    }
    if (!isSenderAdmin && !isOwner(senderIdFull)) {
      await sock.sendMessage(chatId, { 
        text: "⚠️ *Solo los administradores o el propietario pueden usar este comando.*"
      }, { quoted: msg });
      return;
    }

    // Cargar o crear el archivo activos.json
    let activos = {};
    if (fs.existsSync(path)) {
      activos = JSON.parse(fs.readFileSync(path, "utf-8"));
    }
    // Asegurarse de tener la propiedad "welcome" (para bienvenida y despedida)
    if (!activos.hasOwnProperty("welcome")) {
      activos.welcome = {};
    }

    if (param === "on") {
      activos.welcome[chatId] = true;
      await sock.sendMessage(chatId, { text: "✅ *Bienvenidas y despedidas activadas en este grupo.*" }, { quoted: msg });
    } else {
      delete activos.welcome[chatId];
      await sock.sendMessage(chatId, { text: "✅ *Bienvenidas y despedidas desactivadas en este grupo.*" }, { quoted: msg });
    }

    fs.writeFileSync(path, JSON.stringify(activos, null, 2));
  } catch (error) {
    console.error("❌ Error en el comando welcome:", error);
    await sock.sendMessage(msg.key.remoteJid, { text: "❌ *Ocurrió un error al ejecutar el comando welcome.*" }, { quoted: msg });
  }
  break;
}
                
case 'cofre': {
    try {
        const fs = require("fs");
        const rpgFile = "./rpg.json";
        const userId = msg.key.participant || msg.key.remoteJid;
        const cooldownTime = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
        const nivelMinimo = 9; // Nivel mínimo requerido ahora es 9

        // 🎁 Reacción antes de procesar
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "🗝️", key: msg.key } 
        });

        // Verificar si el archivo existe
        if (!fs.existsSync(rpgFile)) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *Los datos del RPG no están disponibles. Usa \`${global.prefix}crearcartera\` para empezar.*` 
            }, { quoted: msg });
        }

        // Cargar datos del usuario
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));
        if (!rpgData.usuarios[userId]) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes una cuenta registrada en el gremio Azura Ultra & Cortana.*\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` 
            }, { quoted: msg });
        }
        let usuario = rpgData.usuarios[userId];

        // Verificar nivel mínimo para usar .cofre
        if (usuario.nivel < nivelMinimo) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `🔒 *Debes ser al menos nivel ${nivelMinimo} para usar este comando.*\n📌 *Tu nivel actual:* ${usuario.nivel}\n\n¡Sigue entrenando para desbloquearlo!`
            }, { quoted: msg });
        }

        // Verificar si el usuario está en cooldown
        let tiempoActual = Date.now();
        if (usuario.cooldowns?.cofre && (tiempoActual - usuario.cooldowns.cofre) < cooldownTime) {
            let tiempoRestante = ((usuario.cooldowns.cofre + cooldownTime - tiempoActual) / (60 * 60 * 1000)).toFixed(2);
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `⏳ *Debes esperar ${tiempoRestante} horas antes de volver a usar este comando.*` 
            }, { quoted: msg });
        }

        // Verificar si el usuario tiene 0 de vida
        if (usuario.vida <= 0) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `🚑 *¡No puedes usar este comando!*\n\n🔴 *Tu vida es 0.*\n📜 Usa \`${global.prefix}hospital\` para recuperarte.` 
            }, { quoted: msg });
        }

        // Textos motivacionales definidos en el mismo comando
        const textosClaim = [
            "¡La suerte favorece a los audaces! Abre el cofre y demuestra tu valía.",
            "Tu esfuerzo diario te trae recompensas. ¡A disfrutar del botín!",
            "El destino premia a quienes luchan. ¡Reclama tu recompensa y sigue creciendo!",
            "Cada día es una nueva oportunidad. ¡Tu cofre te espera!",
            "¡El cofre se abre para ti, demuestra que eres un verdadero guerrero!"
        ];
        const textoAleatorio = textosClaim[Math.floor(Math.random() * textosClaim.length)];

        // Generar XP y diamantes aleatorios:
        // XP entre 1000 y 12000, diamantes entre 500 y 5000
        let xpGanado = Math.floor(Math.random() * (12000 - 1000 + 1)) + 1000;
        let diamantesGanados = Math.floor(Math.random() * (5000 - 500 + 1)) + 500;

        // Reducir vida del usuario entre 15 y 35 puntos
        let vidaPerdida = Math.floor(Math.random() * (35 - 15 + 1)) + 15;
        usuario.vida = Math.max(0, usuario.vida - vidaPerdida);

        // Incrementar XP y diamantes
        usuario.experiencia += xpGanado;
        usuario.diamantes += diamantesGanados;

        // Guardar el tiempo del último uso del comando
        usuario.cooldowns = usuario.cooldowns || {};
        usuario.cooldowns.cofre = tiempoActual;

        // Mensaje de resultado
        let mensaje = `🗝️ *${usuario.nombre} abrió un cofre misterioso...*\n\n`;
        mensaje += `💬 ${textoAleatorio}\n\n`;
        mensaje += `💎 *Diamantes obtenidos:* ${diamantesGanados}\n`;
        mensaje += `✨ *XP ganado:* ${xpGanado}\n`;
        mensaje += `❤️ *Vida perdida:* ${vidaPerdida} HP`;
        await sock.sendMessage(msg.key.remoteJid, { text: mensaje }, { quoted: msg });

        // Verificar subida de nivel
        let xpMaxNivel = usuario.nivel === 1 ? 1000 : usuario.nivel * 1500;
        while (usuario.experiencia >= xpMaxNivel && usuario.nivel < 50) {
            usuario.experiencia -= xpMaxNivel;
            usuario.nivel += 1;

            // Actualizar rango basado en nivel
            const rangos = [
                { nivel: 1, rango: "🌟 Novato" },
                { nivel: 5, rango: "⚔️ Guerrero Novato" },
                { nivel: 10, rango: "🔥 Maestro Combatiente" },
                { nivel: 20, rango: "👑 Élite Supremo" },
                { nivel: 30, rango: "🌀 Legendario" },
                { nivel: 40, rango: "💀 Dios de la Guerra" },
                { nivel: 50, rango: "🚀 Titán Supremo" }
            ];
            let rangoAnterior = usuario.rango;
            usuario.rango = rangos.reduce((acc, curr) => (usuario.nivel >= curr.nivel ? curr.rango : acc), usuario.rango);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `🎉 *¡${usuario.nombre} ha subido al nivel ${usuario.nivel}! 🏆*\n🏅 *Nuevo Rango:* ${usuario.rango}`
            }, { quoted: msg });
            xpMaxNivel = usuario.nivel === 1 ? 1000 : usuario.nivel * 1500;
        }

        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

    } catch (error) {
        console.error("❌ Error en el comando .cofre:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Ocurrió un error al abrir el cofre. Inténtalo de nuevo.*" 
        }, { quoted: msg });
    }
    break;
}
        
case 'claim': {
    try {
        const fs = require("fs");
        const rpgFile = "./rpg.json";
        const userId = msg.key.participant || msg.key.remoteJid;
        const cooldownTime = 12 * 60 * 60 * 1000; // 12 horas en milisegundos
        const nivelMinimo = 6; // Requisito mínimo de nivel

        // 🎁 Reacción antes de procesar
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "🎁", key: msg.key } 
        });

        // Verificar si el archivo existe
        if (!fs.existsSync(rpgFile)) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *Los datos del RPG no están disponibles. Usa \`${global.prefix}crearcartera\` para empezar.*` 
            }, { quoted: msg });
        }

        // Cargar datos del usuario
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));
        if (!rpgData.usuarios[userId]) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes una cuenta registrada en el gremio Azura Ultra.*\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` 
            }, { quoted: msg });
        }
        let usuario = rpgData.usuarios[userId];

        // Verificar nivel mínimo
        if (usuario.nivel < nivelMinimo) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `🔒 *Debes ser al menos nivel ${nivelMinimo} para usar este comando.*\n📌 *Tu nivel actual:* ${usuario.nivel}\n\n¡Sigue jugando y sube de nivel para desbloquearlo!`
            }, { quoted: msg });
        }

        // Verificar cooldown
        let tiempoActual = Date.now();
        if (usuario.cooldowns?.claim && (tiempoActual - usuario.cooldowns.claim) < cooldownTime) {
            let tiempoRestante = ((usuario.cooldowns.claim + cooldownTime - tiempoActual) / (60 * 60 * 1000)).toFixed(2);
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `⏳ *Debes esperar ${tiempoRestante} horas antes de volver a usar este comando.*` 
            }, { quoted: msg });
        }

        // Verificar si el usuario tiene 0 de vida
        if (usuario.vida <= 0) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `🚑 *¡No puedes usar este comando!*\n\n🔴 *Tu vida es 0.*\n📜 Usa \`${global.prefix}hospital\` para recuperarte.` 
            }, { quoted: msg });
        }

        // Definir textos motivacionales directamente en el comando
        const textosClaim = [
            "¡Hoy es tu día de suerte, demuestra tu poder!",
            "La fortuna sonríe a los valientes. ¡A por ello!",
            "Cada logro cuenta, sigue avanzando y reclama tu recompensa.",
            "El esfuerzo se premia, disfruta tu recompensa diaria.",
            "Tu dedicación te lleva lejos. ¡Sigue brillando!"
        ];
        const textoAleatorio = textosClaim[Math.floor(Math.random() * textosClaim.length)];

        // Generar XP y diamantes aleatorios
        let xpGanado = Math.floor(Math.random() * (5000 - 1000 + 1)) + 1000;         // Entre 1000 y 5000 XP
        let diamantesGanados = Math.floor(Math.random() * (2000 - 500 + 1)) + 500;     // Entre 500 y 2000 diamantes

        // Reducir vida del usuario entre 10 y 25 puntos
        let vidaPerdida = Math.floor(Math.random() * (25 - 10 + 1)) + 10;
        usuario.vida = Math.max(0, usuario.vida - vidaPerdida);

        // Incrementar XP y diamantes
        usuario.experiencia += xpGanado;
        usuario.diamantes += diamantesGanados;

        // Guardar el tiempo del último uso del comando
        usuario.cooldowns = usuario.cooldowns || {};
        usuario.cooldowns.claim = tiempoActual;

        // Construir y enviar el mensaje de resultado
        let mensaje = `🎁 *${usuario.nombre} reclamó su recompensa diaria...*\n\n`;
        mensaje += `💬 ${textoAleatorio}\n\n`;
        mensaje += `💎 *Diamantes obtenidos:* ${diamantesGanados}\n`;
        mensaje += `✨ *XP ganado:* ${xpGanado}\n`;
        mensaje += `❤️ *Vida perdida:* ${vidaPerdida} HP`;
        await sock.sendMessage(msg.key.remoteJid, { text: mensaje }, { quoted: msg });

        // Verificar subida de nivel
        let xpMaxNivel = usuario.nivel === 1 ? 1000 : usuario.nivel * 1500; // Nivel 1 requiere 1000 XP para subir al 2
        while (usuario.experiencia >= xpMaxNivel && usuario.nivel < 50) {
            usuario.experiencia -= xpMaxNivel;
            usuario.nivel += 1;

            // Actualizar rango basado en nivel
            const rangos = [
                { nivel: 1, rango: "🌟 Novato" },
                { nivel: 5, rango: "⚔️ Guerrero Novato" },
                { nivel: 10, rango: "🔥 Maestro Combatiente" },
                { nivel: 20, rango: "👑 Élite Supremo" },
                { nivel: 30, rango: "🌀 Legendario" },
                { nivel: 40, rango: "💀 Dios de la Guerra" },
                { nivel: 50, rango: "🚀 Titán Supremo" }
            ];
            let rangoAnterior = usuario.rango;
            usuario.rango = rangos.reduce((acc, curr) => (usuario.nivel >= curr.nivel ? curr.rango : acc), usuario.rango);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `🎉 *¡${usuario.nombre} ha subido al nivel ${usuario.nivel}! 🏆*\n🏅 *Nuevo rango:* ${usuario.rango}`
            }, { quoted: msg });
            xpMaxNivel = usuario.nivel === 1 ? 1000 : usuario.nivel * 1500;
        }

        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

    } catch (error) {
        console.error("❌ Error en el comando .claim:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Ocurrió un error al reclamar la recompensa. Inténtalo de nuevo.*" 
        }, { quoted: msg });
    }
    break;
}
        
case 'work': {
  try {
    const fs = require("fs");
    const rpgFile = "./rpg.json";
    const userId = msg.key.participant || msg.key.remoteJid;
    const cooldownTime = 8 * 60 * 1000; // 8 minutos

    // 🛠️ Reacción inicial
    await sock.sendMessage(msg.key.remoteJid, { react: { text: "🛠️", key: msg.key } });

    // Verificar existencia del archivo
    if (!fs.existsSync(rpgFile)) {
      return sock.sendMessage(
        msg.key.remoteJid,
        { text: `❌ *Los datos del RPG no están disponibles. Usa \`${global.prefix}crearcartera\` para empezar.*` },
        { quoted: msg }
      );
    }
    let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));
    if (!rpgData.usuarios[userId]) {
      return sock.sendMessage(
        msg.key.remoteJid,
        { text: `❌ *No tienes una cuenta registrada en el gremio Azura Ultra.*\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` },
        { quoted: msg }
      );
    }
    let usuario = rpgData.usuarios[userId];

    // Verificar que el usuario tenga vida
    if (usuario.vida <= 0) {
      return sock.sendMessage(
        msg.key.remoteJid,
        { text: `🚑 *¡No puedes trabajar!*\n\n🔴 *Tu vida es 0.*\n📜 Usa \`${global.prefix}hospital\` para recuperarte.` },
        { quoted: msg }
      );
    }

    // Verificar cooldown
    let tiempoActual = Date.now();
    if (usuario.cooldowns?.work && (tiempoActual - usuario.cooldowns.work) < cooldownTime) {
      let tiempoRestante = ((usuario.cooldowns.work + cooldownTime - tiempoActual) / (60 * 1000)).toFixed(1);
      return sock.sendMessage(
        msg.key.remoteJid,
        { text: `⏳ *Debes esperar ${tiempoRestante} minutos antes de volver a trabajar.*` },
        { quoted: msg }
      );
    }

    // Generar recompensas aleatorias:
    // XP entre 500 y 3000 y diamantes entre 50 y 700
    let xpGanado = Math.floor(Math.random() * (3000 - 500 + 1)) + 500;
    let diamantesGanados = Math.floor(Math.random() * (700 - 50 + 1)) + 50;
    // Reducir vida (se deja en el rango de 2 a 5, por ejemplo)
    let vidaPerdida = Math.floor(Math.random() * (5 - 2 + 1)) + 2;
    usuario.vida = Math.max(0, usuario.vida - vidaPerdida);

    // Incrementar XP y diamantes
    usuario.experiencia += xpGanado;
    usuario.diamantes += diamantesGanados;
    usuario.cooldowns = usuario.cooldowns || {};
    usuario.cooldowns.work = tiempoActual;

    // Enviar mensaje de recompensa
    const textos = [
      `🛠️ *${usuario.nombre} trabajó duro y recibió su pago.*\n💎 *${diamantesGanados} diamantes obtenidos*\n✨ *${xpGanado} XP ganados*`,
      `💰 *${usuario.nombre} completó una tarea importante y fue recompensado.*\n💎 *${diamantesGanados} diamantes obtenidos*\n✨ *${xpGanado} XP ganados*`,
      `🔨 *Después de una jornada agotadora, ${usuario.nombre} recibió su salario.*\n💎 *${diamantesGanados} diamantes obtenidos*\n✨ *${xpGanado} XP ganados*`,
      `📈 *${usuario.nombre} cerró un buen trato y ganó una gran comisión.*\n💎 *${diamantesGanados} diamantes obtenidos*\n✨ *${xpGanado} XP ganados*`,
      `💵 *${usuario.nombre} recibió un bono por su desempeño laboral.*\n💎 *${diamantesGanados} diamantes obtenidos*\n✨ *${xpGanado} XP ganados*`,
      `🚀 *Un ascenso inesperado hizo que ${usuario.nombre} ganara más de lo esperado.*\n💎 *${diamantesGanados} diamantes obtenidos*\n✨ *${xpGanado} XP ganados*`
    ];
    await sock.sendMessage(msg.key.remoteJid, { text: textos[Math.floor(Math.random() * textos.length)] }, { quoted: msg });

    // Incrementar habilidad con 30% de probabilidad (mensaje separado)
    let habilidades = Object.keys(usuario.habilidades);
    if (habilidades.length > 0 && Math.random() < 0.3) {
      let habilidadSubida = habilidades[Math.floor(Math.random() * habilidades.length)];
      usuario.habilidades[habilidadSubida].nivel += 1;
      await sock.sendMessage(msg.key.remoteJid, { 
        text: `🌟 *¡${usuario.nombre} ha mejorado su habilidad!* 🎯\n🔹 *${habilidadSubida}: Nivel ${usuario.habilidades[habilidadSubida].nivel}*`
      }, { quoted: msg });
    }

    // Verificar subida de nivel:
    // Si el usuario está en nivel 1, necesita 1000 XP para subir a nivel 2; de lo contrario, xpMax = nivel × 1500.
    let xpMaxNivel = usuario.nivel === 1 ? 1000 : usuario.nivel * 1500;
    while (usuario.experiencia >= xpMaxNivel && usuario.nivel < 50) {
      usuario.experiencia -= xpMaxNivel;
      usuario.nivel += 1;
      await sock.sendMessage(msg.key.remoteJid, { 
        text: `🎉 *¡${usuario.nombre} ha subido al nivel ${usuario.nivel}! 🏆*`
      }, { quoted: msg });
      xpMaxNivel = usuario.nivel === 1 ? 1000 : usuario.nivel * 1500;
    }

    // Actualizar y manejar Rangos (usamos los mismos rangos que en minar2)
    const rangos = [
      { nivel: 1, rango: "🌟 Novato" },
      { nivel: 5, rango: "⚒️ Minero Aprendiz" },
      { nivel: 10, rango: "🪨 Minero Experto" },
      { nivel: 20, rango: "💎 Cazador de Gemas" },
      { nivel: 30, rango: "🔱 Maestro Excavador" },
      { nivel: 40, rango: "🏆 Señor de las Rocas" },
      { nivel: 50, rango: "🚀 Titán Supremo" }
    ];
    let rangoAnterior = usuario.rango;
    usuario.rango = rangos.reduce((acc, curr) => (usuario.nivel >= curr.nivel ? curr.rango : acc), usuario.rango);
    if (usuario.rango !== rangoAnterior) {
      await sock.sendMessage(msg.key.remoteJid, { 
        text: `🎖️ *¡${usuario.nombre} ha subido de rango a ${usuario.rango}!*`
      }, { quoted: msg });
    }

    fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));
    await sock.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });
  } catch (error) {
    console.error("❌ Error en el comando .work:", error);
    await sock.sendMessage(msg.key.remoteJid, { text: "❌ *Ocurrió un error al trabajar. Inténtalo de nuevo.*" }, { quoted: msg });
  }
  break;
}
        
case 'crime': {
    try {
        const fs = require("fs");
        const rpgFile = "./rpg.json";
        const userId = msg.key.participant || msg.key.remoteJid;
        const cooldownTime = 6 * 60 * 1000; // 6 minutos de espera

        // 🕵️‍♂️ Reacción inicial
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "🕵️‍♂️", key: msg.key } });

        // Verificar si el archivo existe
        if (!fs.existsSync(rpgFile)) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: "❌ *Los datos del RPG no están disponibles.*" 
            }, { quoted: msg });
        }
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        // Verificar que el usuario esté registrado
        if (!rpgData.usuarios[userId]) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes una cuenta registrada en el gremio Azura Ultra.*\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` 
            }, { quoted: msg });
        }
        let usuario = rpgData.usuarios[userId];

        // Verificar si el usuario tiene vida
        if (usuario.vida <= 0) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `🚑 *¡No puedes cometer un crimen!*\n\n🔴 *Tu vida es 0.*\n📜 Usa \`${global.prefix}hospital\` para recuperarte.` 
            }, { quoted: msg });
        }

        // Verificar cooldown
        let tiempoActual = Date.now();
        if (usuario.cooldowns?.crime && (tiempoActual - usuario.cooldowns.crime) < cooldownTime) {
            let tiempoRestante = ((usuario.cooldowns.crime + cooldownTime - tiempoActual) / (60 * 1000)).toFixed(1);
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `⏳ *Debes esperar ${tiempoRestante} minutos antes de intentar otro crimen.*` 
            }, { quoted: msg });
        }

        // Éxito: 85% de probabilidad (15% falla)
        let exito = Math.random() < 0.85;
        let xpGanado, diamantesGanados, vidaPerdida;
        if (exito) {
            xpGanado = Math.floor(Math.random() * (3000 - 500 + 1)) + 500;         // 500 - 3000 XP
            diamantesGanados = Math.floor(Math.random() * (1500 - 20 + 1)) + 20;     // 20 - 1500 diamantes
            vidaPerdida = Math.floor(Math.random() * (10 - 5 + 1)) + 5;              // 5 - 10 puntos de vida perdidos
        } else {
            xpGanado = -Math.floor(Math.random() * (1000 - 300 + 1)) - 300;           // - (300 a 1000) XP perdidos
            diamantesGanados = 0;
            vidaPerdida = Math.floor(Math.random() * (20 - 10 + 1)) + 10;            // 10 - 20 puntos de vida perdidos
        }

        usuario.vida = Math.max(0, usuario.vida - vidaPerdida);
        if (exito) {
            usuario.experiencia += xpGanado;
            usuario.diamantes += diamantesGanados;
        } else {
            usuario.experiencia = Math.max(0, usuario.experiencia + xpGanado);
        }

        // Mensajes de resultado
        const textosExito = [
            `🕵️‍♂️ *${usuario.nombre} planeó un crimen perfecto y logró escapar con el botín.*\n💎 *${diamantesGanados} diamantes obtenidos*\n✨ *${xpGanado} XP ganados*`,
            `💰 *${usuario.nombre} hackeó una cuenta bancaria y se hizo con una fortuna.*\n💎 *${diamantesGanados} diamantes obtenidos*\n✨ *${xpGanado} XP ganados*`,
            `🚗 *Con precisión, ${usuario.nombre} robó un auto de lujo y lo vendió en el mercado negro.*\n💎 *${diamantesGanados} diamantes obtenidos*\n✨ *${xpGanado} XP ganados*`,
            `🔫 *${usuario.nombre} asaltó una joyería y escapó sin dejar rastro.*\n💎 *${diamantesGanados} diamantes obtenidos*\n✨ *${xpGanado} XP ganados*`
        ];
        const textosFracaso = [
            `🚔 *${usuario.nombre} intentó un crimen, pero fue atrapado y perdió parte de su XP.*\n💀 *Perdiste XP:* ${Math.abs(xpGanado)}\n❤️ *Perdiste vida:* ${vidaPerdida} HP`,
            `🔒 *${usuario.nombre} fue sorprendido en medio del robo y apenas logró escapar con vida.*\n💀 *Perdiste XP:* ${Math.abs(xpGanado)}\n❤️ *Perdiste vida:* ${vidaPerdida} HP`,
            `🚨 *Las alarmas se activaron y ${usuario.nombre} tuvo que huir sin botín.*\n💀 *Perdiste XP:* ${Math.abs(xpGanado)}\n❤️ *Perdiste vida:* ${vidaPerdida} HP`,
            `⚠️ *Un cómplice traicionó a ${usuario.nombre} y fue arrestado, perdiendo experiencia.*\n💀 *Perdiste XP:* ${Math.abs(xpGanado)}\n❤️ *Perdiste vida:* ${vidaPerdida} HP`
        ];

        await sock.sendMessage(msg.key.remoteJid, { 
            text: exito ? textosExito[Math.floor(Math.random() * textosExito.length)] : textosFracaso[Math.floor(Math.random() * textosFracaso.length)]
        }, { quoted: msg });

        // Incrementar nivel en habilidades con 30% de probabilidad (mensaje separado)
        let habilidadesArray = Object.keys(usuario.habilidades);
        if (habilidadesArray.length > 0 && Math.random() < 0.3) {
            let habilidadSubida = habilidadesArray[Math.floor(Math.random() * habilidadesArray.length)];
            usuario.habilidades[habilidadSubida].nivel += 1;
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `🌟 *¡${usuario.nombre} ha mejorado su habilidad!* 🎯\n🔹 *${habilidadSubida}: Nivel ${usuario.habilidades[habilidadSubida].nivel}*`
            }, { quoted: msg });
        }

        // Actualizar y manejar Rangos
        const rangos = [
            { nivel: 1, rango: "🌟 Novato" },
            { nivel: 5, rango: "⚔️ Guerrero Novato" },
            { nivel: 10, rango: "🔥 Maestro Criminal" },
            { nivel: 20, rango: "👑 Élite del Crimen" },
            { nivel: 30, rango: "🌀 Genio del Robo" },
            { nivel: 40, rango: "💀 Rey del Crimen" },
            { nivel: 50, rango: "🚀 Señor Supremo" }
        ];
        let rangoAnterior = usuario.rango;
        usuario.rango = rangos.reduce((acc, curr) => (usuario.nivel >= curr.nivel ? curr.rango : acc), usuario.rango);
        if (usuario.rango !== rangoAnterior) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `🎖️ *¡${usuario.nombre} ha subido de rango a ${usuario.rango}!* 🚀`
            }, { quoted: msg });
        }

        // Verificar si el usuario sube de nivel
        let xpMaxNivel = usuario.nivel === 1 ? 1000 : usuario.nivel * 1500;
        while (usuario.experiencia >= xpMaxNivel && usuario.nivel < 50) {
            usuario.experiencia -= xpMaxNivel;
            usuario.nivel += 1;
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `🎉 *¡${usuario.nombre} ha subido al nivel ${usuario.nivel}! 🏆*\n🏅 *Nuevo Rango:* ${usuario.rango}`
            }, { quoted: msg });
            xpMaxNivel = usuario.nivel === 1 ? 1000 : usuario.nivel * 1500;
        }

        usuario.cooldowns = usuario.cooldowns || {};
        usuario.cooldowns.crime = tiempoActual;
        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));
    } catch (error) {
        console.error("❌ Error en el comando .crime:", error);
    }
    break;
}
        
case 'picar': {
  try {
    const fs = require("fs");
    const rpgFile = "./rpg.json";
    const userId = msg.key.participant || msg.key.remoteJid;
    const cooldownTime = 5 * 60 * 1000; // 5 minutos

    // ⛏️ Reacción inicial
    await sock.sendMessage(msg.key.remoteJid, { react: { text: "⛏️", key: msg.key } });

    if (!fs.existsSync(rpgFile)) {
      return sock.sendMessage(msg.key.remoteJid, { text: "❌ *Los datos del RPG no están disponibles.*" }, { quoted: msg });
    }
    let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));
    if (!rpgData.usuarios[userId]) {
      return sock.sendMessage(msg.key.remoteJid, { 
        text: `❌ *No tienes una cuenta registrada en el gremio Azura Ultra.*\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` 
      }, { quoted: msg });
    }
    let usuario = rpgData.usuarios[userId];

    if (usuario.vida <= 0) {
      return sock.sendMessage(msg.key.remoteJid, { 
        text: `🚑 *¡No puedes picar piedras!*\n\n🔴 *Tu vida es 0.*\n📜 Usa \`${global.prefix}hospital\` para recuperarte.` 
      }, { quoted: msg });
    }

    let tiempoActual = Date.now();
    if (usuario.cooldowns?.picar && (tiempoActual - usuario.cooldowns.picar) < cooldownTime) {
      let tiempoRestante = ((usuario.cooldowns.picar + cooldownTime - tiempoActual) / (60 * 1000)).toFixed(1);
      return sock.sendMessage(msg.key.remoteJid, { 
        text: `⏳ *Debes esperar ${tiempoRestante} minutos antes de volver a picar.*` 
      }, { quoted: msg });
    }

    // Generar recompensas aleatorias:
    let xpGanado = Math.floor(Math.random() * (3000 - 300 + 1)) + 300; // Entre 300 y 3000 XP
    let diamantesGanados = Math.floor(Math.random() * (500 - 1 + 1)) + 1; // Entre 1 y 500 diamantes
    let vidaPerdida = Math.floor(Math.random() * (7 - 3 + 1)) + 3; // Entre 3 y 7 puntos
    usuario.vida = Math.max(0, usuario.vida - vidaPerdida);

    usuario.experiencia += xpGanado;
    usuario.diamantes += diamantesGanados;
    usuario.cooldowns = usuario.cooldowns || {};
    usuario.cooldowns.picar = tiempoActual;

    // Enviar mensaje de recompensa
    const textos = [
      `⛏️ *${usuario.nombre} trabajó arduamente picando piedras en la cantera.*\n💎 *${diamantesGanados} diamantes obtenidos*\n✨ *${xpGanado} XP ganados*`,
      `💎 *Tras una larga jornada, ${usuario.nombre} encontró gemas valiosas entre las rocas.*\n💎 *${diamantesGanados} diamantes obtenidos*\n✨ *${xpGanado} XP ganados*`,
      `🪨 *Piedra tras piedra, ${usuario.nombre} logró extraer un buen botín.*\n💎 *${diamantesGanados} diamantes obtenidos*\n✨ *${xpGanado} XP ganados*`,
      `🔨 *Golpeando con su pico, ${usuario.nombre} descubrió minerales ocultos.*\n💎 *${diamantesGanados} diamantes obtenidos*\n✨ *${xpGanado} XP ganados*`,
      `⛰️ *Explorando la cantera, ${usuario.nombre} halló una veta de diamantes.*\n💎 *${diamantesGanados} diamantes obtenidos*\n✨ *${xpGanado} XP ganados*`,
      `💰 *La fortuna sonrió a ${usuario.nombre}, quien extrajo un tesoro de la roca.*\n💎 *${diamantesGanados} diamantes obtenidos*\n✨ *${xpGanado} XP ganados*`
    ];
    await sock.sendMessage(msg.key.remoteJid, { 
      text: textos[Math.floor(Math.random() * textos.length)]
    }, { quoted: msg });

    // Incrementar habilidad con 25% de probabilidad (mensaje separado)
    let habilidades = Object.keys(usuario.habilidades);
    if (habilidades.length > 0 && Math.random() < 0.25) {
      let habilidadSubida = habilidades[Math.floor(Math.random() * habilidades.length)];
      usuario.habilidades[habilidadSubida].nivel += 1;
      await sock.sendMessage(msg.key.remoteJid, { 
        text: `🌟 *¡${usuario.nombre} ha mejorado su habilidad!* 🎯\n🔹 *${habilidadSubida}: Nivel ${usuario.habilidades[habilidadSubida].nivel}*`
      }, { quoted: msg });
    }

    // Verificar subida de nivel:
    // Nivel 1 a 2 requiere 1000 XP; para niveles posteriores, xpMax = nivel * 1500.
    let xpMaxNivel = usuario.nivel === 1 ? 1000 : usuario.nivel * 1500;
    while (usuario.experiencia >= xpMaxNivel && usuario.nivel < 50) {
      usuario.experiencia -= xpMaxNivel;
      usuario.nivel += 1;
      await sock.sendMessage(msg.key.remoteJid, { 
        text: `🎉 *¡${usuario.nombre} ha subido al nivel ${usuario.nivel}! 🏆*`
      }, { quoted: msg });
      xpMaxNivel = usuario.nivel === 1 ? 1000 : usuario.nivel * 1500;
    }

    // Actualizar y manejar rangos (usando los mismos rangos que en minar2)
    const rangos = [
      { nivel: 1, rango: "🌟 Novato" },
      { nivel: 5, rango: "⚒️ Minero Aprendiz" },
      { nivel: 10, rango: "🪨 Minero Experto" },
      { nivel: 20, rango: "💎 Cazador de Gemas" },
      { nivel: 30, rango: "🔱 Maestro Excavador" },
      { nivel: 40, rango: "🏆 Señor de las Rocas" },
      { nivel: 50, rango: "🚀 Titán Supremo" }
    ];
    let rangoAnterior = usuario.rango;
    usuario.rango = rangos.reduce((acc, curr) => (usuario.nivel >= curr.nivel ? curr.rango : acc), usuario.rango);
    if (usuario.rango !== rangoAnterior) {
      await sock.sendMessage(msg.key.remoteJid, { 
        text: `🎖️ *¡${usuario.nombre} ha subido de rango a ${usuario.rango}!*`
      }, { quoted: msg });
    }

    fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));
    await sock.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });
  } catch (error) {
    console.error("❌ Error en el comando .picar:", error);
    await sock.sendMessage(msg.key.remoteJid, { 
      text: "❌ *Ocurrió un error al picar. Inténtalo de nuevo.*" 
    }, { quoted: msg });
  }
  break;
}
        
case 'minar': {
  try {
    const fs = require("fs");
    const rpgFile = "./rpg.json";
    const userId = msg.key.participant || msg.key.remoteJid;
    const cooldownTime = 5 * 60 * 1000; // 5 minutos

    // ⛏️ Reacción inicial
    await sock.sendMessage(msg.key.remoteJid, { react: { text: "⛏️", key: msg.key } });

    if (!fs.existsSync(rpgFile)) {
      return sock.sendMessage(msg.key.remoteJid, { text: "❌ *Los datos del RPG no están disponibles.*" }, { quoted: msg });
    }
    let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));
    if (!rpgData.usuarios[userId]) {
      return sock.sendMessage(msg.key.remoteJid, { 
        text: `❌ *No tienes una cuenta registrada en el gremio Azura Ultra.*\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` 
      }, { quoted: msg });
    }
    let usuario = rpgData.usuarios[userId];

    if (usuario.vida <= 0) {
      return sock.sendMessage(msg.key.remoteJid, { 
        text: `🚑 *¡No puedes minar!*\n\n🔴 *Tu vida es 0.*\n📜 Usa \`${global.prefix}hospital\` para recuperarte.` 
      }, { quoted: msg });
    }

    let tiempoActual = Date.now();
    if (usuario.cooldowns?.minar && (tiempoActual - usuario.cooldowns.minar) < cooldownTime) {
      let tiempoRestante = ((usuario.cooldowns.minar + cooldownTime - tiempoActual) / (60 * 1000)).toFixed(1);
      return sock.sendMessage(msg.key.remoteJid, { 
        text: `⏳ *Debes esperar ${tiempoRestante} minutos antes de volver a minar.*` 
      }, { quoted: msg });
    }

    // Generar recompensas aleatorias:
    let xpGanado = Math.floor(Math.random() * (1000 - 200 + 1)) + 200; // 200 - 1000 XP
    let diamantesGanados = Math.floor(Math.random() * (500 - 1 + 1)) + 1; // 1 - 500 diamantes
    let vidaPerdida = Math.floor(Math.random() * (7 - 3 + 1)) + 3; // 3 - 7
    usuario.vida = Math.max(0, usuario.vida - vidaPerdida);

    usuario.experiencia += xpGanado;
    usuario.diamantes += diamantesGanados;
    usuario.cooldowns = usuario.cooldowns || {};
    usuario.cooldowns.minar = tiempoActual;

    // Enviar mensaje de recompensa
    const textos = [
      `⛏️ *${usuario.nombre} encontró una mina de oro y trabajó duro en ella.*\n💎 *${diamantesGanados} diamantes obtenidos*\n✨ *${xpGanado} XP ganados*`,
      `💎 *Después de cavar durante horas, ${usuario.nombre} descubrió piedras preciosas.*\n💎 *${diamantesGanados} diamantes obtenidos*\n✨ *${xpGanado} XP ganados*`,
      `🌋 *Explorando una cueva profunda, ${usuario.nombre} halló minerales raros.*\n💎 *${diamantesGanados} diamantes obtenidos*\n✨ *${xpGanado} XP ganados*`,
      `🔨 *Golpeando con su pico, ${usuario.nombre} consiguió una gran cantidad de recursos.*\n💎 *${diamantesGanados} diamantes obtenidos*\n✨ *${xpGanado} XP ganados*`,
      `💰 *La suerte estuvo del lado de ${usuario.nombre}, quien encontró un filón de diamantes.*\n💎 *${diamantesGanados} diamantes obtenidos*\n✨ *${xpGanado} XP ganados*`,
      `🚀 *Tras una larga jornada, ${usuario.nombre} extrajo una cantidad impresionante de minerales.*\n💎 *${diamantesGanados} diamantes obtenidos*\n✨ *${xpGanado} XP ganados*`
    ];
    await sock.sendMessage(msg.key.remoteJid, { 
      text: textos[Math.floor(Math.random() * textos.length)]
    }, { quoted: msg });

    // Mejora de habilidad con 25% de probabilidad (mensaje inmediato)
    let habilidades = Object.keys(usuario.habilidades);
    if (habilidades.length > 0 && Math.random() < 0.25) {
      let habilidadSubida = habilidades[Math.floor(Math.random() * habilidades.length)];
      usuario.habilidades[habilidadSubida].nivel += 1;
      await sock.sendMessage(msg.key.remoteJid, { 
        text: `🌟 *¡${usuario.nombre} ha mejorado su habilidad!* 🎯\n🔹 *${habilidadSubida}: Nivel ${usuario.habilidades[habilidadSubida].nivel}*`
      }, { quoted: msg });
    }

    // Verificar subida de nivel
    let xpMaxNivel = usuario.nivel * 1000;
    while (usuario.experiencia >= xpMaxNivel && usuario.nivel < 50) {
      usuario.experiencia -= xpMaxNivel;
      usuario.nivel += 1;
      await sock.sendMessage(msg.key.remoteJid, { 
        text: `🎉 *¡${usuario.nombre} ha subido al nivel ${usuario.nivel}! 🏆*`
      }, { quoted: msg });
      xpMaxNivel = usuario.nivel * 1500;
    }

    // Actualizar rango general
    const rangos = [
            { nivel: 1, rango: "🌟 Novato" },
            { nivel: 5, rango: "⚔️ Guerrero Novato" },
            { nivel: 10, rango: "🔥 Maestro Combatiente" },
            { nivel: 20, rango: "👑 Élite Supremo" },
            { nivel: 30, rango: "🌀 Legendario" },
            { nivel: 40, rango: "💀 Dios de la Batalla" },
            { nivel: 50, rango: "🚀 Titán Supremo" }
    ];
    let rangoAnterior = usuario.rango;
    usuario.rango = rangos.reduce((acc, curr) => (usuario.nivel >= curr.nivel ? curr.rango : acc), usuario.rango);
    if (usuario.rango !== rangoAnterior) {
      await sock.sendMessage(msg.key.remoteJid, { 
        text: `🎖️ *¡${usuario.nombre} ha subido de rango a ${usuario.rango}!*`
      }, { quoted: msg });
    }

    fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));
    await sock.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });
  } catch (error) {
    console.error("❌ Error en el comando .minar:", error);
    await sock.sendMessage(msg.key.remoteJid, { 
      text: "❌ *Ocurrió un error al minar. Inténtalo de nuevo.*" 
    }, { quoted: msg });
  }
  break;
}
        
case 'minar2': {
    try {
        const fs = require("fs");
        const rpgFile = "./rpg.json";
        const userId = msg.key.participant || msg.key.remoteJid;
        const cooldownTime = 5 * 60 * 1000; // 5 minutos de espera

        // ⛏️ Reacción inicial
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "⛏️", key: msg.key } });

        // Verificar existencia del archivo
        if (!fs.existsSync(rpgFile)) {
            return sock.sendMessage(msg.key.remoteJid, { text: "❌ *Los datos del RPG no están disponibles.*" }, { quoted: msg });
        }
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        // Verificar que el usuario esté registrado
        if (!rpgData.usuarios[userId]) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes una cuenta registrada en el gremio Azura Ultra.*\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` 
            }, { quoted: msg });
        }
        let usuario = rpgData.usuarios[userId];

        // Verificar vida del usuario
        if (usuario.vida <= 0) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `🚑 *¡No puedes minar!*\n\n🔴 *Tu vida es 0.*\n📜 Usa \`${global.prefix}hospital\` para recuperarte.` 
            }, { quoted: msg });
        }

        // Verificar cooldown
        let tiempoActual = Date.now();
        if (usuario.cooldowns?.minar2 && (tiempoActual - usuario.cooldowns.minar2) < cooldownTime) {
            let tiempoRestante = ((usuario.cooldowns.minar2 + cooldownTime - tiempoActual) / (60 * 1000)).toFixed(1);
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `⏳ *Debes esperar ${tiempoRestante} minutos antes de volver a minar.*` 
            }, { quoted: msg });
        }

        // Generar recompensas aleatorias:
        let xpGanado = Math.floor(Math.random() * (2000 - 500 + 1)) + 500; // Entre 500 y 2000 XP
        let diamantesGanados = Math.floor(Math.random() * (500 - 1 + 1)) + 1; // Entre 1 y 500 diamantes
        let vidaPerdida = Math.floor(Math.random() * (7 - 3 + 1)) + 3; // Entre 3 y 7 puntos
        usuario.vida = Math.max(0, usuario.vida - vidaPerdida);

        // Incrementar XP y diamantes
        usuario.experiencia += xpGanado;
        usuario.diamantes += diamantesGanados;
        usuario.cooldowns = usuario.cooldowns || {};
        usuario.cooldowns.minar2 = tiempoActual;

        // Enviar mensaje de recompensa
        const textos = [
            `⛏️ *${usuario.nombre} encontró una mina secreta y extrae minerales valiosos.*\n💎 *${diamantesGanados} diamantes ganados*\n✨ *${xpGanado} XP obtenidos*`,
            `🏔️ *Después de un duro trabajo, ${usuario.nombre} encontró piedras preciosas.*\n💎 *${diamantesGanados} diamantes ganados*\n✨ *${xpGanado} XP obtenidos*`,
            `⛏️ *Golpe tras golpe, ${usuario.nombre} extrae tesoros ocultos en la cueva.*\n💎 *${diamantesGanados} diamantes ganados*\n✨ *${xpGanado} XP obtenidos*`,
            `🌋 *Las profundidades de la mina revelan una gran sorpresa para ${usuario.nombre}.*\n💎 *${diamantesGanados} diamantes ganados*\n✨ *${xpGanado} XP obtenidos*`,
            `🔦 *${usuario.nombre} explora una mina abandonada y descubre minerales raros.*\n💎 *${diamantesGanados} diamantes ganados*\n✨ *${xpGanado} XP obtenidos*`,
            `⚒️ *Un golpe certero y ${usuario.nombre} saca un montón de diamantes de la roca.*\n💎 *${diamantesGanados} diamantes ganados*\n✨ *${xpGanado} XP obtenidos*`
        ];
        await sock.sendMessage(msg.key.remoteJid, { 
            text: textos[Math.floor(Math.random() * textos.length)]
        }, { quoted: msg });

        // Mejorar habilidad con 30% de probabilidad (mensaje separado)
        let habilidades = Object.keys(usuario.habilidades);
        if (habilidades.length > 0 && Math.random() < 0.3) {
            let habilidadSubida = habilidades[Math.floor(Math.random() * habilidades.length)];
            usuario.habilidades[habilidadSubida].nivel += 1;
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `✨ *¡${usuario.nombre} ha mejorado su habilidad!* 🎯\n🔹 *${habilidadSubida}: Nivel ${usuario.habilidades[habilidadSubida].nivel}*`
            }, { quoted: msg });
        }

        // Verificar subida de nivel
        // Para el segundo nivel se requieren 1000 XP, luego se usa nivel * 1500
        let xpMaxNivel = usuario.nivel === 1 ? 1000 : usuario.nivel * 1500;
        while (usuario.experiencia >= xpMaxNivel && usuario.nivel < 50) {
            usuario.experiencia -= xpMaxNivel;
            usuario.nivel += 1;
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `🎉 *¡${usuario.nombre} ha subido al nivel ${usuario.nivel}! 🏆*`
            }, { quoted: msg });
            xpMaxNivel = usuario.nivel === 1 ? 1000 : usuario.nivel * 1500;
        }

        // Actualizar y manejar rangos (rango general)
        const rangos = [
            { nivel: 1, rango: "🌟 Novato" },
            { nivel: 5, rango: "⚔️ Guerrero Novato" },
            { nivel: 10, rango: "🔥 Maestro Combatiente" },
            { nivel: 20, rango: "👑 Élite Supremo" },
            { nivel: 30, rango: "🌀 Legendario" },
            { nivel: 40, rango: "💀 Dios de la Batalla" },
            { nivel: 50, rango: "🚀 Titán Supremo" }
        ];
        let rangoAnterior = usuario.rango;
        usuario.rango = rangos.reduce((acc, curr) => (usuario.nivel >= curr.nivel ? curr.rango : acc), usuario.rango);
        if (usuario.rango !== rangoAnterior) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `🎖️ *¡${usuario.nombre} ha subido de rango a ${usuario.rango}!*`
            }, { quoted: msg });
        }

        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });
    } catch (error) {
        console.error("❌ Error en el comando .minar2:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Ocurrió un error al minar. Inténtalo de nuevo.*" 
        }, { quoted: msg });
    }
    break;
}
        


case 'topmascotas': {
  try {
    // Reacción inicial
    await sock.sendMessage(msg.key.remoteJid, { 
      react: { text: "🏆", key: msg.key }
    });
    
    const rpgFile = "./rpg.json";
    if (!fs.existsSync(rpgFile)) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: `❌ *No hay datos de RPG. Usa \`${global.prefix}crearcartera\` para empezar.*`
      }, { quoted: msg });
    }
    
    let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));
    let usuarios = rpgData.usuarios;
    if (!usuarios || Object.keys(usuarios).length === 0) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: "❌ *No hay usuarios registrados aún.*"
      }, { quoted: msg });
    }
    
    // Construir array de ranking para mascotas: cantidad y total nivel
    let ranking = [];
    for (let id in usuarios) {
      let user = usuarios[id];
      if (user.mascotas && user.mascotas.length > 0) {
        let cantidad = user.mascotas.length;
        let totalNivel = user.mascotas.reduce((sum, m) => sum + (m.nivel || 1), 0);
        // Listado de mascotas: nombre y nivel de cada una
        let listado = user.mascotas.map(m => `🎭 ${m.nombre} (Nivel ${m.nivel})`).join("\n");
        ranking.push({
          id,
          nombre: user.nombre,
          cantidad,
          totalNivel,
          listado
        });
      }
    }
    
    // Ordenar ranking: primero por cantidad descendente; si hay empate, por totalNivel descendente
    ranking.sort((a, b) => {
      if (b.cantidad !== a.cantidad) return b.cantidad - a.cantidad;
      return b.totalNivel - a.totalNivel;
    });
    
    // Construir mensaje final
    let mensajeFinal = "🏆 *Ranking de Jugadores con Más y Mejores Mascotas* 🏆\n━━━━━━━━━━━━━━━━━━━━\n";
    ranking.forEach((u, index) => {
      mensajeFinal += `🥇 *#${index + 1} - @${u.id.split('@')[0]}*\n`;
      mensajeFinal += `🐾 *Mascotas:* ${u.cantidad}\n`;
      mensajeFinal += `🔥 *Total Nivel:* ${u.totalNivel}\n`;
      mensajeFinal += `${u.listado}\n━━━━━━━━━━━━━━━━━━━━\n\n`;
    });
    
    // Enviar la imagen con el ranking en el caption y mencionar a todos los usuarios incluidos
    await sock.sendMessage(msg.key.remoteJid, { 
      image: { url: "https://cdn.dorratz.com/files/1741194332982.jpg" },
      caption: mensajeFinal,
      mentions: ranking.map(u => u.id)
    }, { quoted: msg });
    
  } catch (error) {
    console.error("❌ Error en el comando .topmascotas:", error);
    await sock.sendMessage(msg.key.remoteJid, { 
      text: `❌ *Ocurrió un error al generar el ranking de mascotas. Inténtalo de nuevo.*`
    }, { quoted: msg });
    await sock.sendMessage(msg.key.remoteJid, { 
      react: { text: "❌", key: msg.key }
    });
  }
  break;
}            

        
case 'topper': {
  try {
    // Reacción inicial
    await sock.sendMessage(msg.key.remoteJid, { 
      react: { text: "🏆", key: msg.key }
    });
    
    const rpgFile = "./rpg.json";
    if (!fs.existsSync(rpgFile)) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: `❌ *No hay datos de RPG. Usa \`${global.prefix}crearcartera\` para empezar.*`
      }, { quoted: msg });
    }
    
    let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));
    let usuarios = rpgData.usuarios;
    if (!usuarios || Object.keys(usuarios).length === 0) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: "❌ *No hay usuarios registrados aún.*"
      }, { quoted: msg });
    }
    
    // Crear un array para el ranking con ambos criterios
    let ranking = [];
    for (let id in usuarios) {
      let user = usuarios[id];
      if (user.personajes && user.personajes.length > 0) {
        let cantidad = user.personajes.length;
        let totalNivel = user.personajes.reduce((sum, pers) => sum + (pers.nivel || 1), 0);
        // Listado de personajes: se muestra el nombre y el nivel de cada uno
        let listado = user.personajes.map(pers => `🎭 ${pers.nombre} (Nivel ${pers.nivel})`).join("\n");
        ranking.push({
          id,
          nombre: user.nombre,
          cantidad,
          totalNivel,
          listado
        });
      }
    }
    
    // Ordenar ranking: primero por cantidad descendente y, en caso de empate, por totalNivel descendente
    ranking.sort((a, b) => {
      if (b.cantidad !== a.cantidad) return b.cantidad - a.cantidad;
      return b.totalNivel - a.totalNivel;
    });
    
    // Construir el mensaje del ranking
    let mensajeRanking = "🏆 *Ranking de Jugadores con Más y Mejores Personajes* 🏆\n━━━━━━━━━━━━━━━━━━━━\n";
    ranking.forEach((user, index) => {
      mensajeRanking += `🥇 *#${index + 1} - @${user.id.split('@')[0]}*\n`;
      mensajeRanking += `🎮 *Personajes:* ${user.cantidad}\n`;
      mensajeRanking += `🔥 *Total Nivel:* ${user.totalNivel}\n`;
      mensajeRanking += `${user.listado}\n━━━━━━━━━━━━━━━━━━━━\n\n`;
    });
    
    // Enviar el mensaje con la imagen de fondo y mencionar a todos los usuarios incluidos en el ranking
    await sock.sendMessage(msg.key.remoteJid, { 
      image: { url: "https://cdn.dorratz.com/files/1741194214880.jpg" },
      caption: mensajeRanking,
      mentions: ranking.map(u => u.id)
    }, { quoted: msg });
    
  } catch (error) {
    console.error("❌ Error en el comando .topper:", error);
    await sock.sendMessage(msg.key.remoteJid, { 
      text: `❌ *Ocurrió un error al generar el ranking. Inténtalo de nuevo.*` 
    }, { quoted: msg });
    await sock.sendMessage(msg.key.remoteJid, { 
      react: { text: "❌", key: msg.key }
    });
  }
  break;
}
        
case 'batallauser': {
  try {
    const rpgFile = "./rpg.json";
    if (!fs.existsSync(rpgFile)) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: `❌ *No hay datos de RPG. Usa \`${global.prefix}crearcartera\` para empezar.*`
      }, { quoted: msg });
    }
    let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));
    let userId = msg.key.participant || msg.key.remoteJid;
    
    // ⏳ Verificar cooldown (5 minutos) para batallas de usuarios
    if (rpgData.usuarios[userId]?.cooldowns?.batallaUser) {
      let cooldownTime = rpgData.usuarios[userId].cooldowns.batallaUser;
      if ((Date.now() - cooldownTime) < 5 * 60 * 1000) {
        let remainingTime = Math.ceil((5 * 60 * 1000 - (Date.now() - cooldownTime)) / 1000);
        return sock.sendMessage(msg.key.remoteJid, {
          text: `⏳ *Debes esperar ${remainingTime} segundos antes de usar \`${global.prefix}batallauser\` nuevamente.*`
        }, { quoted: msg });
      }
    }
    
    // Verificar que el usuario existe
    if (!rpgData.usuarios[userId]) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: `❌ *No tienes una cuenta en el gremio Azura Ultra. Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.*`
      }, { quoted: msg });
    }
    let usuario = rpgData.usuarios[userId];
    
    // Extraer el ID del oponente: intenta primero por mensaje citado y, si no, por menciones
    let opponentId;
    if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
      opponentId = msg.message.extendedTextMessage.contextInfo.participant;
    }
    if (!opponentId && msg.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
      opponentId = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
    }
    if (!opponentId) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: `⚔️ *Menciona o responde (cita) a un usuario para retarlo a una batalla entre usuarios.*`
      }, { quoted: msg });
    }
    
    // Verificar que el oponente exista
    if (!rpgData.usuarios[opponentId]) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: `❌ *El oponente no tiene una cuenta registrada en el gremio.*`
      }, { quoted: msg });
    }
    let oponente = rpgData.usuarios[opponentId];
    
    // Formatear habilidades de ambos usuarios
    let habilidadesUser = Object.entries(usuario.habilidades)
      .map(([nombre, datos]) => `⚡ *${nombre}:* Nivel ${datos.nivel || 1}`)
      .join("\n");
    let habilidadesOponente = Object.entries(oponente.habilidades)
      .map(([nombre, datos]) => `⚡ *${nombre}:* Nivel ${datos.nivel || 1}`)
      .join("\n");
    
    // Construir el mensaje de desafío usando el prefijo global
    let mensajeDesafio =
      `🛡️ *¡Desafío de Batalla entre Usuarios!* 🛡️\n\n` +
      `👤 *Retador:* @${userId.split('@')[0]}\n` +
      `🎯 *Retado:* @${opponentId.split('@')[0]}\n\n` +
      `📊 *Datos de @${userId.split('@')[0]}:*\n` +
      `   • *Nivel:* ${usuario.nivel}\n` +
      `   • *Vida:* ${usuario.vida}\n` +
      `   • *Habilidades:*\n${habilidadesUser}\n\n` +
      `📊 *Datos de @${opponentId.split('@')[0]}:*\n` +
      `   • *Nivel:* ${oponente.nivel}\n` +
      `   • *Vida:* ${oponente.vida}\n` +
      `   • *Habilidades:*\n${habilidadesOponente}\n\n` +
      `🛡️ *@${opponentId.split('@')[0]}*, responde con \`${global.prefix}gouser\` para aceptar el desafío.\n` +
      `⏳ *Tienes 2 minutos para aceptar.*`;
      
    await sock.sendMessage(msg.key.remoteJid, { text: mensajeDesafio, mentions: [userId, opponentId] });
    
    // Guardar la solicitud de batalla en el usuario retador (tipo "user")
    usuario.battleRequest = {
      target: opponentId,
      time: Date.now(),
      type: "user"
    };
    fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));
    
    // Configurar expiración de la solicitud (2 minutos)
    setTimeout(() => {
      let data = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));
      if (
        data.usuarios[userId]?.battleRequest &&
        data.usuarios[userId].battleRequest.target === opponentId &&
        data.usuarios[userId].battleRequest.type === "user"
      ) {
        delete data.usuarios[userId].battleRequest;
        fs.writeFileSync(rpgFile, JSON.stringify(data, null, 2));
        sock.sendMessage(msg.key.remoteJid, {
          text: "⏳ *La solicitud de batalla entre usuarios ha expirado porque no fue aceptada a tiempo.*"
        }, { quoted: msg });
      }
    }, 120000);
    
  } catch (error) {
    console.error('❌ Error en .batallauser:', error);
  }
  break;
}

case 'gouser': {
  try {
    const rpgFile = "./rpg.json";
    if (!fs.existsSync(rpgFile)) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: `❌ *No hay datos de RPG. Usa \`${global.prefix}crearcartera\` para empezar.*`
      }, { quoted: msg });
    }
    let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));
    let userId = msg.key.participant || msg.key.remoteJid;
    
    // Buscar quién desafió al usuario (tipo "user")
    const challengerId = Object.keys(rpgData.usuarios).find(
      (id) => rpgData.usuarios[id].battleRequest &&
              rpgData.usuarios[id].battleRequest.target === userId &&
              rpgData.usuarios[id].battleRequest.type === "user"
    );
    if (!challengerId) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: "⚠️ *No tienes ninguna solicitud de batalla entre usuarios pendiente.*"
      }, { quoted: msg });
    }
    
    // Verificar que la solicitud siga activa (2 minutos)
    const requestTime = rpgData.usuarios[challengerId].battleRequest.time;
    if (Date.now() - requestTime > 120000) {
      delete rpgData.usuarios[challengerId].battleRequest;
      fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));
      return sock.sendMessage(msg.key.remoteJid, {
        text: "⏳ *La solicitud de batalla entre usuarios ha expirado.*"
      }, { quoted: msg });
    }
    
    // Eliminar la solicitud de batalla al aceptar
    delete rpgData.usuarios[challengerId].battleRequest;
    
    let userStats = rpgData.usuarios[userId];
    let challengerStats = rpgData.usuarios[challengerId];
    
    // Animación de batalla
    const animaciones = [
      "🛡️ *¡La batalla entre usuarios comienza!* Los guerreros se preparan...",
      `🔥 *${challengerStats.nombre}* lanza un ataque devastador.`,
      `🛡️ *${userStats.nombre}* se defiende con gran habilidad.`,
      `💥 *Impacto crítico de ${userStats.nombre}!*`,
      `⚡ *${challengerStats.nombre}* utiliza su técnica secreta.`,
      `🌪️ *La batalla se intensifica...*`,
      `✨ *El enfrentamiento alcanza su punto álgido...*`,
      "💥 *¡El destino de la batalla está por decidirse!*"
    ];
    let mensajeAnimado = await sock.sendMessage(
      msg.key.remoteJid,
      { text: animaciones[0] },
      { quoted: msg }
    );
    for (let i = 1; i < animaciones.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: animaciones[i], edit: mensajeAnimado.key },
        { quoted: msg }
      );
    }
    
    // **💥 Cálculo de batalla para usuarios**
    const statsChallenger = challengerStats.nivel * 5 +
      Object.values(challengerStats.habilidades).reduce((total, h) => total + ((typeof h === 'object' ? h.nivel : h) * 2), 0);
    const statsUser = userStats.nivel * 5 +
      Object.values(userStats.habilidades).reduce((total, h) => total + ((typeof h === 'object' ? h.nivel : h) * 2), 0);
    
    let empate = false;
    let ganadorId, perdedorId;
    if (statsChallenger > statsUser) {
      ganadorId = challengerId;
      perdedorId = userId;
    } else if (statsChallenger < statsUser) {
      ganadorId = userId;
      perdedorId = challengerId;
    } else {
      empate = true;
    }
    
    let mensajeFinal = "";
    
    if (empate) {
      const xpTie = Math.floor(Math.random() * 301) + 200;     // 200 - 500 XP
      const diamondTie = Math.floor(Math.random() * 201) + 100;  // 100 - 300 diamantes
      
      rpgData.usuarios[userId].diamantes = (rpgData.usuarios[userId].diamantes || 0) + diamondTie;
      rpgData.usuarios[challengerId].diamantes = (rpgData.usuarios[challengerId].diamantes || 0) + diamondTie;
      
      userStats.experiencia = (userStats.experiencia || 0) + xpTie;
      challengerStats.experiencia = (challengerStats.experiencia || 0) + xpTie;
      
      mensajeFinal = 
        `🤝 *¡La batalla entre usuarios terminó en empate!* 🤝\n\n` +
        `Ambos reciben:\n` +
        `• +${xpTie} XP ✨\n` +
        `• +${diamondTie} diamantes 💎\n\n` +
        `❤️ *Estado actual:*\n` +
        `- ${userStats.nombre}: ${userStats.vida} HP\n` +
        `- ${challengerStats.nombre}: ${challengerStats.vida} HP`;
    } else {
      let ganador = rpgData.usuarios[ganadorId];
      let perdedor = rpgData.usuarios[perdedorId];
      
      // 🔻 Reducir vida de los usuarios
      ganador.vida -= Math.floor(Math.random() * 10) + 5;
      perdedor.vida -= Math.floor(Math.random() * 20) + 10;
      if (ganador.vida < 0) ganador.vida = 0;
      if (perdedor.vida < 0) perdedor.vida = 0;
      
      const xpGanador = Math.floor(Math.random() * 701) + 300; // 300 - 1000 XP
      const diamondGanador = Math.floor(Math.random() * 301) + 200; // 200 - 500 diamantes
      const xpPerdedor = Math.floor(Math.random() * 201) + 100; // 100 - 300 XP
      const diamondPerdedor = Math.floor(Math.random() * 151) + 50; // 50 - 200 diamantes
      
      ganador.experiencia = (ganador.experiencia || 0) + xpGanador;
      rpgData.usuarios[ganadorId].diamantes = (rpgData.usuarios[ganadorId].diamantes || 0) + diamondGanador;
      perdedor.experiencia = (perdedor.experiencia || 0) + xpPerdedor;
      rpgData.usuarios[perdedorId].diamantes = (rpgData.usuarios[perdedorId].diamantes || 0) + diamondPerdedor;
      
      mensajeFinal =
        `🎉 *¡La batalla entre usuarios ha terminado!* 🎉\n\n` +
        `🏆 *Ganador:* @${ganadorId.split('@')[0]}\n` +
        `💔 *Perdedor:* @${perdedorId.split('@')[0]}\n\n` +
        `*Recompensas:*\n` +
        `• *Ganador:* +${xpGanador} XP ✨, +${diamondGanador} diamantes 💎\n` +
        `• *Perdedor:* +${xpPerdedor} XP ✨, +${diamondPerdedor} diamantes 💎\n\n` +
        `❤️ *Estado actual:*\n` +
        `- ${ganador.nombre}: ${ganador.vida} HP\n` +
        `- ${perdedor.nombre}: ${perdedor.vida} HP`;
    }
    
    // Subida de nivel automática para los usuarios (definimos xpMax para usuario como nivel * 1500)
    const usuariosEnBatalla = [userStats, challengerStats];
    for (const u of usuariosEnBatalla) {
      u.xpMax = u.xpMax || (u.nivel * 1500);
      while (u.experiencia >= u.xpMax && u.nivel < 70) {
        u.experiencia -= u.xpMax;
        u.nivel++;
        u.xpMax = u.nivel * 1500; // Ajusta según tu sistema
        const rangos = ['🌟 Principiante', '⚔️ Guerrero', '🔥 Maestro', '👑 Élite', '🌀 Legendario', '💀 Dios de la Batalla'];
        u.rango = rangos[Math.min(Math.floor(u.nivel / 10), rangos.length - 1)];
      }
    }
    
    await sock.sendMessage(
      msg.key.remoteJid,
      { text: mensajeFinal, mentions: empate ? [userId, challengerId] : [ganadorId, perdedorId] },
      { quoted: msg }
    );
    
    // ⏳ Guardar cooldown de batalla para ambos (5 minutos)
    rpgData.usuarios[userId].cooldowns = rpgData.usuarios[userId].cooldowns || {};
    rpgData.usuarios[challengerId].cooldowns = rpgData.usuarios[challengerId].cooldowns || {};
    rpgData.usuarios[userId].cooldowns.batallaUser = Date.now();
    rpgData.usuarios[challengerId].cooldowns.batallaUser = Date.now();
    
    fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));
    
  } catch (error) {
    console.error('❌ Error en .gouser:', error);
    return sock.sendMessage(
      msg.key.remoteJid,
      { text: '❌ *Error inesperado al procesar la batalla entre usuarios.*' },
      { quoted: msg }
    );
  }
  break;
}            
        
case 'batallaanime': {
  try {
    const rpgFile = "./rpg.json";
    if (!fs.existsSync(rpgFile)) {
      return sock.sendMessage(
        msg.key.remoteJid,
        { text: `❌ *No hay datos de RPG. Usa \`${global.prefix}crearcartera\` para empezar.*` },
        { quoted: msg }
      );
    }
    let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));
    let userId = msg.key.participant || msg.key.remoteJid;
    
    // ⏳ Verificar cooldown (5 minutos) para batallas de personajes
    if (rpgData.usuarios[userId]?.cooldowns?.batallaAnime) {
      let cooldownTime = rpgData.usuarios[userId].cooldowns.batallaAnime;
      if ((Date.now() - cooldownTime) < 5 * 60 * 1000) {
        let remainingTime = Math.ceil((5 * 60 * 1000 - (Date.now() - cooldownTime)) / 1000);
        return sock.sendMessage(
          msg.key.remoteJid,
          { text: `⏳ *Debes esperar ${remainingTime} segundos antes de usar \`${global.prefix}batallaanime\` nuevamente.*` },
          { quoted: msg }
        );
      }
    }
    
    // Verificar que el usuario tenga al menos un personaje
    if (!rpgData.usuarios[userId] || !rpgData.usuarios[userId].personajes || rpgData.usuarios[userId].personajes.length === 0) {
      return sock.sendMessage(
        msg.key.remoteJid,
        { text: `❌ *No tienes un personaje registrado. Usa \`${global.prefix}rpg <nombre> <edad>\` para crear tu cuenta y obtener un personaje inicial.*` },
        { quoted: msg }
      );
    }
    
    // Extraer el ID del oponente: se intenta primero por mensaje citado y, si no, por menciones
    let opponentId;
    if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
      opponentId = msg.message.extendedTextMessage.contextInfo.participant;
    }
    if (!opponentId && msg.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
      opponentId = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
    }
    if (!opponentId) {
      return sock.sendMessage(
        msg.key.remoteJid,
        { text: "⚔️ *Menciona o responde (cita) a un usuario para retarlo a una batalla de personajes.*" },
        { quoted: msg }
      );
    }
    
    // Verificar que el oponente tenga un personaje
    if (!rpgData.usuarios[opponentId] || !rpgData.usuarios[opponentId].personajes || rpgData.usuarios[opponentId].personajes.length === 0) {
      return sock.sendMessage(
        msg.key.remoteJid,
        { text: "❌ *El oponente no tiene un personaje registrado.*" },
        { quoted: msg }
      );
    }
    
    let userCharacter = rpgData.usuarios[userId].personajes[0];
    let opponentCharacter = rpgData.usuarios[opponentId].personajes[0];
    
    // Formatear habilidades (en personajes se guardan como números)
    let habilidadesUser = Object.entries(userCharacter.habilidades)
      .map(([nombre, valor]) => `⚡ *${nombre}:* Nivel ${valor}`)
      .join("\n");
    let habilidadesOpponent = Object.entries(opponentCharacter.habilidades)
      .map(([nombre, valor]) => `⚡ *${nombre}:* Nivel ${valor}`)
      .join("\n");
    
    // Construir mensaje de desafío con el prefijo global para la respuesta
    let mensajeDesafio = 
      `🎌 *¡Desafío de Batalla Anime!* 🎌\n\n` +
      `👤 *Retador:* @${userId.split('@')[0]}\n` +
      `🎯 *Retado:* @${opponentId.split('@')[0]}\n\n` +
      `🗡️ *Personaje de @${userId.split('@')[0]}:*\n` +
      `   • *Nombre:* ${userCharacter.nombre}\n` +
      `   • *Nivel:* ${userCharacter.nivel}\n` +
      `   • *Rango:* ${userCharacter.rango}\n` +
      `   • *Habilidades:*\n${habilidadesUser}\n\n` +
      `🛡️ *Personaje de @${opponentId.split('@')[0]}:*\n` +
      `   • *Nombre:* ${opponentCharacter.nombre}\n` +
      `   • *Nivel:* ${opponentCharacter.nivel}\n` +
      `   • *Rango:* ${opponentCharacter.rango}\n` +
      `   • *Habilidades:*\n${habilidadesOpponent}\n\n` +
      `🛡️ *@${opponentId.split('@')[0]}*, responde con \`${global.prefix}goper\` para aceptar el desafío.\n` +
      `⏳ *Tienes 2 minutos para aceptar.*`;
      
    await sock.sendMessage(
      msg.key.remoteJid,
      { text: mensajeDesafio, mentions: [userId, opponentId] }
    );
    
    // Guardar la solicitud de batalla en el usuario retador (tipo "anime")
    rpgData.usuarios[userId].battleRequest = {
      target: opponentId,
      time: Date.now(),
      type: "anime"
    };
    fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));
    
    // Expiración de la solicitud (2 minutos)
    setTimeout(() => {
      let data = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));
      if (
        data.usuarios[userId]?.battleRequest &&
        data.usuarios[userId].battleRequest.target === opponentId &&
        data.usuarios[userId].battleRequest.type === "anime"
      ) {
        delete data.usuarios[userId].battleRequest;
        fs.writeFileSync(rpgFile, JSON.stringify(data, null, 2));
        sock.sendMessage(
          msg.key.remoteJid,
          { text: "⏳ *La solicitud de batalla anime ha expirado porque no fue aceptada a tiempo.*" },
          { quoted: msg }
        );
      }
    }, 120000);
    
  } catch (error) {
    console.error('❌ Error en .batallaanime:', error);
  }
  break;
}

case 'goper': {
  try {
    const rpgFile = "./rpg.json";
    if (!fs.existsSync(rpgFile)) {
      return sock.sendMessage(
        msg.key.remoteJid,
        { text: `❌ *No hay datos de RPG. Usa \`${global.prefix}crearcartera\` para empezar.*` },
        { quoted: msg }
      );
    }
    let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));
    let userId = msg.key.participant || msg.key.remoteJid;
    
    // Buscar quién desafió al usuario (tipo "anime")
    const challengerId = Object.keys(rpgData.usuarios).find(
      (id) => rpgData.usuarios[id].battleRequest &&
              rpgData.usuarios[id].battleRequest.target === userId &&
              rpgData.usuarios[id].battleRequest.type === "anime"
    );
    if (!challengerId) {
      return sock.sendMessage(
        msg.key.remoteJid,
        { text: "⚠️ *No tienes ninguna solicitud de batalla anime pendiente.*" },
        { quoted: msg }
      );
    }
    
    // Verificar que la solicitud siga activa (2 minutos)
    const requestTime = rpgData.usuarios[challengerId].battleRequest.time;
    if (Date.now() - requestTime > 120000) {
      delete rpgData.usuarios[challengerId].battleRequest;
      fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));
      return sock.sendMessage(
        msg.key.remoteJid,
        { text: "⏳ *La solicitud de batalla anime ha expirado.*" },
        { quoted: msg }
      );
    }
    
    // Eliminar la solicitud de batalla al aceptar
    delete rpgData.usuarios[challengerId].battleRequest;
    
    let userCharacter = rpgData.usuarios[userId].personajes[0];
    let challengerCharacter = rpgData.usuarios[challengerId].personajes[0];
    
    // 🔥 Animación de batalla
    const animaciones = [
      "🎌 *¡La batalla anime comienza!* Los guerreros se preparan para el combate...",
      `🔥 *${challengerCharacter.nombre}* lanza un ataque devastador.`,
      `🛡️ *${userCharacter.nombre}* bloquea el ataque con gran habilidad.`,
      `💥 *Impacto crítico de ${userCharacter.nombre}!*`,
      `⚡ *${challengerCharacter.nombre}* utiliza su técnica especial.`,
      `🌪️ *La batalla se intensifica a cada segundo...*`,
      `✨ *El enfrentamiento alcanza su punto álgido...*`,
      "💥 *¡El destino de la batalla está por decidirse!*"
    ];
    let mensajeAnimado = await sock.sendMessage(
      msg.key.remoteJid,
      { text: animaciones[0] },
      { quoted: msg }
    );
    for (let i = 1; i < animaciones.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: animaciones[i], edit: mensajeAnimado.key },
        { quoted: msg }
      );
    }
    
    // **💥 Cálculo de batalla**
    const statsChallenger = challengerCharacter.nivel * 5 +
      Object.values(challengerCharacter.habilidades).reduce((total, h) => total + (h * 2), 0);
    const statsUser = userCharacter.nivel * 5 +
      Object.values(userCharacter.habilidades).reduce((total, h) => total + (h * 2), 0);
    
    let empate = false;
    let ganadorId, perdedorId;
    if (statsChallenger > statsUser) {
      ganadorId = challengerId;
      perdedorId = userId;
    } else if (statsChallenger < statsUser) {
      ganadorId = userId;
      perdedorId = challengerId;
    } else {
      empate = true;
    }
    
    let mensajeFinal = "";
    
    if (empate) {
      const xpTie = Math.floor(Math.random() * 301) + 200;      // 200 - 500 XP
      const diamondTie = Math.floor(Math.random() * 201) + 100;   // 100 - 300 diamantes
      
      rpgData.usuarios[userId].diamantes = (rpgData.usuarios[userId].diamantes || 0) + diamondTie;
      rpgData.usuarios[challengerId].diamantes = (rpgData.usuarios[challengerId].diamantes || 0) + diamondTie;
      
      userCharacter.experiencia = (userCharacter.experiencia || 0) + xpTie;
      challengerCharacter.experiencia = (challengerCharacter.experiencia || 0) + xpTie;
      
      mensajeFinal = 
        `🤝 *¡La batalla anime terminó en empate!* 🤝\n\n` +
        `Ambos reciben:\n` +
        `• +${xpTie} XP ✨\n` +
        `• +${diamondTie} diamantes 💎\n\n` +
        `❤️ *Estado actual de los guerreros:*\n` +
        `- ${userCharacter.nombre}: ${userCharacter.vida} HP\n` +
        `- ${challengerCharacter.nombre}: ${challengerCharacter.vida} HP`;
    } else {
      let ganadorCharacter = rpgData.usuarios[ganadorId].personajes[0];
      let perdedorCharacter = rpgData.usuarios[perdedorId].personajes[0];
      
      // 🔻 Reducir vida de los personajes
      ganadorCharacter.vida -= Math.floor(Math.random() * 10) + 5;
      perdedorCharacter.vida -= Math.floor(Math.random() * 20) + 10;
      if (ganadorCharacter.vida < 0) ganadorCharacter.vida = 0;
      if (perdedorCharacter.vida < 0) perdedorCharacter.vida = 0;
      
      const xpGanador = Math.floor(Math.random() * 701) + 300; // 300 - 1000 XP
      const diamondGanador = Math.floor(Math.random() * 301) + 200; // 200 - 500 diamantes
      const xpPerdedor = Math.floor(Math.random() * 201) + 100; // 100 - 300 XP
      const diamondPerdedor = Math.floor(Math.random() * 151) + 50; // 50 - 200 diamantes
      
      ganadorCharacter.experiencia = (ganadorCharacter.experiencia || 0) + xpGanador;
      rpgData.usuarios[ganadorId].diamantes = (rpgData.usuarios[ganadorId].diamantes || 0) + diamondGanador;
      perdedorCharacter.experiencia = (perdedorCharacter.experiencia || 0) + xpPerdedor;
      rpgData.usuarios[perdedorId].diamantes = (rpgData.usuarios[perdedorId].diamantes || 0) + diamondPerdedor;
      
      mensajeFinal =
        `🎉 *¡La batalla anime ha terminado!* 🎉\n\n` +
        `🏆 *Ganador:* @${ganadorId.split('@')[0]}\n` +
        `💔 *Perdedor:* @${perdedorId.split('@')[0]}\n\n` +
        `*Recompensas:*\n` +
        `• *Ganador:* +${xpGanador} XP ✨, +${diamondGanador} diamantes 💎\n` +
        `• *Perdedor:* +${xpPerdedor} XP ✨, +${diamondPerdedor} diamantes 💎\n\n` +
        `❤️ *Estado actual de los guerreros:*\n` +
        `- ${ganadorCharacter.nombre}: ${ganadorCharacter.vida} HP\n` +
        `- ${perdedorCharacter.nombre}: ${perdedorCharacter.vida} HP`;
    }
    
    // Subida de nivel automática para ambos personajes
    const personajes = [userCharacter, challengerCharacter];
    for (const personaje of personajes) {
      personaje.xpMax = personaje.xpMax || 1000;
      while (personaje.experiencia >= personaje.xpMax && personaje.nivel < 70) {
        personaje.experiencia -= personaje.xpMax;
        personaje.nivel++;
        personaje.xpMax = personaje.nivel * 1500; // Ajusta según tu sistema
        const rangos = ['🌟 Principiante', '⚔️ Guerrero', '🔥 Maestro', '👑 Élite', '🌀 Legendario', '💀 Dios de la Batalla'];
        personaje.rango = rangos[Math.min(Math.floor(personaje.nivel / 10), rangos.length - 1)];
      }
    }
    
    await sock.sendMessage(
      msg.key.remoteJid,
      { text: mensajeFinal, mentions: empate ? [userId, challengerId] : [ganadorId, perdedorId] },
      { quoted: msg }
    );
    
    // ⏳ Guardar cooldown de batalla para ambos (5 minutos)
    rpgData.usuarios[userId].cooldowns = rpgData.usuarios[userId].cooldowns || {};
    rpgData.usuarios[challengerId].cooldowns = rpgData.usuarios[challengerId].cooldowns || {};
    rpgData.usuarios[userId].cooldowns.batallaAnime = Date.now();
    rpgData.usuarios[challengerId].cooldowns.batallaAnime = Date.now();
    
    fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));
    
  } catch (error) {
    console.error('❌ Error en .goper:', error);
    return sock.sendMessage(
      msg.key.remoteJid,
      { text: '❌ *Error inesperado al procesar la batalla anime.*' },
      { quoted: msg }
    );
  }
  break;
}
            
        
case 'batallamascota': {
  try {
    const rpgFile = "./rpg.json";
    if (!fs.existsSync(rpgFile)) {
      return sock.sendMessage(
        msg.key.remoteJid,
        { text: `❌ *No hay datos de RPG. Usa \`${global.prefix}crearcartera\` para empezar.*` },
        { quoted: msg }
      );
    }
    let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));
    let userId = msg.key.participant || msg.key.remoteJid;

    // ⏳ Verificar cooldown (5 minutos)
    if (rpgData.usuarios[userId]?.cooldowns?.batallaMascota) {
      let cooldownTime = rpgData.usuarios[userId].cooldowns.batallaMascota;
      if ((Date.now() - cooldownTime) < 5 * 60 * 1000) {
        let remainingTime = Math.ceil((5 * 60 * 1000 - (Date.now() - cooldownTime)) / 1000);
        return sock.sendMessage(
          msg.key.remoteJid,
          { text: `⏳ *Debes esperar ${remainingTime} segundos antes de usar \`${global.prefix}batallamascota\` nuevamente.*` },
          { quoted: msg }
        );
      }
    }

    // 📌 Verificar si el usuario tiene mascota
    if (!rpgData.usuarios[userId] || !rpgData.usuarios[userId].mascotas || rpgData.usuarios[userId].mascotas.length === 0) {
      return sock.sendMessage(
        msg.key.remoteJid,
        { text: `❌ *No tienes una mascota. Usa \`${global.prefix}tiendamascotas\` para comprar una.*` },
        { quoted: msg }
      );
    }

    // 📌 Extraer ID del oponente: se intenta primero por mensaje citado y, de no haberlo, por menciones
    let opponentId;
    if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
      opponentId = msg.message.extendedTextMessage.contextInfo.participant;
    }
    if (!opponentId && msg.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
      opponentId = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
    }
    if (!opponentId) {
      return sock.sendMessage(
        msg.key.remoteJid,
        { text: "⚔️ *Menciona o responde (cita) a un usuario para retarlo a una batalla de mascotas.*" },
        { quoted: msg }
      );
    }

    // 📌 Verificar que el oponente tenga mascota
    if (!rpgData.usuarios[opponentId] || !rpgData.usuarios[opponentId].mascotas || rpgData.usuarios[opponentId].mascotas.length === 0) {
      return sock.sendMessage(
        msg.key.remoteJid,
        { text: "❌ *El oponente no tiene una mascota.*" },
        { quoted: msg }
      );
    }

    let userMascot = rpgData.usuarios[userId].mascotas[0];
    let opponentMascot = rpgData.usuarios[opponentId].mascotas[0];

    // Formatear habilidades (recorriendo el objeto)
    let habilidadesUser = Object.entries(userMascot.habilidades)
      .map(([nombre, datos]) => `⚡ *${nombre}:* Nivel ${datos.nivel || datos}`)
      .join("\n");
    let habilidadesOpponent = Object.entries(opponentMascot.habilidades)
      .map(([nombre, datos]) => `⚡ *${nombre}:* Nivel ${datos.nivel || datos}`)
      .join("\n");

    // Mensaje de desafío usando el prefijo global para el comando de respuesta
    let mensajeDesafio = 
      `⚔️ *¡Desafío de Batalla de Mascotas!* \n\n` +
      `👤 *Retador:* @${userId.split('@')[0]}\n` +
      `🎯 *Retado:* @${opponentId.split('@')[0]}\n\n` +
      `🐾 *Mascota de @${userId.split('@')[0]}:*\n` +
      `   • *Nombre:* ${userMascot.nombre}\n` +
      `   • *Vida:* ${userMascot.vida}\n` +
      `   • *Nivel:* ${userMascot.nivel}\n` +
      `   • *Rango:* ${userMascot.rango}\n` +
      `   • *Habilidades:*\n${habilidadesUser}\n\n` +
      `🐾 *Mascota de @${opponentId.split('@')[0]}:*\n` +
      `   • *Nombre:* ${opponentMascot.nombre}\n` +
      `   • *Vida:* ${opponentMascot.vida}\n` +
      `   • *Nivel:* ${opponentMascot.nivel}\n` +
      `   • *Rango:* ${opponentMascot.rango}\n` +
      `   • *Habilidades:*\n${habilidadesOpponent}\n\n` +
      `🛡️ *@${opponentId.split('@')[0]}*, responde con \`${global.prefix}gomascota\` para aceptar el desafío.\n` +
      `⏳ *Tienes 2 minutos para aceptar.*`;

    await sock.sendMessage(
      msg.key.remoteJid,
      { text: mensajeDesafio, mentions: [userId, opponentId] }
    );

    // Guardar la solicitud de batalla en el usuario retador
    rpgData.usuarios[userId].battleRequest = {
      target: opponentId,
      time: Date.now()
    };
    fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

    // Configurar expiración de la solicitud (2 minutos)
    setTimeout(() => {
      let data = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));
      if (data.usuarios[userId]?.battleRequest && data.usuarios[userId].battleRequest.target === opponentId) {
        delete data.usuarios[userId].battleRequest;
        fs.writeFileSync(rpgFile, JSON.stringify(data, null, 2));
        sock.sendMessage(
          msg.key.remoteJid,
          { text: "⏳ *La solicitud de batalla ha expirado porque no fue aceptada a tiempo.*" },
          { quoted: msg }
        );
      }
    }, 120000);

  } catch (error) {
    console.error('❌ Error en .batallamascota:', error);
  }
  break;
}

            
case 'gomascota': {
  try {
    const rpgFile = "./rpg.json";
    if (!fs.existsSync(rpgFile)) {
      return sock.sendMessage(
        msg.key.remoteJid,
        { text: `❌ *No hay datos de RPG. Usa \`${global.prefix}crearcartera\` para empezar.*` },
        { quoted: msg }
      );
    }
    let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));
    let userId = msg.key.participant || msg.key.remoteJid;
    
    // Buscar quién desafió al usuario
    const challengerId = Object.keys(rpgData.usuarios).find(
      (id) => rpgData.usuarios[id].battleRequest && rpgData.usuarios[id].battleRequest.target === userId
    );
    if (!challengerId) {
      return sock.sendMessage(
        msg.key.remoteJid,
        { text: "⚠️ *No tienes ninguna solicitud de batalla pendiente.*" },
        { quoted: msg }
      );
    }
    
    // Verificar si la solicitud sigue activa (2 minutos)
    const requestTime = rpgData.usuarios[challengerId].battleRequest.time;
    if (Date.now() - requestTime > 120000) {
      delete rpgData.usuarios[challengerId].battleRequest;
      fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));
      return sock.sendMessage(
        msg.key.remoteJid,
        { text: "⏳ *La solicitud de batalla ha expirado.*" },
        { quoted: msg }
      );
    }
    
    // Eliminar la solicitud de batalla al aceptar el desafío
    delete rpgData.usuarios[challengerId].battleRequest;
    
    let userMascot = rpgData.usuarios[userId].mascotas[0];
    let challengerMascot = rpgData.usuarios[challengerId].mascotas[0];
    
    // 🔥 Animación de batalla
    const animaciones = [
      "⚔️ *¡La batalla comienza!* Las mascotas se preparan para el combate...",
      `🔥 *${challengerMascot.nombre}* ataca con un feroz embate.`,
      `🛡️ *${userMascot.nombre}* esquiva y responde con una contraofensiva.`,
      `💥 *${userMascot.nombre}* lanza un golpe crítico.`,
      `⚡ *${challengerMascot.nombre}* usa su habilidad especial y ataca.`,
      `🌪️ *La batalla se intensifica...*`,
      `✨ *El combate alcanza su clímax...*`,
      "💥 *¡Impacto final! La batalla está por decidirse...*"
    ];
    let mensajeAnimado = await sock.sendMessage(
      msg.key.remoteJid,
      { text: animaciones[0] },
      { quoted: msg }
    );
    for (let i = 1; i < animaciones.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: animaciones[i], edit: mensajeAnimado.key },
        { quoted: msg }
      );
    }
    
    // **💥 Cálculo de batalla**
    const statsChallenger = challengerMascot.nivel * 5 +
      Object.values(challengerMascot.habilidades).reduce((total, h) => total + ((typeof h === 'object' ? h.nivel : h) * 2), 0);
    const statsUser = userMascot.nivel * 5 +
      Object.values(userMascot.habilidades).reduce((total, h) => total + ((typeof h === 'object' ? h.nivel : h) * 2), 0);
    
    let empate = false;
    let ganadorId, perdedorId;
    if (statsChallenger > statsUser) {
      ganadorId = challengerId;
      perdedorId = userId;
    } else if (statsChallenger < statsUser) {
      ganadorId = userId;
      perdedorId = challengerId;
    } else {
      empate = true;
    }
    
    let mensajeFinal = "";
    
    if (empate) {
      // Recompensas de empate: ambos reciben XP y diamantes
      const xpTie = Math.floor(Math.random() * 301) + 200;      // 200 - 500 XP
      const diamondTie = Math.floor(Math.random() * 201) + 100;   // 100 - 300 diamantes
      
      rpgData.usuarios[userId].diamantes = (rpgData.usuarios[userId].diamantes || 0) + diamondTie;
      rpgData.usuarios[challengerId].diamantes = (rpgData.usuarios[challengerId].diamantes || 0) + diamondTie;
      
      userMascot.experiencia = (userMascot.experiencia || 0) + xpTie;
      challengerMascot.experiencia = (challengerMascot.experiencia || 0) + xpTie;
      
      mensajeFinal = 
        `🤝 *¡La batalla terminó en empate!* 🤝\n\n` +
        `Ambos reciben:\n` +
        `• +${xpTie} XP ✨\n` +
        `• +${diamondTie} diamantes 💎\n\n` +
        `❤️ *Estado de las mascotas:*\n` +
        `- ${userMascot.nombre}: ${userMascot.vida} HP\n` +
        `- ${challengerMascot.nombre}: ${challengerMascot.vida} HP`;
    } else {
      let ganadorMascota = rpgData.usuarios[ganadorId].mascotas[0];
      let perdedorMascota = rpgData.usuarios[perdedorId].mascotas[0];
      
      // 🔻 Reducir vida de las mascotas
      ganadorMascota.vida -= Math.floor(Math.random() * 10) + 5;
      perdedorMascota.vida -= Math.floor(Math.random() * 20) + 10;
      if (ganadorMascota.vida < 0) ganadorMascota.vida = 0;
      if (perdedorMascota.vida < 0) perdedorMascota.vida = 0;
      
      // Recompensas para ganador y perdedor
      const xpGanador = Math.floor(Math.random() * 701) + 300; // 300 - 1000 XP
      const diamondGanador = Math.floor(Math.random() * 301) + 200; // 200 - 500 diamantes
      const xpPerdedor = Math.floor(Math.random() * 201) + 100; // 100 - 300 XP
      const diamondPerdedor = Math.floor(Math.random() * 151) + 50; // 50 - 200 diamantes
      
      ganadorMascota.experiencia = (ganadorMascota.experiencia || 0) + xpGanador;
      rpgData.usuarios[ganadorId].diamantes = (rpgData.usuarios[ganadorId].diamantes || 0) + diamondGanador;
      perdedorMascota.experiencia = (perdedorMascota.experiencia || 0) + xpPerdedor;
      rpgData.usuarios[perdedorId].diamantes = (rpgData.usuarios[perdedorId].diamantes || 0) + diamondPerdedor;
      
      mensajeFinal =
        `🎉 *¡La batalla ha terminado!* 🎉\n\n` +
        `🏆 *Ganador:* @${ganadorId.split('@')[0]}\n` +
        `💔 *Perdedor:* @${perdedorId.split('@')[0]}\n\n` +
        `*Recompensas:*\n` +
        `• *Ganador:* +${xpGanador} XP ✨, +${diamondGanador} diamantes 💎\n` +
        `• *Perdedor:* +${xpPerdedor} XP ✨, +${diamondPerdedor} diamantes 💎\n\n` +
        `❤️ *Estado de las mascotas:*\n` +
        `- ${ganadorMascota.nombre}: ${ganadorMascota.vida} HP\n` +
        `- ${perdedorMascota.nombre}: ${perdedorMascota.vida} HP`;
    }
    
    // Subida de nivel automática para ambas mascotas
    const mascotas = [userMascot, challengerMascot];
    for (const mascota of mascotas) {
      mascota.xpMax = mascota.xpMax || 500;
      while (mascota.experiencia >= mascota.xpMax && mascota.nivel < 80) {
        mascota.experiencia -= mascota.xpMax;
        mascota.nivel++;
        mascota.xpMax = mascota.nivel * 500; // Ajusta según tu sistema
        const rangos = ['🐾 Principiante', '🐾 Intermedio', '🐾 Avanzado', '🐾 Experto', '🐾 Leyenda'];
        mascota.rango = rangos[Math.min(Math.floor(mascota.nivel / 10), rangos.length - 1)];
      }
    }
    
    // Enviar mensaje final con menciones y diseño bonito
    await sock.sendMessage(
      msg.key.remoteJid,
      { text: mensajeFinal, mentions: empate ? [userId, challengerId] : [ganadorId, perdedorId] },
      { quoted: msg }
    );
    
    // ⏳ Guardar cooldown de batalla para ambos (5 minutos)
    rpgData.usuarios[userId].cooldowns = rpgData.usuarios[userId].cooldowns || {};
    rpgData.usuarios[challengerId].cooldowns = rpgData.usuarios[challengerId].cooldowns || {};
    rpgData.usuarios[userId].cooldowns.batallaMascota = Date.now();
    rpgData.usuarios[challengerId].cooldowns.batallaMascota = Date.now();
    
    fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));
    
  } catch (error) {
    console.error('❌ Error en .gomascota:', error);
    return sock.sendMessage(
      msg.key.remoteJid,
      { text: '❌ *Error inesperado al procesar la batalla.*' },
      { quoted: msg }
    );
  }
  break;
}          
        
case 'addlista': {
  try {
    const fromMe = msg.key.fromMe; // Definir desde el mensaje
    const text = args.join(" ");
    // Permitir el comando si el remitente es owner o si el mensaje es enviado por el bot (fromMe)
    if (!isOwner(sender) && !fromMe) {
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: "⛔ Solo el propietario del bot o el bot mismo pueden usar este comando." },
        { quoted: msg }
      );
      return;
    }

    // Intentamos extraer el número del usuario objetivo:
    // Si se cita el mensaje, se toma el número del participante citado.
    let target;
    if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
      target =
        msg.message.extendedTextMessage.contextInfo.participant ||
        msg.key.participant ||
        msg.key.remoteJid;
    } else if (text && text.trim() !== "") {
      target = text;
    }

    if (!target) {
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: "⚠️ Uso incorrecto. Cita el mensaje del usuario o proporciona el número." },
        { quoted: msg }
      );
      return;
    }

    // Normalizamos para guardar solo dígitos
    target = target.replace(/\D/g, "");

    // Ruta del archivo lista.json
    const listaFile = "./lista.json";
    let lista = [];
    if (fs.existsSync(listaFile)) {
      lista = JSON.parse(fs.readFileSync(listaFile, "utf-8"));
      if (!Array.isArray(lista)) {
        lista = [];
      }
    }

    // Verificar si el usuario ya está en la lista
    if (lista.includes(target)) {
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: "ℹ️ El usuario ya está en la lista." },
        { quoted: msg }
      );
      return;
    }

    // Agregar el usuario a la lista y guardar el archivo
    lista.push(target);
    fs.writeFileSync(listaFile, JSON.stringify(lista, null, 2));

    await sock.sendMessage(
      msg.key.remoteJid,
      { text: `✅ Usuario ${target} agregado a la lista.` },
      { quoted: msg }
    );
  } catch (error) {
    console.error("❌ Error en el comando .addlista:", error);
    await sock.sendMessage(
      msg.key.remoteJid,
      { text: "❌ Ocurrió un error al agregar el usuario a la lista." },
      { quoted: msg }
    );
  }
  break;
}

// Comando para eliminar un usuario de la lista (deletelista)
case 'deletelista': {
  try {
    const fromMe = msg.key.fromMe; // Definir desde el mensaje
    const text = args.join(" ");
    // Permitir el comando si el remitente es owner o si el mensaje es enviado por el bot (fromMe)
    if (!isOwner(sender) && !fromMe) {
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: "⛔ Solo el propietario del bot o el bot mismo pueden usar este comando." },
        { quoted: msg }
      );
      return;
    }

    // Intentamos extraer el número del usuario objetivo
    let target;
    if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
      target =
        msg.message.extendedTextMessage.contextInfo.participant ||
        msg.key.participant ||
        msg.key.remoteJid;
    } else if (text && text.trim() !== "") {
      target = text;
    }

    if (!target) {
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: "⚠️ Uso incorrecto. Cita el mensaje del usuario o proporciona el número." },
        { quoted: msg }
      );
      return;
    }

    // Normalizamos para guardar solo dígitos
    target = target.replace(/\D/g, "");

    const listaFile = "./lista.json";
    let lista = [];
    if (fs.existsSync(listaFile)) {
      lista = JSON.parse(fs.readFileSync(listaFile, "utf-8"));
      if (!Array.isArray(lista)) {
        lista = [];
      }
    }

    // Verificar si el usuario se encuentra en la lista
    if (!lista.includes(target)) {
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: "ℹ️ El usuario no se encuentra en la lista." },
        { quoted: msg }
      );
      return;
    }

    // Eliminar el usuario de la lista y guardar el archivo
    lista = lista.filter((u) => u !== target);
    fs.writeFileSync(listaFile, JSON.stringify(lista, null, 2));

    await sock.sendMessage(
      msg.key.remoteJid,
      { text: `✅ Usuario ${target} eliminado de la lista.` },
      { quoted: msg }
    );
  } catch (error) {
    console.error("❌ Error en el comando .deletelista:", error);
    await sock.sendMessage(
      msg.key.remoteJid,
      { text: "❌ Ocurrió un error al eliminar el usuario de la lista." },
      { quoted: msg }
    );
  }
  break;
}
        
case 'deletemascota': {
    try {
        // 🔄 Reacción de procesamiento
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "🗑️", key: msg.key } });

        // Verificar si el usuario es el Owner
        if (!isOwner(sender)) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "⛔ *Solo el propietario del bot puede eliminar mascotas de la tienda.*" 
            }, { quoted: msg });
            return;
        }

        const rpgFile = "./rpg.json";

        // 📂 Verificar si el archivo existe
        if (!fs.existsSync(rpgFile)) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "❌ *No hay mascotas en la tienda o el archivo no existe.*" 
            }, { quoted: msg });
            return;
        }

        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        // ❌ Verificar si hay mascotas en la tienda
        if (!rpgData.tiendaMascotas || rpgData.tiendaMascotas.length === 0) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "❌ *La tienda de mascotas está vacía.*" 
            }, { quoted: msg });
            return;
        }

        // 📌 Verificar si se ingresó un número
        if (!text || isNaN(text)) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `⚠️ *Uso incorrecto.*\n📌 Ejemplo: \`${global.prefix}deletemascota <número>\`\n🔹 Usa \`${global.prefix}tiendamascotas\` para ver la lista.` 
            }, { quoted: msg });
            return;
        }

        const numeroMascota = parseInt(text);

        // ❌ Validar el número
        if (numeroMascota <= 0 || numeroMascota > rpgData.tiendaMascotas.length) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `⚠️ *Número inválido.*\n📌 Usa \`${global.prefix}tiendamascotas\` para ver la lista de mascotas.` 
            }, { quoted: msg });
            return;
        }

        // 🗑️ Eliminar la mascota de la tienda
        let mascotaEliminada = rpgData.tiendaMascotas.splice(numeroMascota - 1, 1)[0];

        // 📂 Guardar cambios
        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

        // 📜 Mensaje de confirmación
        let mensaje = `🗑️ *Mascota eliminada de la tienda*\n\n`;
        mensaje += `🐾 *Nombre:* ${mascotaEliminada.nombre}\n`;
        mensaje += `🏅 *Rango:* ${mascotaEliminada.rango}\n`;
        mensaje += `💎 *Precio:* ${mascotaEliminada.precio} diamantes\n`;
        mensaje += `🌟 *Habilidades:* ${Object.keys(mascotaEliminada.habilidades).join(", ")}\n\n`;
        mensaje += `📌 *Esta mascota ya no está disponible en la tienda.*`;

        // 📩 Enviar mensaje con imagen de la mascota eliminada
        await sock.sendMessage(msg.key.remoteJid, { 
            image: { url: mascotaEliminada.imagen },
            caption: mensaje
        }, { quoted: msg });

        // ✅ Reacción de éxito
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "✅", key: msg.key } 
        });

    } catch (error) {
        console.error("❌ Error en el comando .deletemascota:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Ocurrió un error al eliminar la mascota. Inténtalo de nuevo.*" 
        }, { quoted: msg });

        // ❌ Reacción de error
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "❌", key: msg.key } 
        });
    }
    break;
}
        
case 'deleteper': {
    try {
        // 🔄 Reacción de procesamiento
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "🗑️", key: msg.key } });

        // Verificar si el usuario es el Owner
        if (!isOwner(sender)) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "⛔ *Solo el propietario del bot puede eliminar personajes de la tienda.*" 
            }, { quoted: msg });
            return;
        }

        const rpgFile = "./rpg.json";

        // 📂 Verificar si el archivo existe
        if (!fs.existsSync(rpgFile)) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "❌ *No hay personajes en la tienda o el archivo no existe.*" 
            }, { quoted: msg });
            return;
        }

        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        // ❌ Verificar si hay personajes en la tienda
        if (!rpgData.tiendaPersonajes || rpgData.tiendaPersonajes.length === 0) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "❌ *La tienda de personajes está vacía.*" 
            }, { quoted: msg });
            return;
        }

        // 📌 Verificar si se ingresó un número
        if (!text || isNaN(text)) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `⚠️ *Uso incorrecto.*\n📌 Ejemplo: \`${global.prefix}deleteper <número>\`\n🔹 Usa \`${global.prefix}tiendaper\` para ver la lista.` 
            }, { quoted: msg });
            return;
        }

        const numeroPersonaje = parseInt(text);

        // ❌ Validar el número
        if (numeroPersonaje <= 0 || numeroPersonaje > rpgData.tiendaPersonajes.length) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `⚠️ *Número inválido.*\n📌 Usa \`${global.prefix}tiendaper\` para ver la lista de personajes.` 
            }, { quoted: msg });
            return;
        }

        // 🗑️ Eliminar el personaje de la tienda
        let personajeEliminado = rpgData.tiendaPersonajes.splice(numeroPersonaje - 1, 1)[0];

        // 📂 Guardar cambios
        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

        // 📜 Mensaje de confirmación
        let mensaje = `🗑️ *Personaje eliminado de la tienda*\n\n`;
        mensaje += `🎭 *Nombre:* ${personajeEliminado.nombre}\n`;
        mensaje += `🏅 *Rango:* ${personajeEliminado.rango}\n`;
        mensaje += `💎 *Precio:* ${personajeEliminado.precio} diamantes\n`;
        mensaje += `🌟 *Habilidades:* ${Object.keys(personajeEliminado.habilidades).join(", ")}\n\n`;
        mensaje += `📌 *Este personaje ya no está disponible en la tienda.*`;

        // 📩 Enviar mensaje con imagen del personaje eliminado
        await sock.sendMessage(msg.key.remoteJid, { 
            image: { url: personajeEliminado.imagen },
            caption: mensaje
        }, { quoted: msg });

        // ✅ Reacción de éxito
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "✅", key: msg.key } 
        });

    } catch (error) {
        console.error("❌ Error en el comando .deleteper:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Ocurrió un error al eliminar el personaje. Inténtalo de nuevo.*" 
        }, { quoted: msg });

        // ❌ Reacción de error
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "❌", key: msg.key } 
        });
    }
    break;
}
        
case 'verper': { 
    try { 
        // 🔄 Enviar reacción mientras se procesa el comando 
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "🎭", key: msg.key } // Emoji de personaje 🎭 
        });

        const rpgFile = "./rpg.json";
        let rpgData = fs.existsSync(rpgFile) ? JSON.parse(fs.readFileSync(rpgFile, "utf-8")) : { usuarios: {} };
        let userId = msg.key.participant || msg.key.remoteJid;

        // ❌ Verificar si el usuario está registrado 
        if (!rpgData.usuarios[userId]) { 
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No estás registrado en el gremio Azura Ultra.*\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` 
            }, { quoted: msg });
            return; 
        }

        let usuario = rpgData.usuarios[userId];

        // ❌ Verificar si el usuario tiene personajes 
        if (!usuario.personajes || usuario.personajes.length === 0) { 
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes personajes en tu colección.*\n📜 Usa \`${global.prefix}tiendaper\` para comprar alguno.` 
            }, { quoted: msg });
            return; 
        }

        // 📜 **Lista de personajes del usuario**  
        let mensaje = `🎭 *Tus Personajes Comprados - Azura Ultra* 🎭\n\n`;

        usuario.personajes.forEach((personaje, index) => { 
            mensaje += `═════════════════════\n`;  
            mensaje += `🔹 *${index + 1}. ${personaje.nombre}*\n`;  
            mensaje += `   🏅 *Rango:* ${personaje.rango}\n`;  
            mensaje += `   🎚️ *Nivel:* ${personaje.nivel}\n`;  
            mensaje += `   ❤️ *Vida:* ${personaje.vida} HP\n`;  
            mensaje += `   ✨ *Experiencia:* ${personaje.experiencia} / ${personaje.xpMax} XP\n`;  
            mensaje += `   🌟 *Habilidades:*\n`;  
            Object.entries(personaje.habilidades).forEach(([habilidad, nivel]) => {  
                mensaje += `      🔹 ${habilidad} (Nivel ${nivel})\n`;  
            });  
            mensaje += `   💎 *Valor:* ${personaje.precio} diamantes\n\n`;  
        });

        // 🔥 **Opciones de gestión de personajes**  
        mensaje += `═════════════════════\n`;
        mensaje += `🛠️ *Gestión de personajes:*\n`;
        mensaje += `🔹 \`${global.prefix}per <número>\` - Cambiar personaje principal\n`;
        mensaje += `🔹 \`${global.prefix}nivelper\` - Ver estadísticas detalladas\n`;
        mensaje += `🔹 \`${global.prefix}bolasdeldragon\` - Revivir personaje\n`;
        mensaje += `🔹 \`${global.prefix}vender <nombre> <precio>\` - Vender personaje\n`;
        mensaje += `🔹 \`${global.prefix}quitarventa <nombre>\` - Retirar de la venta\n\n`;

        // ⚔️ **Modo Batalla y Rankings**  
        mensaje += `⚔️ *Batalla y Ranking:*\n`;
        mensaje += `🔹 \`${global.prefix}batallaanime\` - Luchar contra otro personaje\n`;
        mensaje += `🔹 \`${global.prefix}topper\` - Ver ranking de personajes\n\n`;

        // 🏆 **Comandos para subir de nivel**  
        mensaje += `🏆 *Subir de nivel:*\n`;
        mensaje += `🔹 \`${global.prefix}luchar\`, \`${global.prefix}poder\`, \`${global.prefix}volar\`\n`;
        mensaje += `🔹 \`${global.prefix}otromundo\`, \`${global.prefix}otrouniverso\`, \`${global.prefix}mododios\`\n`;
        mensaje += `🔹 \`${global.prefix}mododiablo\`, \`${global.prefix}enemigos\`, \`${global.prefix}podermaximo\`\n`;

        // 🎥 **Enviar mensaje con video como GIF**  
        await sock.sendMessage(msg.key.remoteJid, {  
            video: { url: "https://cdn.dorratz.com/files/1740651987117.mp4" },  
            gifPlayback: true, // Se reproduce como GIF  
            caption: mensaje  
        }, { quoted: msg });

        // ✅ Enviar reacción de éxito  
        await sock.sendMessage(msg.key.remoteJid, {  
            react: { text: "✅", key: msg.key }  
        });

    } catch (error) {  
        console.error("❌ Error en el comando .verper:", error);  
        await sock.sendMessage(msg.key.remoteJid, {  
            text: "❌ *Ocurrió un error al obtener la lista de personajes. Inténtalo de nuevo.*"  
        }, { quoted: msg });

        // ❌ Enviar reacción de error  
        await sock.sendMessage(msg.key.remoteJid, {  
            react: { text: "❌", key: msg.key }  
        });  
    }  
    break;  
}
        
case 'per': {
    try {
        // 🔄 Enviar reacción mientras se procesa el comando
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "🎭", key: msg.key } // Emoji de personaje 🎭
        });

        const fs = require("fs");
        const rpgFile = "./rpg.json";

        // Verificar si el archivo RPG existe
        if (!fs.existsSync(rpgFile)) {
            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: `❌ *No tienes una cuenta en el gremio Azura Ultra.*\n\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.`
                },
                { quoted: msg }
            );
            return;
        }

        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));
        let userId = msg.key.participant || msg.key.remoteJid;

        if (!rpgData.usuarios[userId]) {
            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: `❌ *No tienes una cuenta registrada.*\n\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.`
                },
                { quoted: msg }
            );
            return;
        }

        let usuario = rpgData.usuarios[userId];

        if (!usuario.personajes || usuario.personajes.length === 0) {
            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: `❌ *No tienes personajes comprados.*\n🔹 Usa \`${global.prefix}tiendaper\` para comprar uno.`
                },
                { quoted: msg }
            );
            return;
        }

        // Tomamos el input desde 'text'
        const input = (text || "").trim();

        // Si el usuario no ingresó nada o es inválido
        if (!input || isNaN(input)) {
            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: `⚠️ *Uso incorrecto.*\nEjemplo: \`${global.prefix}per <número>\`\n🔹 Usa \`${global.prefix}verper\` para ver la lista de personajes.`
                },
                { quoted: msg }
            );
            return;
        }

        const numeroPersonaje = parseInt(input);

        // Validamos que el número sea un índice válido
        if (numeroPersonaje <= 0 || numeroPersonaje > usuario.personajes.length) {
            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: `⚠️ *Uso incorrecto.*\nEjemplo: \`${global.prefix}per <número>\`\n🔹 Usa \`${global.prefix}verper\` para ver la lista de personajes.`
                },
                { quoted: msg }
            );
            return;
        }

        // Obtener el personaje seleccionado
        let nuevoPersonajePrincipal = usuario.personajes.splice(numeroPersonaje - 1, 1)[0];

        // Mover el personaje seleccionado al primer lugar
        usuario.personajes.unshift(nuevoPersonajePrincipal);

        // Guardar cambios
        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

        // 📜 Construcción del mensaje de confirmación con habilidades correctamente definidas
        let mensaje = `🎭 *¡Has cambiado tu personaje principal!* 🎭\n\n`;
        mensaje += `🔹 *Nuevo Personaje Principal:* ${nuevoPersonajePrincipal.nombre}\n`;
        mensaje += `📊 *Rango:* ${nuevoPersonajePrincipal.rango}\n`;
        mensaje += `🎚️ *Nivel:* ${nuevoPersonajePrincipal.nivel}\n`;
        mensaje += `❤️ *Vida:* ${nuevoPersonajePrincipal.vida} HP\n`;
        mensaje += `✨ *Experiencia:* ${nuevoPersonajePrincipal.experiencia} / ${nuevoPersonajePrincipal.xpMax} XP\n`;
        mensaje += `🌟 *Habilidades:*\n`;

        // 🔥 **Corregimos la manera en que se muestra el nivel de habilidades**
        Object.entries(nuevoPersonajePrincipal.habilidades).forEach(([habilidad, nivel]) => {
            mensaje += `   🔸 ${habilidad} (Nivel ${nivel})\n`;
        });

        mensaje += `\n📜 Usa \`${global.prefix}nivelper\` para ver sus estadísticas.\n`;

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                image: { url: nuevoPersonajePrincipal.imagen },
                caption: mensaje
            },
            { quoted: msg }
        );

        // ✅ Reacción de confirmación
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "✅", key: msg.key }
        });

    } catch (error) {
        console.error("❌ Error en el comando .per:", error);
        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text: "❌ *Ocurrió un error al cambiar tu personaje principal. Inténtalo de nuevo.*"
            },
            { quoted: msg }
        );

        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "❌", key: msg.key }
        });
    }
    break;
}
        
case 'nivelper': {
    try {
        // 🔄 Reacción al procesar
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "📜", key: msg.key } });

        const fs = require("fs");
        const rpgFile = "./rpg.json";

        if (!fs.existsSync(rpgFile)) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes personajes registrados.*\n📌 Usa \`${global.prefix}comprar <nombre>\` para obtener uno.` 
            }, { quoted: msg });
            return;
        }

        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        if (!rpgData.usuarios[msg.key.participant]) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes cuenta en Azura Ultra.*\n📌 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` 
            }, { quoted: msg });
            return;
        }

        let usuario = rpgData.usuarios[msg.key.participant];

        if (!usuario.personajes || usuario.personajes.length === 0) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes personajes.*\n📌 Usa \`${global.prefix}tiendaper\` para comprar.` 
            }, { quoted: msg });
            return;
        }

        let personajeActual = usuario.personajes[0];

        // 📜 Construcción del mensaje claro con habilidades correctamente definidas
        let mensaje = `🎭 *Estadísticas de tu Personaje Principal* 🎭\n\n`;
        mensaje += `🔹 *Nombre:* ${personajeActual.nombre}\n`;
        mensaje += `🏅 *Rango:* ${personajeActual.rango}\n`;
        mensaje += `🎚️ *Nivel:* ${personajeActual.nivel}\n`;
        mensaje += `❤️ *Vida:* ${personajeActual.vida} HP\n`;
        mensaje += `✨ *Experiencia:* ${personajeActual.experiencia || 0} / ${personajeActual.xpMax || 1000} XP\n`;
        mensaje += `🌟 *Habilidades:*\n`;

        // 🔥 **Corregimos la manera en que se muestra el nivel de habilidades**
        Object.entries(personajeActual.habilidades).forEach(([habilidad, nivel]) => {
            mensaje += `   🔸 ${habilidad} (Nivel ${nivel})\n`;
        });

        mensaje += `\n📜 Usa \`${global.prefix}verper\` para ver todos tus personajes.\n`;

        // 📸 Enviar imagen y mensaje
        await sock.sendMessage(msg.key.remoteJid, { 
            image: { url: personajeActual.imagen }, 
            caption: mensaje
        }, { quoted: msg });

        // ✅ Confirmación de éxito
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });

    } catch (error) {
        console.error("❌ Error en .nivelper:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Error al obtener estadísticas. Intenta otra vez.*" 
        }, { quoted: msg });

        await sock.sendMessage(msg.key.remoteJid, { react: { text: "❌", key: msg.key } });
    }
    break;
}
        
case 'enemigos': {
    try {
        const fs = require("fs");
        const rpgFile = "./rpg.json";
        const userId = msg.key.participant || msg.key.remoteJid;
        const cooldownTime = 10 * 60 * 1000; // 10 minutos

        // ⚔️ Reacción antes de procesar
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "⚔️", key: msg.key } });

        // 📂 Verificar si el archivo existe
        if (!fs.existsSync(rpgFile)) {
            return sock.sendMessage(msg.key.remoteJid, { text: "❌ *Los datos del RPG no están disponibles.*" }, { quoted: msg });
        }

        // 📥 Cargar datos del usuario
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        // ❌ Verificar si el usuario está registrado
        if (!rpgData.usuarios[userId]) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes una cuenta registrada en el gremio Azura Ultra.*\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` 
            }, { quoted: msg });
        }

        let usuario = rpgData.usuarios[userId];

        // ❌ Verificar si el usuario tiene personajes
        if (!usuario.personajes || usuario.personajes.length === 0) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes personajes para enfrentarse a los enemigos.*\n📜 Usa \`${global.prefix}tiendaper\` para comprar uno.` 
            }, { quoted: msg });
        }

        let personaje = usuario.personajes[0]; // Se asume que el primer personaje es el principal

        // 🚑 Verificar si el personaje tiene 0 de vida
        if (personaje.vida <= 0) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `🚑 *¡${personaje.nombre} no puede luchar, está sin vida!*\n📜 Usa \`${global.prefix}bolasdeldragon\` para revivirlo.` 
            }, { quoted: msg });
        }

        // 🕒 Verificar cooldown
        let tiempoActual = Date.now();
        if (personaje.cooldowns?.enemigos && tiempoActual - personaje.cooldowns.enemigos < cooldownTime) {
            let tiempoRestante = ((personaje.cooldowns.enemigos + cooldownTime - tiempoActual) / (60 * 1000)).toFixed(1);
            return sock.sendMessage(msg.key.remoteJid, { text: `⏳ *Debes esperar ${tiempoRestante} minutos antes de volver a enfrentarte a los enemigos.*` }, { quoted: msg });
        }

        // 🎖️ **Generar recompensas aleatorias**
        let diamantesGanados = Math.floor(Math.random() * (900 - 1 + 1)) + 1; // 1 a 900
        let xpGanada = Math.floor(Math.random() * (2500 - 200 + 1)) + 200; // 200 a 2500

        // 🔥 **Efecto negativo aleatorio**
        let efectoNegativo = Math.random() < 0.5; // 50% de probabilidad de recibir un efecto negativo

        let vidaPerdida = efectoNegativo ? Math.floor(Math.random() * (60 - 20 + 1)) + 20 : Math.floor(Math.random() * (15 - 5 + 1)) + 5;
        let xpPerdida = efectoNegativo ? Math.floor(Math.random() * (600 - 200 + 1)) + 200 : 0;
        
        personaje.vida = Math.max(0, personaje.vida - vidaPerdida);
        usuario.experiencia += xpGanada;
        usuario.diamantes += diamantesGanados;
        personaje.experiencia = Math.max(0, personaje.experiencia - xpPerdida); 

        // 🕒 **Guardar cooldown**
        if (!personaje.cooldowns) personaje.cooldowns = {};
        personaje.cooldowns.enemigos = tiempoActual;

        // ⚔️ **Mensajes de recompensa y castigo**
        const textosPositivos = [
            `⚔️ *${personaje.nombre} luchó valientemente y derrotó a sus enemigos.*  
💎 *${diamantesGanados} Diamantes obtenidos*  
✨ *${xpGanada} XP ganados*`,
            `🛡️ *${personaje.nombre} se enfrentó a un enemigo formidable y salió victorioso.*  
💎 *${diamantesGanados} Diamantes obtenidos*  
✨ *${xpGanada} XP ganados*`,
            `🔥 *${personaje.nombre} mostró su poder en batalla, acabando con sus rivales.*  
💎 *${diamantesGanados} Diamantes obtenidos*  
✨ *${xpGanada} XP ganados*`
        ];

        const textosNegativos = [
            `⚠️ *${personaje.nombre} fue superado en batalla y sufrió una gran pérdida.*  
💀 *Perdiste XP:* ${xpPerdida}  
❤️ *Perdiste vida:* ${vidaPerdida} HP`,
            `☠️ *${personaje.nombre} subestimó a sus enemigos y terminó gravemente herido.*  
💀 *Perdiste XP:* ${xpPerdida}  
❤️ *Perdiste vida:* ${vidaPerdida} HP`,
            `🔴 *${personaje.nombre} fue emboscado y tuvo que retirarse con serias heridas.*  
💀 *Perdiste XP:* ${xpPerdida}  
❤️ *Perdiste vida:* ${vidaPerdida} HP`
        ];

        // 📢 **Enviar mensaje con XP y Diamantes**
        await sock.sendMessage(msg.key.remoteJid, { 
            text: efectoNegativo ? textosNegativos[Math.floor(Math.random() * textosNegativos.length)] : textosPositivos[Math.floor(Math.random() * textosPositivos.length)]
        }, { quoted: msg });

        // 📊 **Manejar la subida de nivel correctamente**
        let xpMaxNivel = personaje.nivel === 1 ? 1000 : personaje.nivel * 1500;

        while (personaje.experiencia >= xpMaxNivel && personaje.nivel < 70) {
            personaje.experiencia -= xpMaxNivel;
            personaje.nivel += 1;
            xpMaxNivel = personaje.nivel * 1500;
            personaje.xpMax = xpMaxNivel;

            // 📊 **Actualizar Rangos**
            const rangosPersonaje = [
                { nivel: 1, rango: "🌟 Principiante" },
                { nivel: 10, rango: "⚔️ Guerrero Novato" },
                { nivel: 20, rango: "🔥 Maestro de Batallas" },
                { nivel: 30, rango: "👑 General de la Guerra" },
                { nivel: 40, rango: "🌀 Leyenda Viviente" },
                { nivel: 50, rango: "💀 Señor de la Guerra" },
                { nivel: 60, rango: "🚀 Emperador de la Lucha" },
                { nivel: 70, rango: "🔱 Dios de la Guerra" }
            ];
            let rangoAnterior = personaje.rango;
            personaje.rango = rangosPersonaje.reduce((acc, curr) => (personaje.nivel >= curr.nivel ? curr.rango : acc), personaje.rango);

            await sock.sendMessage(msg.key.remoteJid, { 
                text: `🎉 *¡${personaje.nombre} ha subido al nivel ${personaje.nivel}! 🏆*\n🏅 *Nuevo Rango:* ${personaje.rango}`
            }, { quoted: msg });
        }

        // 🌟 **Mejorar habilidades con 30% de probabilidad**
        let habilidades = Object.keys(personaje.habilidades);
        if (habilidades.length > 0 && Math.random() < 0.3) {
            let habilidadSubida = habilidades[Math.floor(Math.random() * habilidades.length)];
            personaje.habilidades[habilidadSubida] += 1;

            await sock.sendMessage(msg.key.remoteJid, { 
                text: `🌟 *¡${personaje.nombre} ha mejorado su habilidad!* 🎯\n🔹 *${habilidadSubida}: Nivel ${personaje.habilidades[habilidadSubida]}*`
            }, { quoted: msg });
        }

        // 📂 Guardar cambios en el archivo
        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

    } catch (error) {
        console.error("❌ Error en el comando .enemigos:", error);
    }
    break;
}
        
case 'mododiablo': {
    try {
        const fs = require("fs");
        const rpgFile = "./rpg.json";
        const userId = msg.key.participant || msg.key.remoteJid;
        const cooldownTime = 10 * 60 * 1000; // 10 minutos

        // 😈 Reacción antes de procesar
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "😈", key: msg.key } });

        // 📂 Verificar si el archivo existe
        if (!fs.existsSync(rpgFile)) {
            return sock.sendMessage(msg.key.remoteJid, { text: "❌ *Los datos del RPG no están disponibles.*" }, { quoted: msg });
        }

        // 📥 Cargar datos del usuario
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        // ❌ Verificar si el usuario está registrado
        if (!rpgData.usuarios[userId]) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes una cuenta registrada en el gremio Azura Ultra.*\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` 
            }, { quoted: msg });
        }

        let usuario = rpgData.usuarios[userId];

        // ❌ Verificar si el usuario tiene personajes
        if (!usuario.personajes || usuario.personajes.length === 0) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes personajes para entrar en el Modo Diablo.*\n📜 Usa \`${global.prefix}tiendaper\` para comprar uno.` 
            }, { quoted: msg });
        }

        let personaje = usuario.personajes[0]; // Se asume que el primer personaje es el principal

        // 🚑 Verificar si el personaje tiene 0 de vida
        if (personaje.vida <= 0) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `🚑 *¡${personaje.nombre} no puede usar el Modo Diablo, está sin vida!*\n📜 Usa \`${global.prefix}bolasdeldragon\` para revivirlo.` 
            }, { quoted: msg });
        }

        // 🕒 Verificar cooldown
        let tiempoActual = Date.now();
        if (personaje.cooldowns?.mododiablo && tiempoActual - personaje.cooldowns.mododiablo < cooldownTime) {
            let tiempoRestante = ((personaje.cooldowns.mododiablo + cooldownTime - tiempoActual) / (60 * 1000)).toFixed(1);
            return sock.sendMessage(msg.key.remoteJid, { text: `⏳ *Debes esperar ${tiempoRestante} minutos antes de volver a usar el Modo Diablo.*` }, { quoted: msg });
        }

        // 🎖️ **Generar recompensas aleatorias**
        let diamantesGanados = Math.floor(Math.random() * (1000 - 1 + 1)) + 1; // 1 a 1000
        let xpGanada = Math.floor(Math.random() * (2000 - 200 + 1)) + 200; // 200 a 2000

        // 🔥 **Efecto negativo aleatorio**
        let efectoNegativo = Math.random() < 0.5; // 50% de probabilidad de recibir un efecto negativo

        let vidaPerdida = efectoNegativo ? Math.floor(Math.random() * (50 - 20 + 1)) + 20 : Math.floor(Math.random() * (15 - 5 + 1)) + 5;
        let xpPerdida = efectoNegativo ? Math.floor(Math.random() * (500 - 200 + 1)) + 200 : 0;
        
        personaje.vida = Math.max(0, personaje.vida - vidaPerdida);
        usuario.experiencia += xpGanada;
        usuario.diamantes += diamantesGanados;
        personaje.experiencia = Math.max(0, personaje.experiencia - xpPerdida); 

        // 🕒 **Guardar cooldown**
        if (!personaje.cooldowns) personaje.cooldowns = {};
        personaje.cooldowns.mododiablo = tiempoActual;

        // 😈 **Mensajes de recompensa y castigo**
        const textosPositivos = [
            `🔥 *${personaje.nombre} ha abrazado la oscuridad y se ha vuelto más fuerte.*  
💎 *${diamantesGanados} Diamantes obtenidos*  
✨ *${xpGanada} XP ganados*`,
            `👹 *El poder infernal fluye a través de ${personaje.nombre}, aumentando su energía.*  
💎 *${diamantesGanados} Diamantes obtenidos*  
✨ *${xpGanada} XP ganados*`,
            `💀 *Con un aura diabólica, ${personaje.nombre} se convierte en una fuerza imparable.*  
💎 *${diamantesGanados} Diamantes obtenidos*  
✨ *${xpGanada} XP ganados*`
        ];

        const textosNegativos = [
            `⚠️ *${personaje.nombre} se dejó consumir por el Modo Diablo y sufrió una gran pérdida.*  
💀 *Perdiste XP:* ${xpPerdida}  
❤️ *Perdiste vida:* ${vidaPerdida} HP`,
            `☠️ *La oscuridad fue demasiado para ${personaje.nombre}, drenando su energía vital.*  
💀 *Perdiste XP:* ${xpPerdida}  
❤️ *Perdiste vida:* ${vidaPerdida} HP`,
            `🔴 *${personaje.nombre} intentó controlar el Modo Diablo, pero terminó debilitado.*  
💀 *Perdiste XP:* ${xpPerdida}  
❤️ *Perdiste vida:* ${vidaPerdida} HP`
        ];

        // 📢 **Enviar mensaje con XP y Diamantes**
        await sock.sendMessage(msg.key.remoteJid, { 
            text: efectoNegativo ? textosNegativos[Math.floor(Math.random() * textosNegativos.length)] : textosPositivos[Math.floor(Math.random() * textosPositivos.length)]
        }, { quoted: msg });

        // 📊 **Manejar la subida de nivel correctamente**
        let xpMaxNivel = personaje.nivel === 1 ? 1000 : personaje.nivel * 1500;

        while (personaje.experiencia >= xpMaxNivel && personaje.nivel < 70) {
            personaje.experiencia -= xpMaxNivel;
            personaje.nivel += 1;
            xpMaxNivel = personaje.nivel * 1500;
            personaje.xpMax = xpMaxNivel;

            // 📊 **Actualizar Rangos**
            const rangosPersonaje = [
                { nivel: 1, rango: "🌟 Principiante" },
                { nivel: 10, rango: "⚔️ Guerrero Oscuro" },
                { nivel: 20, rango: "🔥 Maestro del Caos" },
                { nivel: 30, rango: "👑 Señor del Infierno" },
                { nivel: 40, rango: "🌀 Destructor Demoníaco" },
                { nivel: 50, rango: "💀 Rey del Submundo" },
                { nivel: 60, rango: "🚀 Dios del Mal Supremo" },
                { nivel: 70, rango: "🔱 Emperador de la Oscuridad" }
            ];
            let rangoAnterior = personaje.rango;
            personaje.rango = rangosPersonaje.reduce((acc, curr) => (personaje.nivel >= curr.nivel ? curr.rango : acc), personaje.rango);

            await sock.sendMessage(msg.key.remoteJid, { 
                text: `🎉 *¡${personaje.nombre} ha subido al nivel ${personaje.nivel}! 🏆*\n🏅 *Nuevo Rango:* ${personaje.rango}`
            }, { quoted: msg });
        }

        // 🌟 **Mejorar habilidades con 30% de probabilidad**
        let habilidades = Object.keys(personaje.habilidades);
        if (habilidades.length > 0 && Math.random() < 0.3) {
            let habilidadSubida = habilidades[Math.floor(Math.random() * habilidades.length)];
            personaje.habilidades[habilidadSubida] += 1;

            await sock.sendMessage(msg.key.remoteJid, { 
                text: `🌟 *¡${personaje.nombre} ha mejorado su habilidad!* 🎯\n🔹 *${habilidadSubida}: Nivel ${personaje.habilidades[habilidadSubida]}*`
            }, { quoted: msg });
        }

        // 📂 Guardar cambios en el archivo
        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

    } catch (error) {
        console.error("❌ Error en el comando .mododiablo:", error);
    }
    break;
}
        
case 'podermaximo': {
    try {
        const fs = require("fs");
        const rpgFile = "./rpg.json";
        const userId = msg.key.participant || msg.key.remoteJid;
        const cooldownTime = 24 * 60 * 60 * 1000; // 24 horas

        // 🌌 Reacción antes de procesar
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "🌌", key: msg.key } });

        // 📂 Verificar si el archivo existe
        if (!fs.existsSync(rpgFile)) {
            return sock.sendMessage(msg.key.remoteJid, { text: "❌ *Los datos del RPG no están disponibles.*" }, { quoted: msg });
        }

        // 📥 Cargar datos del usuario
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        // ❌ Verificar si el usuario está registrado
        if (!rpgData.usuarios[userId]) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes una cuenta registrada en el gremio Azura Ultra.*\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` 
            }, { quoted: msg });
        }

        let usuario = rpgData.usuarios[userId];

        // ❌ Verificar si el usuario tiene personajes
        if (!usuario.personajes || usuario.personajes.length === 0) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes personajes para alcanzar el Poder Máximo.*\n📜 Usa \`${global.prefix}tiendaper\` para comprar uno.` 
            }, { quoted: msg });
        }

        let personaje = usuario.personajes[0]; // Se asume que el primer personaje es el principal

        // 🚑 Verificar si el personaje tiene 0 de vida
        if (personaje.vida <= 0) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `🚑 *¡${personaje.nombre} no puede alcanzar el Poder Máximo, está sin vida!*\n📜 Usa \`${global.prefix}bolasdeldragon\` para revivirlo.` 
            }, { quoted: msg });
        }

        // 🕒 Verificar cooldown
        let tiempoActual = Date.now();
        if (personaje.cooldowns?.podermaximo && tiempoActual - personaje.cooldowns.podermaximo < cooldownTime) {
            let tiempoRestante = ((personaje.cooldowns.podermaximo + cooldownTime - tiempoActual) / (60 * 60 * 1000)).toFixed(1);
            return sock.sendMessage(msg.key.remoteJid, { text: `⏳ *Debes esperar ${tiempoRestante} horas antes de volver a usar el Poder Máximo.*` }, { quoted: msg });
        }

        // 🎖️ **Generar recompensas aleatorias**
        let diamantesGanados = Math.floor(Math.random() * (4000 - 500 + 1)) + 500; // 500 a 4000
        let xpGanada = Math.floor(Math.random() * (10000 - 800 + 1)) + 800; // 800 a 10000

        // 💰 **Incrementar experiencia y diamantes**
        usuario.diamantes += diamantesGanados;
        personaje.experiencia += xpGanada;

        // ❤️ Reducir vida entre 20 y 50 puntos
        let vidaPerdida = Math.floor(Math.random() * (50 - 20 + 1)) + 20;
        personaje.vida = Math.max(0, personaje.vida - vidaPerdida);

        // 🕒 **Guardar cooldown**
        if (!personaje.cooldowns) personaje.cooldowns = {};
        personaje.cooldowns.podermaximo = tiempoActual;

        // 🌌 **Mensajes de recompensa**
        const textos = [
            `🌌 *${personaje.nombre} liberó su máximo poder y ahora domina la energía suprema.*  
💎 *${diamantesGanados} Diamantes obtenidos*  
✨ *${xpGanada} XP ganados*`,
            `🔥 *El aura de ${personaje.nombre} ahora brilla con un poder ilimitado.*  
💎 *${diamantesGanados} Diamantes obtenidos*  
✨ *${xpGanada} XP ganados*`,
            `⚡ *${personaje.nombre} ha alcanzado un estado de poder absoluto.*  
💎 *${diamantesGanados} Diamantes obtenidos*  
✨ *${xpGanada} XP ganados*`,
            `💥 *Con un rugido ensordecedor, ${personaje.nombre} superó todas sus limitaciones.*  
💎 *${diamantesGanados} Diamantes obtenidos*  
✨ *${xpGanada} XP ganados*`,
            `🌀 *Un nuevo nivel de existencia se ha desbloqueado para ${personaje.nombre}.*  
💎 *${diamantesGanados} Diamantes obtenidos*  
✨ *${xpGanada} XP ganados*`,
            `👑 *Los dioses han reconocido a ${personaje.nombre} como un ser supremo del universo.*  
💎 *${diamantesGanados} Diamantes obtenidos*  
✨ *${xpGanada} XP ganados*`
        ];

        // 📢 **Enviar mensaje con XP y Diamantes**
        await sock.sendMessage(msg.key.remoteJid, { 
            text: textos[Math.floor(Math.random() * textos.length)] 
        }, { quoted: msg });

        // 📊 **Manejar la subida de nivel correctamente**
        let xpMaxNivel = personaje.nivel === 1 ? 1000 : personaje.nivel * 1500;

        while (personaje.experiencia >= xpMaxNivel && personaje.nivel < 70) {
            personaje.experiencia -= xpMaxNivel;
            personaje.nivel += 1;
            xpMaxNivel = personaje.nivel * 1500;
            personaje.xpMax = xpMaxNivel; // Ajustar la XP máxima del nuevo nivel

            // 📊 **Actualizar Rangos**
            const rangosPersonaje = [
                { nivel: 1, rango: "🌟 Principiante" },
                { nivel: 10, rango: "⚔️ Guerrero Ascendido" },
                { nivel: 20, rango: "🔥 Maestro Celestial" },
                { nivel: 30, rango: "👑 Dios Guerrero" },
                { nivel: 40, rango: "🌀 Señor del Cosmos" },
                { nivel: 50, rango: "💀 Dominador Divino" },
                { nivel: 60, rango: "🚀 Semidiós Supremo" },
                { nivel: 70, rango: "🔱 Dios Supremo de la Creación" }
            ];
            let rangoAnterior = personaje.rango;
            personaje.rango = rangosPersonaje.reduce((acc, curr) => (personaje.nivel >= curr.nivel ? curr.rango : acc), personaje.rango);

            await sock.sendMessage(msg.key.remoteJid, { 
                text: `🎉 *¡${personaje.nombre} ha subido al nivel ${personaje.nivel}! 🏆*\n🏅 *Nuevo Rango:* ${personaje.rango}`
            }, { quoted: msg });
        }

        // 🌟 **Mejorar habilidades con 30% de probabilidad**
        let habilidades = Object.keys(personaje.habilidades);
        if (habilidades.length > 0 && Math.random() < 0.3) {
            let habilidadSubida = habilidades[Math.floor(Math.random() * habilidades.length)];
            personaje.habilidades[habilidadSubida] += 1;

            await sock.sendMessage(msg.key.remoteJid, { 
                text: `🌟 *¡${personaje.nombre} ha mejorado su habilidad!* 🎯\n🔹 *${habilidadSubida}: Nivel ${personaje.habilidades[habilidadSubida]}*`
            }, { quoted: msg });
        }

        // 📂 Guardar cambios en el archivo
        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

        // ✅ Reacción de confirmación después de ejecutar
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });

    } catch (error) {
        console.error("❌ Error en el comando .podermaximo:", error);
        await sock.sendMessage(msg.key.remoteJid, { text: "❌ *Ocurrió un error al activar el Poder Máximo. Inténtalo de nuevo.*" }, { quoted: msg });
    }
    break;
}
        
case 'mododios': {
    try {
        const fs = require("fs");
        const rpgFile = "./rpg.json";
        const userId = msg.key.participant || msg.key.remoteJid;
        const cooldownTime = 10 * 60 * 1000; // 10 minutos

        // 🔱 Reacción antes de procesar
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "🔱", key: msg.key } });

        // 📂 Verificar si el archivo existe
        if (!fs.existsSync(rpgFile)) {
            return sock.sendMessage(msg.key.remoteJid, { text: "❌ *Los datos del RPG no están disponibles.*" }, { quoted: msg });
        }

        // 📥 Cargar datos del usuario
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        // ❌ Verificar si el usuario está registrado
        if (!rpgData.usuarios[userId]) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes una cuenta registrada en el gremio Azura Ultra.*\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` 
            }, { quoted: msg });
        }

        let usuario = rpgData.usuarios[userId];

        // ❌ Verificar si el usuario tiene personajes
        if (!usuario.personajes || usuario.personajes.length === 0) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes personajes divinos para alcanzar el Modo Dios.*\n📜 Usa \`${global.prefix}tiendaper\` para comprar uno.` 
            }, { quoted: msg });
        }

        let personaje = usuario.personajes[0]; // Se usa el personaje principal

        // 🚑 Verificar si el personaje tiene 0 de vida
        if (personaje.vida <= 0) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `🚑 *¡${personaje.nombre} no puede entrar en Modo Dios, está sin vida!*\n📜 Usa \`${global.prefix}bolasdeldragon\` para revivirlo.` 
            }, { quoted: msg });
        }

        // 🕒 Verificar cooldown
        let tiempoActual = Date.now();
        if (personaje.cooldowns?.mododios && tiempoActual - personaje.cooldowns.mododios < cooldownTime) {
            let tiempoRestante = ((personaje.cooldowns.mododios + cooldownTime - tiempoActual) / (60 * 1000)).toFixed(1);
            return sock.sendMessage(msg.key.remoteJid, { text: `⏳ *Debes esperar ${tiempoRestante} minutos antes de volver a usar el Modo Dios.*` }, { quoted: msg });
        }

        // 🎖️ **Generar recompensas aleatorias**
        let diamantesGanados = Math.floor(Math.random() * (1000 - 50 + 1)) + 50; // 50 a 1000
        let xpGanada = Math.floor(Math.random() * (3000 - 500 + 1)) + 500; // 500 a 3000

        // 🔥 **Efecto negativo aleatorio (50% de probabilidad)**
        let efectoNegativo = Math.random() < 0.5; 

        let vidaPerdida = efectoNegativo ? Math.floor(Math.random() * (100 - 20 + 1)) + 20 : Math.floor(Math.random() * (15 - 5 + 1)) + 5;
        let xpPerdida = efectoNegativo ? Math.floor(Math.random() * (700 - 200 + 1)) + 200 : 0;
        
        personaje.vida = Math.max(0, personaje.vida - vidaPerdida);
        usuario.experiencia += xpGanada;
        usuario.diamantes += diamantesGanados;
        personaje.experiencia = Math.max(0, personaje.experiencia - xpPerdida); 

        // 🕒 **Guardar cooldown**
        if (!personaje.cooldowns) personaje.cooldowns = {};
        personaje.cooldowns.mododios = tiempoActual;

        // 🔱 **Mensajes de recompensa y castigo**
        const textosPositivos = [
            `🔱 *${personaje.nombre} alcanzó el Modo Dios y desbloqueó un nuevo nivel de poder.*  
💎 *${diamantesGanados} Diamantes obtenidos*  
✨ *${xpGanada} XP ganados*`,
            `🔥 *${personaje.nombre} sintió el poder divino recorrer su cuerpo y se volvió más fuerte.*  
💎 *${diamantesGanados} Diamantes obtenidos*  
✨ *${xpGanada} XP ganados*`,
            `💥 *El aura dorada de ${personaje.nombre} iluminó todo el campo de batalla, mostrando su fuerza.*  
💎 *${diamantesGanados} Diamantes obtenidos*  
✨ *${xpGanada} XP ganados*`
        ];

        const textosNegativos = [
            `⚠️ *${personaje.nombre} no logró controlar el Modo Dios y sufrió daños colaterales.*  
💀 *Perdiste XP:* ${xpPerdida}  
❤️ *Perdiste vida:* ${vidaPerdida} HP`,
            `☠️ *${personaje.nombre} fue consumido por la energía divina y debilitado.*  
💀 *Perdiste XP:* ${xpPerdida}  
❤️ *Perdiste vida:* ${vidaPerdida} HP`,
            `🔴 *El poder del Modo Dios fue demasiado para ${personaje.nombre}, sufriendo graves heridas.*  
💀 *Perdiste XP:* ${xpPerdida}  
❤️ *Perdiste vida:* ${vidaPerdida} HP`
        ];

        // 📢 **Enviar mensaje con XP y Diamantes**
        await sock.sendMessage(msg.key.remoteJid, { 
            text: efectoNegativo ? textosNegativos[Math.floor(Math.random() * textosNegativos.length)] : textosPositivos[Math.floor(Math.random() * textosPositivos.length)]
        }, { quoted: msg });

        // 📊 **Manejar la subida de nivel correctamente**
        let xpMaxNivel = personaje.nivel === 1 ? 1000 : personaje.nivel * 1500;

        while (personaje.experiencia >= xpMaxNivel && personaje.nivel < 70) {
            personaje.experiencia -= xpMaxNivel;
            personaje.nivel += 1;
            xpMaxNivel = personaje.nivel * 1500;
            personaje.xpMax = xpMaxNivel;

            // 📊 **Actualizar Rangos**
            const rangosPersonaje = [
                { nivel: 1, rango: "🌟 Principiante" },
                { nivel: 10, rango: "⚔️ Guerrero Divino" },
                { nivel: 20, rango: "🔥 Avatar Celestial" },
                { nivel: 30, rango: "👑 Dios de la Guerra" },
                { nivel: 40, rango: "🌀 Destructor Universal" },
                { nivel: 50, rango: "💀 Señor del Cosmos" },
                { nivel: 60, rango: "🚀 Emperador Divino" },
                { nivel: 70, rango: "🔱 Supremo Absoluto" }
            ];
            let rangoAnterior = personaje.rango;
            personaje.rango = rangosPersonaje.reduce((acc, curr) => (personaje.nivel >= curr.nivel ? curr.rango : acc), personaje.rango);

            await sock.sendMessage(msg.key.remoteJid, { 
                text: `🎉 *¡${personaje.nombre} ha subido al nivel ${personaje.nivel}! 🏆*\n🏅 *Nuevo Rango:* ${personaje.rango}`
            }, { quoted: msg });
        }

        // 🌟 **Mejorar habilidades con 30% de probabilidad**
        let habilidades = Object.keys(personaje.habilidades);
        if (habilidades.length > 0 && Math.random() < 0.3) {
            let habilidadSubida = habilidades[Math.floor(Math.random() * habilidades.length)];
            personaje.habilidades[habilidadSubida] += 1;

            await sock.sendMessage(msg.key.remoteJid, { 
                text: `🌟 *¡${personaje.nombre} ha mejorado su habilidad!* 🎯\n🔹 *${habilidadSubida}: Nivel ${personaje.habilidades[habilidadSubida]}*`
            }, { quoted: msg });
        }

        // 📂 Guardar cambios en el archivo
        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

    } catch (error) {
        console.error("❌ Error en el comando .mododios:", error);
    }
    break;
}

        
case 'otrouniverso': {
    try {
        const fs = require("fs");
        const rpgFile = "./rpg.json";
        const userId = msg.key.participant || msg.key.remoteJid;
        const cooldownTime = 6 * 60 * 1000; // 6 minutos

        // 🪐 Reacción antes de procesar
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "🪐", key: msg.key } });

        // 📂 Verificar si el archivo existe
        if (!fs.existsSync(rpgFile)) {
            return sock.sendMessage(msg.key.remoteJid, { text: "❌ *Los datos del RPG no están disponibles.*" }, { quoted: msg });
        }

        // 📥 Cargar datos del usuario
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        // ❌ Verificar si el usuario está registrado
        if (!rpgData.usuarios[userId]) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes una cuenta registrada en el gremio Azura Ultra.*\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` 
            }, { quoted: msg });
        }

        let usuario = rpgData.usuarios[userId];

        // ❌ Verificar si el usuario tiene personajes
        if (!usuario.personajes || usuario.personajes.length === 0) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes personajes para entrenar en otro universo.*\n📜 Usa \`${global.prefix}tiendaper\` para comprar uno.` 
            }, { quoted: msg });
        }

        let personaje = usuario.personajes[0]; // Se asume que el primer personaje es el principal

        // 🚑 Verificar si el personaje tiene 0 de vida
        if (personaje.vida <= 0) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `🚑 *¡${personaje.nombre} no puede entrenar en otro universo, está sin vida!*\n📜 Usa \`${global.prefix}bolasdeldragon\` para revivirlo.` 
            }, { quoted: msg });
        }

        // 🕒 Verificar cooldown
        let tiempoActual = Date.now();
        if (personaje.cooldowns?.otrouniverso && tiempoActual - personaje.cooldowns.otrouniverso < cooldownTime) {
            let tiempoRestante = ((personaje.cooldowns.otrouniverso + cooldownTime - tiempoActual) / (60 * 1000)).toFixed(1);
            return sock.sendMessage(msg.key.remoteJid, { text: `⏳ *Debes esperar ${tiempoRestante} minutos antes de volver a viajar a otro universo.*` }, { quoted: msg });
        }

        // 🎖️ **Generar recompensas aleatorias**
        let diamantesGanados = Math.floor(Math.random() * (600 - 1 + 1)) + 1; // 1 a 600
        let xpGanada = Math.floor(Math.random() * (1500 - 300 + 1)) + 300; // 300 a 1500

        // 💰 **Incrementar experiencia y diamantes**
        usuario.diamantes += diamantesGanados;
        personaje.experiencia += xpGanada;

        // ❤️ Reducir vida entre 5 y 20 puntos
        let vidaPerdida = Math.floor(Math.random() * (20 - 5 + 1)) + 5;
        personaje.vida = Math.max(0, personaje.vida - vidaPerdida);

        // 🕒 **Guardar cooldown**
        if (!personaje.cooldowns) personaje.cooldowns = {};
        personaje.cooldowns.otrouniverso = tiempoActual;

        // 🪐 **Mensajes de recompensa**
        const textos = [
            `🪐 *${personaje.nombre} viajó a otro universo y entrenó con guerreros de dimensiones desconocidas.*  
💎 *${diamantesGanados} Diamantes obtenidos*  
✨ *${xpGanada} XP ganados*`,
            `🚀 *${personaje.nombre} descubrió nuevas formas de energía en un universo alterno, mejorando su poder.*  
💎 *${diamantesGanados} Diamantes obtenidos*  
✨ *${xpGanada} XP ganados*`,
            `🌌 *Entrenando en un universo lejano, ${personaje.nombre} dominó una nueva técnica ancestral.*  
💎 *${diamantesGanados} Diamantes obtenidos*  
✨ *${xpGanada} XP ganados*`,
            `🌀 *Después de un viaje a través del multiverso, ${personaje.nombre} obtuvo un gran aumento de poder.*  
💎 *${diamantesGanados} Diamantes obtenidos*  
✨ *${xpGanada} XP ganados*`,
            `🔥 *${personaje.nombre} desafió a los dioses de un universo desconocido y se volvió más fuerte.*  
💎 *${diamantesGanados} Diamantes obtenidos*  
✨ *${xpGanada} XP ganados*`,
            `⚡ *Gracias a un entrenamiento en otra dimensión, ${personaje.nombre} ha mejorado su control del ki.*  
💎 *${diamantesGanados} Diamantes obtenidos*  
✨ *${xpGanada} XP ganados*`
        ];

        // 📢 **Enviar mensaje con XP y Diamantes**
        await sock.sendMessage(msg.key.remoteJid, { 
            text: textos[Math.floor(Math.random() * textos.length)] 
        }, { quoted: msg });

        // 📊 **Manejar la subida de nivel correctamente**
        let xpMaxNivel = personaje.nivel === 1 ? 1000 : personaje.nivel * 1500;

        while (personaje.experiencia >= xpMaxNivel && personaje.nivel < 70) {
            personaje.experiencia -= xpMaxNivel;
            personaje.nivel += 1;
            xpMaxNivel = personaje.nivel * 1500;
            personaje.xpMax = xpMaxNivel; // Ajustar la XP máxima del nuevo nivel

            // 📊 **Actualizar Rangos**
            const rangosPersonaje = [
                { nivel: 1, rango: "🌟 Principiante" },
                { nivel: 10, rango: "⚔️ Guerrero Interdimensional" },
                { nivel: 20, rango: "🔥 Maestro del Multiverso" },
                { nivel: 30, rango: "👑 Conquistador de Universos" },
                { nivel: 40, rango: "🌀 Dominador Espacial" },
                { nivel: 50, rango: "💀 Rey de los Multiversos" },
                { nivel: 60, rango: "🚀 Dios Cósmico" },
                { nivel: 70, rango: "🔱 Ser Supremo del Multiverso" }
            ];
            let rangoAnterior = personaje.rango;
            personaje.rango = rangosPersonaje.reduce((acc, curr) => (personaje.nivel >= curr.nivel ? curr.rango : acc), personaje.rango);

            await sock.sendMessage(msg.key.remoteJid, { 
                text: `🎉 *¡${personaje.nombre} ha subido al nivel ${personaje.nivel}! 🏆*\n🏅 *Nuevo Rango:* ${personaje.rango}`
            }, { quoted: msg });
        }

        // 🌟 **Mejorar habilidades con 30% de probabilidad**
        let habilidades = Object.keys(personaje.habilidades);
        if (habilidades.length > 0 && Math.random() < 0.3) {
            let habilidadSubida = habilidades[Math.floor(Math.random() * habilidades.length)];
            personaje.habilidades[habilidadSubida] += 1;

            await sock.sendMessage(msg.key.remoteJid, { 
                text: `🌟 *¡${personaje.nombre} ha mejorado su habilidad!* 🎯\n🔹 *${habilidadSubida}: Nivel ${personaje.habilidades[habilidadSubida]}*`
            }, { quoted: msg });
        }

        // 📂 Guardar cambios en el archivo
        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

        // ✅ Reacción de confirmación después de ejecutar
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });

    } catch (error) {
        console.error("❌ Error en el comando .otrouniverso:", error);
        await sock.sendMessage(msg.key.remoteJid, { text: "❌ *Ocurrió un error al entrenar en otro universo. Inténtalo de nuevo.*" }, { quoted: msg });
    }
    break;
}
        
case 'otromundo': {
    try {
        const fs = require("fs");
        const rpgFile = "./rpg.json";
        const userId = msg.key.participant || msg.key.remoteJid;
        const cooldownTime = 6 * 60 * 1000; // 6 minutos

        // 🌌 Reacción antes de procesar
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "🌌", key: msg.key } });

        // 📂 Verificar si el archivo existe
        if (!fs.existsSync(rpgFile)) {
            return sock.sendMessage(msg.key.remoteJid, { text: "❌ *Los datos del RPG no están disponibles.*" }, { quoted: msg });
        }

        // 📥 Cargar datos del usuario
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        // ❌ Verificar si el usuario está registrado
        if (!rpgData.usuarios[userId]) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes una cuenta registrada en el gremio Azura Ultra.*\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` 
            }, { quoted: msg });
        }

        let usuario = rpgData.usuarios[userId];

        // ❌ Verificar si el usuario tiene personajes
        if (!usuario.personajes || usuario.personajes.length === 0) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes personajes para entrenar en el Otro Mundo.*\n📜 Usa \`${global.prefix}tiendaper\` para comprar uno.` 
            }, { quoted: msg });
        }

        let personaje = usuario.personajes[0]; // Primer personaje como principal

        // 🚑 Verificar si el personaje tiene 0 de vida
        if (personaje.vida <= 0) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `🚑 *¡${personaje.nombre} no puede entrenar en el Otro Mundo, está sin vida!*\n📜 Usa \`${global.prefix}bolasdeldragon\` para revivirlo.` 
            }, { quoted: msg });
        }

        // 🕒 Verificar cooldown
        let tiempoActual = Date.now();
        if (personaje.cooldowns?.otromundo && tiempoActual - personaje.cooldowns.otromundo < cooldownTime) {
            let tiempoRestante = ((personaje.cooldowns.otromundo + cooldownTime - tiempoActual) / (60 * 1000)).toFixed(1);
            return sock.sendMessage(msg.key.remoteJid, { text: `⏳ *Debes esperar ${tiempoRestante} minutos antes de volver a entrenar en el Otro Mundo.*` }, { quoted: msg });
        }

        // 🎖️ **Generar recompensas aleatorias**
        let diamantesGanados = Math.floor(Math.random() * (500 - 1 + 1)) + 1; // 1 a 500
        let xpGanada = Math.floor(Math.random() * (2000 - 500 + 1)) + 500; // 500 a 2000

        // 💰 **Incrementar experiencia y diamantes**
        usuario.diamantes += diamantesGanados;
        personaje.experiencia += xpGanada;

        // ❤️ Reducir vida entre 5 y 20 puntos
        let vidaPerdida = Math.floor(Math.random() * (20 - 5 + 1)) + 5;
        personaje.vida = Math.max(0, personaje.vida - vidaPerdida);

        // 🕒 **Guardar cooldown**
        if (!personaje.cooldowns) personaje.cooldowns = {};
        personaje.cooldowns.otromundo = tiempoActual;

        // 🌌 **Mensajes de recompensa**
        const textos = [
            `🌌 *${personaje.nombre} entrenó con los dioses del Otro Mundo y aumentó su poder.*  
💎 *${diamantesGanados} Diamantes obtenidos*  
✨ *${xpGanada} XP ganados*`,
            `🔥 *Después de un duro entrenamiento en el Más Allá, ${personaje.nombre} regresó más fuerte.*  
💎 *${diamantesGanados} Diamantes obtenidos*  
✨ *${xpGanada} XP ganados*`,
            `👁️‍🗨️ *${personaje.nombre} alcanzó una nueva comprensión del ki mientras entrenaba en el Otro Mundo.*  
💎 *${diamantesGanados} Diamantes obtenidos*  
✨ *${xpGanada} XP ganados*`,
            `⚡ *Con la guía de los maestros celestiales, ${personaje.nombre} aumentó su energía vital.*  
💎 *${diamantesGanados} Diamantes obtenidos*  
✨ *${xpGanada} XP ganados*`,
            `🔮 *${personaje.nombre} perfeccionó su técnica en el Otro Mundo, elevando su poder al máximo.*  
💎 *${diamantesGanados} Diamantes obtenidos*  
✨ *${xpGanada} XP ganados*`,
            `💥 *Después de un entrenamiento extremo en el Otro Mundo, ${personaje.nombre} dominó nuevas habilidades.*  
💎 *${diamantesGanados} Diamantes obtenidos*  
✨ *${xpGanada} XP ganados*`
        ];

        // 📢 **Enviar mensaje con XP y Diamantes**
        await sock.sendMessage(msg.key.remoteJid, { 
            text: textos[Math.floor(Math.random() * textos.length)] 
        }, { quoted: msg });

        // 📊 **Manejar la subida de nivel correctamente**
        let xpMaxNivel = personaje.nivel === 1 ? 1000 : personaje.nivel * 1500;

        while (personaje.experiencia >= xpMaxNivel && personaje.nivel < 70) {
            personaje.experiencia -= xpMaxNivel;
            personaje.nivel += 1;
            xpMaxNivel = personaje.nivel * 1500;
            personaje.xpMax = xpMaxNivel; // Ajustar la XP máxima del nuevo nivel

            // 📊 **Actualizar Rangos**
            const rangosPersonaje = [
                { nivel: 1, rango: "🌟 Principiante" },
                { nivel: 10, rango: "⚔️ Guerrero Espiritual" },
                { nivel: 20, rango: "🔥 Maestro del Más Allá" },
                { nivel: 30, rango: "👑 Dominador de Dimensiones" },
                { nivel: 40, rango: "🌀 Señor del Ki Divino" },
                { nivel: 50, rango: "💀 Rey del Otro Mundo" },
                { nivel: 60, rango: "🚀 Dios de las Dimensiones" },
                { nivel: 70, rango: "🔱 Entidad Suprema" }
            ];
            let rangoAnterior = personaje.rango;
            personaje.rango = rangosPersonaje.reduce((acc, curr) => (personaje.nivel >= curr.nivel ? curr.rango : acc), personaje.rango);

            await sock.sendMessage(msg.key.remoteJid, { 
                text: `🎉 *¡${personaje.nombre} ha subido al nivel ${personaje.nivel}! 🏆*\n🏅 *Nuevo Rango:* ${personaje.rango}`
            }, { quoted: msg });
        }

        // 🌟 **Mejorar habilidades con 30% de probabilidad**
        let habilidades = Object.keys(personaje.habilidades);
        if (habilidades.length > 0 && Math.random() < 0.3) {
            let habilidadSubida = habilidades[Math.floor(Math.random() * habilidades.length)];
            personaje.habilidades[habilidadSubida] += 1;

            await sock.sendMessage(msg.key.remoteJid, { 
                text: `🌟 *¡${personaje.nombre} ha mejorado su habilidad!* 🎯\n🔹 *${habilidadSubida}: Nivel ${personaje.habilidades[habilidadSubida]}*`
            }, { quoted: msg });
        }

        // 📂 Guardar cambios en el archivo
        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

        // ✅ Reacción de confirmación después de ejecutar
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });

    } catch (error) {
        console.error("❌ Error en el comando .otromundo:", error);
        await sock.sendMessage(msg.key.remoteJid, { text: "❌ *Ocurrió un error al entrenar en el Otro Mundo. Inténtalo de nuevo.*" }, { quoted: msg });
    }
    break;
}
        
case 'volar': {
    try {
        const fs = require("fs");
        const rpgFile = "./rpg.json";
        const userId = msg.key.participant || msg.key.remoteJid;
        const cooldownTime = 6 * 60 * 1000; // 6 minutos

        // 🛸 Reacción antes de procesar
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "🛸", key: msg.key } });

        // 📂 Verificar si el archivo existe
        if (!fs.existsSync(rpgFile)) {
            return sock.sendMessage(msg.key.remoteJid, { text: "❌ *Los datos del RPG no están disponibles.*" }, { quoted: msg });
        }

        // 📥 Cargar datos del usuario
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        // ❌ Verificar si el usuario está registrado
        if (!rpgData.usuarios[userId]) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes una cuenta registrada en el gremio Azura Ultra.*\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` 
            }, { quoted: msg });
        }

        let usuario = rpgData.usuarios[userId];

        // ❌ Verificar si el usuario tiene personajes
        if (!usuario.personajes || usuario.personajes.length === 0) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes personajes para entrenar su vuelo.*\n📜 Usa \`${global.prefix}tiendaper\` para comprar uno.` 
            }, { quoted: msg });
        }

        let personaje = usuario.personajes[0]; // Primer personaje como principal

        // 🚑 Verificar si el personaje tiene 0 de vida
        if (personaje.vida <= 0) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `🚑 *¡${personaje.nombre} no puede entrenar vuelo, está sin vida!*\n📜 Usa \`${global.prefix}bolasdeldragon\` para curarlo.` 
            }, { quoted: msg });
        }

        // 🕒 Verificar cooldown
        let tiempoActual = Date.now();
        if (personaje.cooldowns?.volar && tiempoActual - personaje.cooldowns.volar < cooldownTime) {
            let tiempoRestante = ((personaje.cooldowns.volar + cooldownTime - tiempoActual) / (60 * 1000)).toFixed(1);
            return sock.sendMessage(msg.key.remoteJid, { text: `⏳ *Debes esperar ${tiempoRestante} minutos antes de volver a entrenar el vuelo de tu personaje.*` }, { quoted: msg });
        }

        // 🎖️ **Generar recompensas aleatorias**
        let diamantesGanados = Math.floor(Math.random() * (500 - 1 + 1)) + 1; // 1 a 500
        let xpGanada = Math.floor(Math.random() * (3000 - 300 + 1)) + 300; // 300 a 3000

        // 💰 **Incrementar experiencia y diamantes**
        usuario.diamantes += diamantesGanados;
        personaje.experiencia += xpGanada;

        // ❤️ Reducir vida entre 5 y 20 puntos
        let vidaPerdida = Math.floor(Math.random() * (20 - 5 + 1)) + 5;
        personaje.vida = Math.max(0, personaje.vida - vidaPerdida);

        // 🕒 **Guardar cooldown**
        if (!personaje.cooldowns) personaje.cooldowns = {};
        personaje.cooldowns.volar = tiempoActual;

        // ✈️ **Mensajes de recompensa**
        const textos = [
            `🛸 *${personaje.nombre} entrenó su vuelo y ahora puede moverse más rápido.*  
💎 *${diamantesGanados} Diamantes obtenidos*  
✨ *${xpGanada} XP ganados*`,
            `🌬️ *${personaje.nombre} logró perfeccionar el control de su energía en el aire.*  
💎 *${diamantesGanados} Diamantes obtenidos*  
✨ *${xpGanada} XP ganados*`,
            `🔥 *Con una increíble explosión de poder, ${personaje.nombre} alcanzó una gran velocidad en el aire.*  
💎 *${diamantesGanados} Diamantes obtenidos*  
✨ *${xpGanada} XP ganados*`,
            `🌀 *${personaje.nombre} realizó maniobras aéreas impresionantes, mejorando su control de vuelo.*  
💎 *${diamantesGanados} Diamantes obtenidos*  
✨ *${xpGanada} XP ganados*`,
            `💨 *Después de un duro entrenamiento, ${personaje.nombre} ahora vuela sin esfuerzo.*  
💎 *${diamantesGanados} Diamantes obtenidos*  
✨ *${xpGanada} XP ganados*`,
            `⚡ *${personaje.nombre} alcanzó una nueva fase de vuelo, pudiendo moverse a la velocidad de la luz.*  
💎 *${diamantesGanados} Diamantes obtenidos*  
✨ *${xpGanada} XP ganados*`
        ];

        // 📢 **Enviar mensaje con XP y Diamantes**
        await sock.sendMessage(msg.key.remoteJid, { 
            text: textos[Math.floor(Math.random() * textos.length)] 
        }, { quoted: msg });

        // 📊 **Manejar la subida de nivel correctamente**
        let xpMaxNivel = personaje.nivel === 1 ? 1000 : personaje.nivel * 1500;

        while (personaje.experiencia >= xpMaxNivel && personaje.nivel < 70) {
            personaje.experiencia -= xpMaxNivel;
            personaje.nivel += 1;
            xpMaxNivel = personaje.nivel * 1500;
            personaje.xpMax = xpMaxNivel; // Ajustar la XP máxima del nuevo nivel

            // 📊 **Actualizar Rangos**
            const rangosPersonaje = [
                { nivel: 1, rango: "🌟 Principiante" },
                { nivel: 10, rango: "⚔️ Guerrero del Cielo" },
                { nivel: 20, rango: "🔥 Maestro Aéreo" },
                { nivel: 30, rango: "👑 Dominador del Vuelo" },
                { nivel: 40, rango: "🌀 Señor del Viento" },
                { nivel: 50, rango: "💀 Espíritu Celestial" },
                { nivel: 60, rango: "🚀 Viajero Dimensional" },
                { nivel: 70, rango: "🔱 Dios del Vuelo" }
            ];
            let rangoAnterior = personaje.rango;
            personaje.rango = rangosPersonaje.reduce((acc, curr) => (personaje.nivel >= curr.nivel ? curr.rango : acc), personaje.rango);

            await sock.sendMessage(msg.key.remoteJid, { 
                text: `🎉 *¡${personaje.nombre} ha subido al nivel ${personaje.nivel}! 🏆*\n🏅 *Nuevo Rango:* ${personaje.rango}`
            }, { quoted: msg });
        }

        // 🌟 **Mejorar habilidades con 30% de probabilidad**
        let habilidades = Object.keys(personaje.habilidades);
        if (habilidades.length > 0 && Math.random() < 0.3) {
            let habilidadSubida = habilidades[Math.floor(Math.random() * habilidades.length)];
            personaje.habilidades[habilidadSubida] += 1;

            await sock.sendMessage(msg.key.remoteJid, { 
                text: `🌟 *¡${personaje.nombre} ha mejorado su habilidad!* 🎯\n🔹 *${habilidadSubida}: Nivel ${personaje.habilidades[habilidadSubida]}*`
            }, { quoted: msg });
        }

        // 📂 Guardar cambios en el archivo
        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

        // ✅ Reacción de confirmación después de ejecutar
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });

    } catch (error) {
        console.error("❌ Error en el comando .volar:", error);
        await sock.sendMessage(msg.key.remoteJid, { text: "❌ *Ocurrió un error al entrenar el vuelo. Inténtalo de nuevo.*" }, { quoted: msg });
    }
    break;
}
        
case 'poder': {
    try {
        const fs = require("fs");
        const rpgFile = "./rpg.json";
        const userId = msg.key.participant || msg.key.remoteJid;
        const cooldownTime = 6 * 60 * 1000; // 6 minutos

        // ⚡ Reacción antes de procesar
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "⚡", key: msg.key } });

        // 📂 Verificar si el archivo existe
        if (!fs.existsSync(rpgFile)) {
            return sock.sendMessage(msg.key.remoteJid, { text: "❌ *Los datos del RPG no están disponibles.*" }, { quoted: msg });
        }

        // 📥 Cargar datos del usuario
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        // ❌ Verificar si el usuario está registrado
        if (!rpgData.usuarios[userId]) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes una cuenta registrada en el gremio Azura Ultra.*\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` 
            }, { quoted: msg });
        }

        let usuario = rpgData.usuarios[userId];

        // ❌ Verificar si el usuario tiene personajes
        if (!usuario.personajes || usuario.personajes.length === 0) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes personajes para entrenar su poder.*\n📜 Usa \`${global.prefix}tiendaper\` para comprar uno.` 
            }, { quoted: msg });
        }

        let personaje = usuario.personajes[0]; // Primer personaje como principal

        // 🚑 Verificar si el personaje tiene 0 de vida
        if (personaje.vida <= 0) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `🚑 *¡${personaje.nombre} no puede entrenar su poder, está sin vida!*\n📜 Usa \`${global.prefix}bolasdeldragon\` para curarlo.` 
            }, { quoted: msg });
        }

        // 🕒 Verificar cooldown
        let tiempoActual = Date.now();
        if (personaje.cooldowns?.poder && tiempoActual - personaje.cooldowns.poder < cooldownTime) {
            let tiempoRestante = ((personaje.cooldowns.poder + cooldownTime - tiempoActual) / (60 * 1000)).toFixed(1);
            return sock.sendMessage(msg.key.remoteJid, { text: `⏳ *Debes esperar ${tiempoRestante} minutos antes de volver a entrenar el poder de tu personaje.*` }, { quoted: msg });
        }

        // 🎖️ **Generar recompensas aleatorias**
        let diamantesGanados = Math.floor(Math.random() * (800 - 1 + 1)) + 1; // 1 a 800
        let xpGanada = Math.floor(Math.random() * (2500 - 300 + 1)) + 300; // 300 a 2500

        // 💰 **Incrementar experiencia y diamantes**
        usuario.diamantes += diamantesGanados;
        personaje.experiencia += xpGanada;

        // ❤️ Reducir vida entre 5 y 25 puntos
        let vidaPerdida = Math.floor(Math.random() * (25 - 5 + 1)) + 5;
        personaje.vida = Math.max(0, personaje.vida - vidaPerdida);

        // 🕒 **Guardar cooldown**
        if (!personaje.cooldowns) personaje.cooldowns = {};
        personaje.cooldowns.poder = tiempoActual;

        // ⚡ **Mensajes de recompensa**
        const textos = [
            `⚡ *${personaje.nombre} entrenó su poder y se siente más fuerte.*  
💎 *${diamantesGanados} Diamantes obtenidos*  
✨ *${xpGanada} XP ganados*`,
            `🔥 *${personaje.nombre} aumentó su ki y ahora su aura brilla intensamente.*  
💎 *${diamantesGanados} Diamantes obtenidos*  
✨ *${xpGanada} XP ganados*`,
            `💥 *${personaje.nombre} liberó una explosión de energía impresionante.*  
💎 *${diamantesGanados} Diamantes obtenidos*  
✨ *${xpGanada} XP ganados*`,
            `🌀 *${personaje.nombre} logró concentrar su poder y alcanzó un nuevo nivel de energía.*  
💎 *${diamantesGanados} Diamantes obtenidos*  
✨ *${xpGanada} XP ganados*`,
            `🔮 *${personaje.nombre} entrenó con un maestro legendario y su poder se elevó.*  
💎 *${diamantesGanados} Diamantes obtenidos*  
✨ *${xpGanada} XP ganados*`,
            `⚔️ *${personaje.nombre} dominó una nueva técnica de combate.*  
💎 *${diamantesGanados} Diamantes obtenidos*  
✨ *${xpGanada} XP ganados*`
        ];

        // 📢 **Enviar mensaje con XP y Diamantes**
        await sock.sendMessage(msg.key.remoteJid, { 
            text: textos[Math.floor(Math.random() * textos.length)] 
        }, { quoted: msg });

        // 📊 **Manejar la subida de nivel correctamente**
        let xpMaxNivel = personaje.nivel === 1 ? 1000 : personaje.nivel * 1500;

        while (personaje.experiencia >= xpMaxNivel && personaje.nivel < 70) {
            personaje.experiencia -= xpMaxNivel;
            personaje.nivel += 1;
            xpMaxNivel = personaje.nivel * 1500;
            personaje.xpMax = xpMaxNivel; // Ajustar la XP máxima del nuevo nivel

            // 📊 **Actualizar Rangos**
            const rangosPersonaje = [
                { nivel: 1, rango: "🌟 Principiante" },
                { nivel: 10, rango: "⚔️ Guerrero" },
                { nivel: 20, rango: "🔥 Maestro de Batalla" },
                { nivel: 30, rango: "👑 Líder Supremo" },
                { nivel: 40, rango: "🌀 Legendario" },
                { nivel: 50, rango: "💀 Dios de la Guerra" },
                { nivel: 60, rango: "🚀 Titán de la Arena" },
                { nivel: 70, rango: "🔱 Inmortal" }
            ];
            let rangoAnterior = personaje.rango;
            personaje.rango = rangosPersonaje.reduce((acc, curr) => (personaje.nivel >= curr.nivel ? curr.rango : acc), personaje.rango);

            await sock.sendMessage(msg.key.remoteJid, { 
                text: `🎉 *¡${personaje.nombre} ha subido al nivel ${personaje.nivel}! 🏆*\n🏅 *Nuevo Rango:* ${personaje.rango}`
            }, { quoted: msg });
        }

        // 🌟 **Mejorar habilidades con 30% de probabilidad**
        let habilidades = Object.keys(personaje.habilidades);
        if (habilidades.length > 0 && Math.random() < 0.3) {
            let habilidadSubida = habilidades[Math.floor(Math.random() * habilidades.length)];
            personaje.habilidades[habilidadSubida] += 1;

            await sock.sendMessage(msg.key.remoteJid, { 
                text: `🌟 *¡${personaje.nombre} ha mejorado su habilidad!* 🎯\n🔹 *${habilidadSubida}: Nivel ${personaje.habilidades[habilidadSubida]}*`
            }, { quoted: msg });
        }

        // 📂 Guardar cambios en el archivo
        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

        // ✅ Reacción de confirmación después de ejecutar
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });

    } catch (error) {
        console.error("❌ Error en el comando .poder:", error);
        await sock.sendMessage(msg.key.remoteJid, { text: "❌ *Ocurrió un error al entrenar el poder. Inténtalo de nuevo.*" }, { quoted: msg });
    }
    break;
}

case 'luchar': {
    try {
        const fs = require("fs");
        const rpgFile = "./rpg.json";
        const userId = msg.key.participant || msg.key.remoteJid;
        const cooldownTime = 5 * 60 * 1000; // 5 minutos

        // ⚔️ Reacción antes de procesar
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "⚔️", key: msg.key } });

        // 📂 Verificar si el archivo existe
        if (!fs.existsSync(rpgFile)) {
            return sock.sendMessage(msg.key.remoteJid, { text: "❌ *Los datos del RPG no están disponibles.*" }, { quoted: msg });
        }

        // 📥 Cargar datos del usuario
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        // ❌ Verificar si el usuario está registrado
        if (!rpgData.usuarios[userId]) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes una cuenta registrada en el gremio Azura Ultra.*\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` 
            }, { quoted: msg });
        }

        let usuario = rpgData.usuarios[userId];

        // ❌ Verificar si el usuario tiene personajes
        if (!usuario.personajes || usuario.personajes.length === 0) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes personajes para luchar.*\n📜 Usa \`${global.prefix}tiendaper\` para comprar uno.` 
            }, { quoted: msg });
        }

        let personaje = usuario.personajes[0]; // Primer personaje como principal

        // 🚑 Verificar si el personaje tiene 0 de vida
        if (personaje.vida <= 0) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `🚑 *¡No puedes luchar!*\n\n🔴 *${personaje.nombre} tiene 0 de vida.*\n📜 Usa \`${global.prefix}bolasdeldragon\` para curarlo.` 
            }, { quoted: msg });
        }

        // 🕒 Verificar cooldown
        let tiempoActual = Date.now();
        if (personaje.cooldowns?.luchar && tiempoActual - personaje.cooldowns.luchar < cooldownTime) {
            let tiempoRestante = ((personaje.cooldowns.luchar + cooldownTime - tiempoActual) / (60 * 1000)).toFixed(1);
            return sock.sendMessage(msg.key.remoteJid, { text: `⏳ *Debes esperar ${tiempoRestante} minutos antes de volver a luchar.*` }, { quoted: msg });
        }

        // 🎖️ **Generar recompensas aleatorias**
        let diamantesGanados = Math.floor(Math.random() * (500 - 1 + 1)) + 1;
        let xpGanada = Math.floor(Math.random() * (2000 - 500 + 1)) + 500;

        // 💰 **Incrementar experiencia y diamantes**
        usuario.diamantes += diamantesGanados;
        personaje.experiencia += xpGanada;

        // ❤️ Reducir vida entre 5 y 20 puntos
        let vidaPerdida = Math.floor(Math.random() * (20 - 5 + 1)) + 5;
        personaje.vida = Math.max(0, personaje.vida - vidaPerdida);

        // 🕒 **Guardar cooldown**
        if (!personaje.cooldowns) personaje.cooldowns = {};
        personaje.cooldowns.luchar = tiempoActual;

        // ⚔️ **Mensajes de recompensa**
        const textos = [
            `⚔️ *${personaje.nombre} peleó y ganó experiencia.*  
💎 *${diamantesGanados} Diamantes obtenidos*  
✨ *${xpGanada} XP ganados*`,
            `🔥 *${personaje.nombre} venció a un enemigo y se hizo más fuerte.*  
💎 *${diamantesGanados} Diamantes obtenidos*  
✨ *${xpGanada} XP ganados*`,
            `🛡️ *${personaje.nombre} se defendió con éxito en la batalla.*  
💎 *${diamantesGanados} Diamantes obtenidos*  
✨ *${xpGanada} XP ganados*`,
            `⚡ *${personaje.nombre} aprendió nuevas técnicas en el combate.*  
💎 *${diamantesGanados} Diamantes obtenidos*  
✨ *${xpGanada} XP ganados*`
        ];

        // 📢 **Enviar mensaje con XP y Diamantes**
        await sock.sendMessage(msg.key.remoteJid, { 
            text: textos[Math.floor(Math.random() * textos.length)] 
        }, { quoted: msg });

        // 📊 **Manejar la subida de nivel correctamente**
        let xpMaxNivel = personaje.nivel === 1 ? 1000 : personaje.nivel * 1500;

        while (personaje.experiencia >= xpMaxNivel && personaje.nivel < 70) {
            personaje.experiencia -= xpMaxNivel;
            personaje.nivel += 1;
            xpMaxNivel = personaje.nivel * 1500;
            personaje.xpMax = xpMaxNivel; // Ajustar la XP máxima del nuevo nivel

            // 📊 **Actualizar Rangos**
            const rangosPersonaje = [
                { nivel: 1, rango: "🌟 Principiante" },
                { nivel: 10, rango: "⚔️ Guerrero" },
                { nivel: 20, rango: "🔥 Maestro de Batalla" },
                { nivel: 30, rango: "👑 Líder Supremo" },
                { nivel: 40, rango: "🌀 Legendario" },
                { nivel: 50, rango: "💀 Dios de la Guerra" },
                { nivel: 60, rango: "🚀 Titán de la Arena" },
                { nivel: 70, rango: "🔱 Inmortal" }
            ];
            let rangoAnterior = personaje.rango;
            personaje.rango = rangosPersonaje.reduce((acc, curr) => (personaje.nivel >= curr.nivel ? curr.rango : acc), personaje.rango);

            await sock.sendMessage(msg.key.remoteJid, { 
                text: `🎉 *¡${personaje.nombre} ha subido al nivel ${personaje.nivel}! 🏆*\n🏅 *Nuevo Rango:* ${personaje.rango}`
            }, { quoted: msg });
        }

        // 🌟 **Mejorar habilidades con 30% de probabilidad**
        let habilidades = Object.keys(personaje.habilidades);
        if (habilidades.length > 0 && Math.random() < 0.3) {
            let habilidadSubida = habilidades[Math.floor(Math.random() * habilidades.length)];
            personaje.habilidades[habilidadSubida] += 1;

            await sock.sendMessage(msg.key.remoteJid, { 
                text: `🌟 *¡${personaje.nombre} ha mejorado su habilidad!* 🎯\n🔹 *${habilidadSubida}: Nivel ${personaje.habilidades[habilidadSubida]}*`
            }, { quoted: msg });
        }

        // 📂 Guardar cambios en el archivo
        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

        // ✅ Reacción de confirmación después de ejecutar
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });

    } catch (error) {
        console.error("❌ Error en el comando .luchar:", error);
        await sock.sendMessage(msg.key.remoteJid, { text: "❌ *Ocurrió un error al luchar. Inténtalo de nuevo.*" }, { quoted: msg });
    }
    break;
}
            
        
case 'bolasdeldragon': {
    try {
        const fs = require("fs");
        const rpgFile = "./rpg.json";
        const userId = msg.key.participant || msg.key.remoteJid;
        const costoCuracion = 500; // 💎 Costo de curación en diamantes

        // 🐉 Reacción antes de procesar
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "🐉", key: msg.key } });

        // 📂 Verificar si el archivo existe
        if (!fs.existsSync(rpgFile)) {
            return sock.sendMessage(msg.key.remoteJid, { text: "❌ *Los datos del RPG no están disponibles.*" }, { quoted: msg });
        }

        // 📥 Cargar datos del usuario
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        // ❌ Verificar si el usuario está registrado
        if (!rpgData.usuarios[userId]) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes una cuenta registrada en el gremio Azura Ultra.*\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` 
            }, { quoted: msg });
        }

        let usuario = rpgData.usuarios[userId];

        // ❌ Verificar si el usuario tiene personajes
        if (!usuario.personajes || usuario.personajes.length === 0) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes personajes para curar.*\n📜 Usa \`${global.prefix}tiendaper\` para comprar uno.` 
            }, { quoted: msg });
        }

        let personaje = usuario.personajes[0]; // Se cura el primer personaje de la lista

        // 💎 Verificar si el usuario tiene suficientes diamantes
        if (usuario.diamantes < costoCuracion) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes suficientes diamantes para curar a tu personaje.*\n💎 *Costo de curación:* ${costoCuracion} Diamantes\n💰 *Diamantes disponibles:* ${usuario.diamantes}`
            }, { quoted: msg });
        }

        // 🚑 Verificar si el personaje ya tiene vida completa
        if (personaje.vida === 100) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `⚠️ *${personaje.nombre} ya tiene la vida al máximo.*` 
            }, { quoted: msg });
        }

        // 💖 Restaurar la vida del personaje
        personaje.vida = 100; // Se establece en 100 de vida

        // 💎 Restar diamantes
        usuario.diamantes -= costoCuracion;

        // 🐉 **Textos aleatorios al usar la curación**
        const textos = [
            `🐉 *Las Bolas del Dragón fueron invocadas y ${personaje.nombre} ha sido completamente curado.*  
❤️ *Vida restaurada al 100%*  
💎 *-${costoCuracion} Diamantes*`,
            `🌟 *Un resplandor dorado envolvió a ${personaje.nombre}, restaurando toda su energía.*  
❤️ *Vida restaurada al 100%*  
💎 *-${costoCuracion} Diamantes*`,
            `🔥 *El poder del Dragón Sagrado sanó todas las heridas de ${personaje.nombre}.*  
❤️ *Vida restaurada al 100%*  
💎 *-${costoCuracion} Diamantes*`,
            `✨ *Las esferas mágicas liberaron su poder y ${personaje.nombre} volvió a estar en plena forma.*  
❤️ *Vida restaurada al 100%*  
💎 *-${costoCuracion} Diamantes*`,
            `🌿 *${personaje.nombre} bebió el elixir de la inmortalidad y recuperó toda su fuerza.*  
❤️ *Vida restaurada al 100%*  
💎 *-${costoCuracion} Diamantes*`,
            `⚡ *La energía celestial fluyó a través de ${personaje.nombre}, devolviéndole la vitalidad.*  
❤️ *Vida restaurada al 100%*  
💎 *-${costoCuracion} Diamantes*`
        ];

        // 📢 **Enviar mensaje de curación**
        await sock.sendMessage(msg.key.remoteJid, { text: textos[Math.floor(Math.random() * textos.length)] }, { quoted: msg });

        // 📊 **Verificar si el personaje sube de nivel**
        let xpMaxNivel = personaje.nivel * 1500;
        while (personaje.experiencia >= xpMaxNivel && personaje.nivel < 70) {
            personaje.experiencia -= xpMaxNivel;
            personaje.nivel += 1;
            xpMaxNivel = personaje.nivel * 1500;

            // 🎖️ **Actualizar Rangos (Hasta nivel 70)**
            const rangos = [
                { nivel: 1, rango: "🌟 Principiante" },
                { nivel: 5, rango: "⚔️ Guerrero" },
                { nivel: 10, rango: "🔥 Maestro" },
                { nivel: 20, rango: "🏆 Leyenda" },
                { nivel: 30, rango: "👑 Rey Supremo" },
                { nivel: 40, rango: "🚀 Dios de la Guerra" },
                { nivel: 50, rango: "💀 Deidad de la Batalla" },
                { nivel: 60, rango: "🌌 Titán del Universo" },
                { nivel: 70, rango: "🐉 Mítico Inmortal" }
            ];
            let rangoAnterior = personaje.rango;
            personaje.rango = rangos.reduce((acc, curr) => (personaje.nivel >= curr.nivel ? curr.rango : acc), personaje.rango);

            // 📢 **Notificar subida de nivel y cambio de rango**
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `🎉 *¡${personaje.nombre} ha subido al nivel ${personaje.nivel}! 🏆*\n🏅 *Nuevo Rango:* ${personaje.rango}`
            }, { quoted: msg });
        }

        // 📂 Guardar cambios en el archivo
        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

        // ✅ Reacción de confirmación después de ejecutar
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });

    } catch (error) {
        console.error("❌ Error en el comando .bolasdeldragon:", error);
        await sock.sendMessage(msg.key.remoteJid, { text: "❌ *Ocurrió un error al usar las Bolas del Dragón. Inténtalo de nuevo.*" }, { quoted: msg });
    }
    break;
}
        
case 'curar': {
    try {
        const fs = require("fs");
        const rpgFile = "./rpg.json";
        const userId = msg.key.participant || msg.key.remoteJid;
        const costoCuracion = 500; // 💎 Costo de la curación

        // 🏥 Reacción antes de procesar
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "❤️", key: msg.key } });

        // 📂 Verificar si el archivo existe
        if (!fs.existsSync(rpgFile)) {
            return sock.sendMessage(msg.key.remoteJid, { text: "❌ *Los datos del RPG no están disponibles.*" }, { quoted: msg });
        }

        // 📥 Cargar datos del usuario
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        // ❌ Verificar si el usuario está registrado
        if (!rpgData.usuarios[userId]) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes una cuenta registrada en el gremio Azura Ultra.*\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` 
            }, { quoted: msg });
        }

        let usuario = rpgData.usuarios[userId];

        // ❌ Verificar si el usuario tiene mascota
        if (!usuario.mascotas || usuario.mascotas.length === 0) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes ninguna mascota.*\n📜 Usa \`${global.prefix}tiendamascotas\` para comprar una.` 
            }, { quoted: msg });
        }

        let mascota = usuario.mascotas[0]; // Se asume que la primera mascota es la principal

        // 🏥 Verificar si la mascota ya tiene vida completa
        if (mascota.vida >= 100) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `✅ *${mascota.nombre} ya tiene su vida completa.* No es necesario curarla.` 
            }, { quoted: msg });
        }

        // 💎 Verificar si el usuario tiene suficientes diamantes
        if (usuario.diamantes < costoCuracion) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes suficientes diamantes para curar a tu mascota.*\n💎 *Necesitas ${costoCuracion} diamantes.*` 
            }, { quoted: msg });
        }

        // 💖 Restaurar la vida de la mascota y descontar diamantes
        usuario.diamantes -= costoCuracion;
        mascota.vida = 100;

        // 🏥 Mensaje de confirmación
        await sock.sendMessage(msg.key.remoteJid, { 
            text: `❤️ *¡Has curado a ${mascota.nombre} exitosamente!* 🏥\n\n💎 *Costo:* ${costoCuracion} diamantes\n❤️ *Vida restaurada a:* 100 HP\n\n¡Ahora ${mascota.nombre} está lista para más aventuras! 🐾` 
        }, { quoted: msg });

        // 📂 Guardar cambios en el archivo
        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

    } catch (error) {
        console.error("❌ Error en el comando .curar:", error);
        await sock.sendMessage(msg.key.remoteJid, { text: "❌ *Ocurrió un error al curar a tu mascota. Inténtalo de nuevo.*" }, { quoted: msg });
    }
    break;
}
        
case 'supermascota': {
    try {
        const fs = require("fs");
        const rpgFile = "./rpg.json";
        const userId = msg.key.participant || msg.key.remoteJid;
        const cooldownTime = 24 * 60 * 60 * 1000; // 24 horas de espera

        // 🚀 Reacción antes de procesar
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "🚀", key: msg.key } });

        // 📂 Verificar si el archivo existe
        if (!fs.existsSync(rpgFile)) {
            return sock.sendMessage(msg.key.remoteJid, { text: "❌ *Los datos del RPG no están disponibles.*" }, { quoted: msg });
        }

        // 📥 Cargar datos del usuario
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        // ❌ Verificar si el usuario está registrado
        if (!rpgData.usuarios[userId]) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes una cuenta registrada en el gremio Azura Ultra.*\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` 
            }, { quoted: msg });
        }

        let usuario = rpgData.usuarios[userId];

        // ❌ Verificar si el usuario tiene mascota
        if (!usuario.mascotas || usuario.mascotas.length === 0) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes ninguna mascota.*\n📜 Usa \`${global.prefix}tiendamascotas\` para comprar una.` 
            }, { quoted: msg });
        }

        let mascota = usuario.mascotas[0]; // Se asume que la primera mascota es la principal

        // 🚑 Verificar si la mascota tiene 0 de vida
        if (mascota.vida <= 0) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `🚑 *¡No puedes usar este comando!*\n\n🔴 *${mascota.nombre} tiene 0 de vida.*\n📜 Usa \`${global.prefix}curar\` para recuperarla.` 
            }, { quoted: msg });
        }

        // 🕒 Verificar cooldown
        let tiempoActual = Date.now();
        if (mascota.cooldowns?.supermascota && tiempoActual - mascota.cooldowns.supermascota < cooldownTime) {
            let tiempoRestante = ((mascota.cooldowns.supermascota + cooldownTime - tiempoActual) / (60 * 60 * 1000)).toFixed(1);
            return sock.sendMessage(msg.key.remoteJid, { text: `⏳ *Debes esperar ${tiempoRestante} horas antes de volver a usar este comando.*` }, { quoted: msg });
        }

        // 🎖️ **Generar recompensas aleatorias**
        let diamantesGanados = Math.floor(Math.random() * (5000 - 800 + 1)) + 800; // Entre 800 y 5000
        let xpGanada = Math.floor(Math.random() * (8000 - 1000 + 1)) + 1000; // Entre 1000 y 8000

        // 💰 **Incrementar experiencia y diamantes**
        usuario.diamantes += diamantesGanados;
        mascota.experiencia += xpGanada;

        // ❤️ Reducir vida aleatoriamente entre 5 y 20 puntos
        let vidaPerdida = Math.floor(Math.random() * (20 - 5 + 1)) + 5;
        mascota.vida = Math.max(0, mascota.vida - vidaPerdida);

        // 🕒 **Guardar cooldown**
        if (!mascota.cooldowns) mascota.cooldowns = {};
        mascota.cooldowns.supermascota = tiempoActual;

        // 🌟 **Textos aleatorios personalizados con recompensas**
        const textos = [
            `🚀 *${mascota.nombre} demostró su máximo poder y dejó a todos sorprendidos.*\n💎 *${diamantesGanados} Diamantes ganados*\n✨ *${xpGanada} XP obtenidos*`,
            `🔥 *Después de un entrenamiento extremo, ${mascota.nombre} ha alcanzado un nuevo nivel de fuerza.*\n💎 *${diamantesGanados} Diamantes ganados*\n✨ *${xpGanada} XP obtenidos*`,
            `👑 *¡Todos han reconocido a ${mascota.nombre} como una supermascota legendaria!* \n💎 *${diamantesGanados} Diamantes ganados*\n✨ *${xpGanada} XP obtenidos*`,
            `✨ *El aura de ${mascota.nombre} brilla con intensidad, demostrando su poder absoluto.*\n💎 *${diamantesGanados} Diamantes ganados*\n✨ *${xpGanada} XP obtenidos*`,
            `💥 *La fuerza de ${mascota.nombre} ha superado todos los límites conocidos.*\n💎 *${diamantesGanados} Diamantes ganados*\n✨ *${xpGanada} XP obtenidos*`,
            `🎖️ *La evolución de ${mascota.nombre} es impresionante, alcanzando un nivel sobrehumano.*\n💎 *${diamantesGanados} Diamantes ganados*\n✨ *${xpGanada} XP obtenidos*`
        ];

        // 📢 **Enviar mensaje con XP y Diamantes**
        await sock.sendMessage(msg.key.remoteJid, { 
            text: textos[Math.floor(Math.random() * textos.length)] 
        }, { quoted: msg });

        // 📊 **Notificación de subida de nivel**
        let xpMaxActual = mascota.nivel === 1 ? 500 : mascota.nivel * 1200;
        while (mascota.experiencia >= xpMaxActual && mascota.nivel < 80) {
            mascota.experiencia -= xpMaxActual;
            mascota.nivel += 1;
            xpMaxActual = mascota.nivel * 1200;
            mascota.xpMax = xpMaxActual;

            await sock.sendMessage(msg.key.remoteJid, { 
                text: `🎉 *¡Felicidades! Tu mascota ${mascota.nombre} ha subido de nivel.* 🏆\n🐾 *Nuevo Nivel:* ${mascota.nivel}\n✨ *Experiencia:* ${mascota.experiencia} / ${xpMaxActual} XP`
            }, { quoted: msg });
        }

        // 🌟 **Incrementar niveles aleatorios en habilidades con 30% de probabilidad**
        let habilidades = Object.keys(mascota.habilidades);
        if (habilidades.length > 0) {
            let habilidadSubida = habilidades[Math.floor(Math.random() * habilidades.length)];
            if (Math.random() < 0.3) { // 30% de probabilidad de mejorar una habilidad
                mascota.habilidades[habilidadSubida].nivel += 1;

                await sock.sendMessage(msg.key.remoteJid, { 
                    text: `🌟 *¡${mascota.nombre} ha mejorado su habilidad!* 🎯\n🔹 *${habilidadSubida}: Nivel ${mascota.habilidades[habilidadSubida].nivel}*`
                }, { quoted: msg });
            }
        }

        // 📊 **Actualizar y manejar Rangos**
        const rangosMascota = [
            { nivel: 1, rango: "🐣 Principiante" },
            { nivel: 10, rango: "🐾 Aprendiz" },
            { nivel: 20, rango: "🦴 Experto" },
            { nivel: 30, rango: "🛡️ Guardián" },
            { nivel: 40, rango: "🐺 Alfa" },
            { nivel: 50, rango: "🏆 Leyenda" },
            { nivel: 60, rango: "🔥 Divino" },
            { nivel: 70, rango: "🐉 Mítico" },
            { nivel: 80, rango: "🚀 Titán Supremo" }
        ];
        let rangoAnterior = mascota.rango;
        mascota.rango = rangosMascota.reduce((acc, curr) => (mascota.nivel >= curr.nivel ? curr.rango : acc), mascota.rango);

        if (mascota.rango !== rangoAnterior) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `🎖️ *¡Tu mascota ${mascota.nombre} ha subido de rango a ${mascota.rango}!* 🚀`
            }, { quoted: msg });
        }

        // 📂 Guardar cambios
        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

    } catch (error) {
        console.error("❌ Error en el comando .supermascota:", error);
    }
    break;
}
        
case 'presumir': {
    try {
        const fs = require("fs");
        const rpgFile = "./rpg.json";
        const userId = msg.key.participant || msg.key.remoteJid;
        const cooldownTime = 10 * 60 * 1000; // 10 minutos de espera

        // 🌟 Reacción antes de procesar
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "🌟", key: msg.key } });

        // 📂 Verificar si el archivo existe
        if (!fs.existsSync(rpgFile)) {
            return sock.sendMessage(msg.key.remoteJid, { text: "❌ *Los datos del RPG no están disponibles.*" }, { quoted: msg });
        }

        // 📥 Cargar datos del usuario
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        // ❌ Verificar si el usuario está registrado
        if (!rpgData.usuarios[userId]) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes una cuenta registrada en el gremio Azura Ultra.*\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` 
            }, { quoted: msg });
        }

        let usuario = rpgData.usuarios[userId];

        // ❌ Verificar si el usuario tiene mascota
        if (!usuario.mascotas || usuario.mascotas.length === 0) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes ninguna mascota.*\n📜 Usa \`${global.prefix}tiendamascotas\` para comprar una.` 
            }, { quoted: msg });
        }

        let mascota = usuario.mascotas[0]; // Se asume que la primera mascota es la principal

        // 🚑 Verificar si la mascota tiene 0 de vida
        if (mascota.vida <= 0) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `🚑 *¡No puedes presumir a tu mascota!*\n\n🔴 *${mascota.nombre} tiene 0 de vida.*\n📜 Usa \`${global.prefix}curar\` para recuperarla.` 
            }, { quoted: msg });
        }

        // 🕒 Verificar cooldown
        let tiempoActual = Date.now();
        if (mascota.cooldowns?.presumir && tiempoActual - mascota.cooldowns.presumir < cooldownTime) {
            let tiempoRestante = ((mascota.cooldowns.presumir + cooldownTime - tiempoActual) / (60 * 1000)).toFixed(1);
            return sock.sendMessage(msg.key.remoteJid, { text: `⏳ *Debes esperar ${tiempoRestante} minutos antes de volver a presumir a tu mascota.*` }, { quoted: msg });
        }

        // 🎖️ **Generar recompensas aleatorias**
        let diamantesGanados = Math.floor(Math.random() * (500 - 50 + 1)) + 50; // Entre 50 y 500
        let xpGanada = Math.floor(Math.random() * (2800 - 500 + 1)) + 500; // Entre 500 y 2800

        // 💰 **Incrementar experiencia y diamantes**
        usuario.diamantes += diamantesGanados;
        mascota.experiencia += xpGanada;

        // ❤️ Reducir vida aleatoriamente entre 5 y 20 puntos
        let vidaPerdida = Math.floor(Math.random() * (20 - 5 + 1)) + 5;
        mascota.vida = Math.max(0, mascota.vida - vidaPerdida);

        // 🕒 **Guardar cooldown**
        if (!mascota.cooldowns) mascota.cooldowns = {};
        mascota.cooldowns.presumir = tiempoActual;

        // 🌟 **Textos aleatorios personalizados con recompensas**
        const textos = [
            `🌟 *${mascota.nombre} deslumbró a todos con su presencia.*\n💎 *${diamantesGanados} Diamantes ganados*\n✨ *${xpGanada} XP obtenidos*`,
            `💎 *La gente quedó impresionada con ${mascota.nombre}, ¡qué orgullo!* \n💎 *${diamantesGanados} Diamantes ganados*\n✨ *${xpGanada} XP obtenidos*`,
            `👑 *${mascota.nombre} se robó todas las miradas, ¡una verdadera estrella!* \n💎 *${diamantesGanados} Diamantes ganados*\n✨ *${xpGanada} XP obtenidos*`,
            `🔥 *Al presumir a ${mascota.nombre}, todos quedaron asombrados.*\n💎 *${diamantesGanados} Diamantes ganados*\n✨ *${xpGanada} XP obtenidos*`,
            `📸 *${mascota.nombre} posó como todo un profesional y fue el centro de atención.*\n💎 *${diamantesGanados} Diamantes ganados*\n✨ *${xpGanada} XP obtenidos*`,
            `✨ *Después de presumir a ${mascota.nombre}, todos quieren una igual.*\n💎 *${diamantesGanados} Diamantes ganados*\n✨ *${xpGanada} XP obtenidos*`
        ];

        // 📢 **Enviar mensaje con XP y Diamantes**
        await sock.sendMessage(msg.key.remoteJid, { 
            text: textos[Math.floor(Math.random() * textos.length)] 
        }, { quoted: msg });

        // 📊 **Notificación de subida de nivel**
        let xpMaxActual = mascota.nivel === 1 ? 500 : mascota.nivel * 1200;
        while (mascota.experiencia >= xpMaxActual && mascota.nivel < 80) {
            mascota.experiencia -= xpMaxActual;
            mascota.nivel += 1;
            xpMaxActual = mascota.nivel * 1200;
            mascota.xpMax = xpMaxActual;

            await sock.sendMessage(msg.key.remoteJid, { 
                text: `🎉 *¡Felicidades! Tu mascota ${mascota.nombre} ha subido de nivel.* 🏆\n🐾 *Nuevo Nivel:* ${mascota.nivel}\n✨ *Experiencia:* ${mascota.experiencia} / ${xpMaxActual} XP`
            }, { quoted: msg });
        }

        // 🌟 **Incrementar niveles aleatorios en habilidades con 30% de probabilidad**
        let habilidades = Object.keys(mascota.habilidades);
        if (habilidades.length > 0) {
            let habilidadSubida = habilidades[Math.floor(Math.random() * habilidades.length)];
            if (Math.random() < 0.3) { // 30% de probabilidad de mejorar una habilidad
                mascota.habilidades[habilidadSubida].nivel += 1;

                await sock.sendMessage(msg.key.remoteJid, { 
                    text: `🌟 *¡${mascota.nombre} ha mejorado su habilidad!* 🎯\n🔹 *${habilidadSubida}: Nivel ${mascota.habilidades[habilidadSubida].nivel}*`
                }, { quoted: msg });
            }
        }

        // 📊 **Actualizar y manejar Rangos**
        const rangosMascota = [
            { nivel: 1, rango: "🐣 Principiante" },
            { nivel: 10, rango: "🐾 Aprendiz" },
            { nivel: 20, rango: "🦴 Experto" },
            { nivel: 30, rango: "🛡️ Guardián" },
            { nivel: 40, rango: "🐺 Alfa" },
            { nivel: 50, rango: "🏆 Leyenda" },
            { nivel: 60, rango: "🔥 Divino" },
            { nivel: 70, rango: "🐉 Mítico" },
            { nivel: 80, rango: "🚀 Titán Supremo" }
        ];
        let rangoAnterior = mascota.rango;
        mascota.rango = rangosMascota.reduce((acc, curr) => (mascota.nivel >= curr.nivel ? curr.rango : acc), mascota.rango);

        if (mascota.rango !== rangoAnterior) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `🎖️ *¡Tu mascota ${mascota.nombre} ha subido de rango a ${mascota.rango}!* 🚀`
            }, { quoted: msg });
        }

        // 📂 Guardar cambios
        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

    } catch (error) {
        console.error("❌ Error en el comando .presumir:", error);
    }
    break;
}
        
case 'entrenar': {
    try {
        const fs = require("fs");
        const rpgFile = "./rpg.json";
        const userId = msg.key.participant || msg.key.remoteJid;
        const cooldownTime = 10 * 60 * 1000; // 10 minutos de espera

        // 🏋️ Reacción antes de procesar
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "🏋️", key: msg.key } });

        // 📂 Verificar si el archivo existe
        if (!fs.existsSync(rpgFile)) {
            return sock.sendMessage(msg.key.remoteJid, { text: "❌ *Los datos del RPG no están disponibles.*" }, { quoted: msg });
        }

        // 📥 Cargar datos del usuario
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        // ❌ Verificar si el usuario está registrado
        if (!rpgData.usuarios[userId]) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes una cuenta registrada en el gremio Azura Ultra.*\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` 
            }, { quoted: msg });
        }

        let usuario = rpgData.usuarios[userId];

        // ❌ Verificar si el usuario tiene mascota
        if (!usuario.mascotas || usuario.mascotas.length === 0) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes ninguna mascota.*\n📜 Usa \`${global.prefix}tiendamascotas\` para comprar una.` 
            }, { quoted: msg });
        }

        let mascota = usuario.mascotas[0]; // Se asume que la primera mascota es la principal

        // 🚑 Verificar si la mascota tiene 0 de vida
        if (mascota.vida <= 0) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `🚑 *¡No puedes entrenar a tu mascota!*\n\n🔴 *${mascota.nombre} tiene 0 de vida.*\n📜 Usa \`${global.prefix}curar\` para recuperarla.` 
            }, { quoted: msg });
        }

        // 🕒 Verificar cooldown
        let tiempoActual = Date.now();
        if (mascota.cooldowns?.entrenar && tiempoActual - mascota.cooldowns.entrenar < cooldownTime) {
            let tiempoRestante = ((mascota.cooldowns.entrenar + cooldownTime - tiempoActual) / (60 * 1000)).toFixed(1);
            return sock.sendMessage(msg.key.remoteJid, { text: `⏳ *Debes esperar ${tiempoRestante} minutos antes de volver a entrenar a tu mascota.*` }, { quoted: msg });
        }

        // 🎖️ **Generar recompensas aleatorias**
        let diamantesGanados = Math.floor(Math.random() * (500 - 1 + 1)) + 1; // Entre 1 y 500
        let xpGanada = Math.floor(Math.random() * (1800 - 500 + 1)) + 500; // Entre 500 y 1800

        // 💰 **Incrementar experiencia y diamantes**
        usuario.diamantes += diamantesGanados;
        mascota.experiencia += xpGanada;

        // ❤️ Reducir vida aleatoriamente entre 5 y 20 puntos
        let vidaPerdida = Math.floor(Math.random() * (20 - 5 + 1)) + 5;
        mascota.vida = Math.max(0, mascota.vida - vidaPerdida);

        // 🕒 **Guardar cooldown**
        if (!mascota.cooldowns) mascota.cooldowns = {};
        mascota.cooldowns.entrenar = tiempoActual;

        // 🏋️ **Textos aleatorios personalizados con recompensas**
        const textos = [
            `🏋️ *${mascota.nombre} entrenó intensamente y ahora es más fuerte.*\n💎 *${diamantesGanados} Diamantes ganados*\n✨ *${xpGanada} XP obtenidos*`,
            `💪 *Después de una sesión de entrenamiento, ${mascota.nombre} está más resistente.*\n💎 *${diamantesGanados} Diamantes ganados*\n✨ *${xpGanada} XP obtenidos*`,
            `🔥 *${mascota.nombre} practicó nuevas técnicas y mejoró sus habilidades.*\n💎 *${diamantesGanados} Diamantes ganados*\n✨ *${xpGanada} XP obtenidos*`,
            `⚡ *Un duro entrenamiento hizo que ${mascota.nombre} aumentara su agilidad y destreza.*\n💎 *${diamantesGanados} Diamantes ganados*\n✨ *${xpGanada} XP obtenidos*`,
            `💥 *${mascota.nombre} rompió sus límites con una intensa rutina de entrenamiento.*\n💎 *${diamantesGanados} Diamantes ganados*\n✨ *${xpGanada} XP obtenidos*`,
            `🏆 *El esfuerzo de ${mascota.nombre} en el entrenamiento está dando grandes resultados.*\n💎 *${diamantesGanados} Diamantes ganados*\n✨ *${xpGanada} XP obtenidos*`
        ];

        // 📢 **Enviar mensaje con XP y Diamantes**
        await sock.sendMessage(msg.key.remoteJid, { 
            text: textos[Math.floor(Math.random() * textos.length)] 
        }, { quoted: msg });

        // 📊 **Notificación de subida de nivel**
        let xpMaxActual = mascota.nivel === 1 ? 500 : mascota.nivel * 1200;
        while (mascota.experiencia >= xpMaxActual && mascota.nivel < 80) {
            mascota.experiencia -= xpMaxActual;
            mascota.nivel += 1;
            xpMaxActual = mascota.nivel * 1200;
            mascota.xpMax = xpMaxActual;

            await sock.sendMessage(msg.key.remoteJid, { 
                text: `🎉 *¡Felicidades! Tu mascota ${mascota.nombre} ha subido de nivel.* 🏆\n🐾 *Nuevo Nivel:* ${mascota.nivel}\n✨ *Experiencia:* ${mascota.experiencia} / ${xpMaxActual} XP`
            }, { quoted: msg });
        }

        // 🌟 **Incrementar niveles aleatorios en habilidades con 30% de probabilidad**
        let habilidades = Object.keys(mascota.habilidades);
        if (habilidades.length > 0) {
            let habilidadSubida = habilidades[Math.floor(Math.random() * habilidades.length)];
            if (Math.random() < 0.3) { // 30% de probabilidad de mejorar una habilidad
                mascota.habilidades[habilidadSubida].nivel += 1;

                await sock.sendMessage(msg.key.remoteJid, { 
                    text: `🌟 *¡${mascota.nombre} ha mejorado su habilidad!* 🎯\n🔹 *${habilidadSubida}: Nivel ${mascota.habilidades[habilidadSubida].nivel}*`
                }, { quoted: msg });
            }
        }

        // 📊 **Actualizar y manejar Rangos**
        const rangosMascota = [
            { nivel: 1, rango: "🐣 Principiante" },
            { nivel: 10, rango: "🐾 Aprendiz" },
            { nivel: 20, rango: "🦴 Experto" },
            { nivel: 30, rango: "🛡️ Guardián" },
            { nivel: 40, rango: "🐺 Alfa" },
            { nivel: 50, rango: "🏆 Leyenda" },
            { nivel: 60, rango: "🔥 Divino" },
            { nivel: 70, rango: "🐉 Mítico" },
            { nivel: 80, rango: "🚀 Titán Supremo" }
        ];
        let rangoAnterior = mascota.rango;
        mascota.rango = rangosMascota.reduce((acc, curr) => (mascota.nivel >= curr.nivel ? curr.rango : acc), mascota.rango);

        if (mascota.rango !== rangoAnterior) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `🎖️ *¡Tu mascota ${mascota.nombre} ha subido de rango a ${mascota.rango}!* 🚀`
            }, { quoted: msg });
        }

        // 📂 Guardar cambios
        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

    } catch (error) {
        console.error("❌ Error en el comando .entrenar:", error);
    }
    break;
}
        
case 'pasear': {
    try {
        const fs = require("fs");
        const rpgFile = "./rpg.json";
        const userId = msg.key.participant || msg.key.remoteJid;
        const cooldownTime = 8 * 60 * 1000; // 8 minutos de espera

        // 🚶 Reacción antes de procesar
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "🚶", key: msg.key } });

        // 📂 Verificar si el archivo existe
        if (!fs.existsSync(rpgFile)) {
            return sock.sendMessage(msg.key.remoteJid, { text: "❌ *Los datos del RPG no están disponibles.*" }, { quoted: msg });
        }

        // 📥 Cargar datos del usuario
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        // ❌ Verificar si el usuario está registrado
        if (!rpgData.usuarios[userId]) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes una cuenta registrada en el gremio Azura Ultra.*\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` 
            }, { quoted: msg });
        }

        let usuario = rpgData.usuarios[userId];

        // ❌ Verificar si el usuario tiene mascota
        if (!usuario.mascotas || usuario.mascotas.length === 0) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes ninguna mascota.*\n📜 Usa \`${global.prefix}tiendamascotas\` para comprar una.` 
            }, { quoted: msg });
        }

        let mascota = usuario.mascotas[0]; // Se asume que la primera mascota es la principal

        // 🚑 Verificar si la mascota tiene 0 de vida
        if (mascota.vida <= 0) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `🚑 *¡No puedes pasear con tu mascota!*\n\n🔴 *${mascota.nombre} tiene 0 de vida.*\n📜 Usa \`${global.prefix}curar\` para recuperarla.` 
            }, { quoted: msg });
        }

        // 🕒 Verificar cooldown
        let tiempoActual = Date.now();
        if (mascota.cooldowns?.pasear && tiempoActual - mascota.cooldowns.pasear < cooldownTime) {
            let tiempoRestante = ((mascota.cooldowns.pasear + cooldownTime - tiempoActual) / (60 * 1000)).toFixed(1);
            return sock.sendMessage(msg.key.remoteJid, { text: `⏳ *Debes esperar ${tiempoRestante} minutos antes de volver a usar este comando.*` }, { quoted: msg });
        }

        // 🎖️ **Generar recompensas aleatorias**
        let diamantesGanados = Math.floor(Math.random() * (500 - 50 + 1)) + 50; // Entre 50 y 500
        let xpGanada = Math.floor(Math.random() * (1200 - 300 + 1)) + 300; // Entre 300 y 1200

        // 💰 **Incrementar experiencia y diamantes**
        usuario.diamantes += diamantesGanados;
        mascota.experiencia += xpGanada;

        // ❤️ Reducir vida aleatoriamente entre 5 y 20 puntos
        let vidaPerdida = Math.floor(Math.random() * (20 - 5 + 1)) + 5;
        mascota.vida = Math.max(0, mascota.vida - vidaPerdida);

        // 🕒 **Guardar cooldown**
        if (!mascota.cooldowns) mascota.cooldowns = {};
        mascota.cooldowns.pasear = tiempoActual;

        // 🚶 **Textos aleatorios personalizados con recompensas**
        const textos = [
            `🚶 *${mascota.nombre} disfrutó de un paseo relajante por el parque.*\n💎 *${diamantesGanados} Diamantes ganados*\n✨ *${xpGanada} XP obtenidos*`,
            `🌳 *${mascota.nombre} corrió por la pradera y se llenó de energía.*\n💎 *${diamantesGanados} Diamantes ganados*\n✨ *${xpGanada} XP obtenidos*`,
            `🐕 *${mascota.nombre} hizo nuevos amigos en su paseo y se divirtió mucho.*\n💎 *${diamantesGanados} Diamantes ganados*\n✨ *${xpGanada} XP obtenidos*`,
            `☀️ *${mascota.nombre} disfrutó del sol y el aire fresco mientras paseaban juntos.*\n💎 *${diamantesGanados} Diamantes ganados*\n✨ *${xpGanada} XP obtenidos*`,
            `🌊 *Un paseo junto al río hizo que ${mascota.nombre} se sintiera renovado.*\n💎 *${diamantesGanados} Diamantes ganados*\n✨ *${xpGanada} XP obtenidos*`,
            `🏃 *${mascota.nombre} corrió a toda velocidad en el paseo y entrenó su resistencia.*\n💎 *${diamantesGanados} Diamantes ganados*\n✨ *${xpGanada} XP obtenidos*`
        ];

        // 📢 **Enviar mensaje con XP y Diamantes**
        await sock.sendMessage(msg.key.remoteJid, { 
            text: textos[Math.floor(Math.random() * textos.length)] 
        }, { quoted: msg });

        // 📊 **Notificación de subida de nivel**
        let xpMaxActual = mascota.nivel === 1 ? 500 : mascota.nivel * 1200;
        while (mascota.experiencia >= xpMaxActual && mascota.nivel < 80) {
            mascota.experiencia -= xpMaxActual;
            mascota.nivel += 1;
            xpMaxActual = mascota.nivel * 1200;
            mascota.xpMax = xpMaxActual;

            await sock.sendMessage(msg.key.remoteJid, { 
                text: `🎉 *¡Felicidades! Tu mascota ${mascota.nombre} ha subido de nivel.* 🏆\n🐾 *Nuevo Nivel:* ${mascota.nivel}\n✨ *Experiencia:* ${mascota.experiencia} / ${xpMaxActual} XP`
            }, { quoted: msg });
        }

        // 🌟 **Incrementar niveles aleatorios en habilidades con 30% de probabilidad**
        let habilidades = Object.keys(mascota.habilidades);
        if (habilidades.length > 0) {
            let habilidadSubida = habilidades[Math.floor(Math.random() * habilidades.length)];
            if (Math.random() < 0.3) { // 30% de probabilidad de mejorar una habilidad
                mascota.habilidades[habilidadSubida].nivel += 1;

                await sock.sendMessage(msg.key.remoteJid, { 
                    text: `🌟 *¡${mascota.nombre} ha mejorado su habilidad!* 🎯\n🔹 *${habilidadSubida}: Nivel ${mascota.habilidades[habilidadSubida].nivel}*`
                }, { quoted: msg });
            }
        }

        // 📊 **Actualizar y manejar Rangos**
        const rangosMascota = [
            { nivel: 1, rango: "🐣 Principiante" },
            { nivel: 10, rango: "🐾 Aprendiz" },
            { nivel: 20, rango: "🦴 Experto" },
            { nivel: 30, rango: "🛡️ Guardián" },
            { nivel: 40, rango: "🐺 Alfa" },
            { nivel: 50, rango: "🏆 Leyenda" },
            { nivel: 60, rango: "🔥 Divino" },
            { nivel: 70, rango: "🐉 Mítico" },
            { nivel: 80, rango: "🚀 Titán Supremo" }
        ];
        let rangoAnterior = mascota.rango;
        mascota.rango = rangosMascota.reduce((acc, curr) => (mascota.nivel >= curr.nivel ? curr.rango : acc), mascota.rango);

        if (mascota.rango !== rangoAnterior) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `🎖️ *¡Tu mascota ${mascota.nombre} ha subido de rango a ${mascota.rango}!* 🚀`
            }, { quoted: msg });
        }

        // 📂 Guardar cambios
        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

    } catch (error) {
        console.error("❌ Error en el comando .pasear:", error);
    }
    break;
}

        
case 'cazar': {
    try {
        const fs = require("fs");
        const rpgFile = "./rpg.json";
        const userId = msg.key.participant || msg.key.remoteJid;
        const cooldownTime = 7 * 60 * 1000; // 7 minutos de espera

        // 🎯 Reacción antes de procesar
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "🎯", key: msg.key } });

        // 📂 Verificar si el archivo existe
        if (!fs.existsSync(rpgFile)) {
            return sock.sendMessage(msg.key.remoteJid, { text: "❌ *Los datos del RPG no están disponibles.*" }, { quoted: msg });
        }

        // 📥 Cargar datos del usuario
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        // ❌ Verificar si el usuario está registrado
        if (!rpgData.usuarios[userId]) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes una cuenta registrada en el gremio Azura Ultra.*\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` 
            }, { quoted: msg });
        }

        let usuario = rpgData.usuarios[userId];

        // ❌ Verificar si el usuario tiene mascota
        if (!usuario.mascotas || usuario.mascotas.length === 0) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes ninguna mascota.*\n📜 Usa \`${global.prefix}tiendamascotas\` para comprar una.` 
            }, { quoted: msg });
        }

        let mascota = usuario.mascotas[0]; // Se asume que la primera mascota es la principal

        // 🚑 Verificar si la mascota tiene 0 de vida
        if (mascota.vida <= 0) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `🚑 *¡No puedes ir de caza con tu mascota!*\n\n🔴 *${mascota.nombre} tiene 0 de vida.*\n📜 Usa \`${global.prefix}curar\` para recuperarla.` 
            }, { quoted: msg });
        }

        // 🕒 Verificar cooldown
        let tiempoActual = Date.now();
        if (mascota.cooldowns?.cazar && tiempoActual - mascota.cooldowns.cazar < cooldownTime) {
            let tiempoRestante = ((mascota.cooldowns.cazar + cooldownTime - tiempoActual) / (60 * 1000)).toFixed(1);
            return sock.sendMessage(msg.key.remoteJid, { text: `⏳ *Debes esperar ${tiempoRestante} minutos antes de volver a usar este comando.*` }, { quoted: msg });
        }

        // 🎖️ **Generar recompensas aleatorias**
        let diamantesGanados = Math.floor(Math.random() * (350 - 1 + 1)) + 1; // Entre 1 y 350
        let xpGanada = Math.floor(Math.random() * (1800 - 500 + 1)) + 500; // Entre 500 y 1800

        // 💰 **Incrementar experiencia y diamantes**
        usuario.diamantes += diamantesGanados;
        mascota.experiencia += xpGanada;

        // ❤️ Reducir vida aleatoriamente entre 5 y 20 puntos
        let vidaPerdida = Math.floor(Math.random() * (20 - 5 + 1)) + 5;
        mascota.vida = Math.max(0, mascota.vida - vidaPerdida);

        // 🕒 **Guardar cooldown**
        if (!mascota.cooldowns) mascota.cooldowns = {};
        mascota.cooldowns.cazar = tiempoActual;

        // 🎯 **Textos aleatorios personalizados con recompensas**
        const textos = [
            `🎯 *${mascota.nombre} cazó con precisión y trajo una gran presa.*\n💎 *${diamantesGanados} Diamantes ganados*\n✨ *${xpGanada} XP obtenidos*`,
            `🏹 *${mascota.nombre} tuvo un día de caza exitoso y se siente más fuerte.*\n💎 *${diamantesGanados} Diamantes ganados*\n✨ *${xpGanada} XP obtenidos*`,
            `🦌 *${mascota.nombre} persiguió a su presa con gran habilidad.*\n💎 *${diamantesGanados} Diamantes ganados*\n✨ *${xpGanada} XP obtenidos*`,
            `🐾 *${mascota.nombre} acechó con astucia y logró una cacería exitosa.*\n💎 *${diamantesGanados} Diamantes ganados*\n✨ *${xpGanada} XP obtenidos*`,
            `⚡ *${mascota.nombre} usó su velocidad y atrapó una presa en tiempo récord.*\n💎 *${diamantesGanados} Diamantes ganados*\n✨ *${xpGanada} XP obtenidos*`,
            `🔥 *${mascota.nombre} mostró su instinto salvaje y dominó el arte de la caza.*\n💎 *${diamantesGanados} Diamantes ganados*\n✨ *${xpGanada} XP obtenidos*`
        ];

        // 📢 **Enviar mensaje con XP y Diamantes**
        await sock.sendMessage(msg.key.remoteJid, { 
            text: textos[Math.floor(Math.random() * textos.length)] 
        }, { quoted: msg });

        // 📊 **Notificación de subida de nivel**
        let xpMaxActual = mascota.nivel === 1 ? 500 : mascota.nivel * 1200;
        while (mascota.experiencia >= xpMaxActual && mascota.nivel < 80) {
            mascota.experiencia -= xpMaxActual;
            mascota.nivel += 1;
            xpMaxActual = mascota.nivel * 1200;
            mascota.xpMax = xpMaxActual;

            await sock.sendMessage(msg.key.remoteJid, { 
                text: `🎉 *¡Felicidades! Tu mascota ${mascota.nombre} ha subido de nivel.* 🏆\n🐾 *Nuevo Nivel:* ${mascota.nivel}\n✨ *Experiencia:* ${mascota.experiencia} / ${xpMaxActual} XP`
            }, { quoted: msg });
        }

        // 🌟 **Incrementar niveles aleatorios en habilidades**
        let habilidades = Object.keys(mascota.habilidades);
        if (habilidades.length > 0) {
            let habilidadSubida = habilidades[Math.floor(Math.random() * habilidades.length)];
            if (Math.random() < 0.5) { // 50% de probabilidad de mejorar una habilidad
                mascota.habilidades[habilidadSubida].nivel += 1;

                await sock.sendMessage(msg.key.remoteJid, { 
                    text: `🌟 *¡${mascota.nombre} ha mejorado su habilidad!* 🎯\n🔹 *${habilidadSubida}: Nivel ${mascota.habilidades[habilidadSubida].nivel}*`
                }, { quoted: msg });
            }
        }

        // 📊 **Actualizar y manejar Rangos**
        const rangosMascota = [
            { nivel: 1, rango: "🐣 Principiante" },
            { nivel: 10, rango: "🐾 Aprendiz" },
            { nivel: 20, rango: "🦴 Experto" },
            { nivel: 30, rango: "🛡️ Guardián" },
            { nivel: 40, rango: "🐺 Alfa" },
            { nivel: 50, rango: "🏆 Leyenda" },
            { nivel: 60, rango: "🔥 Divino" },
            { nivel: 70, rango: "🐉 Mítico" },
            { nivel: 80, rango: "🚀 Titán Supremo" }
        ];
        let rangoAnterior = mascota.rango;
        mascota.rango = rangosMascota.reduce((acc, curr) => (mascota.nivel >= curr.nivel ? curr.rango : acc), mascota.rango);

        if (mascota.rango !== rangoAnterior) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `🎖️ *¡Tu mascota ${mascota.nombre} ha subido de rango a ${mascota.rango}!* 🚀`
            }, { quoted: msg });
        }

        // 📂 Guardar cambios
        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

    } catch (error) {
        console.error("❌ Error en el comando .cazar:", error);
    }
    break;
}
        
case 'darcariño': {
    try {
        const fs = require("fs");
        const rpgFile = "./rpg.json";
        const userId = msg.key.participant || msg.key.remoteJid;
        const cooldownTime = 5 * 60 * 1000; // 5 minutos de espera

        // ❤️ Reacción antes de procesar
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "❤️", key: msg.key } });

        // 📂 Verificar si el archivo existe
        if (!fs.existsSync(rpgFile)) {
            return sock.sendMessage(msg.key.remoteJid, { text: "❌ *Los datos del RPG no están disponibles.*" }, { quoted: msg });
        }

        // 📥 Cargar datos del usuario
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        // ❌ Verificar si el usuario está registrado
        if (!rpgData.usuarios[userId]) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes una cuenta registrada en el gremio Azura Ultra.*\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` 
            }, { quoted: msg });
        }

        let usuario = rpgData.usuarios[userId];

        // ❌ Verificar si el usuario tiene mascota
        if (!usuario.mascotas || usuario.mascotas.length === 0) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes ninguna mascota.*\n📜 Usa \`${global.prefix}tiendamascotas\` para comprar una.` 
            }, { quoted: msg });
        }

        let mascota = usuario.mascotas[0]; // Se asume que la primera mascota es la principal

        // 🚑 Verificar si la mascota tiene 0 de vida
        if (mascota.vida <= 0) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `🚑 *¡No puedes dar cariño a tu mascota!*\n\n🔴 *${mascota.nombre} tiene 0 de vida.*\n📜 Usa \`${global.prefix}curar\` para recuperarla.` 
            }, { quoted: msg });
        }

        // 🕒 Verificar cooldown
        let tiempoActual = Date.now();
        if (mascota.cooldowns?.darcariño && tiempoActual - mascota.cooldowns.darcariño < cooldownTime) {
            let tiempoRestante = ((mascota.cooldowns.darcariño + cooldownTime - tiempoActual) / (60 * 1000)).toFixed(1);
            return sock.sendMessage(msg.key.remoteJid, { text: `⏳ *Debes esperar ${tiempoRestante} minutos antes de volver a usar este comando.*` }, { quoted: msg });
        }

        // 🎖️ **Generar recompensas aleatorias**
        let diamantesGanados = Math.floor(Math.random() * (200 - 1 + 1)) + 1; // Entre 1 y 200
        let xpGanada = Math.floor(Math.random() * (1500 - 300 + 1)) + 300; // Entre 300 y 1500

        // 💰 **Incrementar experiencia y diamantes**
        usuario.diamantes += diamantesGanados;
        mascota.experiencia += xpGanada;

        // ❤️ Reducir vida aleatoriamente entre 5 y 20 puntos
        let vidaPerdida = Math.floor(Math.random() * (20 - 5 + 1)) + 5;
        mascota.vida = Math.max(0, mascota.vida - vidaPerdida);

        // 🕒 **Guardar cooldown**
        if (!mascota.cooldowns) mascota.cooldowns = {};
        mascota.cooldowns.darcariño = tiempoActual;

        // 💖 **Textos aleatorios personalizados con recompensas**
        const textos = [
            `❤️ *${mascota.nombre} recibió cariño y ahora está más feliz.*\n💎 *${diamantesGanados} Diamantes ganados*\n✨ *${xpGanada} XP obtenidos*`,
            `🤗 *${mascota.nombre} se sintió amado y su vínculo contigo ha crecido.*\n💎 *${diamantesGanados} Diamantes ganados*\n✨ *${xpGanada} XP obtenidos*`,
            `🐾 *Después de recibir amor, ${mascota.nombre} parece más motivado para entrenar.*\n💎 *${diamantesGanados} Diamantes ganados*\n✨ *${xpGanada} XP obtenidos*`,
            `💞 *${mascota.nombre} disfrutó de un momento especial contigo.*\n💎 *${diamantesGanados} Diamantes ganados*\n✨ *${xpGanada} XP obtenidos*`,
            `💓 *Tu amor y cariño hicieron que ${mascota.nombre} se sintiera muy especial.*\n💎 *${diamantesGanados} Diamantes ganados*\n✨ *${xpGanada} XP obtenidos*`,
            `🦴 *${mascota.nombre} ronroneó de felicidad después de recibir tu cariño.*\n💎 *${diamantesGanados} Diamantes ganados*\n✨ *${xpGanada} XP obtenidos*`
        ];

        // 📢 **Enviar mensaje con XP y Diamantes**
        await sock.sendMessage(msg.key.remoteJid, { 
            text: textos[Math.floor(Math.random() * textos.length)] 
        }, { quoted: msg });

        // 📊 **Notificación de subida de nivel**
        let xpMaxActual = mascota.nivel === 1 ? 500 : mascota.nivel * 1200;
        while (mascota.experiencia >= xpMaxActual && mascota.nivel < 80) {
            mascota.experiencia -= xpMaxActual;
            mascota.nivel += 1;
            xpMaxActual = mascota.nivel * 1200;
            mascota.xpMax = xpMaxActual;

            await sock.sendMessage(msg.key.remoteJid, { 
                text: `🎉 *¡Felicidades! Tu mascota ${mascota.nombre} ha subido de nivel.* 🏆\n🐾 *Nuevo Nivel:* ${mascota.nivel}\n✨ *Experiencia:* ${mascota.experiencia} / ${xpMaxActual} XP`
            }, { quoted: msg });
        }

        // 🌟 **Incrementar niveles aleatorios en habilidades**
        let habilidades = Object.keys(mascota.habilidades);
        if (habilidades.length > 0) {
            let habilidadSubida = habilidades[Math.floor(Math.random() * habilidades.length)];
            if (Math.random() < 0.5) { // 50% de probabilidad de mejorar una habilidad
                mascota.habilidades[habilidadSubida].nivel += 1;

                await sock.sendMessage(msg.key.remoteJid, { 
                    text: `🌟 *¡${mascota.nombre} ha mejorado su habilidad!* 🎯\n🔹 *${habilidadSubida}: Nivel ${mascota.habilidades[habilidadSubida].nivel}*`
                }, { quoted: msg });
            }
        }

        // 📊 **Actualizar y manejar Rangos**
        const rangosMascota = [
            { nivel: 1, rango: "🐣 Principiante" },
            { nivel: 10, rango: "🐾 Aprendiz" },
            { nivel: 20, rango: "🦴 Experto" },
            { nivel: 30, rango: "🛡️ Guardián" },
            { nivel: 40, rango: "🐺 Alfa" },
            { nivel: 50, rango: "🏆 Leyenda" },
            { nivel: 60, rango: "🔥 Divino" },
            { nivel: 70, rango: "🐉 Mítico" },
            { nivel: 80, rango: "🚀 Titán Supremo" }
        ];
        let rangoAnterior = mascota.rango;
        mascota.rango = rangosMascota.reduce((acc, curr) => (mascota.nivel >= curr.nivel ? curr.rango : acc), mascota.rango);

        if (mascota.rango !== rangoAnterior) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `🎖️ *¡Tu mascota ${mascota.nombre} ha subido de rango a ${mascota.rango}!* 🚀`
            }, { quoted: msg });
        }

        // 📂 Guardar cambios
        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

    } catch (error) {
        console.error("❌ Error en el comando .darcariño:", error);
    }
    break;
}        
        
case 'darcomida': {
    try {
        const fs = require("fs");
        const rpgFile = "./rpg.json";
        const userId = msg.key.participant || msg.key.remoteJid;
        const cooldownTime = 5 * 60 * 1000; // 5 minutos de espera

        // 🍖 Reacción antes de procesar
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "🍖", key: msg.key } });

        // 📂 Verificar si el archivo existe
        if (!fs.existsSync(rpgFile)) {
            return sock.sendMessage(msg.key.remoteJid, { text: "❌ *Los datos del RPG no están disponibles.*" }, { quoted: msg });
        }

        // 📥 Cargar datos del usuario
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        // ❌ Verificar si el usuario está registrado
        if (!rpgData.usuarios[userId]) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes una cuenta registrada en el gremio Azura Ultra.*\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` 
            }, { quoted: msg });
        }

        let usuario = rpgData.usuarios[userId];

        // ❌ Verificar si el usuario tiene mascota
        if (!usuario.mascotas || usuario.mascotas.length === 0) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes ninguna mascota.*\n📜 Usa \`${global.prefix}tiendamascotas\` para comprar una.` 
            }, { quoted: msg });
        }

        let mascota = usuario.mascotas[0]; // Se asume que la primera mascota es la principal

        // 🚑 Verificar si la mascota tiene 0 de vida
        if (mascota.vida <= 0) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `🚑 *¡No puedes dar comida a tu mascota!*\n\n🔴 *${mascota.nombre} tiene 0 de vida.*\n📜 Usa \`${global.prefix}curar\` para recuperarla.` 
            }, { quoted: msg });
        }

        // 🕒 Verificar cooldown
        let tiempoActual = Date.now();
        if (mascota.cooldowns?.darcomida && tiempoActual - mascota.cooldowns.darcomida < cooldownTime) {
            let tiempoRestante = ((mascota.cooldowns.darcomida + cooldownTime - tiempoActual) / (60 * 1000)).toFixed(1);
            return sock.sendMessage(msg.key.remoteJid, { text: `⏳ *Debes esperar ${tiempoRestante} minutos antes de volver a usar este comando.*` }, { quoted: msg });
        }

        // 🎖️ **Generar recompensas aleatorias**
        let diamantesGanados = Math.floor(Math.random() * (200 - 1 + 1)) + 1; // Entre 1 y 200
        let xpGanada = Math.floor(Math.random() * (1200 - 200 + 1)) + 200; // Entre 200 y 1200

        // 💰 **Incrementar experiencia y diamantes**
        usuario.diamantes += diamantesGanados;
        mascota.experiencia += xpGanada;

        // ❤️ Reducir vida aleatoriamente entre 5 y 20 puntos
        let vidaPerdida = Math.floor(Math.random() * (20 - 5 + 1)) + 5;
        mascota.vida = Math.max(0, mascota.vida - vidaPerdida);

        // 🕒 **Guardar cooldown**
        if (!mascota.cooldowns) mascota.cooldowns = {};
        mascota.cooldowns.darcomida = tiempoActual;

        // 🍖 **Textos aleatorios personalizados con recompensas**
        const textos = [
            `🍖 *${mascota.nombre} devoró su comida con gusto y se siente satisfecho.*\n💎 *${diamantesGanados} Diamantes ganados*\n✨ *${xpGanada} XP obtenidos*`,
            `🥩 *${mascota.nombre} disfrutó un banquete delicioso y parece más fuerte.*\n💎 *${diamantesGanados} Diamantes ganados*\n✨ *${xpGanada} XP obtenidos*`,
            `🐾 *Después de comer, ${mascota.nombre} parece tener más energía para entrenar.*\n💎 *${diamantesGanados} Diamantes ganados*\n✨ *${xpGanada} XP obtenidos*`,
            `🍗 *${mascota.nombre} disfrutó su comida y está más feliz.*\n💎 *${diamantesGanados} Diamantes ganados*\n✨ *${xpGanada} XP obtenidos*`,
            `🥓 *${mascota.nombre} comió hasta quedar satisfecho y listo para nuevas aventuras.*\n💎 *${diamantesGanados} Diamantes ganados*\n✨ *${xpGanada} XP obtenidos*`,
            `🍎 *Un alimento saludable ayudó a ${mascota.nombre} a mantenerse fuerte y ágil.*\n💎 *${diamantesGanados} Diamantes ganados*\n✨ *${xpGanada} XP obtenidos*`
        ];

        // 📢 **Enviar mensaje con XP y Diamantes**
        await sock.sendMessage(msg.key.remoteJid, { 
            text: textos[Math.floor(Math.random() * textos.length)] 
        }, { quoted: msg });

        // 📊 **Notificación de subida de nivel**
        let xpMaxActual = mascota.nivel === 1 ? 500 : mascota.nivel * 1200;
        while (mascota.experiencia >= xpMaxActual && mascota.nivel < 80) {
            mascota.experiencia -= xpMaxActual;
            mascota.nivel += 1;
            xpMaxActual = mascota.nivel * 1200;
            mascota.xpMax = xpMaxActual;

            await sock.sendMessage(msg.key.remoteJid, { 
                text: `🎉 *¡Felicidades! Tu mascota ${mascota.nombre} ha subido de nivel.* 🏆\n🐾 *Nuevo Nivel:* ${mascota.nivel}\n✨ *Experiencia:* ${mascota.experiencia} / ${xpMaxActual} XP`
            }, { quoted: msg });
        }

        // 🌟 **Incrementar niveles aleatorios en habilidades**
        let habilidades = Object.keys(mascota.habilidades);
        if (habilidades.length > 0) {
            let habilidadSubida = habilidades[Math.floor(Math.random() * habilidades.length)];
            if (Math.random() < 0.5) { // 50% de probabilidad de mejorar una habilidad
                mascota.habilidades[habilidadSubida].nivel += 1;

                await sock.sendMessage(msg.key.remoteJid, { 
                    text: `🌟 *¡${mascota.nombre} ha mejorado su habilidad!* 🎯\n🔹 *${habilidadSubida}: Nivel ${mascota.habilidades[habilidadSubida].nivel}*`
                }, { quoted: msg });
            }
        }

        // 📊 **Actualizar y manejar Rangos**
        const rangosMascota = [
            { nivel: 1, rango: "🐣 Principiante" },
            { nivel: 10, rango: "🐾 Aprendiz" },
            { nivel: 20, rango: "🦴 Experto" },
            { nivel: 30, rango: "🛡️ Guardián" },
            { nivel: 40, rango: "🐺 Alfa" },
            { nivel: 50, rango: "🏆 Leyenda" },
            { nivel: 60, rango: "🔥 Divino" },
            { nivel: 70, rango: "🐉 Mítico" },
            { nivel: 80, rango: "🚀 Titán Supremo" }
        ];
        let rangoAnterior = mascota.rango;
        mascota.rango = rangosMascota.reduce((acc, curr) => (mascota.nivel >= curr.nivel ? curr.rango : acc), mascota.rango);

        if (mascota.rango !== rangoAnterior) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `🎖️ *¡Tu mascota ${mascota.nombre} ha subido de rango a ${mascota.rango}!* 🚀`
            }, { quoted: msg });
        }

        // 📂 Guardar cambios
        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

    } catch (error) {
        console.error("❌ Error en el comando .darcomida:", error);
    }
    break;
}
        
case 'nivelmascota': {
    try {
        // 📊 Enviar reacción mientras se procesa el comando
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "📊", key: msg.key } // Emoji de estadísticas 📊
        });

        // 📂 Archivo JSON donde se guardan los datos del RPG
        const rpgFile = "./rpg.json";

        // 📂 Verificar si el archivo existe
        if (!fs.existsSync(rpgFile)) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes una mascota registrada.*\n\n🔹 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte y obtener una mascota inicial.` 
            }, { quoted: msg });
        }

        // 📥 Cargar los datos del RPG
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        // ❌ Verificar si el usuario está registrado
        let userId = msg.key.participant || msg.key.remoteJid;
        if (!rpgData.usuarios[userId]) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes una cuenta en el gremio Azura Ultra.*\n\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` 
            }, { quoted: msg });
        }

        let usuario = rpgData.usuarios[userId];

        // ❌ Verificar si el usuario tiene mascotas
        if (!usuario.mascotas || usuario.mascotas.length === 0) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes una mascota actualmente.*\n\n🔹 Usa \`${global.prefix}tiendamascotas\` para comprar una.` 
            }, { quoted: msg });
        }

        // 🐾 Obtener la mascota actual (la primera en la lista)
        let mascota = usuario.mascotas[0];

        // Definir defaults para evitar valores undefined
        let experiencia = typeof mascota.experiencia === "number" ? mascota.experiencia : 0;
        let nivel = typeof mascota.nivel === "number" ? mascota.nivel : 1;
        let xpMax = typeof mascota.xpMax === "number" ? mascota.xpMax : 500;
        let xpFaltante = Math.max(0, xpMax - experiencia);

        // 📜 Construcción del mensaje de estadísticas
        let mensaje = `📊 *Estadísticas de tu Mascota Principal* 📊\n\n`;
        mensaje += `🐾 *Nombre:* ${mascota.nombre}\n`;
        mensaje += `🎚️ *Nivel:* ${nivel} 🆙\n`;
        mensaje += `❤️ *Vida:* ${mascota.vida || 100} HP\n`;
        mensaje += `✨ *Experiencia:* ${experiencia} / ${xpMax} XP\n`;
        mensaje += `📊 *Rango:* ${mascota.rango || "Principiante"}\n`;
        mensaje += `📌 *XP faltante para el siguiente nivel:* ${xpFaltante} XP\n\n`;

        mensaje += `🌟 *Habilidades:*\n`;
        Object.entries(mascota.habilidades).forEach(([habilidad, datos]) => {
            let nivelSkill = (datos && datos.nivel) ? datos.nivel : 1;
            mensaje += `   🔹 ${habilidad} (Nivel ${nivelSkill})\n`;
        });

        // 📢 Mensaje motivacional para seguir entrenando
        mensaje += `\n🚀 *Sigue subiendo de nivel a tu mascota con estos comandos:* 🔽\n`;
        mensaje += `   🥤 \`${global.prefix}daragua\` | 🍖 \`${global.prefix}darcomida\` | ❤️ \`${global.prefix}darcariño\`\n`;
        mensaje += `   🚶 \`${global.prefix}pasear\` | 🎯 \`${global.prefix}cazar\` | 🏋️ \`${global.prefix}entrenar\`\n`;
        mensaje += `   🌟 \`${global.prefix}presumir\` | 🦸 \`${global.prefix}supermascota\`\n\n`;
        mensaje += `🔥 ¡Entrena a tu mascota y conviértela en la más fuerte del gremio! 💪🐾\n`;

        // 📩 Enviar mensaje con la imagen de la mascota
        await sock.sendMessage(msg.key.remoteJid, { 
            image: { url: mascota.imagen }, 
            caption: mensaje
        }, { quoted: msg });

        // ✅ Confirmación con reacción de éxito
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "✅", key: msg.key } // Emoji de confirmación ✅
        });

    } catch (error) {
        console.error("❌ Error en el comando .nivelmascota:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: `❌ *Ocurrió un error al obtener la información de tu mascota. Inténtalo de nuevo.*` 
        }, { quoted: msg });

        // ❌ Enviar reacción de error
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "❌", key: msg.key } // Emoji de error ❌
        });
    }
    break;
}

case 'daragua': {
    try {
        const fs = require("fs");
        const rpgFile = "./rpg.json";
        const userId = msg.key.participant || msg.key.remoteJid;
        const cooldownTime = 5 * 60 * 1000; // 5 minutos de espera

        // 💧 Reacción antes de procesar
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "💧", key: msg.key } });

        // 📂 Verificar si el archivo existe
        if (!fs.existsSync(rpgFile)) {
            return sock.sendMessage(msg.key.remoteJid, { text: "❌ *Los datos del RPG no están disponibles.*" }, { quoted: msg });
        }

        // 📥 Cargar datos del usuario
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        // ❌ Verificar si el usuario está registrado
        if (!rpgData.usuarios[userId]) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes una cuenta registrada en el gremio Azura Ultra.*\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` 
            }, { quoted: msg });
        }

        let usuario = rpgData.usuarios[userId];

        // ❌ Verificar si el usuario tiene mascota
        if (!usuario.mascotas || usuario.mascotas.length === 0) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes ninguna mascota.*\n📜 Usa \`${global.prefix}tiendamascotas\` para comprar una.` 
            }, { quoted: msg });
        }

        let mascota = usuario.mascotas[0]; // Se asume que la primera mascota es la principal

        // 🚑 Verificar si la mascota tiene 0 de vida
        if (mascota.vida <= 0) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `🚑 *¡No puedes dar agua a tu mascota!*\n\n🔴 *${mascota.nombre} tiene 0 de vida.*\n📜 Usa \`${global.prefix}curar\` para recuperarla.` 
            }, { quoted: msg });
        }

        // 🕒 Verificar cooldown
        let tiempoActual = Date.now();
        if (mascota.cooldowns?.daragua && tiempoActual - mascota.cooldowns.daragua < cooldownTime) {
            let tiempoRestante = ((mascota.cooldowns.daragua + cooldownTime - tiempoActual) / (60 * 1000)).toFixed(1);
            return sock.sendMessage(msg.key.remoteJid, { text: `⏳ *Debes esperar ${tiempoRestante} minutos antes de volver a usar este comando.*` }, { quoted: msg });
        }

        // 🎖️ **Generar recompensas aleatorias**
        let diamantesGanados = Math.floor(Math.random() * (100 - 1 + 1)) + 1; // Entre 1 y 100
        let xpGanada = Math.floor(Math.random() * (1000 - 200 + 1)) + 200; // Entre 200 y 1000

        // 💰 **Incrementar experiencia y diamantes**
        usuario.diamantes += diamantesGanados;
        mascota.experiencia += xpGanada;

        // ❤️ Reducir vida aleatoriamente entre 5 y 20 puntos
        let vidaPerdida = Math.floor(Math.random() * (20 - 5 + 1)) + 5;
        mascota.vida = Math.max(0, mascota.vida - vidaPerdida);

        // 🕒 **Guardar cooldown**
        if (!mascota.cooldowns) mascota.cooldowns = {};
        mascota.cooldowns.daragua = tiempoActual;

        // 💦 **Textos aleatorios personalizados con recompensas**
        const textos = [
            `💧 *${mascota.nombre} bebió agua fresca y se siente revitalizado.*  
💎 *${diamantesGanados} Diamantes ganados*  
✨ *${xpGanada} XP obtenidos*`,
            `🌊 *Un trago de agua y ${mascota.nombre} está lleno de energía.*  
💎 *${diamantesGanados} Diamantes ganados*  
✨ *${xpGanada} XP obtenidos*`,
            `🏞️ *${mascota.nombre} se refrescó con agua y está más feliz que nunca.*  
💎 *${diamantesGanados} Diamantes ganados*  
✨ *${xpGanada} XP obtenidos*`,
            `🐾 *${mascota.nombre} disfrutó de una buena hidratación y ahora está más activo.*  
💎 *${diamantesGanados} Diamantes ganados*  
✨ *${xpGanada} XP obtenidos*`
        ];

        // 📢 **Enviar mensaje con XP y Diamantes**
        await sock.sendMessage(msg.key.remoteJid, { 
            text: textos[Math.floor(Math.random() * textos.length)] 
        }, { quoted: msg });

        // 🌟 **Incrementar niveles aleatorios en habilidades**
        let habilidades = Object.keys(mascota.habilidades);
        if (habilidades.length > 0) {
            let habilidadSubida = habilidades[Math.floor(Math.random() * habilidades.length)];
            if (Math.random() < 0.5) { // 50% de probabilidad de mejorar una habilidad
                mascota.habilidades[habilidadSubida].nivel += 1;

                await sock.sendMessage(msg.key.remoteJid, { 
                    text: `🌟 *¡${mascota.nombre} ha mejorado su habilidad!* 🎯\n🔹 *${habilidadSubida}: Nivel ${mascota.habilidades[habilidadSubida].nivel}*`
                }, { quoted: msg });
            }
        }

        // 📊 **Actualizar y manejar Rangos**
        const rangosMascota = [
            { nivel: 1, rango: "🐣 Principiante" },
            { nivel: 10, rango: "🐾 Aprendiz" },
            { nivel: 20, rango: "🦴 Experto" },
            { nivel: 30, rango: "🛡️ Guardián" },
            { nivel: 40, rango: "🐺 Alfa" },
            { nivel: 50, rango: "🏆 Leyenda" },
            { nivel: 60, rango: "🔥 Divino" },
            { nivel: 70, rango: "🐉 Mítico" },
            { nivel: 80, rango: "🚀 Titán Supremo" }
        ];
        let rangoAnterior = mascota.rango;
        mascota.rango = rangosMascota.reduce((acc, curr) => (mascota.nivel >= curr.nivel ? curr.rango : acc), mascota.rango);

        if (mascota.rango !== rangoAnterior) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `🎖️ *¡Tu mascota ${mascota.nombre} ha subido de rango a ${mascota.rango}!* 🚀`
            }, { quoted: msg });
        }

        // 📊 **Verificar si la mascota sube de nivel**
        let xpMaxActual = mascota.nivel === 1 ? 500 : mascota.nivel * 1200;
        while (mascota.experiencia >= xpMaxActual && mascota.nivel < 80) {
            mascota.experiencia -= xpMaxActual;
            mascota.nivel += 1;
            xpMaxActual = mascota.nivel * 1200;
            mascota.xpMax = xpMaxActual;

            await sock.sendMessage(msg.key.remoteJid, { 
                text: `🎉 *¡Felicidades! Tu mascota ${mascota.nombre} ha subido de nivel.* 🏆\n🐾 *Nuevo Nivel:* ${mascota.nivel}\n✨ *Experiencia:* ${mascota.experiencia} / ${xpMaxActual} XP`
            }, { quoted: msg });
        }

        // 📂 Guardar cambios
        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

    } catch (error) {
        console.error("❌ Error en el comando .daragua:", error);
    }
    break;
}
        
        
case 'hospital':
case 'hosp': {
    try {
        const fs = require("fs");
        const rpgFile = "./rpg.json";
        const userId = msg.key.participant || msg.key.remoteJid;
        const costoCuracion = 500; // 💰 Precio por curarse

        // 🚑 Reacción antes de procesar
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "🏥", key: msg.key } 
        });

        // 📂 Verificar si el archivo existe
        if (!fs.existsSync(rpgFile)) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: "❌ *Los datos del RPG no están disponibles.*" 
            }, { quoted: msg });
        }

        // 📥 Cargar datos del usuario
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        // ❌ Verificar si el usuario está registrado
        if (!rpgData.usuarios[userId]) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes una cuenta registrada en el gremio Azura Ultra.*\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` 
            }, { quoted: msg });
        }

        let usuario = rpgData.usuarios[userId];

        // ❌ Verificar si el usuario tiene suficientes diamantes para curarse
        if (usuario.diamantes < costoCuracion) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes suficientes diamantes para curarte.*\n💎 *Diamantes necesarios:* ${costoCuracion}\n💰 *Tu saldo actual:* ${usuario.diamantes} diamantes.` 
            }, { quoted: msg });
        }

        // ❌ Verificar si el usuario ya tiene la vida llena
        if (usuario.vida >= 100) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `⚕️ *Tu vida ya está completa.*\n❤️ *Vida actual:* ${usuario.vida} HP` 
            }, { quoted: msg });
        }

        // 🏥 Curar al usuario
        usuario.vida = 100; // Restaurar la vida a 100
        usuario.diamantes -= costoCuracion; // Cobrar el costo de curación

        // 📂 Guardar cambios en el archivo
        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

        // 📜 Mensaje de confirmación
        let mensaje = `🏥 *Has sido curado en el hospital.*\n\n`;
        mensaje += `❤️ *Vida restaurada:* 100 HP\n`;
        mensaje += `💰 *Costo de la curación:* ${costoCuracion} diamantes\n`;
        mensaje += `💎 *Diamantes restantes:* ${usuario.diamantes}\n\n`;
        mensaje += `🩹 *¡Vuelve cuando necesites más cuidados!*`;

        // 📩 Enviar mensaje de confirmación
        await sock.sendMessage(msg.key.remoteJid, { text: mensaje }, { quoted: msg });

    } catch (error) {
        console.error("❌ Error en el comando .hospital:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Hubo un error al intentar curarte. Inténtalo de nuevo.*" 
        }, { quoted: msg });
    }
    break;
}
        
case 'retirar':
case 'ret': {
    try {
        const fs = require("fs");
        const rpgFile = "./rpg.json";
        const userId = msg.key.participant || msg.key.remoteJid;

        // 🏦 Reacción antes de procesar
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "💰", key: msg.key } 
        });

        // 📂 Verificar si el archivo existe
        if (!fs.existsSync(rpgFile)) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: "❌ *Los datos del RPG no están disponibles.*" 
            }, { quoted: msg });
        }

        // 📥 Cargar datos del usuario
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        // ❌ Verificar si el usuario está registrado
        if (!rpgData.usuarios[userId]) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes una cuenta registrada en el gremio Azura Ultra.*\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` 
            }, { quoted: msg });
        }

        let usuario = rpgData.usuarios[userId];

        // 🔢 Verificar si el usuario ingresó una cantidad válida
        let cantidad = parseInt(args[0]);
        if (isNaN(cantidad) || cantidad <= 0) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `⚠️ *Uso incorrecto.*\n📌 Ejemplo: \`${global.prefix}ret 500\`\n💎 Retira diamantes del gremio.` 
            }, { quoted: msg });
        }

        // ❌ Verificar si el usuario tiene suficientes diamantes guardados
        if (usuario.diamantesGuardados < cantidad) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes suficientes diamantes en el gremio.*\n🏦 *Diamantes guardados:* ${usuario.diamantesGuardados}` 
            }, { quoted: msg });
        }

        // 🏦 Retirar los diamantes
        usuario.diamantesGuardados -= cantidad;
        usuario.diamantes += cantidad;

        // 📂 Guardar cambios en el archivo
        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

        // 📜 Mensaje de confirmación
        let mensaje = `✅ *Has retirado ${cantidad} diamantes del gremio.*\n\n`;
        mensaje += `💎 *Diamantes en inventario:* ${usuario.diamantes}\n`;
        mensaje += `🏦 *Diamantes guardados en el gremio:* ${usuario.diamantesGuardados}\n`;
        mensaje += `\n⚠️ *Recuerda que los diamantes fuera del gremio pueden ser robados.*`;

        // 📩 Enviar mensaje de confirmación
        await sock.sendMessage(msg.key.remoteJid, { text: mensaje }, { quoted: msg });

    } catch (error) {
        console.error("❌ Error en el comando .retirar:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Hubo un error al retirar diamantes. Inténtalo de nuevo.*" 
        }, { quoted: msg });
    }
    break;
}
        
case 'depositar':
case 'dep': {
    try {
        const fs = require("fs");
        const rpgFile = "./rpg.json";
        const userId = msg.key.participant || msg.key.remoteJid;

        // 🏦 Reacción antes de procesar
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "🏦", key: msg.key } 
        });

        // 📂 Verificar si el archivo existe
        if (!fs.existsSync(rpgFile)) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: "❌ *Los datos del RPG no están disponibles.*" 
            }, { quoted: msg });
        }

        // 📥 Cargar datos del usuario
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        // ❌ Verificar si el usuario está registrado
        if (!rpgData.usuarios[userId]) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes una cuenta registrada en el gremio Azura Ultra.*\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` 
            }, { quoted: msg });
        }

        let usuario = rpgData.usuarios[userId];

        // 🔢 Verificar si el usuario ingresó una cantidad válida
        let cantidad = parseInt(args[0]);
        if (isNaN(cantidad) || cantidad <= 0) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `⚠️ *Uso incorrecto.*\n📌 Ejemplo: \`${global.prefix}dep 500\`\n💎 Deposita diamantes en el gremio.` 
            }, { quoted: msg });
        }

        // ❌ Verificar si el usuario tiene suficientes diamantes
        if (usuario.diamantes < cantidad) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes suficientes diamantes para depositar.*\n💎 *Tus diamantes actuales:* ${usuario.diamantes}` 
            }, { quoted: msg });
        }

        // 🏦 Depositar los diamantes
        usuario.diamantes -= cantidad;
        usuario.diamantesGuardados = (usuario.diamantesGuardados || 0) + cantidad;

        // 📂 Guardar cambios en el archivo
        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

        // 📜 Mensaje de confirmación
        let mensaje = `✅ *Has depositado ${cantidad} diamantes en el gremio.*\n\n`;
        mensaje += `💎 *Diamantes en inventario:* ${usuario.diamantes}\n`;
        mensaje += `🏦 *Diamantes guardados en el gremio:* ${usuario.diamantesGuardados}\n`;
        mensaje += `\n🔒 *Depositar protege tus diamantes de ser robados.*`;

        // 📩 Enviar mensaje de confirmación
        await sock.sendMessage(msg.key.remoteJid, { text: mensaje }, { quoted: msg });

    } catch (error) {
        console.error("❌ Error en el comando .depositar:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Hubo un error al depositar diamantes. Inténtalo de nuevo.*" 
        }, { quoted: msg });
    }
    break;
}
        
case 'nivel': {
    try {
        const fs = require("fs");
        const axios = require("axios");
        const rpgFile = "./rpg.json";
        const userId = msg.key.participant || msg.key.remoteJid;
        const defaultImageUrl = "https://cdn.dorratz.com/files/1740822565780.jpg"; // Imagen por defecto

        // 📜 Reacción antes de procesar
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "📜", key: msg.key } 
        });

        // 📂 Verificar si el archivo existe
        if (!fs.existsSync(rpgFile)) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: "❌ *Los datos del RPG no están disponibles.*" 
            }, { quoted: msg });
        }

        // 📥 Cargar datos del usuario
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        // ❌ Verificar si el usuario está registrado
        if (!rpgData.usuarios[userId]) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes una cuenta registrada en el gremio Azura Ultra.*\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` 
            }, { quoted: msg });
        }

        let usuario = rpgData.usuarios[userId];

        // 📸 Obtener foto de perfil del usuario
        let profilePictureUrl;
        try {
            profilePictureUrl = await sock.profilePictureUrl(userId, "image");
        } catch {
            profilePictureUrl = defaultImageUrl; // Usa imagen por defecto si no tiene foto de perfil
        }

        // 🏅 Rango basado en nivel
        const rangos = [
            { nivel: 1, rango: "🌟 Novato" },
            { nivel: 5, rango: "⚔️ Guerrero Novato" },
            { nivel: 10, rango: "🔥 Maestro Combatiente" },
            { nivel: 20, rango: "👑 Élite Supremo" },
            { nivel: 30, rango: "🌀 Legendario" },
            { nivel: 40, rango: "💀 Dios de la Guerra" },
            { nivel: 50, rango: "🚀 Titán Supremo" }
        ];
        let nuevoRango = rangos.reduce((acc, curr) => (usuario.nivel >= curr.nivel ? curr.rango : acc), usuario.rango);
        usuario.rango = nuevoRango;

        // 📊 Construir mensaje de estadísticas
        let mensaje = `🎖️ *Estadísticas de ${usuario.nombre}*\n\n`;
        mensaje += `🏅 *Rango:* ${usuario.rango}\n`;
        mensaje += `🎚 *Nivel:* ${usuario.nivel}\n`;
        mensaje += `❤️ *Vida:* ${usuario.vida} HP\n`;
        mensaje += `✨ *XP:* ${usuario.experiencia} / ${(usuario.nivel * 1500)} XP\n\n`;

        mensaje += `🌟 *Habilidades:*\n`;
        Object.entries(usuario.habilidades).forEach(([habilidad, data]) => {
            mensaje += `   🔹 ${habilidad}: Nivel ${data.nivel}\n`;
        });

        mensaje += `\n💪 *Comandos para mejorar tu nivel y habilidades:*  
━━━━━━━━━━━━━━━━━━━━━━  
⛏️ *Recolección y Trabajo:*  
🔹 \`${global.prefix}picar\`, \`${global.prefix}minar\`, \`${global.prefix}minar2\`, \`${global.prefix}work\`  
🎁 *Recompensas y robos:*  
🔹 \`${global.prefix}claim\`, \`${global.prefix}cofre\`, \`${global.prefix}crime\`, \`${global.prefix}robar\`  

⚔️ *Batallas y Ránkings:*  
━━━━━━━━━━━━━━━━━━━━━━  
🆚 *Lucha contra otros usuarios:*  
🔹 Usa \`${global.prefix}batallauser\` para desafiar a alguien.  

🏆 *Consulta el ranking global:*  
🔹 Usa \`${global.prefix}topuser\` para ver el top de jugadores.  

💰 *Gestión de Diamantes:*  
━━━━━━━━━━━━━━━━━━━━━━  
🏦 *Guarda diamantes:*  
🔹 \`${global.prefix}depositar <cantidad>\`  
💎 *Retira diamantes:*  
🔹 \`${global.prefix}retirar <cantidad>\`  

🚑 *Cuidado de tu personaje:*  
━━━━━━━━━━━━━━━━━━━━━━  
❤️ *Cura tu vida:*  
🔹 \`${global.prefix}hospital\`  
🐉 *Revive con las Bolas del Dragón:*  
🔹 \`${global.prefix}bolasdeldragon\`  

━━━━━━━━━━━━━━━━━━━━━━  
⚡ *Sigue entrenando para convertirte en una leyenda.*  
`;

        // 📩 Enviar mensaje con imagen de perfil
        await sock.sendMessage(msg.key.remoteJid, { 
            image: { url: profilePictureUrl },
            caption: mensaje
        }, { quoted: msg });

    } catch (error) {
        console.error("❌ Error en el comando .nivel:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Hubo un error al obtener tu nivel. Inténtalo de nuevo.*" 
        }, { quoted: msg });
    }
    break;
}
        
        
case 'visión': {
    try {
        // 🔄 Reacción antes de procesar el comando
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: '🎨', key: msg.key } // Reacción de pincel antes de generar la imagen
        });

        // Asegúrate de tener la variable 'text' disponible aquí. 
        // Si tu framework o tu código define 'text' en otro lado, no olvides 
        // que tienes que capturar el valor que viene después de "visión".
        const query = (text || "").trim();

        // Si no hay contenido en 'query', muestra ejemplo y no genera imagen
        if (!query) {
            return sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: `⚠️ *Uso incorrecto del comando.*\n` +
                          `📌 Ejemplo: \`${global.prefix}visión un gato en el espacio\`\n\n` +
                          `🔹 *Escribe una descripción para generar una imagen personalizada.*`
                },
                { quoted: msg }
            );
        }

        // Mención que no falle en chats privados
        const participant = msg.key.participant || msg.key.remoteJid;
        const userMention = '@' + participant.replace(/[^0-9]/g, '');

        const apiUrl = `https://api.dorratz.com/v3/ai-image?prompt=${encodeURIComponent(query)}`;

        // 🔄 Reacción de carga mientras procesa
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: '🔄', key: msg.key } 
        });

        // Llamada a la API
        const response = await axios.get(apiUrl);

        // Validación básica de la respuesta
        if (
          !response.data || 
          !response.data.data || 
          !response.data.data.image_link
        ) {
            return sock.sendMessage(
                msg.key.remoteJid,
                { text: "❌ No se pudo generar la imagen. Intenta con otro texto." },
                { quoted: msg }
            );
        }

        // URL de la imagen generada
        const imageUrl = response.data.data.image_link;

        // Enviar imagen
        await sock.sendMessage(
            msg.key.remoteJid,
            {
                image: { url: imageUrl },
                caption: `🖼️ *Imagen generada para:* ${userMention}\n` +
                         `📌 *Descripción:* ${query}\n\n` +
                         `🍧 API utilizada: https://api.dorratz.com\n` +
                         `© Azura Ultra 2.0 Bot`,
                mentions: [participant] // Menciona al usuario (o al bot mismo si fuera el caso)
            },
            { quoted: msg }
        );

        // ✅ Reacción de éxito
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: '✅', key: msg.key } 
        });

    } catch (error) {
        console.error("❌ Error en .visión:", error);
        await sock.sendMessage(
            msg.key.remoteJid, 
            { text: "❌ Error al generar la imagen. Intenta de nuevo." },
            { quoted: msg }
        );

        // ❌ Reacción de error
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "❌", key: msg.key } 
        });
    }
    break;
}

        
case 'pixai': {
    try {
        // 🔄 Reacción antes de procesar el comando
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: '🎨', key: msg.key } // Reacción de pincel antes de generar la imagen
        });

        // Ajuste: verifica si "args" existe y si tiene longitud
        if (!text) {
            return sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: `⚠️ *Uso incorrecto del comando.*\n📌 Ejemplo: \`${global.prefix}pixai chica anime estilo studio ghibli\`\n\n🔹 *Escribe una descripción para generar una imagen personalizada.*`
                },
                { quoted: msg }
            );
        }

        // Aseguramos la mención incluso en privado
        const participant = msg.key.participant || msg.key.remoteJid;
        const userMention = `@${participant.replace(/[^0-9]/g, '')}`; // Extrae el número

        // Si quieres que se auto-mencione cuando el bot sea el emisor, podrías usar:
        // if (participant === sock.user.jid) {
        //     // Lógica adicional si el mensaje proviene del bot
        // }

        const prompt = `${text}`
        const apiUrl = `https://api.dorratz.com/v2/pix-ai?prompt=${encodeURIComponent(prompt)}`;

        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: '🔄', key: msg.key } // Reacción de carga mientras procesa
        });

        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

        const { images } = await response.json();
        if (!images?.length) {
            return sock.sendMessage(
                msg.key.remoteJid,
                { text: "❌ *No se encontraron resultados.* Intenta con otra descripción." },
                { quoted: msg }
            );
        }

        for (const imageUrl of images.slice(0, 4)) {
            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    image: { url: imageUrl },
                    caption: `🎨 *Imagen generada para:* ${userMention}\n📌 *Descripción:* ${prompt}\n\n🍧 API utilizada: https://api.dorratz.com\n© Azura Ultra 2.0 Bot`,
                    mentions: [participant] // Menciona al usuario (o bot si es el emisor)
                },
                { quoted: msg }
            );
        }

        // ✅ Reacción de éxito
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "✅", key: msg.key }
        });

    } catch (error) {
        console.error("❌ Error en .pixai:", error);
        await sock.sendMessage(
            msg.key.remoteJid,
            { text: `❌ Fallo al generar imágenes. Error: ${error.message}` },
            { quoted: msg }
        );

        // ❌ Reacción de error
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "❌", key: msg.key }
        });
    }
    break;
}
            
        
case 'verdad': {
    try {
        // 🔄 Reacción antes de procesar el comando
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "🧐", key: msg.key } // Reacción de pensamiento antes de enviar la respuesta
        });

        const verdad = pickRandom(global.verdad); // Selecciona una verdad aleatoria

        await sock.sendMessage(msg.key.remoteJid, {
            image: { url: 'https://cdn.dorratz.com/files/1740781671173.jpg' },
            caption: `𝘏𝘢𝘴 𝘦𝘴𝘤𝘰𝘨𝘪𝘥𝘰 *𝘝𝘌𝘙𝘋𝘈𝘋*\n\n╱╲❀╱╲╱╲❀╱╲╱╲❀╱╲\n◆ ${verdad}\n╲╱❀╲╱╲╱❀╲╱╲╱❀╲╱\n\n© Azura Ultra`
        }, { quoted: msg });

        // ✅ Reacción de éxito
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "✅", key: msg.key }
        });

    } catch (e) {
        console.error("❌ Error en el comando .verdad:", e);
        await sock.sendMessage(msg.key.remoteJid, {
            text: "❌ *Hubo un error al enviar la verdad. Inténtalo de nuevo.*"
        }, { quoted: msg });

        // ❌ Reacción de error
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "❌", key: msg.key }
        });
    }
    break;
}

case 'reto': {
    try {
        const reto = pickRandom(global.reto); // Selecciona un reto aleatorio

        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "🎲", key: msg.key } // Reacción al usar el comando
        });

        await sock.sendMessage(msg.key.remoteJid, {
            image: { url: 'https://cdn.dorratz.com/files/1740781675920.jpg' },
            caption: `𝘏𝘢𝘴 𝘦𝘴𝘤𝘰𝘨𝘪𝘥𝘰 *𝘙𝘌𝘛𝘖*\n\n╱╲❀╱╲╱╲❀╱╲╱╲❀╱╲\n◆ ${reto}\n╲╱❀╲╱╲╱❀╲╱╲╱❀╲╱\n\n© Azura Ultra`
        }, { quoted: msg });

    } catch (e) {
        console.error("❌ Error en el comando .reto:", e);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Hubo un error al enviar el reto. Inténtalo de nuevo.*" 
        }, { quoted: msg });

        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "❌", key: msg.key } // Reacción de error
        });
    }
    break;
}            
            
            
case 'tts': {
    try {
        // 1) Envía primero la reacción (🗣️) indicando que se empieza a procesar
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "🗣️", key: msg.key },
        });

        // 2) Obtiene el texto:
        //    - Directamente de 'text'
        //    - O del mensaje citado (si no hay 'text')
        let textToSay = (text || "").trim();
        if (!textToSay && msg.message.extendedTextMessage?.contextInfo?.quotedMessage) {
            textToSay = msg.message.extendedTextMessage.contextInfo.quotedMessage.conversation || "";
            textToSay = textToSay.trim();
        }

        // 3) Verifica si al final sí hay algo de texto
        if (!textToSay) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: "Por favor, proporciona un texto o cita un mensaje para convertir a voz."
            }, { quoted: msg });
            return;
        }

        // 4) Indica que está "grabando" (opcional, para mostrar un indicador)
        await sock.sendPresenceUpdate('recording', msg.key.remoteJid);

        // 5) Usa google-tts-api para obtener la URL del audio
        const SpeakEngine = require("google-tts-api");
        const textToSpeechUrl = SpeakEngine.getAudioUrl(textToSay, {
            lang: "es",
            slow: false,
            host: "https://translate.google.com",
        });

        // 6) Envía el audio como nota de voz
        await sock.sendMessage(msg.key.remoteJid, {
            audio: { url: textToSpeechUrl },
            ptt: true,
            mimetype: 'audio/mpeg',
            fileName: `tts.mp3`,
        }, { quoted: msg });

    } catch (error) {
        console.error("❌ Error en el comando .tts:", error);
        await sock.sendMessage(msg.key.remoteJid, {
            text: "❌ Ocurrió un error al procesar la conversión a voz."
        }, { quoted: msg });
    }
    break;
}

case 'meme':
case 'memes': {
    try {
        const hispamemes = require("hispamemes");
        const meme = hispamemes.meme();

        // 🔄 Reacción antes de enviar el meme
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "😆", key: msg.key } 
        });

        await sock.sendMessage(msg.key.remoteJid, {
            image: { url: meme },
            caption: "🤣 *¡Aquí tienes un meme!*\n\n© Azura Ultra"
        }, { quoted: msg });

    } catch (e) {
        console.error("❌ Error en el comando .memes:", e);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Hubo un error al obtener el meme. Inténtalo de nuevo.*" 
        }, { quoted: msg });
    }
    break;
}

            

case 'hd': {
    try {
        const FormData = require("form-data");

        let quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: "⚠️ *Responde a una imagen con el comando `.hd` para mejorarla.*" 
            }, { quoted: msg });
        }

        let mime = quoted.imageMessage?.mimetype || "";
        if (!mime) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: "⚠️ *El mensaje citado no contiene una imagen.*" 
            }, { quoted: msg });
        }

        if (!/image\/(jpe?g|png)/.test(mime)) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: "⚠️ *Solo se admiten imágenes en formato JPG o PNG.*" 
            }, { quoted: msg });
        }

        // 🛠️ Reacción de proceso
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "🛠️", key: msg.key } 
        });

        let img = await downloadContentFromMessage(quoted.imageMessage, "image");
        let buffer = Buffer.alloc(0);
        for await (const chunk of img) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        if (buffer.length === 0) {
            throw new Error("❌ Error: No se pudo descargar la imagen.");
        }

        // 📌 Procesar imagen mejorada
        let pr = await remini(buffer, "enhance");

        // 📤 Enviar imagen con la marca de agua en el texto
        await sock.sendMessage(msg.key.remoteJid, {
            image: pr,
            caption: "✨ *Imagen mejorada con éxito.*\n\n© Azura Ultra 2.0 Bot"
        }, { quoted: msg });

        // ✅ Reacción de éxito
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "✅", key: msg.key } 
        });

    } catch (e) {
        console.error("❌ Error en el comando .hd:", e);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Hubo un error al mejorar la imagen. Inténtalo de nuevo.*" 
        }, { quoted: msg });

        // ❌ Reacción de error
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "❌", key: msg.key } 
        });
    }
    break;
}
case 'imagen': {
    const fetch = require('node-fetch');

    if (!text.length) {
        await sock.sendMessage(msg.key.remoteJid, { 
            text: `⚠️ *Uso incorrecto.*\n📌 Ejemplo: \`${global.prefix}imagen gatos\`` 
        }, { quoted: msg });
        return;
    }

    const query = args.join(" ");
    const apiUrl = `https://api.neoxr.eu/api/goimg?q=${encodeURIComponent(query)}&apikey=russellxz`;

    await sock.sendMessage(msg.key.remoteJid, { 
        react: { text: "⏳", key: msg.key } 
    });

    try {
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`Error de la API: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.status || !data.data || data.data.length === 0) {
            throw new Error("No se encontraron imágenes.");
        }

        const image = data.data[0]; // Tomar la primera imagen de la lista

        await sock.sendMessage(msg.key.remoteJid, { 
            image: { url: image.url },
            caption: `🖼️ *Imagen de:* ${query}\n\n🔗 *Fuente:* ${image.origin.website.url}`,
            mimetype: 'image/jpeg'
        }, { quoted: msg });

        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "✅", key: msg.key } 
        });

    } catch (error) {
        console.error("❌ Error en el comando .imagen:", error.message);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: `❌ *Error al obtener la imagen:*\n_${error.message}_\n\n🔹 Inténtalo más tarde.` 
        }, { quoted: msg });

        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "❌", key: msg.key } 
        });
    }
    break;
}

case 'apk': {
    const fetch = require('node-fetch');

    if (!text.length) {
        await sock.sendMessage(msg.key.remoteJid, { 
            text: `⚠️ *Uso incorrecto.*\n📌 Ejemplo: \`${global.prefix}apk whatsapp\`` 
        }, { quoted: msg });
        return;
    }

    const query = args.join(" ");
    const apiUrl = `https://api.neoxr.eu/api/apk?q=${encodeURIComponent(query)}&no=1&apikey=russellxz`;

    await sock.sendMessage(msg.key.remoteJid, { 
        react: { text: "⏳", key: msg.key } 
    });

    try {
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`Error de la API: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.status || !data.data || !data.file || !data.file.url) {
            throw new Error("No se pudo obtener información del APK.");
        }

        const apkInfo = data.data;
        const apkFile = data.file;

        const fileResponse = await fetch(apkFile.url);
        if (!fileResponse.ok) {
            throw new Error("No se pudo descargar el archivo APK.");
        }

        const fileBuffer = await fileResponse.buffer();

        const caption = `📱 *Nombre:* ${apkInfo.name}\n` +
                        `📦 *Tamaño:* ${apkInfo.size}\n` +
                        `⭐ *Rating:* ${apkInfo.rating}\n` +
                        `📥 *Instalaciones:* ${apkInfo.installs}\n` +
                        `👨‍💻 *Desarrollador:* ${apkInfo.developer}\n` +
                        `📂 *Categoría:* ${apkInfo.category}\n` +
                        `🔄 *Versión:* ${apkInfo.version}\n` +
                        `📅 *Actualizado:* ${apkInfo.updated}\n` +
                        `📋 *Requisitos:* ${apkInfo.requirements}\n` +
                        `🔗 *ID:* ${apkInfo.id}`;

        await sock.sendMessage(msg.key.remoteJid, { 
            image: { url: apkInfo.thumbnail },
            caption: caption,
            mimetype: 'image/jpeg'
        }, { quoted: msg });

        await sock.sendMessage(msg.key.remoteJid, {
            document: fileBuffer,
            mimetype: 'application/vnd.android.package-archive',
            fileName: apkFile.filename
        }, { quoted: msg });

        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "✅", key: msg.key } 
        });

    } catch (error) {
        console.error("❌ Error en el comando .apk:", error.message);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: `❌ *Error al procesar la solicitud:*\n_${error.message}_\n\n🔹 Inténtalo más tarde.` 
        }, { quoted: msg });

        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "❌", key: msg.key } 
        });
    }
    break;
}

case 'chatgpt': {
    const fetch = require('node-fetch');

    if (!text.length) {
        await sock.sendMessage(msg.key.remoteJid, { 
            text: `⚠️ *Uso incorrecto.*\n📌 Ejemplo: \`${global.prefix}chatgpt Hola, ¿cómo estás?\`` 
        }, { quoted: msg });
        return;
    }

    const query = args.join(" ");
    const apiUrl = `https://api.neoxr.eu/api/gpt4-session?q=${encodeURIComponent(query)}&session=1727468410446638&apikey=russellxz`;
    const userId = msg.key.participant || msg.key.remoteJid;

    await sock.sendMessage(msg.key.remoteJid, { 
        react: { text: "🤖", key: msg.key } 
    });

    try {
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`Error de la API: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.status || !data.data || !data.data.message) {
            throw new Error("No se pudo obtener una respuesta de GPT-4.");
        }

        const respuestaGPT4 = data.data.message;

        await sock.sendMessage(msg.key.remoteJid, { 
            text: `✨ *GPT-4 responde a @${userId.replace("@s.whatsapp.net", "")}:*\n\n${respuestaGPT4}\n\n🔹 *Powered by Azura Ultra* 🤖`,
            mentions: [userId] 
        }, { quoted: msg });

        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "✅", key: msg.key } 
        });

    } catch (error) {
        console.error("❌ Error en el comando .chatgpt:", error.message);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: `❌ *Error al obtener respuesta de GPT-4:*\n_${error.message}_\n\n🔹 Inténtalo más tarde.` 
        }, { quoted: msg });

        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "❌", key: msg.key } 
        });
    }
    break;
}
         
      case 'toaudio':
case 'tomp3': {
    try {
        let quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: "⚠️ *Responde a un video o audio con el comando `.toaudio` para convertirlo a MP3.*" 
            }, { quoted: msg });
        }

        let mediaType = quoted.videoMessage ? "video" : quoted.audioMessage ? "audio" : null;
        if (!mediaType) {
            return sock.sendMessage(msg.key.remoteJid, { 
                text: "⚠️ *Solo puedes convertir videos o audios a MP3.*" 
            }, { quoted: msg });
        }

        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "🛠️", key: msg.key } 
        });

        let mediaStream = await downloadContentFromMessage(quoted[`${mediaType}Message`], mediaType);
        let buffer = Buffer.alloc(0);
        for await (const chunk of mediaStream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        if (buffer.length === 0) {
            throw new Error("❌ Error: No se pudo descargar el archivo.");
        }

        const { toAudio } = require('./libs/converter.js');
        const audio = await toAudio(buffer, 'mp4');

        await sock.sendMessage(msg.key.remoteJid, {
            audio: audio,
            mimetype: 'audio/mpeg',
        }, { quoted: msg });

        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "✅", key: msg.key } 
        });

    } catch (error) {
        console.error("❌ Error en el comando .toaudio:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Hubo un error al convertir el contenido a MP3. Inténtalo de nuevo.*" 
        }, { quoted: msg });
    }
    break;
}


        
case 'geminis':
case 'gemini': {
    const fetch = require('node-fetch');

    if (!args.length) {
        await sock.sendMessage(msg.key.remoteJid, { 
            text: `⚠️ *Uso incorrecto.*\n📌 Ejemplo: \`${global.prefix}geminis ¿Cuál es la capital de Japón?\`` 
        }, { quoted: msg });
        return;
    }

    let pregunta = args.join(" ");
    const geminiUrl = `https://api.dorratz.com/ai/gemini?prompt=${encodeURIComponent(pregunta)}`;
    let userId = msg.key.participant || msg.key.remoteJid; // Obtener ID del usuario

    await sock.sendMessage(msg.key.remoteJid, { 
        react: { text: "🤖", key: msg.key } 
    });

    try {
        const response = await fetch(geminiUrl);

        if (!response.ok) {
            throw new Error(`Error de la API: ${response.status} ${response.statusText}`);
        }

        const json = await response.json();

        if (!json || !json.message || json.message.trim() === "") {
            throw new Error("Respuesta vacía de Gemini.");
        }

        let respuestaGemini = json.message.trim();

        await sock.sendMessage(msg.key.remoteJid, { 
            text: `✨ *Respuesta de Gemini para @${userId.replace("@s.whatsapp.net", "")}:*\n\n${respuestaGemini}\n\n🔹 *Powered by Azura Ultra 2.0 Bot* 🤖`,
            mentions: [userId] // Menciona al usuario en la respuesta
        }, { quoted: msg });

        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "✅", key: msg.key } 
        });

    } catch (error) {
        console.error("❌ Error en el comando .geminis:", error.message);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: `❌ *Error al obtener respuesta de Gemini:*\n_${error.message}_\n\n🔹 Inténtalo más tarde.` 
        }, { quoted: msg });

        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "❌", key: msg.key } 
        });
    }
    break;
}


case 'simi':
case 'simisimi': {
    const fetch = require('node-fetch');

    if (!args.length) {
        await sock.sendMessage(msg.key.remoteJid, { 
            text: `⚠️ *Uso incorrecto.*\n📌 Ejemplo: \`${global.prefix}simi Hola, ¿cómo estás?\`` 
        }, { quoted: msg });
        return;
    }

    const query = args.join(" ");
    const apiUrl = `https://exonity.tech/api/ai/simi?query=${encodeURIComponent(query)}&lang=es&apikey=${zrapi}`;
    const userId = msg.key.participant || msg.key.remoteJid; // Obtener ID del usuario

    await sock.sendMessage(msg.key.remoteJid, { 
        react: { text: "🤖", key: msg.key } 
    });

    try {
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`Error de la API: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (data.status !== 200 || !data.result) {
            throw new Error("No se pudo obtener una respuesta de Simi Simi.");
        }

        const respuestaSimi = data.result;

        await sock.sendMessage(msg.key.remoteJid, { 
            text: `✨ *Simi Simi responde a @${userId.replace("@s.whatsapp.net", "")}:*\n\n${respuestaSimi}\n\n🔹 *Powered by Azura Ultra 2.0 Bot* 🤖`,
            mentions: [userId] // Menciona al usuario en la respuesta
        }, { quoted: msg });

        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "✅", key: msg.key } 
        });

    } catch (error) {
        console.error("❌ Error en el comando .simi:", error.message);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: `❌ *Error al obtener respuesta de Simi Simi:*\n_${error.message}_\n\n🔹 Inténtalo más tarde.` 
        }, { quoted: msg });

        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "❌", key: msg.key } 
        });
    }
    break;
}       
case 'topuser': {
    try {
        const rpgFile = "./rpg.json";

        // 🔄 Enviar una única reacción antes de procesar
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "📊", key: msg.key } // Emoji de estadística 📊
        });

        // Verificar si el archivo RPG existe
        if (!fs.existsSync(rpgFile)) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "❌ *El gremio aún no tiene miembros registrados.* Usa `.rpg <nombre> <edad>` para unirte." 
            }, { quoted: msg });
            return;
        }

        // Cargar datos del gremio
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        if (!rpgData.usuarios || Object.keys(rpgData.usuarios).length === 0) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "📜 *No hay miembros registrados en el Gremio Azura Ultra.*" 
            }, { quoted: msg });
            return;
        }

        let usuarios = Object.entries(rpgData.usuarios);

        // Ordenar por nivel de mayor a menor
        usuarios.sort((a, b) => b[1].nivel - a[1].nivel);

        let ranking = `🏆 *Ranking de Jugadores del Gremio Azura Ultra* 🏆\n\n`;
        let mentions = [];

        usuarios.forEach(([userId, usuario], index) => {
            let posicion = index + 1;
            let medalla = posicion === 1 ? "🥇" : posicion === 2 ? "🥈" : posicion === 3 ? "🥉" : "🔹";
            let cantidadPersonajes = usuario.personajes ? usuario.personajes.length : 0;
            let cantidadMascotas = usuario.mascotas ? usuario.mascotas.length : 0;

            ranking += `${medalla} *${posicion}.* @${userId.replace("@s.whatsapp.net", "")}  
   🏅 *Rango:* ${usuario.rango}  
   🎚️ *Nivel:* ${usuario.nivel}  
   🎭 *Personajes:* ${cantidadPersonajes}  
   🐾 *Mascotas:* ${cantidadMascotas}\n\n`;
            mentions.push(userId);
        });

        ranking += `🔥 ¡Sigue entrenando para subir en el ranking!`;

        // Enviar el mensaje con imagen 📩
        await sock.sendMessage(msg.key.remoteJid, { 
            image: { url: "https://cdn.dorratz.com/files/1740729353375.jpg" },
            caption: ranking,
            mentions: mentions // Mencionar a todos los jugadores
        }, { quoted: msg });

    } catch (error) {
        console.error("❌ Error en el comando .topuser:", error);

        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Hubo un error al obtener el ranking de jugadores. Inténtalo de nuevo.*" 
        }, { quoted: msg });
    }
    break;
}

        
case 'comprar2': {
    try {
        // 🔄 Reacción de proceso
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "🛒", key: msg.key }
        });

        // Verificamos que el usuario haya introducido algo en "text"
        const inputRaw = (text || "").trim();
        if (!inputRaw) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `⚠️ *Uso incorrecto.*\nEjemplo: \`${global.prefix}comprar2 <nombre_personaje>\``
            }, { quoted: msg });
            return;
        }

        // 🔍 Limpiar el nombre del personaje (ignora emojis, mayúsculas, minúsculas y caracteres especiales)
        let nombrePersonaje = inputRaw
            .toLowerCase()
            .replace(/[^a-zA-Z0-9_]/g, "");

        let compradorId = msg.key.participant || msg.key.remoteJid;
        const rpgFile = "./rpg.json";

        // 📂 Cargar datos del RPG
        let rpgData = fs.existsSync(rpgFile)
            ? JSON.parse(fs.readFileSync(rpgFile, "utf-8"))
            : { usuarios: {}, mercadoPersonajes: [] };

        // ❌ Verificar si el comprador tiene cuenta
        if (!rpgData.usuarios[compradorId]) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ *No tienes una cuenta registrada en el gremio.*\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.`
            }, { quoted: msg });
            return;
        }

        let comprador = rpgData.usuarios[compradorId];

        // 🔎 Buscar el personaje en la tienda de venta
        let indexPersonaje = rpgData.mercadoPersonajes.findIndex(p =>
            p.nombre.toLowerCase().replace(/[^a-zA-Z0-9_]/g, "") === nombrePersonaje
        );

        // ❌ Si el personaje no está en venta
        if (indexPersonaje === -1) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ *Este personaje no está en venta o no existe.*\n📜 Usa \`${global.prefix}alaventa\` para ver la lista de personajes en venta.`
            }, { quoted: msg });
            return;
        }

        // 📦 Obtener los datos del personaje en venta
        let personajeComprado = rpgData.mercadoPersonajes[indexPersonaje];

        // ❌ Evitar que el usuario compre su propio personaje
        if (personajeComprado.vendedor === compradorId) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ *No puedes comprar tu propio personaje en venta.*`
            }, { quoted: msg });
            return;
        }

        // ❌ Verificar si el usuario tiene suficientes diamantes
        if (comprador.diamantes < personajeComprado.precio) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ *No tienes suficientes diamantes para comprar a ${personajeComprado.nombre}.*\n💎 *Diamantes requeridos:* ${personajeComprado.precio}\n💰 *Tu saldo:* ${comprador.diamantes}`
            }, { quoted: msg });
            return;
        }

        // 💎 Descontar diamantes al comprador
        comprador.diamantes -= personajeComprado.precio;

        // 💰 Transferir pago al vendedor (si existe en la base de datos)
        if (rpgData.usuarios[personajeComprado.vendedor]) {
            rpgData.usuarios[personajeComprado.vendedor].diamantes += personajeComprado.precio;
        }

        // 📜 Transferir personaje al comprador
        delete personajeComprado.vendedor;  // Eliminar vendedor de los datos
        personajeComprado.precio = personajeComprado.precioOriginal;  // Restaurar precio original

        if (!comprador.personajes) {
            comprador.personajes = [];
        }
        comprador.personajes.push(personajeComprado);

        // ❌ Eliminar personaje del mercado
        rpgData.mercadoPersonajes.splice(indexPersonaje, 1);

        // Guardar cambios
        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

        // 📜 Construcción del mensaje con habilidades bien formateadas
        let habilidadesPersonaje = Object.entries(personajeComprado.habilidades)
            .map(([habilidad, nivel]) => `   🔹 ${habilidad} (Nivel ${nivel})`)
            .join("\n");

        // 📢 Mensaje de confirmación con imagen
        let mensaje = `🎭 *¡Has comprado un nuevo personaje del mercado!* 🎭\n\n`;
        mensaje += `🔹 *Nombre:* ${personajeComprado.nombre}\n`;
        mensaje += `🏅 *Rango:* ${personajeComprado.rango}\n`;
        mensaje += `🎚️ *Nivel:* ${personajeComprado.nivel}\n`;
        mensaje += `❤️ *Vida:* ${personajeComprado.vida} HP\n`;
        mensaje += `✨ *Experiencia:* ${personajeComprado.experiencia} / ${personajeComprado.xpMax} XP\n`;
        mensaje += `🌟 *Habilidades:*\n${habilidadesPersonaje}\n`;
        mensaje += `💎 *Costo:* ${personajeComprado.precio} diamantes\n\n`;
        mensaje += `📜 Usa \`${global.prefix}verper\` para ver tu lista de personajes.\n`;

        await sock.sendMessage(msg.key.remoteJid, {
            image: { url: personajeComprado.imagen },
            caption: mensaje
        }, { quoted: msg });

        // ✅ Confirmación con reacción
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "✅", key: msg.key }
        });

    } catch (error) {
        console.error("❌ Error en el comando .comprar2:", error);
        await sock.sendMessage(msg.key.remoteJid, {
            text: "❌ *Ocurrió un error al comprar el personaje. Inténtalo de nuevo.*"
        }, { quoted: msg });

        // ❌ Reacción de error
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "❌", key: msg.key }
        });
    }
    break;
}

        
        
case 'vender': {
    try {
        // 🔄 Enviar reacción mientras se procesa el comando
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "💰", key: msg.key } // Emoji de venta 💰
        });

        // Verificar que el usuario ingresó los parámetros correctos
        if (args.length < 2) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `⚠️ *Uso incorrecto.*\nEjemplo: \`${global.prefix}vender <nombre_personaje> <precio>\`` 
            }, { quoted: msg });
            return;
        }

        let nombrePersonaje = args.slice(0, -1).join("_").toLowerCase().replace(/[^a-zA-Z0-9_]/g, ""); // Limpiar emojis y caracteres especiales
        let precioVenta = parseInt(args[args.length - 1]);
        let userId = msg.key.participant || msg.key.remoteJid;

        if (isNaN(precioVenta) || precioVenta <= 0) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "❌ *El precio debe ser un número válido mayor a 0.*" 
            }, { quoted: msg });
            return;
        }

        const rpgFile = "./rpg.json";
        let rpgData = fs.existsSync(rpgFile) ? JSON.parse(fs.readFileSync(rpgFile, "utf-8")) : { usuarios: {}, mercadoPersonajes: [] };

        if (!rpgData.usuarios[userId]) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes una cuenta registrada.*\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` 
            }, { quoted: msg });
            return;
        }

        let usuario = rpgData.usuarios[userId];
        let indexPersonaje = usuario.personajes.findIndex(p => p.nombre.toLowerCase().replace(/[^a-zA-Z0-9_]/g, "") === nombrePersonaje);

        if (indexPersonaje === -1) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes ese personaje en tu cartera.*\n📜 Usa \`${global.prefix}verper\` para ver tu lista de personajes.` 
            }, { quoted: msg });
            return;
        }

        let personajeVendido = usuario.personajes.splice(indexPersonaje, 1)[0];
        personajeVendido.precioOriginal = personajeVendido.precio; // Guardar precio original
        personajeVendido.precio = precioVenta; // Precio de venta
        personajeVendido.vendedor = userId; // Guardar el ID del vendedor

        rpgData.mercadoPersonajes.push(personajeVendido);
        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

        // Construcción del mensaje de venta
        let habilidadesPersonaje = Object.entries(personajeVendido.habilidades)
            .map(([habilidad, nivel]) => `   🔹 ${habilidad} (Nivel ${nivel})`)
            .join("\n");

        let mensajeVenta = `💰 *¡Has puesto a la venta un personaje!* 💰\n\n`;
        mensajeVenta += `🎭 *Personaje:* ${personajeVendido.nombre}\n`;
        mensajeVenta += `🏅 *Rango:* ${personajeVendido.rango}\n`;
        mensajeVenta += `🎚️ *Nivel:* ${personajeVendido.nivel}\n`;
        mensajeVenta += `❤️ *Vida:* ${personajeVendido.vida} HP\n`;
        mensajeVenta += `✨ *Experiencia:* ${personajeVendido.experiencia} / ${personajeVendido.xpMax} XP\n`;
        mensajeVenta += `🌟 *Habilidades:*\n${habilidadesPersonaje}\n`;
        mensajeVenta += `💎 *Precio de Venta:* ${precioVenta} diamantes\n\n`;
        mensajeVenta += `📜 Usa \`${global.prefix}quitarventa <nombre_personaje>\` si deseas retirarlo del mercado.\n`;

        await sock.sendMessage(msg.key.remoteJid, { 
            image: { url: personajeVendido.imagen }, 
            caption: mensajeVenta
        }, { quoted: msg });

        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "✅", key: msg.key } 
        });

    } catch (error) {
        console.error("❌ Error en el comando .vender:", error);
    }
    break;
}
        
case 'quitarventa': {
    try {
        // 🔄 Reacción de proceso
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "🛑", key: msg.key }
        });

        // Usamos 'text' en lugar de 'args'
        const inputRaw = (text || "").trim();

        // Verificar si el usuario ingresó algo
        if (!inputRaw) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `⚠️ *Uso incorrecto.*\nEjemplo: \`${global.prefix}quitarventa <nombre_personaje>\``
            }, { quoted: msg });
            return;
        }

        // 🔍 Limpiar nombre del personaje (ignora emojis, mayúsculas, minúsculas y caracteres especiales)
        let nombrePersonaje = inputRaw
            .toLowerCase()
            .replace(/[^a-zA-Z0-9_]/g, "");

        let userId = msg.key.participant || msg.key.remoteJid;
        const rpgFile = "./rpg.json";

        // 📂 Cargar datos del RPG
        let rpgData = fs.existsSync(rpgFile)
            ? JSON.parse(fs.readFileSync(rpgFile, "utf-8"))
            : { usuarios: {}, mercadoPersonajes: [] };

        // ❌ Verificar si el usuario tiene cuenta
        if (!rpgData.usuarios[userId]) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ *No tienes una cuenta registrada en el gremio.*\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.`
            }, { quoted: msg });
            return;
        }

        // 🔎 Buscar el personaje en la tienda de venta
        let indexPersonaje = rpgData.mercadoPersonajes.findIndex(p =>
            p.nombre.toLowerCase().replace(/[^a-zA-Z0-9_]/g, "") === nombrePersonaje &&
            p.vendedor === userId
        );

        // ❌ Si el personaje no está en venta
        if (indexPersonaje === -1) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ *No tienes ese personaje en venta o no te pertenece.*\n📜 Usa \`${global.prefix}alaventa\` para ver la lista de personajes en venta.`
            }, { quoted: msg });
            return;
        }

        // 📦 Recuperar personaje del mercado
        let personajeRecuperado = rpgData.mercadoPersonajes.splice(indexPersonaje, 1)[0];
        delete personajeRecuperado.vendedor; // Quitar 'vendedor' de sus datos
        personajeRecuperado.precio = personajeRecuperado.precioOriginal; // Restaurar precio original

        // 📜 Agregarlo de nuevo a la cartera del usuario
        if (!rpgData.usuarios[userId].personajes) {
            rpgData.usuarios[userId].personajes = [];
        }
        rpgData.usuarios[userId].personajes.push(personajeRecuperado);

        // Guardar cambios
        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

        // 📜 Construir mensaje con habilidades
        let habilidadesPersonaje = Object.entries(personajeRecuperado.habilidades)
            .map(([habilidad, nivel]) => `   🔹 ${habilidad} (Nivel ${nivel})`)
            .join("\n");

        // Mensaje de confirmación
        let mensaje = `✅ *Has retirado a ${personajeRecuperado.nombre} del mercado y ha sido devuelto a tu cartera.*\n\n`;
        mensaje += `🏅 *Rango:* ${personajeRecuperado.rango}\n`;
        mensaje += `🎚️ *Nivel:* ${personajeRecuperado.nivel}\n`;
        mensaje += `❤️ *Vida:* ${personajeRecuperado.vida} HP\n`;
        mensaje += `✨ *Experiencia:* ${personajeRecuperado.experiencia} / ${personajeRecuperado.xpMax} XP\n`;
        mensaje += `🌟 *Habilidades:*\n${habilidadesPersonaje}\n`;
        mensaje += `💎 *Precio Original:* ${personajeRecuperado.precio} diamantes\n\n`;
        mensaje += `📜 Usa \`${global.prefix}verper\` para ver tu lista de personajes.\n`;

        // 📷 Enviar la imagen si existe
        if (personajeRecuperado.imagen && personajeRecuperado.imagen.startsWith("http")) {
            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: personajeRecuperado.imagen },
                caption: mensaje
            }, { quoted: msg });
        } else {
            // Si no tiene imagen, solo enviar el mensaje de texto
            await sock.sendMessage(msg.key.remoteJid, {
                text: mensaje
            }, { quoted: msg });
        }

        // ✅ Reacción de confirmación
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "✅", key: msg.key }
        });

    } catch (error) {
        console.error("❌ Error en el comando .quitarventa:", error);
        await sock.sendMessage(msg.key.remoteJid, {
            text: "❌ *Ocurrió un error al retirar el personaje del mercado. Inténtalo de nuevo.*"
        }, { quoted: msg });

        // ❌ Reacción de error
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "❌", key: msg.key }
        });
    }
    break;
}
        
case 'alaventa': {
    try {
        // 🔄 Reacción de proceso
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "🛍️", key: msg.key } 
        });

        const rpgFile = "./rpg.json";
        let rpgData = fs.existsSync(rpgFile) ? JSON.parse(fs.readFileSync(rpgFile, "utf-8")) : { mercadoPersonajes: [] };

        if (!rpgData.mercadoPersonajes || rpgData.mercadoPersonajes.length === 0) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No hay personajes en venta actualmente.*\n📜 Usa \`${global.prefix}vender <nombre_personaje> <precio>\` para vender uno.` 
            }, { quoted: msg });
            return;
        }

        let mensaje = `🏪 *Mercado de Personajes - Azura Ultra* 🏪\n\n`;
        mensaje += `🎭 *Aquí puedes comprar personajes puestos a la venta por otros jugadores.*\n`;
        mensaje += `🛒 *Para comprar usa:* \n`;
        mensaje += `   📌 \`${global.prefix}comprar2 <nombre_personaje>\`\n\n`;
        mensaje += `📜 Usa \`${global.prefix}menurpg\` para más información.\n\n`;

        // Recorrer los personajes en venta
        rpgData.mercadoPersonajes.forEach((personaje, index) => {
            let habilidadesPersonaje = Object.entries(personaje.habilidades)
                .map(([habilidad, nivel]) => `   🔹 ${habilidad} (Nivel ${nivel})`)
                .join("\n");

            mensaje += `═════════════════════\n`;
            mensaje += `🔹 *${index + 1}. ${personaje.nombre}*\n`;
            mensaje += `🏅 *Rango:* ${personaje.rango}\n`;
            mensaje += `🎚️ *Nivel:* ${personaje.nivel}\n`;
            mensaje += `❤️ *Vida:* ${personaje.vida} HP\n`;
            mensaje += `✨ *Experiencia:* ${personaje.experiencia} / ${personaje.xpMax} XP\n`;
            mensaje += `🌟 *Habilidades:*\n${habilidadesPersonaje}\n`;
            mensaje += `💎 *Precio:* ${personaje.precio} diamantes\n`;
            mensaje += `🛒 *Vendedor:* @${personaje.vendedor.replace("@s.whatsapp.net", "")}\n`;
            mensaje += `═════════════════════\n\n`;
        });

        // 📢 Enviar el mensaje con video como GIF 🎥
        await sock.sendMessage(msg.key.remoteJid, { 
            video: { url: "https://cdn.dorratz.com/files/1740730170576.mp4" }, 
            gifPlayback: true, 
            caption: mensaje, 
            mentions: rpgData.mercadoPersonajes.map(p => p.vendedor) // Menciona a los vendedores
        }, { quoted: msg });

        // ✅ Confirmación con reacción
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "✅", key: msg.key } 
        });

    } catch (error) {
        console.error("❌ Error en el comando .alaventa:", error);
    }
    break;
}
              
        
case 'mascota': {
    try {
        // 🔄 Enviar reacción mientras se procesa el comando
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "🐾", key: msg.key } // Emoji de mascota 🐾
        });

        const rpgFile = "./rpg.json";

        // Verificar si el archivo RPG existe
        if (!fs.existsSync(rpgFile)) {
            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: `❌ *No tienes una cuenta en el gremio Azura Ultra.*\n\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.`
                },
                { quoted: msg }
            );
            return;
        }

        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));
        let userId = msg.key.participant || msg.key.remoteJid;

        if (!rpgData.usuarios[userId]) {
            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: `❌ *No tienes una cuenta registrada.*\n\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.`
                },
                { quoted: msg }
            );
            return;
        }

        let usuario = rpgData.usuarios[userId];

        if (!usuario.mascotas || usuario.mascotas.length === 0) {
            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: `❌ *No tienes mascotas en tu inventario.*\n🔹 Usa \`${global.prefix}tiendamascotas\` para comprar una.`
                },
                { quoted: msg }
            );
            return;
        }

        // Tomamos el valor introducido en "text"
        const numeroMascota = parseInt(text);

        // Validar que sea un número correcto
        if (
            isNaN(numeroMascota) ||
            numeroMascota <= 0 ||
            numeroMascota > usuario.mascotas.length
        ) {
            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: `⚠️ *Uso incorrecto.*\nEjemplo: \`${global.prefix}mascota <número>\`\n🔹 Usa \`${global.prefix}vermascotas\` para ver la lista de mascotas.`
                },
                { quoted: msg }
            );
            return;
        }

        // Obtener la mascota seleccionada (la pasamos al primer lugar del array)
        let nuevaMascotaPrincipal = usuario.mascotas.splice(numeroMascota - 1, 1)[0];
        usuario.mascotas.unshift(nuevaMascotaPrincipal);

        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

        let mensaje = `🐾 *¡Has cambiado tu mascota principal!* 🐾\n\n`;
        mensaje += `🔹 *Nueva Mascota Principal:* ${nuevaMascotaPrincipal.nombre}\n`;
        mensaje += `📊 *Rango:* ${nuevaMascotaPrincipal.rango}\n`;
        mensaje += `🎚️ *Nivel:* ${nuevaMascotaPrincipal.nivel}\n`;
        mensaje += `❤️ *Vida:* ${nuevaMascotaPrincipal.vida} HP\n`;
        mensaje += `✨ *Experiencia:* ${nuevaMascotaPrincipal.experiencia} / ${nuevaMascotaPrincipal.xpMax} XP\n`;
        mensaje += `🌟 *Habilidades:*\n`;
        Object.entries(nuevaMascotaPrincipal.habilidades).forEach(([habilidad, datos]) => {
            mensaje += `      🔹 ${habilidad} (Nivel ${datos.nivel})\n`;
        });
        mensaje += `\n📜 Usa \`${global.prefix}nivelmascota\` para ver sus estadísticas.\n`;

        // Enviar la imagen y el mensaje
        await sock.sendMessage(
            msg.key.remoteJid,
            {
                image: { url: nuevaMascotaPrincipal.imagen },
                caption: mensaje
            },
            { quoted: msg }
        );

        // ✅ Reacción de éxito
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "✅", key: msg.key }
        });

    } catch (error) {
        console.error("❌ Error en el comando .mascota:", error);
        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text: "❌ *Ocurrió un error al cambiar tu mascota principal. Inténtalo de nuevo.*"
            },
            { quoted: msg }
        );

        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "❌", key: msg.key }
        });
    }
    break;
}

        
        
case 'compra': {
    try {
        // 🔄 Enviar reacción mientras se procesa el comando
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "🐾", key: msg.key } // Emoji de pata 🐾
        });

        // Archivo JSON donde se guardan los datos del RPG
        const rpgFile = "./rpg.json";

        // Verificar si el archivo existe
        if (!fs.existsSync(rpgFile)) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes una cuenta en el gremio Azura Ultra.*\n\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.`
            }, { quoted: msg });
            return;
        }

        // Cargar los datos del RPG
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        // Verificar si el usuario está registrado
        let userId = msg.key.participant || msg.key.remoteJid;
        if (!rpgData.usuarios[userId]) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes una cuenta en el gremio Azura Ultra.*\n\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.`
            }, { quoted: msg });
            return;
        }

        // Verificar si hay mascotas en la tienda
        if (!rpgData.tiendaMascotas || rpgData.tiendaMascotas.length === 0) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "❌ *Actualmente no hay mascotas en la tienda.*\n🔹 Usa `"+global.prefix+"addmascota` para agregar nuevas mascotas."
            }, { quoted: msg });
            return;
        }

        // Verificar si el usuario ingresó un nombre o número
        const inputRaw = (text || "").trim();
        if (!inputRaw) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `⚠️ *Uso incorrecto.*\nEjemplo: \`${global.prefix}compra <nombre_mascota>\` o \`${global.prefix}compra <número_mascota>\``
            }, { quoted: msg });
            return;
        }

        // Convertir a minúsculas y limpiar de emojis/caracteres especiales
        let input = inputRaw.toLowerCase().replace(/[^a-z0-9]/gi, ''); 

        let mascotaSeleccionada = null;

        // Buscar por índice (número) o por nombre
        if (!isNaN(input) && rpgData.tiendaMascotas[parseInt(input) - 1]) {
            // Si "input" es numérico y corresponde a un índice en la tienda
            mascotaSeleccionada = rpgData.tiendaMascotas[parseInt(input) - 1];
        } else {
            // Buscar la mascota cuyo nombre (en minúsculas, limpiado) coincida
            mascotaSeleccionada = rpgData.tiendaMascotas.find(m => 
                m.nombre.toLowerCase().replace(/[^a-z0-9]/gi, '') === input
            );
        }

        // Verificar si la mascota existe
        if (!mascotaSeleccionada) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No se encontró la mascota en la tienda.*\n🔹 Usa \`${global.prefix}tiendamascotas\` para ver las mascotas disponibles.`
            }, { quoted: msg });
            return;
        }

        let usuario = rpgData.usuarios[userId];

        // Verificar si el usuario ya tiene la mascota
        if (usuario.mascotas && usuario.mascotas.some(m => m.nombre === mascotaSeleccionada.nombre)) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `⚠️ *Ya posees esta mascota.*\n🔹 Usa \`${global.prefix}vermascotas\` para ver tus mascotas compradas.`
            }, { quoted: msg });
            return;
        }

        // Verificar si el usuario tiene suficientes diamantes
        if (usuario.diamantes < mascotaSeleccionada.precio) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes suficientes diamantes para comprar esta mascota.*\n💎 *Precio:* ${mascotaSeleccionada.precio} diamantes\n💰 *Tu saldo:* ${usuario.diamantes} diamantes`
            }, { quoted: msg });
            return;
        }

        // Descontar diamantes
        usuario.diamantes -= mascotaSeleccionada.precio;

        // Crear la mascota en la cartera del usuario
        let nuevaMascota = {
            nombre: mascotaSeleccionada.nombre,
            rango: mascotaSeleccionada.rango,
            nivel: 1,
            experiencia: 0,
            xpMax: mascotaSeleccionada.xpMax,
            vida: mascotaSeleccionada.vida,
            habilidades: {
                [Object.keys(mascotaSeleccionada.habilidades)[0]]: { nivel: 1 },
                [Object.keys(mascotaSeleccionada.habilidades)[1]]: { nivel: 1 }
            },
            imagen: mascotaSeleccionada.imagen
        };

        // Agregar la mascota al usuario
        if (!usuario.mascotas) usuario.mascotas = [];
        usuario.mascotas.push(nuevaMascota);

        // Guardar los cambios en el archivo JSON
        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

        // Construir mensaje de confirmación
        let mensaje = `🎉 *¡Has comprado una nueva mascota!* 🎉\n\n`;
        mensaje += `🐾 *Nombre:* ${nuevaMascota.nombre}\n`;
        mensaje += `📊 *Rango:* ${nuevaMascota.rango}\n`;
        mensaje += `🎚️ *Nivel:* ${nuevaMascota.nivel}\n`;
        mensaje += `❤️ *Vida:* ${nuevaMascota.vida} HP\n`;
        mensaje += `✨ *Experiencia:* ${nuevaMascota.experiencia} / ${nuevaMascota.xpMax} XP\n`;
        mensaje += `🌟 *Habilidades:*\n`;
        Object.entries(nuevaMascota.habilidades).forEach(([habilidad, datos]) => {
            mensaje += `      🔹 ${habilidad} (Nivel ${datos.nivel})\n`;
        });
        mensaje += `💎 *Costo:* ${mascotaSeleccionada.precio} diamantes\n\n`;
        mensaje += `📜 Usa \`${global.prefix}vermascotas\` para ver todas tus mascotas compradas.\n`;

        // Enviar mensaje con la imagen de la mascota
        await sock.sendMessage(msg.key.remoteJid, {
            image: { url: nuevaMascota.imagen },
            caption: mensaje
        }, { quoted: msg });

        // ✅ Confirmación con reacción de éxito
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "✅", key: msg.key }
        });

    } catch (error) {
        console.error("❌ Error en el comando .compra:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Ocurrió un error al procesar la compra. Inténtalo de nuevo.*"
        }, { quoted: msg });

        // ❌ Enviar reacción de error
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "❌", key: msg.key }
        });
    }
    break;
}        
        
case 'rpg': { 
    try { 
        if (args.length < 2) { 
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `⚠️ *Uso incorrecto.*\nEjemplo: \`${global.prefix}rpg Russell 26\`` 
            }, { quoted: msg });
            return; 
        }

        let nombreUsuario = args[0]; 
        let edadUsuario = parseInt(args[1]); 
        let userId = msg.key.participant || msg.key.remoteJid; 

        if (isNaN(edadUsuario) || edadUsuario <= 0) { 
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "❌ *La edad debe ser un número válido mayor que 0.*" 
            }, { quoted: msg });
            return; 
        }

        const rpgFile = "./rpg.json"; 
        let rpgData = fs.existsSync(rpgFile) ? JSON.parse(fs.readFileSync(rpgFile, "utf-8")) : { usuarios: {} }; 

        if (rpgData.usuarios[userId]) { 
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `⚠️ *Ya estás registrado en el gremio Azura Ultra.*\n\n📜 Usa \`${global.prefix}menurpg\` para ver tus opciones.` 
            }, { quoted: msg });
            return; 
        }

        await sock.sendMessage(msg.key.remoteJid, { react: { text: "⏳", key: msg.key } }); 
        let registroMensaje = await sock.sendMessage(msg.key.remoteJid, { text: `📝 *Registrando en el Gremio Azura Ultra...*` }, { quoted: msg }); 

        await new Promise(resolve => setTimeout(resolve, 1500)); 
        await sock.sendMessage(msg.key.remoteJid, { edit: registroMensaje.key, text: `📜 *Nombre:* ${nombreUsuario}\n🎂 *Edad:* ${edadUsuario}\n\n⏳ *Procesando...*` }); 
        await new Promise(resolve => setTimeout(resolve, 1500)); 
        await sock.sendMessage(msg.key.remoteJid, { edit: registroMensaje.key, text: `🔍 *Buscando rango y habilidades...*` }); 
        await new Promise(resolve => setTimeout(resolve, 1500)); 

        const habilidadesDisponibles = ["⚔️ Espadachín", "🛡️ Defensor", "🔥 Mago", "🏹 Arquero", "🌀 Sanador", "⚡ Ninja", "💀 Asesino"]; 
        const rangosDisponibles = ["🌟 Novato", "⚔️ Guerrero", "🔥 Maestro", "👑 Élite", "🌀 Legendario"]; 

        let habilidad1 = habilidadesDisponibles[Math.floor(Math.random() * habilidadesDisponibles.length)]; 
        let habilidad2 = habilidadesDisponibles[Math.floor(Math.random() * habilidadesDisponibles.length)]; 
        let rango = "🌟 Novato"; 

        let mascotasTienda = rpgData.tiendaMascotas || []; 
        let mascotaAleatoria = mascotasTienda.length > 0 ? mascotasTienda[Math.floor(Math.random() * mascotasTienda.length)] : null; 
        let nuevaMascota = null; 

        if (mascotaAleatoria) { 
            nuevaMascota = { 
                nombre: mascotaAleatoria.nombre, 
                imagen: mascotaAleatoria.imagen, 
                rango: mascotaAleatoria.rango, // ✅ Ahora guarda correctamente el rango de la mascota
                nivel: 1, 
                vida: 100, 
                experiencia: 0, 
                habilidades: { 
                    [Object.keys(mascotaAleatoria.habilidades)[0]]: { nivel: 1 }, 
                    [Object.keys(mascotaAleatoria.habilidades)[1]]: { nivel: 1 } 
                } 
            }; 
        }

        let nuevoUsuario = { 
            id: userId, 
            nombre: nombreUsuario, 
            edad: edadUsuario, 
            nivel: 1, 
            experiencia: 0, 
            rango: rango, 
            vida: 100, 
            habilidades: {  
                [habilidad1]: { nivel: 1 }, 
                [habilidad2]: { nivel: 1 } 
            }, 
            diamantes: 0, 
            diamantesGuardados: 0, 
            mascotas: nuevaMascota ? [nuevaMascota] : [] 
        };

        rpgData.usuarios[userId] = nuevoUsuario; 
        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2)); 

        let habilidadesMascota = ""; 
        if (nuevaMascota) { 
            habilidadesMascota = `🔹 *Habilidades:*  
   🌀 ${Object.keys(nuevaMascota.habilidades)[0]} (Nivel 1)  
   🔥 ${Object.keys(nuevaMascota.habilidades)[1]} (Nivel 1)`; 
        }

        let mensajeFinal = `🎉 *¡Registro Completado!* 🎉
        
🌟 *Jugador:* ${nombreUsuario}  
🎂 *Edad:* ${edadUsuario} años  
⚔️ *Rango Inicial:* ${rango}  
🎚️ *Nivel:* 1  
❤️ *Vida:* 100 HP  
✨ *Experiencia:* 0 / 1000 XP  
🛠️ *Habilidades:*  
   ✨ ${habilidad1} (Nivel 1)  
   ✨ ${habilidad2} (Nivel 1)  

🐾 *Mascota Inicial:* ${nuevaMascota ? `🦴 ${nuevaMascota.nombre}` : "❌ Ninguna (No hay en la tienda)"}  
   📊 *Rango:* ${nuevaMascota ? nuevaMascota.rango : "❌"}  
   🎚️ *Nivel:* ${nuevaMascota ? nuevaMascota.nivel : "❌"}  
   ❤️ *Vida:* ${nuevaMascota ? nuevaMascota.vida : "❌"}  
   ✨ *Experiencia:* 0 / 500 XP  
   ${habilidadesMascota}  

💎 *Diamantes:* 0  
🏦 *Diamantes en Gremio:* 0  

📜 *Comandos Básicos:*  
🔹 Usa *${global.prefix}vermascotas* para ver tu mascota actual y las que compres.  
🔹 Usa *${global.prefix}tiendamascotas* para ver mascotas disponibles.  
🔹 Usa *${global.prefix}tiendaper* para ver personajes de anime disponibles.  
🔹 Usa estos comandos para subir de nivel y ganar diamantes:  
   *${global.prefix}minar*, *${global.prefix}picar*, *${global.prefix}crime*, *${global.prefix}work*,  
   *${global.prefix}claim*, *${global.prefix}cofre*, *${global.prefix}minar2*, *${global.prefix}robar*  

🚀 ¡Prepárate para la aventura en *Azura Ultra*! 🏆`;

        await sock.sendMessage(msg.key.remoteJid, { edit: registroMensaje.key, text: "✅ *¡Registro completado!* Generando tu tarjeta de jugador..." }); 
        await new Promise(resolve => setTimeout(resolve, 2000)); 
        await sock.sendMessage(msg.key.remoteJid, {  
            video: { url: "https://cdn.dorratz.com/files/1740560637895.mp4" },  
            gifPlayback: true,  
            caption: mensajeFinal  
        }, { quoted: msg }); 

        await sock.sendMessage(msg.key.remoteJid, { react: { text: "🎮", key: msg.key } }); 

    } catch (error) { 
        console.error("❌ Error en el comando .rpg:", error); 
        await sock.sendMessage(msg.key.remoteJid, { text: "❌ *Ocurrió un error al registrarte en el gremio. Inténtalo de nuevo.*" }, { quoted: msg }); 
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "❌", key: msg.key } }); 
    } 
    break; 
}
        



case 'vermascotas': {  
    try {  
        // 🔄 Enviar reacción mientras se procesa el comando  
        await sock.sendMessage(msg.key.remoteJid, {  
            react: { text: "🐾", key: msg.key } // Emoji de mascotas 🐾  
        });  

        // 📂 Archivo JSON donde se guardan los datos del RPG  
        const rpgFile = "./rpg.json";  

        // 📂 Verificar si el archivo existe  
        if (!fs.existsSync(rpgFile)) {  
            await sock.sendMessage(msg.key.remoteJid, {  
                text: `❌ *No tienes una cuenta en el gremio Azura Ultra.*\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.`  
            }, { quoted: msg });  
            return;  
        }  

        // 📥 Cargar los datos del RPG  
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));  

        // ❌ Verificar si el usuario está registrado  
        let userId = msg.key.participant || msg.key.remoteJid;  
        if (!rpgData.usuarios[userId]) {  
            await sock.sendMessage(msg.key.remoteJid, {  
                text: `❌ *No tienes una cuenta en el gremio Azura Ultra.*\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.`  
            }, { quoted: msg });  
            return;  
        }  

        let usuario = rpgData.usuarios[userId];  

        // ❌ Verificar si el usuario tiene mascotas  
        if (!usuario.mascotas || usuario.mascotas.length === 0) {  
            await sock.sendMessage(msg.key.remoteJid, {  
                text: `❌ *No tienes ninguna mascota comprada.*\n🔹 Usa \`${global.prefix}tiendamascotas\` para ver las mascotas disponibles en la tienda.`  
            }, { quoted: msg });  
            return;  
        }  

        // 📜 Mensaje principal con explicación  
        let mensaje = ` 🐾 *Tus Mascotas - Azura Ultra* 🐾\n\n`;  
        mensaje += `📜 *Aquí puedes ver todas las mascotas que has comprado y sus estadísticas.*\n\n`;  
        mensaje += `🔹 Usa \`${global.prefix}mascota <número>\` para cambiar tu mascota principal.\n`;  
        mensaje += `🔹 Usa \`${global.prefix}curar\` para restaurar la vida de tu mascota.\n`;  
        mensaje += `🔹 Usa \`${global.prefix}nivelmascota\` para ver las estadísticas de tu mascota actual.\n\n`;  

        // 🔥 **Nuevas funciones**  
        mensaje += `⚔️ *Batallas y Rankings:*\n`;  
        mensaje += `🔹 Usa \`${global.prefix}batallamascota\` para luchar contra otra mascota.\n`;  
        mensaje += `🔹 Usa \`${global.prefix}topmascotas\` para ver en qué puesto está tu mascota en el ranking.\n\n`;  

        // 📜 **Mostrar lista de mascotas del usuario**  
        usuario.mascotas.forEach((mascota, index) => {  
            let habilidadesMascota = Object.entries(mascota.habilidades)  
                .map(([habilidad, data]) => `      🔹 ${habilidad} (Nivel ${data.nivel || 1})`)  
                .join("\n");  

            mensaje += `═════════════════════\n`;  
            mensaje += `🔹 *${index + 1}. ${mascota.nombre}*\n`;  
            mensaje += `   📊 *Rango:* ${mascota.rango || "Sin Rango"}\n`;  
            mensaje += `   🎚️ *Nivel:* ${mascota.nivel || 1}\n`;  
            mensaje += `   ❤️ *Vida:* ${mascota.vida || 100} HP\n`;  
            mensaje += `   ✨ *Experiencia:* ${mascota.experiencia || 0} / ${mascota.xpMax || 500} XP\n`;  
            mensaje += `   🌟 *Habilidades:*\n${habilidadesMascota}\n`;  
            mensaje += `═════════════════════\n\n`;  
        });  

        // 📜 **Explicación Final**  
        mensaje += `📜 **Estos son los comandos para subir de nivel a tu mascota:**\n`;  
        mensaje += `   🛠️ *${global.prefix}daragua*, *${global.prefix}darcomida*, *${global.prefix}darcariño*, *${global.prefix}pasear*, *${global.prefix}cazar*, *${global.prefix}entrenar*, *${global.prefix}presumir*, *${global.prefix}supermascota*\n\n`;  
        mensaje += `🚀 **¡Sigue entrenando a tus mascotas en el Gremio Azura Ultra!** 🏆`;  

        // 🎥 Enviar mensaje con el **video como GIF**  
        await sock.sendMessage(msg.key.remoteJid, {  
            video: { url: "https://cdn.dorratz.com/files/1740655817564.mp4" },  
            gifPlayback: true, // Se reproduce como GIF  
            caption: mensaje  
        }, { quoted: msg });  

        // ✅ Confirmación con reacción de éxito  
        await sock.sendMessage(msg.key.remoteJid, {  
            react: { text: "✅", key: msg.key }  
        });  

    } catch (error) {  
        console.error("❌ Error en el comando .vermascotas:", error);  
        await sock.sendMessage(msg.key.remoteJid, {  
            text: "❌ *Ocurrió un error al obtener tu lista de mascotas. Inténtalo de nuevo.*"  
        }, { quoted: msg });  

        // ❌ Enviar reacción de error  
        await sock.sendMessage(msg.key.remoteJid, {  
            react: { text: "❌", key: msg.key }  
        });  
    }  
    break;  
}
        

 case 'comprar': {
    try {
        // Verificar si el usuario ingresó algo
        const input = (text || "").trim();
        if (!input) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `⚠️ *Uso incorrecto.*\nEjemplo:\n📌 \`${global.prefix}comprar Satoru_Gojo\`\n📌 \`${global.prefix}comprar 1\``
            }, { quoted: msg });
            return;
        }

        const rpgFile = "./rpg.json";
        // Carga del archivo si existe, sino crea estructura vacía
        let rpgData = fs.existsSync(rpgFile)
            ? JSON.parse(fs.readFileSync(rpgFile, "utf-8"))
            : { usuarios: {}, tiendaPersonajes: [], mercadoPersonajes: [] };

        let userId = msg.key.participant || msg.key.remoteJid;

        // Verificar si el usuario está registrado
        if (!rpgData.usuarios[userId]) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No estás registrado en el gremio Azura Ultra.*\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.`
            }, { quoted: msg });
            return;
        }

        let usuario = rpgData.usuarios[userId];
        let personajeSeleccionado = null;

        // Primero, vemos si 'input' es un número
        if (!isNaN(input)) {
            // Si es un número, interpretamos que el usuario desea comprar por índice
            let index = parseInt(input) - 1;
            if (index >= 0 && index < rpgData.tiendaPersonajes.length) {
                personajeSeleccionado = rpgData.tiendaPersonajes[index];
            }
        } else {
            // Si no es número, interpretamos que el usuario desea comprar por nombre
            // Recreamos la lógica de "args.join('_')" y limpieza:
            let nombreBuscado = input
                .replace(/\s+/g, "_") // Cambia espacios a guiones bajos
                .toLowerCase()
                .replace(/[^a-zA-Z0-9_]/g, ""); // Mantiene solo letras, números y "_"
            
            // Buscamos el personaje en la tienda con el nombre "limpio"
            personajeSeleccionado = rpgData.tiendaPersonajes.find(p =>
                p.nombre
                 .toLowerCase()
                 .replace(/[^a-zA-Z0-9_]/g, "") === nombreBuscado
            );
        }

        // Si el personaje no existe, mostramos mensaje
        if (!personajeSeleccionado) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ *No se encontró ese personaje en la tienda.*\n📜 Usa \`${global.prefix}tiendaper\` para ver los personajes disponibles.`
            }, { quoted: msg });
            return;
        }

        // Verificar si el usuario tiene suficientes diamantes
        if (usuario.diamantes < personajeSeleccionado.precio) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ *No tienes suficientes diamantes.*\n💎 *Precio:* ${personajeSeleccionado.precio} diamantes\n💰 *Tu saldo:* ${usuario.diamantes} diamantes.`
            }, { quoted: msg });
            return;
        }

        // Restar diamantes al usuario
        usuario.diamantes -= personajeSeleccionado.precio;

        // Agregar el personaje a la cartera del usuario (si no existe el array, crearlo)
        if (!usuario.personajes) usuario.personajes = [];
        usuario.personajes.push({
            nombre: personajeSeleccionado.nombre,
            rango: personajeSeleccionado.rango,
            nivel: personajeSeleccionado.nivel,
            experiencia: personajeSeleccionado.experiencia,
            xpMax: personajeSeleccionado.xpMax,
            vida: personajeSeleccionado.vida,
            habilidades: personajeSeleccionado.habilidades, 
            precio: personajeSeleccionado.precio,
            imagen: personajeSeleccionado.imagen
        });

        // Eliminar el personaje de la tienda
        rpgData.tiendaPersonajes = rpgData.tiendaPersonajes.filter(
            p => p.nombre !== personajeSeleccionado.nombre
        );

        // Guardar cambios en el archivo
        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

        // Mensaje de confirmación de compra con imagen
        let mensajeCompra = `🎭 *¡Has comprado un nuevo personaje!* 🎭\n\n`;
        mensajeCompra += `🔹 *Nombre:* ${personajeSeleccionado.nombre}\n`;
        mensajeCompra += `   🎚️ *Nivel:* ${personajeSeleccionado.nivel}\n`;
        mensajeCompra += `   ❤️ *Vida:* ${personajeSeleccionado.vida} HP\n`;
        mensajeCompra += `   ✨ *Experiencia:* ${personajeSeleccionado.experiencia} / ${personajeSeleccionado.xpMax} XP\n`;
        mensajeCompra += `   🌟 *Habilidades:*\n`;

        // Mostrar habilidades correctamente
        Object.entries(personajeSeleccionado.habilidades).forEach(([habilidad, nivel]) => {
            mensajeCompra += `      🔹 ${habilidad} (Nivel ${nivel})\n`;
        });

        mensajeCompra += `\n💎 *Costo:* ${personajeSeleccionado.precio} diamantes\n`;
        mensajeCompra += `📜 Usa \`${global.prefix}nivelper\` para ver sus estadísticas.\n`;
        mensajeCompra += `📜 Usa \`${global.prefix}verper\` para ver todos tus personajes comprados.`;

        await sock.sendMessage(msg.key.remoteJid, {
            image: { url: personajeSeleccionado.imagen },
            caption: mensajeCompra
        }, { quoted: msg });

        // ✅ Enviar reacción de éxito
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "✅", key: msg.key }
        });

    } catch (error) {
        console.error("❌ Error en el comando .comprar:", error);
        await sock.sendMessage(msg.key.remoteJid, {
            text: "❌ *Ocurrió un error al procesar la compra. Inténtalo de nuevo.*"
        }, { quoted: msg });

        // ❌ Enviar reacción de error
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "❌", key: msg.key }
        });
    }
    break;
}       

        
case 'dar': {
    try {
        // Aseguramos que mentionedJid sea un array, aunque no haya menciones
        const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

        // 🔒 Verificar si el usuario que ejecuta el comando es el Owner
        if (!isOwner(sender)) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "⛔ *Solo el propietario del bot puede dar diamantes a otros jugadores.*" 
            }, { quoted: msg });
            return;
        }

        // Determina el usuario objetivo, ya sea por cita o mención
        let targetUser;

        // 1) Usuario al que se le respondió el mensaje
        if (msg.message.extendedTextMessage?.contextInfo?.quotedMessage) {
            targetUser = msg.message.extendedTextMessage.contextInfo.participant;
        
        // 2) Usuario mencionado con @
        } else if (mentionedJid.length > 0) {
            targetUser = mentionedJid[0];
        }

        // Si no obtenemos un usuario por cita ni mención, mostramos ejemplo de uso
        if (!targetUser) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `⚠️ *Uso incorrecto.*\nEjemplo: \`${global.prefix}dar citando el mensaje y la cantidad 5000\` ok`
            }, { quoted: msg });
            return;
        }

        // Verificar si se ingresó la cantidad de diamantes en 'text'
        const cantidadStr = (text || "").trim();

        // Si no hay nada o no es un número válido
        if (!cantidadStr || isNaN(cantidadStr) || parseInt(cantidadStr) <= 0) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: "⚠️ *Debes ingresar una cantidad válida de diamantes a dar.*\nEjemplo: `citando el mensaje y la cantidad 5000`"
            }, { quoted: msg });
            return;
        }

        const cantidad = parseInt(cantidadStr);

        // 🔄 Reacción de “diamantes” mientras se procesa
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "💎", key: msg.key }
        });

        // 📂 Verificar si el archivo RPG existe
        const rpgFile = "./rpg.json";
        if (!fs.existsSync(rpgFile)) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "⚠️ *No hay datos de RPG guardados.*"
            }, { quoted: msg });
            return;
        }

        // 📂 Cargar datos del RPG
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        // 📌 Verificar si el usuario objetivo está registrado en el RPG
        if (!rpgData.usuarios[targetUser]) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *El usuario no tiene una cuenta en el gremio Azura Ultra.*\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarlo.` 
            }, { quoted: msg });
            return;
        }

        // 💎 Añadir diamantes al usuario objetivo
        rpgData.usuarios[targetUser].diamantes += cantidad;

        // 💾 Guardar cambios en el archivo JSON
        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

        // 📩 Confirmar transferencia
        await sock.sendMessage(msg.key.remoteJid, {
            text: `💎 *Se han enviado ${cantidad} diamantes a @${targetUser.replace("@s.whatsapp.net", "")}.*\n✨ Usa \`${global.prefix}bal\` para ver tu saldo.`,
            mentions: [targetUser]
        }, { quoted: msg });

        // ✅ Reacción de confirmación
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "✅", key: msg.key }
        });

    } catch (error) {
        console.error("❌ Error en el comando .dar:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Ocurrió un error al dar diamantes. Inténtalo de nuevo.*"
        }, { quoted: msg });

        // ❌ Enviar reacción de error
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "❌", key: msg.key }
        });
    }
    break;
}

        
case 'deleteuser': {
    try {
        // 🔒 Verificar si el usuario que ejecuta el comando es Owner
        if (!isOwner(sender)) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: "⛔ *Solo el propietario del bot puede eliminar la cuenta de otros jugadores.*"
            }, { quoted: msg });
            return;
        }

        // 📌 Verificar si el usuario ingresó un número válido en "text"
        // isNaN(text) detecta si NO es un número
        if (!text || isNaN(text)) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `⚠️ *Uso incorrecto.*\n\n` +
                      `📌 *Ejemplo de uso:* \n` +
                      `🔹 \`${global.prefix}deleteuser 50212345678\` (Número sin @ ni espacios)\n\n` +
                      `🔹 *Este comando eliminará la cuenta del usuario y devolverá sus personajes a la tienda.*`
            }, { quoted: msg });
            return;
        }

        // Construimos el userId para WhatsApp
        const userId = text.replace(/[^0-9]/g, "") + "@s.whatsapp.net"; // le quitamos todo excepto dígitos y agregamos @s.whatsapp.net
        const rpgFile = "./rpg.json";

        // 🔄 Enviar reacción de "eliminación" mientras se procesa
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "🗑️", key: msg.key }
        });

        // 📂 Verificar si el archivo RPG existe
        if (!fs.existsSync(rpgFile)) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: "⚠️ *No hay datos de RPG guardados.*"
            }, { quoted: msg });
            return;
        }

        // 📂 Cargar datos del RPG
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        // 📌 Verificar si el usuario está registrado en el RPG
        if (!rpgData.usuarios[userId]) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ *El usuario @${text} no tiene una cuenta registrada en el gremio Azura Ultra.*`,
                mentions: [userId]
            }, { quoted: msg });
            return;
        }

        // 🏷️ Recuperar personajes del usuario y devolverlos a la tienda
        let usuario = rpgData.usuarios[userId];
        if (usuario.personajes && usuario.personajes.length > 0) {
            rpgData.tiendaPersonajes.push(...usuario.personajes);
        }

        // ❌ Eliminar el usuario del JSON
        delete rpgData.usuarios[userId];

        // 💾 Guardar cambios en el archivo JSON
        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

        // 📩 Confirmar eliminación
        await sock.sendMessage(msg.key.remoteJid, {
            text: `🗑️ *La cuenta de @${text} ha sido eliminada exitosamente del gremio Azura Ultra.*\n\n` +
                  `🔹 *Sus personajes han sido devueltos a la tienda.*`,
            mentions: [userId]
        }, { quoted: msg });

        // ✅ Reacción de confirmación
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "✅", key: msg.key }
        });

    } catch (error) {
        console.error("❌ Error en el comando .deleteuser:", error);
        await sock.sendMessage(msg.key.remoteJid, {
            text: "❌ *Ocurrió un error al eliminar la cuenta del usuario. Inténtalo de nuevo.*"
        }, { quoted: msg });

        // ❌ Enviar reacción de error
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "❌", key: msg.key }
        });
    }
    break;
}
        
case 'deleterpg': {
    try {
        const userId = msg.key.participant || msg.key.remoteJid;
        const rpgFile = "./rpg.json";

        // 🔄 Reacción inicial
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "⏳", key: msg.key } // Emoji de espera ⏳
        });

        // Verificar si el archivo existe
        if (!fs.existsSync(rpgFile)) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "⚠️ *No hay datos de RPG guardados.*" 
            }, { quoted: msg });
            return;
        }

        // Cargar datos del RPG
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        // Verificar si el usuario está registrado
        if (!rpgData.usuarios[userId]) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes un registro en el gremio Azura Ultra.*\n\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` 
            }, { quoted: msg });
            return;
        }

        // Confirmación de eliminación
        await sock.sendMessage(msg.key.remoteJid, { 
            text: `⚠️ *¿Estás seguro de que quieres eliminar tu cuenta del gremio Azura Ultra?* Esto borrará todos tus datos, incluyendo personajes y mascotas.\n\n⏳ *Tienes 1 minuto para confirmar.*\n\n✅ Si estás seguro, usa \`${global.prefix}ok\` para confirmar.\n❌ Si no quieres eliminar, simplemente ignora este mensaje.` 
        }, { quoted: msg });

        // Guardar en memoria temporal la solicitud de eliminación
        global.pendingDeletions = global.pendingDeletions || {};
        global.pendingDeletions[userId] = setTimeout(() => {
            delete global.pendingDeletions[userId]; // Expira la solicitud después de 1 minuto
        }, 60000);

    } catch (error) {
        console.error("❌ Error en el comando .deleterpg:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Ocurrió un error al intentar eliminar tu registro. Inténtalo de nuevo.*" 
        }, { quoted: msg });
    }
    break;
}

// ✅ **Comando de Confirmación .ok**
case 'ok': {
    try {
        const userId = msg.key.participant || msg.key.remoteJid;
        const rpgFile = "./rpg.json";

        // Verificar si hay una solicitud de eliminación pendiente
        if (!global.pendingDeletions || !global.pendingDeletions[userId]) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "❌ *No tienes una solicitud de eliminación pendiente.* Usa `"+global.prefix+"deleterpg` para iniciar la eliminación de tu cuenta." 
            }, { quoted: msg });
            return;
        }

        clearTimeout(global.pendingDeletions[userId]); // Cancelar temporizador
        delete global.pendingDeletions[userId]; // Remover de la lista de eliminaciones

        // Cargar datos del RPG
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        // Verificar si el usuario está registrado
        if (!rpgData.usuarios[userId]) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "❌ *No tienes un registro en el gremio Azura Ultra.*" 
            }, { quoted: msg });
            return;
        }

        // Recuperar personajes del usuario y devolverlos a la tienda
        let usuario = rpgData.usuarios[userId];
        if (usuario.personajes && usuario.personajes.length > 0) {
            rpgData.tiendaPersonajes.push(...usuario.personajes);
        }

        // Eliminar el usuario
        delete rpgData.usuarios[userId];

        // Guardar los cambios en el archivo JSON
        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

        // Confirmar eliminación
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "🗑️ *Tu cuenta ha sido eliminada del gremio Azura Ultra.*\n\n🔹 Puedes volver a registrarte en cualquier momento usando `"+global.prefix+"rpg <nombre> <edad>`." 
        }, { quoted: msg });

        // ✅ Reacción de confirmación
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "✅", key: msg.key } // Emoji de confirmación ✅
        });

    } catch (error) {
        console.error("❌ Error en el comando .ok:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Ocurrió un error al confirmar la eliminación. Inténtalo de nuevo.*" 
        }, { quoted: msg });

        // ❌ Enviar reacción de error
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "❌", key: msg.key } // Emoji de error ❌
        });
    }
    break;
}
             

case 'bal':
case 'saldo': {
    try {
        // 🔄 Enviar reacción mientras se procesa el comando
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "💰", key: msg.key } // Emoji de dinero 💰
        });

        // Archivo JSON donde se guardan los datos del RPG
        const rpgFile = "./rpg.json";

        // Verificar si el archivo existe
        if (!fs.existsSync(rpgFile)) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes una cuenta en el gremio Azura Ultra.*\n\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` 
            }, { quoted: msg });
            return;
        }

        // Cargar los datos del RPG
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        // Verificar si el usuario está registrado
        let userId = msg.key.participant || msg.key.remoteJid;
        if (!rpgData.usuarios[userId]) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `❌ *No tienes una cuenta en el gremio Azura Ultra.*\n\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.` 
            }, { quoted: msg });
            return;
        }

        let usuario = rpgData.usuarios[userId];

        // Construir mensaje de saldo 📜
        let mensaje = `
*╔═══❖•ೋ° °ೋ•❖═══╗*
🎒 *Bienvenido a tu Cartera* 🎒
*╚═══❖•ೋ° °ೋ•❖═══╝*

💰 *SALDO DE:* @${userId.replace("@s.whatsapp.net", "")}

⊰᯽⊱┈──╌❊╌──┈⊰᯽⊱
💎 *Diamantes disponibles:* ${usuario.diamantes}
🏦 *Diamantes guardados en el gremio:* ${usuario.diamantesGuardados}
⊰᯽⊱┈──╌❊╌──┈⊰᯽⊱

📜 *¿Cómo guardar tus diamantes en el gremio?*  
🔹 Usa \`${global.prefix}dep <cantidad>\` o \`${global.prefix}depositar <cantidad>\` para almacenar diamantes en el gremio.  
🔹 Los diamantes guardados están protegidos y no pueden ser robados.  

📜 *¿Cómo retirar diamantes del gremio?*  
🔹 Usa \`${global.prefix}retirar <cantidad>\` para sacar diamantes de tu cuenta del gremio y agregarlos a tu saldo.  

🚀 ¡Administra bien tu economía y conviértete en el más rico del gremio! 🏆
`;

        // Enviar mensaje con el **video como GIF** 🎥
        await sock.sendMessage(msg.key.remoteJid, { 
            video: { url: "https://cdn.dorratz.com/files/1740652887134.mp4" },
            gifPlayback: true, // Se reproduce como GIF
            caption: mensaje,
            mentions: [userId] // Menciona al usuario
        }, { quoted: msg });

        // ✅ Confirmación con reacción de éxito
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "✅", key: msg.key } // Emoji de confirmación ✅
        });

    } catch (error) {
        console.error("❌ Error en el comando .bal:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Ocurrió un error al obtener tu saldo. Inténtalo de nuevo.*" 
        }, { quoted: msg });

        // ❌ Enviar reacción de error
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "❌", key: msg.key } // Emoji de error ❌
        });
    }
    break;
}
        

case 'dame': {
    try {
        // Verificar si el usuario es el owner
        if (!isOwner(sender)) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "⛔ *Este comando solo puede ser usado por el owner del bot.*"
            }, { quoted: msg });
            return;
        }

        // Extraer la cantidad desde "text"
        const inputCantidad = (text || "").trim();

        // Verificar que se haya ingresado algo y que sea un número válido
        if (!inputCantidad || isNaN(inputCantidad) || parseInt(inputCantidad) <= 0) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `⚠️ *Uso incorrecto.*\nEjemplo: \`${global.prefix}dame 5000\``
            }, { quoted: msg });
            return;
        }

        let cantidad = parseInt(inputCantidad);

        // Archivo JSON donde se guardan los datos del RPG
        const rpgFile = "./rpg.json";
        if (!fs.existsSync(rpgFile)) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: "❌ *No hay datos de jugadores registrados.*"
            }, { quoted: msg });
            return;
        }

        // Cargar los datos del RPG
        let rpgData = JSON.parse(fs.readFileSync(rpgFile, "utf-8"));

        // Verificar si el owner está registrado
        let userId = msg.key.participant || msg.key.remoteJid;
        if (!rpgData.usuarios[userId]) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ *No tienes una cuenta en el gremio Azura Ultra.*\n\n📜 Usa \`${global.prefix}rpg <nombre> <edad>\` para registrarte.`
            }, { quoted: msg });
            return;
        }

        // Dar los diamantes al owner
        rpgData.usuarios[userId].diamantes += cantidad;

        // Guardar cambios en el archivo JSON
        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

        // Mensaje de confirmación 💎
        let mensaje = `🎉 *¡Diamantes añadidos con éxito!* 🎉\n\n`;
        mensaje += `💰 *Has recibido:* ${cantidad} diamantes\n`;
        mensaje += `💎 *Total actual:* ${rpgData.usuarios[userId].diamantes} diamantes\n\n`;
        mensaje += `📜 Usa \`${global.prefix}bal\` para ver tu saldo.`;

        await sock.sendMessage(msg.key.remoteJid, { text: mensaje }, { quoted: msg });

        // ✅ Reacción de confirmación
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "💎", key: msg.key }
        });

    } catch (error) {
        console.error("❌ Error en el comando .dame:", error);
        await sock.sendMessage(msg.key.remoteJid, {
            text: `❌ *Ocurrió un error al intentar añadir diamantes. Inténtalo de nuevo.*`
        }, { quoted: msg });

        // ❌ Reacción de error
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "❌", key: msg.key }
        });
    }
    break;
}        

        
        
case 'tiendamascotas': {
    try {
        // 🔄 Enviar reacción mientras se procesa el comando
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "🐾", key: msg.key } // Emoji de mascota 🐾
        });

        // Leer el archivo RPG JSON
        const rpgFile = "./rpg.json";
        let rpgData = fs.existsSync(rpgFile) ? JSON.parse(fs.readFileSync(rpgFile, "utf-8")) : { tiendaMascotas: [] };

        // Verificar si hay mascotas en la tienda
        if (!rpgData.tiendaMascotas || rpgData.tiendaMascotas.length === 0) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "❌ *Actualmente no hay mascotas en la tienda.*\n🔹 Usa `.addmascota` para agregar nuevas mascotas." 
            }, { quoted: msg });
            return;
        }

        // Explicación sobre la compra de mascotas 📜
        let mensaje = `🏪 *Tienda de Mascotas - Azura Ultra* 🏪\n\n`;
        mensaje += `🐶 *Aquí puedes comprar mascotas para mejorar tu equipo.*\n`;
        mensaje += `🛍️ *Para comprar una mascota, usa:* \n`;
        mensaje += `   📌 \`${global.prefix}compra <nombre_mascota>\`\n`;
        mensaje += `   📌 \`${global.prefix}compra <número_mascota>\`\n\n`;
        mensaje += `📜 Usa \`${global.prefix}menurpg\` para más información.\n\n`;

        // Mostrar todas las mascotas disponibles 🐾
        rpgData.tiendaMascotas.forEach((mascota, index) => {
            let habilidadesMascota = Object.entries(mascota.habilidades)
                .map(([habilidad, nivel]) => `      🔹 ${habilidad} (Nivel ${nivel})`)
                .join("\n");

            mensaje += `╔══════════════════╗\n`;
            mensaje += `🔹 *${index + 1}. ${mascota.nombre}*\n`;
            mensaje += `   📊 *Rango:* ${mascota.rango}\n`;
            mensaje += `   🎚️ *Nivel Inicial:* ${mascota.nivel || 1}\n`; 
            mensaje += `   ❤️ *Vida:* ${mascota.vida || 100} HP\n`;
            mensaje += `   ✨ *Experiencia:* ${mascota.experiencia || 0} / ${mascota.xpMax} XP\n`;
            mensaje += `   🌟 *Habilidades:*\n${habilidadesMascota}\n`;
            mensaje += `   💎 *Precio:* ${mascota.precio} diamantes\n`;
            mensaje += `╚══════════════════╝\n\n`;
        });

        // Explicación Final 📜
        mensaje += `📜 **Explicación Final:**\n`;
        mensaje += `🔹 Usa *${global.prefix}compra <nombre_mascota>* para comprar la mascota que quieras.\n`;
        mensaje += `🔹 También puedes usar *${global.prefix}compra <número_mascota>* si prefieres usar el número de la lista.\n`;
        mensaje += `🔹 Usa *${global.prefix}vermascotas* para ver todas las mascotas que has comprado.\n`;
        mensaje += `🔹 Usa *${global.prefix}mascota <número>* para cambiar tu mascota principal.\n\n`;
        mensaje += `🚀 **¡Colecciona y entrena las mejores mascotas en el Gremio Azura Ultra!** 🏆`;

        // Enviar mensaje con el **video como GIF** 🎥
        await sock.sendMessage(msg.key.remoteJid, { 
            video: { url: "https://cdn.dorratz.com/files/1740573307122.mp4" },
            gifPlayback: true, // Se reproduce como GIF
            caption: mensaje
        }, { quoted: msg });

        // ✅ Confirmación con reacción de éxito
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "✅", key: msg.key } // Emoji de confirmación ✅
        });

    } catch (error) {
        console.error("❌ Error en el comando .tiendamascotas:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Ocurrió un error al cargar la tienda de mascotas. Inténtalo de nuevo.*" 
        }, { quoted: msg });

        // ❌ Enviar reacción de error
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "❌", key: msg.key } // Emoji de error ❌
        });
    }
    break;
}
        
case 'tiendaper': {
    try {
        // 🔄 Enviar reacción de carga mientras se procesa el comando
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "🛍️", key: msg.key } // Emoji de tienda 🛍️
        });

        // Leer el archivo RPG JSON
        const rpgFile = "./rpg.json";
        let rpgData = fs.existsSync(rpgFile) ? JSON.parse(fs.readFileSync(rpgFile, "utf-8")) : { tiendaPersonajes: [] };

        // Verificar si hay personajes en la tienda
        if (!rpgData.tiendaPersonajes || rpgData.tiendaPersonajes.length === 0) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "❌ *Actualmente no hay personajes en la tienda.*\n🔹 Usa `.addper` para agregar nuevos personajes." 
            }, { quoted: msg });
            return;
        }

        // Explicación de compra al inicio 📜
        let mensaje = `🏪 *Tienda de Personajes - Azura Ultra* 🏪\n\n`;
        mensaje += `🎭 *Compra personajes de anime y mejora sus habilidades.*\n`;
        mensaje += `🛒 *Para comprar un personaje usa:* \n`;
        mensaje += `   📌 \`${global.prefix}comprar <nombre_personaje>\`\n`;
        mensaje += `   📌 \`${global.prefix}comprar <número_personaje>\`\n`;
        mensaje += `📜 Usa \`${global.prefix}menurpg\` para más información.\n\n`;

        // Crear la lista de personajes disponibles 📜
        rpgData.tiendaPersonajes.forEach((personaje, index) => {
            let habilidadesPersonaje = Object.entries(personaje.habilidades)
                .map(([habilidad, datos]) => `      🔹 ${habilidad} (Nivel ${datos.nivel || 1})`)
                .join("\n");

            mensaje += `*╔══════════════════╗*\n`;
            mensaje += `🔹 *${index + 1}. ${personaje.nombre}*\n`;
            mensaje += `   🎚️ *Nivel Inicial:* ${personaje.nivel || 1}\n`;
            mensaje += `   ❤️ *Vida:* ${personaje.vida || 100} HP\n`;
            mensaje += `   ✨ *Experiencia:* ${personaje.experiencia || 0} / 1000 XP\n`;
            mensaje += `   🌟 *Habilidades:*\n${habilidadesPersonaje}\n`;
            mensaje += `   💎 *Precio:* ${personaje.precio} diamantes\n`;
            mensaje += `*╚══════════════════╝*\n\n`;
        });

        // Enviar mensaje con el video como GIF 🎥
        await sock.sendMessage(msg.key.remoteJid, { 
            video: { url: "https://cdn.dorratz.com/files/1740568203122.mp4" },
            gifPlayback: true, // Se reproduce como GIF
            caption: mensaje
        }, { quoted: msg });

        // ✅ Confirmación con reacción de éxito
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "✅", key: msg.key } // Emoji de confirmación ✅
        });

    } catch (error) {
        console.error("❌ Error en el comando .tiendaper:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Ocurrió un error al cargar la tienda de personajes. Inténtalo de nuevo.*" 
        }, { quoted: msg });

        // ❌ Enviar reacción de error
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "❌", key: msg.key } // Emoji de error ❌
        });
    }
    break;
}      

        
case 'addper': {
    try {
        // 🔄 Reacción antes de agregar el personaje
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "🎭", key: msg.key } // Emoji de personaje 🎭
        });

        // Verificar permisos (Solo Owner)
        if (!isOwner(sender)) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "⛔ *Solo el propietario del bot puede agregar personajes a la tienda.*" 
            }, { quoted: msg });
            return;
        }

        // Verificar si se enviaron todos los parámetros
        if (args.length < 5) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `⚠️ *Uso incorrecto.*\n\n📌 Ejemplo: \`${global.prefix}addper Goku Kamehameha UltraInstinto https://cdn.example.com/goku.jpg 5000\`` 
            }, { quoted: msg });
            return;
        }

        // Extraer los datos ingresados
        let nombre = args[0]; // Nombre del personaje
        let habilidad1 = args[1]; // Primera habilidad
        let habilidad2 = args[2]; // Segunda habilidad
        let urlImagen = args[3]; // URL de la imagen o GIF
        let precio = parseInt(args[4]); // Precio en 💎 Diamantes

        // Validar que el precio sea un número
        if (isNaN(precio) || precio < 0) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "❌ *El precio debe ser un número válido mayor o igual a 0.*" 
            }, { quoted: msg });
            return;
        }

        // Definir los rangos de los personajes
        const rangosPersonajes = [
            "🌟 Principiante", "⚔️ Guerrero", "🔥 Maestro", "👑 Élite", "🌀 Legendario", "💀 Dios de la Batalla"
        ];
        
        let rangoInicial = rangosPersonajes[0]; // Todos los personajes empiezan con rango Principiante

        // Leer o crear el archivo rpg.json
        const rpgFile = "./rpg.json";
        let rpgData = fs.existsSync(rpgFile) ? JSON.parse(fs.readFileSync(rpgFile, "utf-8")) : { tiendaPersonajes: [] };

        // Verificar si el personaje ya está en la tienda
        let personajeExistente = rpgData.tiendaPersonajes.find(p => p.nombre.toLowerCase() === nombre.toLowerCase());
        if (personajeExistente) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "⚠️ *Ese personaje ya está en la tienda.* Usa otro nombre." 
            }, { quoted: msg });
            return;
        }

        // Crear el objeto del nuevo personaje con nivel, vida y experiencia
        let nuevoPersonaje = {
            nombre: nombre,
            rango: rangoInicial,
            nivel: 1, // Nivel inicial
            experiencia: 0, // Exp inicial
            xpMax: 1000, // Exp máxima inicial
            vida: 100, // Vida inicial
            habilidades: { 
                [habilidad1]: 1,
                [habilidad2]: 1
            },
            imagen: urlImagen,
            precio: precio
        };

        // Agregar el personaje a la tienda
        rpgData.tiendaPersonajes.push(nuevoPersonaje);
        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

        // Enviar confirmación con la imagen
        await sock.sendMessage(msg.key.remoteJid, { 
            image: { url: urlImagen },
            caption: `✅ *Nuevo Personaje Agregado a la Tienda* ✅\n\n` +
                     `🎭 *Nombre:* ${nombre}\n` +
                     `📊 *Rango:* ${rangoInicial}\n` +
                     `🆙 *Nivel:* 1\n` +
                     `❤️ *Vida:* 100 HP\n` +
                     `✨ *Experiencia:* 0 / 1000 XP\n` +
                     `🌟 *Habilidades:*\n` +
                     `   🔹 ${habilidad1} (Nivel 1)\n` +
                     `   🔹 ${habilidad2} (Nivel 1)\n` +
                     `💎 *Precio:* ${precio} diamantes\n\n` +
                     `📌 ¡Disponible en la tienda de personajes ahora!`
        }, { quoted: msg });

        // ✅ Reacción de confirmación
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "✅", key: msg.key }
        });

    } catch (error) {
        console.error("❌ Error en el comando .addper:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Ocurrió un error al agregar el personaje. Inténtalo de nuevo.*" 
        }, { quoted: msg });

        // ❌ Reacción de error
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "❌", key: msg.key }
        });
    }
    break;
}
            
case 'addmascota': { 
    try {
        // 🔄 Reacción antes de agregar la mascota
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "🐾", key: msg.key } // Emoji de patas 🐾
        });

        // Verificar permisos: solo el owner puede usar este comando
        if (!isOwner(sender)) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "⛔ *Solo el propietario del bot puede agregar mascotas a la tienda.*" 
            }, { quoted: msg });
            return;
        }

        // Verificar si se enviaron todos los parámetros
        if (args.length < 5) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `⚠️ *Uso incorrecto.*\n\n📌 Ejemplo: \`${global.prefix}addmascota 🐕Perro rápido protector https://cdn.example.com/perro.jpg 3000\`` 
            }, { quoted: msg });
            return;
        }

        // Extraer los datos ingresados
        let nombre = args[0]; // Emoji + Nombre
        let habilidad1 = args[1]; // Primera habilidad
        let habilidad2 = args[2]; // Segunda habilidad
        let urlImagen = args[3]; // URL de la imagen o GIF
        let precio = parseInt(args[4]); // Precio en 💎 Diamantes

        // Validar que el precio sea un número
        if (isNaN(precio) || precio < 0) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "❌ *El precio debe ser un número válido mayor o igual a 0.*" 
            }, { quoted: msg });
            return;
        }

        // Definir los rangos de las mascotas
        const rangosMascotas = [
            "🐣 Principiante", "🐾 Novato", "🦴 Aprendiz", "🐕 Iniciado", "🦊 Experimentado",
            "🐅 Avanzado", "🐉 Veterano", "🦅 Élite", "🦄 Legendario", "🔥 Divino"
        ];
        
        let rangoInicial = rangosMascotas[0]; // Todas las mascotas empiezan con rango Principiante

        // Leer o crear el archivo rpg.json
        const rpgFile = "./rpg.json";
        let rpgData = fs.existsSync(rpgFile) ? JSON.parse(fs.readFileSync(rpgFile, "utf-8")) : { tiendaMascotas: [] };

        // Verificar si la mascota ya está en la tienda
        let mascotaExistente = rpgData.tiendaMascotas.find(m => m.nombre === nombre);
        if (mascotaExistente) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "⚠️ *Esa mascota ya está en la tienda.* Usa otro nombre." 
            }, { quoted: msg });
            return;
        }

        // Crear el objeto de la nueva mascota
        let nuevaMascota = {
            nombre: nombre,
            rango: rangoInicial,
            nivel: 1, // Nivel inicial
            experiencia: 0, // Exp inicial
            xpMax: 500, // Exp máxima inicial
            habilidades: { 
                [habilidad1]: 1,
                [habilidad2]: 1
            },
            vida: 100, // Vida inicial
            imagen: urlImagen,
            precio: precio
        };

        // Agregar la mascota a la tienda
        rpgData.tiendaMascotas.push(nuevaMascota);
        fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

        // Enviar confirmación con la imagen
        await sock.sendMessage(msg.key.remoteJid, { 
            image: { url: urlImagen },
            caption: `✅ *Nueva Mascota Agregada a la Tienda* ✅\n\n` +
                     `🦴 *Nombre:* ${nombre}\n` +
                     `📊 *Rango:* ${rangoInicial}\n` +
                     `🆙 *Nivel:* 1\n` +
                     `❤️ *Vida:* 100\n` +
                     `✨ *Experiencia:* 0 / 500 XP\n` +
                     `🌟 *Habilidades:*\n` +
                     `   🔹 ${habilidad1} (Nivel 1)\n` +
                     `   🔹 ${habilidad2} (Nivel 1)\n` +
                     `💎 *Precio:* ${precio} diamantes\n\n` +
                     `🔹 ¡Disponible en la tienda ahora!`
        }, { quoted: msg });

        // ✅ Reacción de éxito
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "✅", key: msg.key } 
        });

    } catch (error) {
        console.error("❌ Error en el comando .addmascota:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Ocurrió un error al agregar la mascota. Inténtalo de nuevo.*" 
        }, { quoted: msg });

        // ❌ Reacción de error
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "❌", key: msg.key } 
        });
    }
    break;
}

        
case 'toimg': {
    const axios = require('axios');
    const fs = require('fs');
    const path = require('path');
    const { writeFileSync } = fs;
    const { exec } = require('child_process');

    if (!msg.message.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage) {
        return sock.sendMessage(msg.key.remoteJid, { 
            text: "⚠️ *Debes responder a un sticker para convertirlo en imagen.*" 
        }, { quoted: msg });
    }

    // Enviar reacción de proceso ⏳
    await sock.sendMessage(msg.key.remoteJid, { 
        react: { text: "⏳", key: msg.key } 
    });

    let quoted = msg.message.extendedTextMessage.contextInfo.quotedMessage.stickerMessage;
    let stickerStream = await downloadContentFromMessage(quoted, "sticker");

    let buffer = Buffer.alloc(0);
    for await (const chunk of stickerStream) {
        buffer = Buffer.concat([buffer, chunk]);
    }

    if (buffer.length === 0) {
        return sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Error al procesar el sticker.*" 
        }, { quoted: msg });
    }

    const stickerPath = path.join(__dirname, 'tmp', `${Date.now()}.webp`);
    const imagePath = stickerPath.replace('.webp', '.jpg');

    writeFileSync(stickerPath, buffer); // Guardar el sticker temporalmente

    // Convertir de WebP a JPG con ffmpeg
    exec(`ffmpeg -i "${stickerPath}" "${imagePath}"`, async (error) => {
        if (error) {
            console.error("❌ Error al convertir sticker a imagen:", error);
            return sock.sendMessage(msg.key.remoteJid, { 
                text: "❌ *No se pudo convertir el sticker en imagen.*" 
            }, { quoted: msg });
        }

        // Enviar la imagen resultante
        await sock.sendMessage(msg.key.remoteJid, { 
            image: { url: imagePath },
            caption: "🖼️ *Aquí está tu imagen convertida del sticker.*"
        }, { quoted: msg });

        // Eliminar archivos temporales después de enviarlos
        fs.unlinkSync(stickerPath);
        fs.unlinkSync(imagePath);

        // Enviar reacción de éxito ✅
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "✅", key: msg.key } 
        });
    });

    break;
}

        
case 'speedtest':
case 'speed': {
    const cp = require('child_process');
    const { promisify } = require('util');
    const axios = require('axios');
    const fs = require('fs');
    const path = require('path');
    
    const exec = promisify(cp.exec).bind(cp);

    // Enviar una reacción antes de procesar el comando ⏳
    await sock.sendMessage(msg.key.remoteJid, { 
        react: { text: "⏳", key: msg.key } 
    });

    await sock.sendMessage(msg.key.remoteJid, {
        text: '🚀 Prueba de velocidad en curso... ⏳',
        mentions: [msg.key.participant || msg.key.remoteJid],
    }, { quoted: msg });

    let o;
    try {
        o = await exec('python3 speed.py --secure --share');
    } catch (e) {
        o = e;
    } finally {
        const { stdout, stderr } = o;
        
        if (stdout.trim()) {
            let result = stdout.trim();
            let imageUrlMatch = result.match(/(https?:\/\/[^\s]+)/); // Buscar la URL de la imagen de Speedtest
            
            if (imageUrlMatch) {
                let imageUrl = imageUrlMatch[0];

                try {
                    // Descargar la imagen de Speedtest
                    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                    const imageBuffer = Buffer.from(response.data);
                    const imagePath = path.join(__dirname, 'tmp', 'speedtest.png');

                    fs.writeFileSync(imagePath, imageBuffer); // Guardar la imagen temporalmente

                    // Enviar imagen con los resultados
                    await sock.sendMessage(msg.key.remoteJid, { 
                        image: { url: imagePath },
                        caption: `📊 *Resultados de Speedtest:*\n\n${result.replace(imageUrl, '').trim()}`
                    }, { quoted: msg });

                    fs.unlinkSync(imagePath); // Eliminar la imagen después de enviarla
                } catch (error) {
                    console.error('Error al descargar la imagen:', error);
                    await sock.sendMessage(msg.key.remoteJid, { 
                        text: `⚠️ No se pudo descargar la imagen de Speedtest, pero aquí están los resultados:\n\n${result}`
                    }, { quoted: msg });
                }
            } else {
                // Si no hay URL de imagen, solo enviar el texto del resultado
                await sock.sendMessage(msg.key.remoteJid, { text: result }, { quoted: msg });
            }
        }
        
        if (stderr.trim()) {
            await sock.sendMessage(msg.key.remoteJid, { text: `⚠️ Error en Speedtest:\n\n${stderr}` }, { quoted: msg });
            console.log(stderr);
        }

        // Enviar una reacción de confirmación ✅ después de completar la prueba
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "✅", key: msg.key } 
        });
    }
    break;
}

            
case "listpacks":
    try {
        // Leer el archivo donde se guardan los paquetes de stickers
        let stickerData = JSON.parse(fs.readFileSync(stickersFile, "utf-8"));
        let packNames = Object.keys(stickerData);

        if (packNames.length === 0) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "❌ *No hay paquetes de stickers creados aún.*\n🛠️ Usa `.newpack <nombre>` para crear uno." 
            }, { quoted: msg });
            return;
        }

        // Crear una lista con los paquetes y la cantidad de stickers 📦
        let packList = `📦 *Paquetes de Stickers Disponibles:*\n\n`;
        packNames.forEach((pack, index) => {
            let stickerCount = stickerData[pack].length; // Cantidad de stickers en el paquete
            packList += `🔹 *${index + 1}.* ${pack}  📌 (${stickerCount} stickers)\n`;
        });

        packList += `\n📌 Usa *${global.prefix}sendpack <nombre>* para enviar un paquete.\n💡 Usa *${global.prefix}addsticker <nombre>* para agregar más stickers.`;

        // Reaccionar antes de enviar la lista 📜
        await sock.sendMessage(msg.key.remoteJid, { 
            react: { text: "📜", key: msg.key } 
        });

        // Enviar la lista de paquetes al usuario 📩
        await sock.sendMessage(msg.key.remoteJid, { text: packList }, { quoted: msg });

    } catch (error) {
        console.error("❌ Error en el comando .listpacks:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Hubo un error al obtener la lista de paquetes. Inténtalo de nuevo.*" 
        }, { quoted: msg });
    }
    break;

case "sendpack":
    try {
        if (!args[0]) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "⚠️ *Debes especificar el nombre del paquete.*\nEjemplo: `.sendpack Memes`" 
            }, { quoted: msg });
            return;
        }

        let packName = args.join(" ");

        // Cargar los paquetes de stickers desde el JSON
        let stickerData = JSON.parse(fs.readFileSync(stickersFile, "utf-8"));

        // Verificar si el paquete existe
        if (!stickerData[packName]) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "❌ *Ese paquete no existe.* Usa `.listpacks` para ver los disponibles." 
            }, { quoted: msg });
            return;
        }

        let stickerPaths = stickerData[packName];

        if (stickerPaths.length === 0) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "⚠️ *Este paquete no tiene stickers guardados.* Usa `.addsticker <paquete>` para añadir." 
            }, { quoted: msg });
            return;
        }

        // Enviar cada sticker desde la carpeta 'stickers/'
        for (let stickerFileName of stickerPaths) {
            let stickerPath = path.join(stickersDir, stickerFileName); // Asegurar la ruta correcta

            // Verificar si el archivo del sticker existe en la carpeta
            if (fs.existsSync(stickerPath)) {
                await sock.sendMessage(msg.key.remoteJid, { 
                    sticker: { url: stickerPath } 
                }, { quoted: msg });
            } else {
                console.warn(`⚠️ Sticker no encontrado: ${stickerPath}`);
            }
        }

        await sock.sendMessage(msg.key.remoteJid, { 
            text: `✅ *Paquete de stickers '${packName}' enviado.*` 
        }, { quoted: msg });

    } catch (error) {
        console.error("❌ Error en el comando .sendpack:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Ocurrió un error al enviar el paquete de stickers.*" 
        }, { quoted: msg });
    }
    break;

        
case "addsticker":
    try {
        if (!args[0]) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "⚠️ *Debes especificar el nombre del paquete al que quieres agregar el sticker.*\nEjemplo: `.addsticker Memes`" 
            }, { quoted: msg });
            return;
        }

        let packName = args.join(" ");

        // Verificar si el paquete existe
        let stickerData = JSON.parse(fs.readFileSync(stickersFile, "utf-8"));

        if (!stickerData[packName]) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "❌ *Ese paquete no existe. Crea uno primero con `.newpack <nombre>`*" 
            }, { quoted: msg });
            return;
        }

        // Verificar si el usuario respondió a un sticker
        let quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted || !quoted.stickerMessage) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "⚠️ *Responde a un sticker con `.addsticker <nombre>` para agregarlo al paquete.*" 
            }, { quoted: msg });
            return;
        }

        // Descargar el sticker
        let stream = await downloadContentFromMessage(quoted.stickerMessage, "sticker");
        let buffer = Buffer.alloc(0);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        let fileName = `${Date.now()}.webp`;
        let filePath = path.join(stickersDir, fileName); // Asegurar la ruta correcta

        // Guardar el sticker en la carpeta
        fs.writeFileSync(filePath, buffer);

        // Agregar el sticker al paquete en el JSON (solo el nombre del archivo, no la ruta completa)
        stickerData[packName].push(fileName);
        fs.writeFileSync(stickersFile, JSON.stringify(stickerData, null, 2));

        await sock.sendMessage(msg.key.remoteJid, { 
            text: `✅ *Sticker agregado al paquete '${packName}'*` 
        }, { quoted: msg });

    } catch (error) {
        console.error("❌ Error en el comando .addsticker:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Ocurrió un error al agregar el sticker al paquete.*" 
        }, { quoted: msg });
    }
    break;
        
case "newpack":
    try {
        if (!args[0]) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "⚠️ *Debes especificar un nombre para el paquete.*\nEjemplo: `.newpack Memes`" 
            }, { quoted: msg });
            return;
        }

        let packName = args.join(" ");

        // Verificar si el archivo stickers.json existe, si no, crearlo
        if (!fs.existsSync(stickersFile)) {
            fs.writeFileSync(stickersFile, JSON.stringify({}, null, 2));
        }

        // Leer el archivo JSON
        let stickerData = JSON.parse(fs.readFileSync(stickersFile, "utf-8"));

        // Verificar si el paquete ya existe
        if (stickerData[packName]) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "❌ *Ese paquete ya existe. Usa otro nombre.*" 
            }, { quoted: msg });
            return;
        }

        // Crear el paquete de stickers
        stickerData[packName] = [];

        // Guardar la estructura en el JSON
        fs.writeFileSync(stickersFile, JSON.stringify(stickerData, null, 2));

        await sock.sendMessage(msg.key.remoteJid, { 
            text: `✅ *Paquete de stickers '${packName}' creado exitosamente.*` 
        }, { quoted: msg });

    } catch (error) {
        console.error("❌ Error en el comando .newpack:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Ocurrió un error al crear el paquete de stickers.*" 
        }, { quoted: msg });
    }
    break;
        
case "rest":
    try {
        const senderNumber = (msg.key.participant || sender).replace("@s.whatsapp.net", "");
        const botNumber = sock.user.id.split(":")[0]; // Obtener el número del bot correctamente
        const isBotMessage = msg.key.fromMe; // True si el mensaje es del bot

        if (!isOwner(senderNumber) && !isBotMessage) { 
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "⛔ *Solo los dueños del bot o el bot mismo pueden reiniciar el servidor.*"
            }, { quoted: msg });
            return;
        }

        // 🟢 Enviar reacción antes de reiniciar
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "🔄", key: msg.key } // Emoji de reinicio
        });

        // Enviar mensaje de confirmación
        await sock.sendMessage(msg.key.remoteJid, {
            text: "🔄 *Reiniciando el servidor...* \nEspera unos segundos..."
        }, { quoted: msg });

        // Definir la ruta del archivo donde se guardará el último chat que ejecutó .rest
        const lastRestarterFile = "./lastRestarter.json";

        // Verificar si el archivo existe, si no, crearlo
        if (!fs.existsSync(lastRestarterFile)) {
            fs.writeFileSync(lastRestarterFile, JSON.stringify({ chatId: "" }, null, 2));
        }

        // Guardar el chat donde se usó el comando para avisar cuando el bot esté en línea
        fs.writeFileSync(lastRestarterFile, JSON.stringify({ chatId: msg.key.remoteJid }, null, 2));

        // Esperar unos segundos antes de reiniciar
        setTimeout(() => {
            process.exit(1); // Reiniciar el bot (depende de tu gestor de procesos)
        }, 3000);

    } catch (error) {
        console.error("❌ Error en el comando rest:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Error al intentar reiniciar el servidor.*"
        }, { quoted: msg });
    }
    break;
        
case "setprefix":
    try {
        // Obtener el número del bot
        const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";

        // Verificar si el remitente es un dueño autorizado o el mismo bot
        const isBotMessage = msg.key.fromMe || sender === botNumber;

        if (!isOwner(sender) && !isBotMessage) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "⛔ *Solo los dueños del bot o el bot mismo pueden cambiar el prefijo.*" 
            }, { quoted: msg });
            return;
        }

        // Verificar si el usuario proporcionó un nuevo prefijo
        if (!args[0]) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "⚠️ *Debes especificar un nuevo prefijo.*\nEjemplo: `.setprefix !`" 
            }, { quoted: msg });
            return;
        }

        const newPrefix = args[0];

        // Verificar si el nuevo prefijo está permitido
        if (!allowedPrefixes.includes(newPrefix)) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: "❌ *Prefijo inválido.* Usa un solo carácter o emoji permitido." 
            }, { quoted: msg });
            return;
        }

        // Guardar el nuevo prefijo en `config.json`
        fs.writeFileSync(configFilePath, JSON.stringify({ prefix: newPrefix }, null, 2));

        // Actualizar `global.prefix`
        global.prefix = newPrefix;

        // Confirmación del cambio
        await sock.sendMessage(msg.key.remoteJid, { 
            text: `✅ *Prefijo cambiado a:* *${newPrefix}*` 
        }, { quoted: msg });

        console.log(`🔄 Prefijo cambiado a: ${newPrefix}`);

    } catch (error) {
        console.error("❌ Error en el comando .setprefix:", error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Error al cambiar el prefijo.*" 
        }, { quoted: msg });
    }
    break;
             
        
        
case 'help':
case 'info':
  try {
    await sock.sendMessage(msg.key.remoteJid, {
      react: { text: "ℹ️", key: msg.key }
    });

    const infoMessage = `╭─ *🤖 AZURA ULTRA* ─╮
│ 🔹 *Prefijo actual:* ${global.prefix}
│ 👑 *Dueño:* Russell xz
│ 🛠️ *Bot desarrollado desde cero* con la ayuda de Chatgpt.
│ 🚀 *Creado por:* Russell
│  
├─〔 📥 *Descargas Redes* 〕─
│ 📌 *IG, TikTok y FB*  
│    - 👤 *Colaboró:* DIEGO-OFC  
│  
│ 📌 *Descargas youtube*
│     (.play, .play2, .ytmp3, .ytmp4)  
│    - 👤 *Colaboró:* Eliasar54  
│  
├─〔 📜 *Menús y Comandos* 〕─
│ 📌 Usa *${global.prefix}menu* para ver los comandos principales.  
│ 📌 Usa *${global.prefix}allmenu* para ver todos los comandos disponibles.  
│ 📌 Usa *${global.prefix}menuaudio* para ver los comandos de multimedia y guardado.  
╰──────────────────╯`;

    await sock.sendMessage2(msg.key.remoteJid,
  {
    image: { url: "https://cdn.russellxz.click/6984cf1b.jpeg" }, 
    caption: infoMessage 
  },
  msg 
);
    

  } catch (error) {
    console.error("Error en comando info:", error);
    await sock.sendMessage2(
      msg.key.remoteJid,
      "❌ *Ocurrió un error al mostrar la información. Inténtalo de nuevo.*",
      msg
    );
  }
  break;
        
        

case "pong":
    try {
        const now = new Date();
        const options = { 
            weekday: "long", 
            year: "numeric", 
            month: "long", 
            day: "numeric", 
            hour: "2-digit", 
            minute: "2-digit", 
            second: "2-digit", 
            timeZoneName: "short" 
        };
        const formattedDate = now.toLocaleDateString("es-ES", options);

        // Obtener el tiempo activo en días, horas, minutos y segundos
        const uptime = os.uptime();
        const uptimeDays = Math.floor(uptime / 86400);
        const uptimeHours = Math.floor((uptime % 86400) / 3600);
        const uptimeMinutes = Math.floor((uptime % 3600) / 60);
        const uptimeSeconds = Math.floor(uptime % 60);
        const uptimeFormatted = `${uptimeDays} días, ${uptimeHours}h ${uptimeMinutes}m ${uptimeSeconds}s`;

        // Información del sistema
        const freeMem = os.freemem();
        const totalMem = os.totalmem();
        const usedMem = totalMem - freeMem;
        const freeMemGB = (freeMem / 1024 / 1024 / 1024).toFixed(2);
        const totalMemGB = (totalMem / 1024 / 1024 / 1024).toFixed(2);
        const usedMemGB = (usedMem / 1024 / 1024 / 1024).toFixed(2);

        const cpuModel = os.cpus()[0].model;
        const numCores = os.cpus().length;
        const loadAvg = os.loadavg()[0].toFixed(2);
        const diskUsage = execSync("df -h / | awk 'NR==2 {print $3 \" / \" $2}'").toString().trim();

        // Reaccionar al mensaje con un emoji
        await sock.sendMessage(msg.key.remoteJid, {
            react: {
                text: "🏓",
                key: msg.key
            }
        });

        // Enviar mensaje con imagen y detalles del servidor
        await sock.sendMessage(msg.key.remoteJid, {
            image: { url: "https://cdn.dorratz.com/files/1740372224017.jpg" }, 
            caption: `🏓 *Ping! El bot está activo.*\n\n` +
                     `📅 *Fecha y hora actual:* ${formattedDate}\n\n` +
                     `🕒 *Tiempo Activo:* ${uptimeFormatted}\n\n` +
                     `💻 *Información del Servidor:*\n` +
                     `🔹 *CPU:* ${cpuModel}\n` +
                     `🔹 *Núcleos:* ${numCores}\n` +
                     `🔹 *Carga del sistema:* ${loadAvg}\n\n` +
                     `🖥️ *Memoria RAM:*\n` +
                     `🔹 *Usada:* ${usedMemGB}GB\n` +
                     `🔹 *Libre:* ${freeMemGB}GB\n` +
                     `🔹 *Total:* ${totalMemGB}GB\n\n` +
                     `💾 *Disco:* ${diskUsage}\n\n` +
                     `🌐 *Alojado en:* *Sky Ultra Plus* 🚀\n` +
                     `📌 *Proveedor de Hosting de Confianza*`,
            quoted: msg // Responder citando al mensaje original
        });

    } catch (error) {
        console.error("❌ Error en el comando ping:", error);
        await sock.sendMessage(msg.key.remoteJid, {
            text: "❌ *Error al obtener información del servidor.*",
            quoted: msg // Responder citando al mensaje original
        });
    }
    break;
            
case "get": {
    try {
        if (!msg.message.extendedTextMessage || 
            !msg.message.extendedTextMessage.contextInfo || 
            !msg.message.extendedTextMessage.contextInfo.quotedMessage) {
            return sock.sendMessage(
                msg.key.remoteJid,
                { text: "❌ *Error:* Debes responder a un estado de WhatsApp para descargarlo. 📝" },
                { quoted: msg }
            );
        }

        const quotedMsg = msg.message.extendedTextMessage.contextInfo.quotedMessage;
        let mediaType, mediaMessage;

        if (quotedMsg.imageMessage) {
            mediaType = "image";
            mediaMessage = quotedMsg.imageMessage;
        } else if (quotedMsg.videoMessage) {
            mediaType = "video";
            mediaMessage = quotedMsg.videoMessage;
        } else if (quotedMsg.audioMessage) {
            mediaType = "audio";
            mediaMessage = quotedMsg.audioMessage;
        } else if (quotedMsg.conversation || quotedMsg.extendedTextMessage) {
            mediaType = "text";
            mediaMessage = quotedMsg.conversation || quotedMsg.extendedTextMessage.text;
        } else {
            return sock.sendMessage(
                msg.key.remoteJid,
                { text: "❌ *Error:* Solo puedes descargar *imágenes, videos, audios y textos* de estados de WhatsApp." },
                { quoted: msg }
            );
        }

        // Enviar reacción mientras procesa
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "⏳", key: msg.key } 
        });

        if (mediaType === "text") {
            // Convertir el texto en una imagen
            const { createCanvas, loadImage } = require("canvas");
            const canvas = createCanvas(500, 250);
            const ctx = canvas.getContext("2d");

            // Fondo blanco
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Configurar texto
            ctx.fillStyle = "#000000";
            ctx.font = "20px Arial";
            ctx.fillText(mediaMessage, 20, 100, 460); // Ajustar el texto dentro del cuadro

            // Guardar la imagen en buffer
            const buffer = canvas.toBuffer("image/png");

            // Enviar la imagen del estado de texto
            await sock.sendMessage(msg.key.remoteJid, { 
                image: buffer, 
                caption: "📝 *Estado de texto convertido en imagen*" 
            }, { quoted: msg });

        } else {
            // Descargar el multimedia
            const mediaStream = await new Promise(async (resolve, reject) => {
                try {
                    const stream = await downloadContentFromMessage(mediaMessage, mediaType);
                    let buffer = Buffer.alloc(0);
                    for await (const chunk of stream) {
                        buffer = Buffer.concat([buffer, chunk]);
                    }
                    resolve(buffer);
                } catch (err) {
                    reject(null);
                }
            });

            if (!mediaStream || mediaStream.length === 0) {
                await sock.sendMessage(msg.key.remoteJid, { text: "❌ *Error:* No se pudo descargar el estado. Intenta de nuevo." }, { quoted: msg });
                return;
            }

            // Enviar el archivo descargado al chat
            let messageOptions = {
                mimetype: mediaMessage.mimetype,
            };

            if (mediaType === "image") {
                messageOptions.image = mediaStream;
            } else if (mediaType === "video") {
                messageOptions.video = mediaStream;
            } else if (mediaType === "audio") {
                messageOptions.audio = mediaStream;
                messageOptions.mimetype = "audio/mpeg"; // Especificar que es un audio
            }

            await sock.sendMessage(msg.key.remoteJid, messageOptions, { quoted: msg });
        }

        // Confirmar que el estado ha sido enviado con éxito
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "✅", key: msg.key } 
        });

    } catch (error) {
        console.error("❌ Error en el comando get:", error);
        await sock.sendMessage(msg.key.remoteJid, { text: "❌ *Error:* No se pudo recuperar el estado. Inténtalo de nuevo." }, { quoted: msg });
    }
    break;
}
        
    
case "ver": {
    try {
        
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted) {
            return sock.sendMessage(
                msg.key.remoteJid,
                { text: "❌ *Error:* Debes responder a una imagen, video o nota de voz para reenviarla." },
                { quoted: msg }
            );
        }

       
        const unwrap = m => {
            let node = m;
            while (
                node?.viewOnceMessage?.message          ||
                node?.viewOnceMessageV2?.message        ||
                node?.viewOnceMessageV2Extension?.message ||
                node?.ephemeralMessage?.message
            ) {
                node =
                    node.viewOnceMessage?.message            ||
                    node.viewOnceMessageV2?.message          ||
                    node.viewOnceMessageV2Extension?.message ||
                    node.ephemeralMessage?.message           ||
                    node;
            }
            return node;
        };
        const inner = unwrap(quoted);

        
        let mediaType, mediaMsg;
        if (inner.imageMessage) {
            mediaType = "image"; mediaMsg = inner.imageMessage;
        } else if (inner.videoMessage) {
            mediaType = "video"; mediaMsg = inner.videoMessage;
        } else if (inner.audioMessage || inner.voiceMessage || inner.pttMessage) {
            
            mediaType = "audio";
            mediaMsg  = inner.audioMessage || inner.voiceMessage || inner.pttMessage;
        } else {
            return sock.sendMessage(
                msg.key.remoteJid,
                { text: "❌ *Error:* El mensaje citado no contiene un archivo compatible." },
                { quoted: msg }
            );
        }

        
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "⏳", key: msg.key }
        });

        
        const mediaBuffer = await (async () => {
            try {
                const stream = await downloadContentFromMessage(mediaMsg, mediaType);
                let buf = Buffer.alloc(0);
                for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
                return buf;
            } catch { return null; }
        })();

        if (!mediaBuffer?.length) {
            return sock.sendMessage(
                msg.key.remoteJid,
                { text: "❌ *Error:* No se pudo descargar el archivo. Intenta de nuevo." },
                { quoted: msg }
            );
        }

        
        const credit  = "> 🔓 Recuperado por:\n\`Azura Ultra`";
        const opts    = { mimetype: mediaMsg.mimetype };

        if (mediaType === "image") {
            opts.image   = mediaBuffer;
            opts.caption = credit;                
        } else if (mediaType === "video") {
            opts.video   = mediaBuffer;
            opts.caption = credit;               
        } else { 
            opts.audio   = mediaBuffer;
            opts.ptt     = mediaMsg.ptt ?? true;  
            if (mediaMsg.seconds) opts.seconds = mediaMsg.seconds; 
        }

        await sock.sendMessage(msg.key.remoteJid, opts, { quoted: msg });

        
        if (mediaType === "audio") {
            await sock.sendMessage(
                msg.key.remoteJid,
                { text: credit },
                { quoted: msg }
            );
        }

        
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "✅", key: msg.key }
        });

    } catch (err) {
        console.error("❌ Error en comando ver:", err);
        await sock.sendMessage(
            msg.key.remoteJid,
            { text: "❌ *Error:* Hubo un problema al procesar el archivo." },
            { quoted: msg }
        );
    }
    break;
}
        
case "perfil": {
    try {
        let userJid = null;

        // Enviar reacción antes de procesar el comando
        await sock.sendMessage(msg.key.remoteJid, {
            react: {
                text: "📸", // Emoji de cámara o cualquier otro que prefieras
                key: msg.key
            }
        });

        // Si no hay menciones, no hay participante y no hay texto, mostrar la guía de uso
        const hasMention = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0;
        const hasParticipant = msg.message.extendedTextMessage?.contextInfo?.participant;
        const cleanText = (text || "").trim();

        if (!hasMention && !hasParticipant && !cleanText) {
            return await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: `🔍 *¿Cómo usar el comando .perfil?*\n\n` +
                          `📌 *Ejemplos de uso:*\n\n` +
                          `🔹 *Para obtener la foto de perfil de alguien:* \n` +
                          `   - *Responde a su mensaje con:* _.perfil_\n\n` +
                          `🔹 *Para obtener la foto de perfil de un número:* \n` +
                          `   - _.perfil +1 555-123-4567_\n\n` +
                          `🔹 *Para obtener la foto de perfil de un usuario mencionado:* \n` +
                          `   - _.perfil @usuario_\n\n` +
                          `⚠️ *Nota:* Algunos usuarios pueden tener su foto de perfil privada y el bot no podrá acceder a ella.`
                },
                { quoted: msg }
            );
        }

        // Verifica si se mencionó un usuario
        if (hasMention) {
            userJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } 
        // Verifica si se respondió a un mensaje
        else if (hasParticipant) {
            userJid = msg.message.extendedTextMessage.contextInfo.participant;
        } 
        // Verifica si se ingresó un número en 'text'
        else if (cleanText) {
            let number = cleanText.replace(/[^0-9]/g, ""); // Limpia el número de caracteres no numéricos
            userJid = number + "@s.whatsapp.net";
        }

        // Si no se encontró un usuario válido, termina
        if (!userJid) return;

        // Intentar obtener la imagen de perfil
        let ppUrl;
        try {
            ppUrl = await sock.profilePictureUrl(userJid, "image");
        } catch {
            ppUrl = "https://i.imgur.com/3J8M0wG.png"; // Imagen de perfil por defecto
        }

        // Enviar la imagen de perfil solo si se encontró un userJid
        await sock.sendMessage(
            msg.key.remoteJid,
            {
                image: { url: ppUrl },
                caption: `🖼️ *Foto de perfil de:* @${userJid.split("@")[0]}`,
                mentions: [userJid]
            },
            { quoted: msg }
        );

    } catch (error) {
        console.error("❌ Error en el comando perfil:", error);
        await sock.sendMessage(
            msg.key.remoteJid,
            { text: "❌ *Error:* No se pudo obtener la foto de perfil." },
            { quoted: msg }
        );
    }
    break;
}

case 'creador': {
    const ownerNumber = "15167096032@s.whatsapp.net"; // Número del dueño en formato WhatsApp
    const ownerName = "Russell xz 🤖"; // Nombre del dueño
    const messageText = "📞 *Contacto del Creador:*\n\nSi tienes dudas, preguntas o sugerencias sobre el bot, puedes contactar a mi creador.\n\n📌 *Nombre:* Russell\n📌 *Número:* +1 (516) 709-6032\n💬 *Mensaje directo:* Pulsa sobre el contacto y chatea con él.";

    // Enviar mensaje con el contacto del dueño
    await sock.sendMessage(msg.key.remoteJid, {
        contacts: {
            displayName: ownerName,
            contacts: [{
                vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${ownerName}\nTEL;waid=${ownerNumber.split('@')[0]}:+${ownerNumber.split('@')[0]}\nEND:VCARD`
            }]
        }
    });

    // Enviar mensaje adicional con información
    await sock.sendMessage(msg.key.remoteJid, { text: messageText }, { quoted: msg });

    break;
}
           
            
            
case 'kill': {
    const searchKey = args.join(' ').trim().toLowerCase(); // Convertir clave a minúsculas
    if (!searchKey) {
        return sock.sendMessage(
            msg.key.remoteJid,
            { text: "⚠️ *Error:* Debes proporcionar una palabra clave para eliminar el multimedia. 🗑️" },
            { quoted: msg }
        );
    }

    // Verificar si el archivo guar.json existe
    if (!fs.existsSync("./guar.json")) {
        return sock.sendMessage(
            msg.key.remoteJid,
            { text: "❌ *Error:* No hay multimedia guardado aún. Usa `.guar` para guardar algo primero." },
            { quoted: msg }
        );
    }

    // Leer archivo guar.json
    let guarData = JSON.parse(fs.readFileSync("./guar.json", "utf-8"));

    // Verificar si la palabra clave existe
    if (!guarData[searchKey]) {
        return sock.sendMessage(
            msg.key.remoteJid,
            { text: `❌ *Error:* No se encontró multimedia guardado con la clave: *"${searchKey}"*.` },
            { quoted: msg }
        );
    }

    const storedMedia = guarData[searchKey];
    const savedBy = storedMedia.savedBy;
    const senderId = msg.key.participant || msg.key.remoteJid;

    // Verificar si el usuario es Owner
    const isUserOwner = global.owner.some(owner => owner[0] === senderId.replace("@s.whatsapp.net", ""));
    const isSavedByOwner = global.owner.some(owner => owner[0] === savedBy.replace("@s.whatsapp.net", ""));

    // Verificar si el usuario es admin
    const isAdminUser = await isAdmin(sock, msg.key.remoteJid, senderId);

    // Reglas de eliminación:
    if (isUserOwner) {
        // El owner puede eliminar cualquier multimedia
        delete guarData[searchKey];
    } else if (isAdminUser) {
        // Los admins pueden eliminar cualquier multimedia excepto los del owner
        if (isSavedByOwner) {
            return sock.sendMessage(
                msg.key.remoteJid,
                { text: "🚫 *Acceso denegado:* No puedes eliminar multimedia guardado por el Owner." },
                { quoted: msg }
            );
        }
        delete guarData[searchKey];
    } else {
        // Un usuario solo puede eliminar su propio multimedia
        if (savedBy !== senderId) {
            return sock.sendMessage(
                msg.key.remoteJid,
                { text: "⛔ *Acceso denegado:* Solo puedes eliminar los multimedia que tú guardaste." },
                { quoted: msg }
            );
        }
        delete guarData[searchKey];
    }

    // Guardar los cambios en guar.json
    fs.writeFileSync("./guar.json", JSON.stringify(guarData, null, 2));

    return sock.sendMessage(
        msg.key.remoteJid,
        { text: `✅ *Multimedia eliminado con éxito:* "${searchKey}" ha sido eliminado. 🗑️` },
        { quoted: msg }
    );
}
break;
        
case 'clavelista': {
    // Verificar si el archivo guar.json existe
    if (!fs.existsSync("./guar.json")) {
        return sock.sendMessage(
            msg.key.remoteJid,
            { text: "❌ *Error:* No hay multimedia guardado aún. Usa `.guar` para guardar algo primero." },
            { quoted: msg }
        );
    }

    // Leer archivo guar.json
    let guarData = JSON.parse(fs.readFileSync("./guar.json", "utf-8"));
    
    if (Object.keys(guarData).length === 0) {
        return sock.sendMessage(
            msg.key.remoteJid,
            { text: "📂 *Lista vacía:* No hay palabras clave registradas." },
            { quoted: msg }
        );
    }

    // Construir el mensaje con la lista de palabras clave y quién las guardó
    let listaMensaje = "📜 *Lista de palabras clave guardadas para sacar el multimedia:*\n\n";
    let mentions = [];

    for (let clave in guarData) {
        let user = guarData[clave].savedBy || "Desconocido"; // Evitar undefined
        if (user.includes("@s.whatsapp.net")) {
            user = user.replace("@s.whatsapp.net", ""); // Obtener solo el número
            mentions.push(`${user}@s.whatsapp.net`);
        }

        listaMensaje += `🔹 *${clave}* → Guardado por: @${user}\n`;
    }

    // Agregar explicación de cómo recuperar multimedia
    listaMensaje += `\n💡 *Para recuperar un archivo, usa el siguiente comando:*\n`;
    listaMensaje += `📥 *${global.prefix}g <palabra clave>*\n`;
    listaMensaje += `🛠️ Usa *${global.prefix}kill <palabra>* para eliminar Multimedia guardados✨️.\n`;

    // Enviar la lista de palabras clave mencionando a los usuarios
    return sock.sendMessage(
        msg.key.remoteJid,
        {
            text: listaMensaje,
            mentions: mentions // Mencionar a los que guardaron multimedia
        },
        { quoted: msg }
    );
}
break;
        
        
case 'g': {
    const removeEmojis = (text) => text.replace(/[\u{1F300}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, ""); // Remover emojis
    const normalizeText = (text) => removeEmojis(text).toLowerCase().trim(); // Normalizar texto

    const searchKey = normalizeText(args.join(' ')); // Convertir clave a minúsculas y sin emojis
    if (!searchKey) {
        return sock.sendMessage(
            msg.key.remoteJid,
            { text: "⚠️ *Error:* Debes proporcionar una palabra clave para recuperar el multimedia. 🔍" },
            { quoted: msg }
        );
    }

    // Verificar si el archivo guar.json existe
    if (!fs.existsSync("./guar.json")) {
        return sock.sendMessage(
            msg.key.remoteJid,
            { text: "❌ *Error:* No hay multimedia guardado aún. Usa `.guar` para guardar algo primero." },
            { quoted: msg }
        );
    }

    // Leer archivo guar.json
    let guarData = JSON.parse(fs.readFileSync("./guar.json", "utf-8"));

    // Buscar la clave ignorando mayúsculas, minúsculas y emojis
    const keys = Object.keys(guarData);
    const foundKey = keys.find(key => normalizeText(key) === searchKey);

    if (!foundKey) {
        return sock.sendMessage(
            msg.key.remoteJid,
            { text: `❌ *Error:* No se encontró multimedia guardado con la clave: *"${searchKey}"*.` },
            { quoted: msg }
        );
    }

    const storedMedia = guarData[foundKey];

    // Convertir la base64 nuevamente a Buffer
    const mediaBuffer = Buffer.from(storedMedia.buffer, "base64");

    // Verificar el tipo de archivo y enviarlo correctamente
    let messageOptions = {
        mimetype: storedMedia.mimetype,
    };

    if (storedMedia.mimetype.startsWith("image") && storedMedia.extension !== "webp") {
        messageOptions.image = mediaBuffer;
    } else if (storedMedia.mimetype.startsWith("video")) {
        messageOptions.video = mediaBuffer;
    } else if (storedMedia.mimetype.startsWith("audio")) {
        messageOptions.audio = mediaBuffer;
    } else if (storedMedia.mimetype.startsWith("application")) {
        messageOptions.document = mediaBuffer;
        messageOptions.fileName = `Archivo.${storedMedia.extension}`;
    } else if (storedMedia.mimetype === "image/webp" || storedMedia.extension === "webp") {
        // Si es un sticker (webp), se envía como sticker
        messageOptions.sticker = mediaBuffer;
    } else {
        return sock.sendMessage(
            msg.key.remoteJid,
            { text: "❌ *Error:* No se pudo enviar el archivo. Tipo de archivo desconocido." },
            { quoted: msg }
        );
    }

    // Enviar el multimedia almacenado
    await sock.sendMessage(msg.key.remoteJid, messageOptions, { quoted: msg });

    break;
}
        

        
                        

        case "cerrargrupo":
            try {
                if (!msg.key.remoteJid.includes("@g.us")) {
                    return sock.sendMessage(msg.key.remoteJid, { text: "❌ *Este comando solo funciona en grupos.*" }, { quoted: msg });
                }

                const chat = await sock.groupMetadata(msg.key.remoteJid);
                const senderId = msg.key.participant.replace(/@s.whatsapp.net/, '');
                const isOwner = global.owner.some(o => o[0] === senderId);
                const groupAdmins = chat.participants.filter(p => p.admin);
                const isAdmin = groupAdmins.some(admin => admin.id === msg.key.participant);

                if (!isAdmin && !isOwner) {
                    return sock.sendMessage(
                        msg.key.remoteJid,
                        { text: "🚫 *No tienes permisos para cerrar el grupo.*\n⚠️ *Solo administradores o el dueño del bot pueden usar este comando.*" },
                        { quoted: msg }
                    );
                }

                await sock.groupSettingUpdate(msg.key.remoteJid, 'announcement');

                return sock.sendMessage(
                    msg.key.remoteJid,
                    { text: "🔒 *El grupo ha sido cerrado.*\n📢 *Solo los administradores pueden enviar mensajes ahora.*" },
                    { quoted: msg }
                );

            } catch (error) {
                console.error('❌ Error en el comando cerrargrupo:', error);
                return sock.sendMessage(msg.key.remoteJid, { text: "❌ *Ocurrió un error al intentar cerrar el grupo.*" }, { quoted: msg });
            }
            break;

        case "abrirgrupo":
            try {
                if (!msg.key.remoteJid.includes("@g.us")) {
                    return sock.sendMessage(msg.key.remoteJid, { text: "❌ *Este comando solo funciona en grupos.*" }, { quoted: msg });
                }

                const chat = await sock.groupMetadata(msg.key.remoteJid);
                const senderId = msg.key.participant.replace(/@s.whatsapp.net/, '');
                const isOwner = global.owner.some(o => o[0] === senderId);
                const groupAdmins = chat.participants.filter(p => p.admin);
                const isAdmin = groupAdmins.some(admin => admin.id === msg.key.participant);

                if (!isAdmin && !isOwner) {
                    return sock.sendMessage(
                        msg.key.remoteJid,
                        { text: "🚫 *No tienes permisos para abrir el grupo.*\n⚠️ *Solo administradores o el dueño del bot pueden usar este comando.*" },
                        { quoted: msg }
                    );
                }

                await sock.groupSettingUpdate(msg.key.remoteJid, 'not_announcement');

                return sock.sendMessage(
                    msg.key.remoteJid,
                    { text: "🔓 *El grupo ha sido abierto.*\n📢 *Todos los miembros pueden enviar mensajes ahora.*" },
                    { quoted: msg }
                );

            } catch (error) {
                console.error('❌ Error en el comando abrirgrupo:', error);
                return sock.sendMessage(msg.key.remoteJid, { text: "❌ *Ocurrió un error al intentar abrir el grupo.*" }, { quoted: msg });
            }
            break;

case "kick": {
  try {
    const chatId = msg.key.remoteJid;
    const sender = (msg.key.participant || msg.participant || msg.key.remoteJid).replace(/[^0-9]/g, "");
    const isGroup = chatId.endsWith("@g.us");

    // Reacción inicial
    await sock.sendMessage(chatId, { react: { text: "🛑", key: msg.key } });

    if (!isGroup) {
      return await sock.sendMessage(chatId, { text: "❌ *Este comando solo funciona en grupos.*" }, { quoted: msg });
    }

    const metadata = await sock.groupMetadata(chatId);
    const groupAdmins = metadata.participants.filter(p => p.admin);
    const isSenderAdmin = groupAdmins.some(p => p.id.includes(sender));
    const isSenderOwner = isOwner(sender);

    if (!isSenderAdmin && !isSenderOwner) {
      return await sock.sendMessage(chatId, {
        text: "🚫 *Solo los administradores o el owner pueden expulsar miembros del grupo.*"
      }, { quoted: msg });
    }

    // Obtener usuario a expulsar
    let userToKick = null;

    if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
      userToKick = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
      userToKick = msg.message.extendedTextMessage.contextInfo.participant;
    }

    if (!userToKick) {
      return await sock.sendMessage(chatId, {
        text: "⚠️ *Debes mencionar o responder al usuario que deseas expulsar.*"
      }, { quoted: msg });
    }

    const isTargetAdmin = groupAdmins.some(p => p.id === userToKick);
    const botId = sock.user.id;

    if (isTargetAdmin) {
      return await sock.sendMessage(chatId, {
        text: "❌ *No se puede expulsar a otro administrador.*"
      }, { quoted: msg });
    }

    if (userToKick === botId) {
      return await sock.sendMessage(chatId, {
        text: "❌ *No puedo expulsarme a mí mismo.*"
      }, { quoted: msg });
    }

    await sock.groupParticipantsUpdate(chatId, [userToKick], "remove");

    await sock.sendMessage(chatId, {
      text: `🚷 *El usuario @${userToKick.split("@")[0]} ha sido expulsado del grupo.*`,
      mentions: [userToKick]
    }, { quoted: msg });

  } catch (error) {
    console.error("❌ Error en el comando kick:", error);
    await sock.sendMessage(msg.key.remoteJid, {
      text: "❌ *Ocurrió un error al intentar expulsar al usuario.*"
    }, { quoted: msg });
  }
  break;
}
        
    
}
}



module.exports = { handleCommand };

