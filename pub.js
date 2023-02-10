const mqtt = require('mqtt');

const client = mqtt.connect({
  clientId: 'some-client',
  username: 'oauth2',

  // This token was generated using https://jwt.io/
  // The secret is: `something-secret`
  // It decodes to:
  // { "sub": "someone", "scope": "aedea-write aedes-read" }
  password: 'matteo',
//   password: [
//     'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
//     'eyJzdWIiOiJzb21lb25lIiwic2NvcGUiOiJhZWRlYS13cml0ZSBhZWRlcy1yZWFkIn0',
//     'B5pNFLaZuNz9cQueABiSAaxoHlmtOygw8jaWHnR1nyo',
//   ].join('.'),
});

client.on('connect', () => console.info('connect'));
client.on('disconnect', () => console.info('disconnect'));
// client.on('error', console.error);

client.subscribe('topic-name', { qos: 2 });
client.on('message', (topic, message) => {
  console.log(message.toString());
});