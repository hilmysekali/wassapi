const { Client } = require('pg');

const client = new Client({
	connectionString: 'postgres://yuzbsotrimkhoe:11857a2f4af9452f69a70d7a3e4f1de3f23292dc138708de699c48f2496cb4dd@ec2-44-198-24-0.compute-1.amazonaws.com:5432/d4o0j39ebcuilb',
	ssl: {
		rejectUnauthorized: false
	}
});

client.connect();

const readSession = async () => {
	try {
		const res = await client.query('SELECT * FROM wassap_sessions ORDER BY created_at DESC LIMIT 1');
		if (res.rows.length) return res.rows[0].session;
		return '';
	} catch (err) {
		throw err;
	}
}

const saveSession = (session) => {
	client.query('INSERT INTO  wassap_sessions (session) VALUES ($1)', [session], (err, result) => {
		if (err) {
			console.error('Failed save session!', err);
		} else {
			console.log('Session saved!');
		}
	});
}

const removeSession = () => {
	client.query('DELETE FROM wassap_sessions', (err, results) => {
		if (err) {
			console.error('Failed remove session!', err);
		} else {
			console.log('Session deleted!');
		}
	});
}

module.exports = {
	readSession,
	saveSession,
	removeSession
}