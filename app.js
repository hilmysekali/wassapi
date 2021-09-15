const { Client } = require('whatsapp-web.js');
const express = require('express');
const { body, validationResult } = require('express-validator');
const socketIO = require('socket.io');
const qrcode = require('qrcode');
const http = require('http');
const { phoneNumberFormatter } = require('./helpers/formatter');
const request = require('request');

const port = process.env.PORT || 8000;
const tokennya = '71f7be7b8496f7ece8454b1bcdcd2162';

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));


const db = require('./helpers/db.js');

(async() => {
  app.get('/', (req, res) => {
    res.sendFile('index.html', {
      root: __dirname
    });
  });

  const client = new Client({
    restartOnAuthFail: true,
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process', // <- this one doesn't works in Windows
        '--disable-gpu'
      ],
    },
    session: savedSession
  });

  client.on('message', async msg => {
  	const { chat, from, caption } = msg
  	let { body } = msg
      const commands = caption || body || ''
      const command = commands.toLowerCase().split(' ')[0] || ''
      const args =  commands.split(' ')
     
      const msgs = (msg) => {
          if (command.startsWith('!')) {
              if (msg.length >= 10){
                  return `${msg.substr(0, 15)}`
              }else{
                  return `${msg}`
              }
          }
      }

      switch(command) {
      	case '!cek_saldo':
      		if (args.length === 1) return msg.reply('Kirim perintah *!cek_saldo [nomor_rekening]*, contoh *!cek 45683*')
      		const norek = body.slice(11)
  			request('https://reinvolve.online/api.php', function (error, response, body) {
  	  		if (!error && response.statusCode == 200) {
  		     	const rows = JSON.parse(body);
  		     	// console.log(rows[1].no_rekening);

  		     	const cari = norek;
  			 	const x = rows.length;
  			 	// console.log(x);

  		    	for (var i = 0; i < x; i++) {
  		    	// console.log(rows[i].nama_nasabah);
  			    	if (rows[i].no_rekening == cari) {
  			    		// console.log(rows[i].nama_nasabah);
  			    		var find = 1;
  			    		var no_rekening = rows[i].no_rekening;
  			    		var nama_nasabah = rows[i].nama_nasabah;
  			    		var alamat = rows[i].alamat;
  			    		var no_hp = rows[i].no_hp;
  			    		var nama_orang_tua = rows[i].nama_orang_tua;
  			    		var nama_kelas = rows[i].nama_kelas;
  					var total = rows[i].total;
  			    	}
  		    	}
  			}
  		    if (find == 1) {
  		    	const pesan = '*CEK SALDO*\nNo. Rekening : *'+no_rekening+'*\nNama Nasabah : *'+nama_nasabah+'*\nAlamat : *'+alamat+'*\nNo. HP : *'+no_hp+'*\nNama Orang Tua : *'+nama_orang_tua+'*\nKelas : *'+id_kelas+'*\nJumlah Saldo : *Rp. '+total+'*';
  		    	msg.reply(pesan);
  			}
  			else {
  				// const pesan = 'Nomor Rekening tidak ditemukan';
  				msg.reply('Nomor Rekening tidak ditemukan');
  			}
  		})
      	break

      	case '!reinvolve':
  	case 'reinvolve':
      	case 'hilmy':
      	case 'saya':
      		client.sendMessage(from, 'Halo Selamat datang di *Reinvolve* Whatsapp BOT');
      	break

      	case '!test':
      	case '!coba':
      		msg.reply('Ini adalah perintah untuk testing');
      	break

      	case '!help':
      	case '!bantuan':
      		client.sendMessage(from, 'Perintah BOT\n1. *!cek_saldo*\n2. *!reinvolve*\n3. *!test*');
      	break

      	default:
      		client.sendMessage(from, 'Selamat datang di Wassap BOT by Reinvolve versi Beta\nKetik *!help* untuk mengetahui beberapa perintah BOT.');
      	break
      }
  });

  client.initialize();

  // Socket IO
    io.on('connection', function(socket) {
      socket.emit('message', 'Connecting...');
    
      client.on('qr', (qr) => {
        console.log('QR RECEIVED', qr);
        qrcode.toDataURL(qr, (err, url) => {
          socket.emit('qr', url);
          socket.emit('message', 'QR Code received, scan please!');
        });
      });
    
      client.on('ready', () => {
        socket.emit('ready', 'Whatsapp is ready!');
        socket.emit('message', 'Whatsapp is ready!');
      });
    
      client.on('authenticated', (session) => {
        socket.emit('authenticated', 'Whatsapp is authenticated!');
        socket.emit('message', 'Whatsapp is authenticated!');
        console.log('AUTHENTICATED', session);
        // Save session to DB
        db.saveSession(session);
      });
    
      client.on('auth_failure', function(session) {
        socket.emit('message', 'Auth failure, restarting...');
      });
    
      client.on('disconnected', (reason) => {
        socket.emit('message', 'Whatsapp is disconnected!');
        // Remove session from DB
        // db.removeSession();
        client.destroy();
        client.initialize();
      });
    });


  const checkRegisteredNumber = async function(number) {
    const isRegistered = await client.isRegisteredUser(number);
    return isRegistered;
  }

  // Send message
  app.post('/send-message', [
    body('token').notEmpty(),
    body('number').notEmpty(),
    body('message').notEmpty(),
  ], async (req, res) => {
    const errors = validationResult(req).formatWith(({
      msg
    }) => {
      return msg;
    });
  	
    if (tokennya != req.body.token) {
     return res.status(422).json({
     status: false,
     message: 'Token Tidak Valid!'
     });
    }
    if (!errors.isEmpty()) {
      return res.status(422).json({
        status: false,
        message: errors.mapped()
      });
    }

    const number = phoneNumberFormatter(req.body.number);
    const message = req.body.message;

    const isRegisteredNumber = await checkRegisteredNumber(number);

    if (!isRegisteredNumber) {
      return res.status(422).json({
        status: false,
        message: 'The number is not registered'
      });
    }

    client.sendMessage(number, message).then(response => {
      res.status(200).json({
        status: true,
        response: response
      });
    }).catch(err => {
      res.status(500).json({
        status: false,
        response: err
      });
    });
  });

  server.listen(port, function() {
    console.log('App running on *: ' + port);
  });
})();
