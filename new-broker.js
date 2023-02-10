const net = require('net');
const Aedes = require('aedes');
const jwt = require('jsonwebtoken');

const server = net.createServer();
const aedes = new Aedes();

const secret = process.env.SECRET_OR_KEY;

aedes.authenticate = (client, username, password, callback) => {
  if (username === 'oauth2') {
    return jwt.verify(password.toString(), secret, (error, token) => {
      if (error) {
        return callback(error, false);
      }

      client.token = token;
      return callback(null, true);
    });
  }

  return callback(null, false);
};

function checkAnyScope(client, ...requiredScopes) {
  if (typeof client.token.scope !== 'string') {
    throw new TypeError('Token contains no scope');
  }

  const tokenScopes = client.token.scope.split(' ');

  for (const requiredScope of requiredScopes) {
    if (tokenScopes.includes(requiredScope)) {
      return;
    }
  }

  throw new Error('Insufficient to permissions to publish message');
}

aedes.authorizePublish = (client, packet, callback) => {
  if (client.token instanceof Object) {
    try {
      checkAnyScope(client, 'aedes-write');

      return callback(null);
    } catch (error) {
      return callback(error);
    }
  }

  callback(new Error('Cannot publish'));
};

aedes.authorizeSubscribe = (client, subscription, callback) => {
  if (client.token instanceof Object) {
    try {
      checkAnyScope(client, 'aedes-read');

      return callback(null, subscription);
    } catch (error) {
      return callback(error);
    }
  }

  callback(new Error('Cannot subscribe'));
};

server.on('connection', aedes.handle);
server.on('error', console.error);

aedes.on('clientError', (client, error) => console.error(error));
aedes.on('connectionError', (client, error) => console.error(error));

server.listen(1883);