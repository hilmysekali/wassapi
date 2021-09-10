const phoneNumberFormatter = function(number) {
	//1. hilangkan selain angka
	let formatted = number.replace(/\D/g, '');

	//2. hilangkan angka 0 didepan diganti dengan 62
	if (formatted.startsWith('0')) {
		formatted = '62' + formatted.substr(1);
	}

	if (!formatted.endsWith('@c.us')) {
		formatted += '@c.us';
	}

	return formatted;
}

module.exports = {
	phoneNumberFormatter
}