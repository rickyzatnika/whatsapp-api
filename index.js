const express = require("express");
const { Client, LocalAuth } = require('whatsapp-web.js'); // Import library whatsapp-web.js
const bodyParser = require('body-parser');
const { Configuration, OpenAIApi } = require("openai"); // Import library OpenAI
const qrcode = require('qrcode');
const cors = require('cors');
const path = require('path');

const http = require('http');
// const server = http.createServer(app);
// const socketIo = require('socket.io');
const dotenv = require("dotenv")
dotenv.config();

const port = process.env.PORT || 3001;
const app = express();
// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: false }));


app.use(cors({
  credentials: true,
  origin: "*", // Izinkan CORS untuk alamat ini
  allowedHeaders: ["Content-Type", "Authorization"],
}));



// Halaman utama
app.get('/', function (req, res) {
  res.sendFile('index.html', { root: __dirname });
});

const configuration = new Configuration({
  apiKey: process.env.API_KEY, // Masukkan API key OpenAI
});
const openai = new OpenAIApi(configuration);

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "client-one",
    setDisplayName: "Webqodes Invitation"
  }),
});

(async () => {
  await client.initialize();

  // Endpoint untuk mengambil QR Code
  app.get('/qrcode', async function (req, res) {
    const qrCodeData = await client.getQRCode();
    const qrCodeUrl = await qrcode.toDataURL(qrCodeData);
    res.json({ url: qrCodeUrl });
  });

  // Event saat client siap
  client.on('ready', () => {
    console.log('Client is ready!');
  });

  // Endpoint untuk memproses pesan
  app.post('/message', async function (req, res) {
    const message = req.body.message;
    try {
      if (message.startsWith('#t')) {
        const text = message.substring(3);
        const translation = await translateToEnglish(text);
        res.json({ result: `Terjemahan: ${translation}` });
      } else if (message === 'siapa ricky') {
        res.json({ result: "Ricky adalah teman saya, dia baik hati dan tidak sombong seperti kamu." });
      } else {
        let prompt = message;
        if (message !== 'gambar') {
          prompt = `Q: ${message}\nA:`;
        }
        const response = await openai.createCompletion({
          model: "text-davinci-003",
          prompt: prompt,
          temperature: 0,
          max_tokens: 1000,
          top_p: 1.0,
          frequency_penalty: 0.0,
          presence_penalty: 0.0,
        });
        res.json({ result: response.data.choices[0].text });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Gagal memproses pesan' });
    }
  });

  app.listen(port, function () {
    console.log(`Listening on port ${port}`);
  });
})();


// (async () => {

//   const client = new Client({

//     authStrategy: new LocalAuth({
//       clientId: "client-one",// ID client yang digunakan
//       setDisplayName: "Webqodes Invitation"
//     }),
//   });

//   const io = socketIo(server, {  // socket.io
//     cors: {
//       origin: "https://whatsapp-api-beta.vercel.app",
//       method: ["GET", "POST"]
//     }
//   });
//   // Socket.io connection

//   io.on('connection', async function (socket) {
//     socket.emit('message', 'connecting...');

//     // Menampilkan QR Code di web
//     client.on('qr', (qr) => {
//       console.log('QR RECEIVED', qr);
//       qrcode.toDataURL(qr, (err, url) => {
//         console.log(url);
//         socket.emit('qr', url);
//       });
//     });

//     // Klien siap digunakan
//     client.on('ready', () => {
//       socket.emit('message', 'Client is ready!')
//       console.log('Client is Ready!')
//     });
//   });

//   // Inisialisasi klien WhatsApp Web
//   server.listen(port, async function () {
//     console.log(`Listening on port ${port}`);
//     await client.initialize();
//   });

//   client.on('message', async (message) => {
//     try {
//       if (message.body.startsWith('#t')) {
//         const text = message.body.substring(3); // Menghapus '#t ' dari awal pesan
//         const translation = await translateToEnglish(text);
//         message.reply(`Terjemahan: ${translation}`);
//       } else if (message.body === 'siapa ricky') {
//         message.reply("Ricky adalah teman saya, dia baik hati dan tidak sombong seperti kamu.");
//       } else if (message.body === 'p' || message.body === 'lenx') {
//         message.reply("Hadir");
//       } else if (message.body === 'gambar') {
//         // Logika untuk mengirim gambar
//         // ...
//       } else {
//         let prompt = message.body;
//         if (message.body !== 'gambar') {
//           prompt = `Q: ${message.body}\nA:`;
//         }
//         const response = await openai.createCompletion({
//           model: "text-davinci-003",
//           prompt: prompt,
//           temperature: 0,
//           max_tokens: 1000,
//           top_p: 1.0,
//           frequency_penalty: 0.0,
//           presence_penalty: 0.0,
//         });
//         message.reply(response.data.choices[0].text);
//       }
//     } catch (error) {
//       console.log(error);
//       message.reply('Error: Gagal memproses pesan');
//     }
//   });

//   // // ==============================================================
//   // client.on('message', async (message) => {
//   //   try {
//   //     if (message.body.startsWith('#t')) {
//   //       const text = message.body.substring(3); // Menghapus '#t ' dari awal pesan
//   //       const translation = await translateToEnglish(text);
//   //       message.reply(`Terjemahan: ${translation}`);
//   //     } else if (message.body === 'siapa ricky') {
//   //       message.reply("Ricky adalah teman saya, dia baik hati dan tidak sombong seperti kamu.");
//   //     } else {
//   //       let prompt = message.body;
//   //       if (message.body !== 'gambar') {
//   //         prompt = `Q: ${message.body}\nA:`;
//   //       }
//   //       const response = await openai.createCompletion({
//   //         model: "text-davinci-003",
//   //         prompt: prompt,
//   //         temperature: 0,
//   //         max_tokens: 1000,
//   //         top_p: 1.0,
//   //         frequency_penalty: 0.0,
//   //         presence_penalty: 0.0,
//   //       });
//   //       message.reply(response.data.choices[0].text);
//   //     }
//   //   } catch (error) {
//   //     console.log(error);
//   //     message.reply('Error: Gagal memproses pesan');
//   //   }
//   // });



//   // send - message
//   const checkRegisterNumber = async function (number) {
//     const isRegistered = await client.isRegisteredUser(number);
//     return isRegistered
//   }
//   app.post('/whatsapp', async (req, res) => {
//     try {
//       let number = req.body.number;
//       let message = req.body.message;

//       const displayName = "WebHouse_Invitation"
//       if (number) {
//         number = number + "@c.us"
//       }
//       const user = await client.isRegisteredUser(number);
//       const isRegisteredNumber = await checkRegisterNumber(number);

//       if (!isRegisteredNumber) {
//         return res.status(422).json({ msg: "Mohon periksa kembali, ada Nomor yang tidak terdaftar di Whatsapp" })
//       }

//       if (user) {
//         await client.setDisplayName(displayName);
//         client.sendMessage(number, message)
//         res.json({ msg: " Pesan terkirim " })
//       }


//     } catch (error) {
//       res.status(500).json({ msg: "Failed to send message" })
//     }
//   });

//   async function translateToEnglish(text) {
//     const prompt = `Translate to English: ${text}`;
//     const response = await openai.createCompletion({
//       model: "text-davinci-003",
//       prompt: prompt,
//       temperature: 0,
//       max_tokens: 1000,
//       top_p: 1.0,
//       frequency_penalty: 0.0,
//       presence_penalty: 0.0,
//     });
//     return response.data.choices[0].text.trim();
//   }



// })();




// Setiap ada pesan baru
// client.on('message', async (message) => {
//   try {
//     if (message.body === 'siapa ricky') { // Jika pesan bukan 'gambar'
//       message.reply("Ricky adalah teman saya, dia baik hati dan tidak sombong seperti kamu.");
//     }
//     else { // AI response
//       const qst = `Q: ${message.body}\nA:`; //
//       const response = await openai.createCompletion({
//         model: "text-davinci-003",
//         prompt: qst,
//         temperature: 0,
//         max_tokens: 1000,
//         top_p: 1.0,
//         frequency_penalty: 0.0,
//         presence_penalty: 0.0,
//       });
//       message.reply(response.data.choices[0].text);
//     }
//   } catch (error) {
//     console.log(error);
//     message.reply('Error: Failed to process');
//   }
// });
























// server.listen(PORT, async function () {
//   console.log(`Listening on port ${PORT}`);

//   client.initialize();

//   const executablePath = path.join(
//     __dirname,
//     "Chromium",
//     "chrome-win",
//     "chrome.exe"
//   );
//   await exec(`chmod +x "${executablePath}"`);

//   const browser = await puppeteer.launch({
//     headless: true,
//     args: ['--no-sandbox', '--disable-setuid-sandbox'],
//     executablePath: executablePath,
//   });
//   try {
//     const page = await browser.newPage();
//     await page.goto('https://whatsapp-api.webqodes.com');
//     // You can do some stuff here using puppeteer
//     // socket io
//     io.on('connection', function (socket) {

//       socket.emit('message', 'connecting...');

//       client.on('qr', (qr) => {
//         console.log('QR RECEIVED', qr);
//         qrcode.toDataURL(qr, (err, url) => {
//           console.log(url);
//           socket.emit('qr', url);
//           socket.emit('message', 'QR Code received, scan please');
//         });
//       });

//       client.on('ready', () => {
//         console.log('Client is ready!');
//         socket.emit('message', 'Client is ready!')
//       });
//     });
//   } catch (error) {
//     console.log(error)
//   }
// });