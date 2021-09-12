const { Client } = require('whatsapp-web.js');
const express = require('express');
const { body, validationResult } = require('express-validator');
const socketIO = require('socket.io');
const qrcode = require('qrcode');
const http = require('http');
const { phoneNumberFormatter } = require('./helpers/formatter');

const port = process.env.PORT || 8000;
const tokennya = '71f7be7b8496f7ece8454b1bcdcd2162';

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = require('./helpers/db.js');

(async() => {
	app.get('/', (req, res) => {
		res.sendFile('index.html', { 
			root: __dirname });
	});

	const savedSession = await db.readSession();
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
				'--single-process',
				'--disable-gpu'
				],
		},
		session: savedSession
	});

	client.on('message', msg => {
	    if (msg.body == '!cek_saldo') {
	        msg.reply('Masukkan Nomor Rekening');
		client.on('message', cek => {
		  if(cek.body == '120'){
		     cek.reply('Nomor Rekening : *120*\n Saldo anda : *Rp.100,000*');
		  } else{
		     cek.reply('Nomor Rekening tidak ada.\nSilahkan periksa kembali Nomor Rekening anda!');
		     return false;
		  }
		});
		  return true;
	    } else if (msg.body == 'reinvolve') {
	    	msg.reply('Halo, Selamat datang!');
	    } else if (msg.body == '!help') {
	    	msg.reply('List perintah BOT\n1. *!cek_saldo*\n2. *hilmy*\n3. *reinvolve*');
	    } else {
	    	msg.reply('Selamat datang di Wassap BOT by Reinvolve versi Beta\nKetik *!help* untuk mengetahui beberapa perintah BOT.');
	    }
	});

	client.initialize();

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
      db.removeSession();
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
