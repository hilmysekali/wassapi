const { Client } = require('whatsapp-web.js');
const express = require('express');
const { body, validationResult } = require('express-validator');
const socketIO = require('socket.io');
const qrcode = require('qrcode');
const http = require('http');
const { phoneNumberFormatted } = require('./helpers/formatter');

const port = process.env.PORT || 8000;

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
	    if (msg.body == '!ping') {
	        msg.reply('pong');
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
	//sendmessage
	app.post('/send-message', [
		body('number').notEmpty(),
		body('message').notEmpty(),
	], async (req,res) => {
		const errors = validationResult(req).formatWith(({ msg })=> {
			return msg;
		});

		if (!errors.isEmpty()) {
			return res.status(422).json({
				status: false,
				message: errors.mapped()
			})
		}
		const number = phoneNumberFormatted(req.body.number);
		const message = req.body.message;

		const isRegisteredNumber = await checkRegisteredNumber(number);

		if (!isRegisteredNumber) {
			return res.status(422).json({
				status: false,
				message: 'Nomor tidak terdaftar di Whatsapp'
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
