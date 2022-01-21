const client = require('../index');
const { stdLog } = require('../utils/Utility');

client.on('ready', () => stdLog(0, { extra: `${client.user.tag} is up and ready to go!` }));
