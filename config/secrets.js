var uri = process.env.uri || 'http://localhost:8888';

module.exports = {
	client_id: process.env.client_id,
	client_secret: process.env.client_secret,
	uri: uri,
	redirect_uri: uri + '/callback/',
	blockchain_redirect_uri: uri + '/blockchain',
	pay_redirect_uri: uri + '/add_song',
	btc_address: '1P38omURqPRpJzEiwkxF2nAY5rFHsz9v4h'
};