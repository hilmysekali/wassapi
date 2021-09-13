// get the client
const mysql = require('mysql2/promise');

// create the connection to database
const connection = async() => {
	return await mysql.createConnection({
	  host: 'lannister.id.rapidplex.com',
	  port: '2083',
	  user: 'reinvol1_hilmy',
	  password: 'ezan^hQK&C3C',
	  database: 'reinvol1_tabungan'
	});
}

const cekSaldo = async(norek) => {
	const connect = await connection();
	const [rows] = await connect.execute('SELECT * FROM tb_nasabah');
	const cari = [norek];
	const x = rows.length;
	var find = 0;

    for (var i = 0; i < x; i++) {
    	// console.log(hasil[i].kategori_nama);
    	if (rows[i].no_rekening == cari) {
    		find = 1;
    		var no_rekening = rows[i].no_rekening;
    		var nama_nasabah = rows[i].nama_nasabah;
    		var alamat = rows[i].alamat;
    		var no_hp = rows[i].no_hp;
    		var nama_orang_tua = rows[i].nama_orang_tua;
    		var id_kelas = rows[i].id_kelas;
    	}
    }
    if (find == '1') {
    	const pesan = 'CEK SALDO\nNo. Rekening : *'+no_rekening+'*\nNama Nasabah : *'+nama_nasabah+'*\nAlamat : *'+alamat+'*\nNo. HP : *'+no_hp+'*\nNama Orang Tua : *'+nama_orang_tua+'*\nKelas : *'+id_kelas+'*\nJumlah Saldo : *Rp.500,000*';
    	return pesan;
	}
	else {
		const pesan = 'Nomor Rekening tidak ditemukan';
		return pesan;
	}
}
module.exports = {
	cekSaldo
}
