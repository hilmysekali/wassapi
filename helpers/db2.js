// get the client
const mysql = require('mysql2/promise');

// create the connection to database
const connection = async() => {
	return await mysql.createConnection({
	  host: '103.147.154.42',
	  user: 'reinvol1_hilmy',
	  password: 'ezan^hQK&C3C',
	  database: 'reinvol1_tabungan'
	});
}

//Pencarian
const cekSaldo = async(norek) => {
	const connect = await connection();
	const [rows] = await connect.execute('SELECT * FROM kategori');
	const cari = [norek];
	const x = rows.length;
	var find = 0;

    for (var i = 0; i < x; i++) {
      //cari nilai yang sama
    	// console.log(row[i].kategori_nama);
    	if (rows[i].kategori_nama == cari) {
    		find = 1;
    		var nama_kategori = rows[i].kategori_nama;
    		var id_kategori = rows[i].kategori_id;
    		var keterangan_kategori = rows[i].kategori_keterangan;
    	}
    }
    if (find == '1') {
    	const pesan = nama_kategori+' '+id_kategori+' '+keterangan_kategori;
    	return pesan;
	}
	else {
		const pesan = 'Data tidak ditemukan';
		return pesan;
	}
}
module.exports = {
	cekSaldo
}
