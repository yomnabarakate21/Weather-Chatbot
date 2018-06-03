const express = require('express');
const bodyParser = require('body-parser')
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

var webhook = require('./routes/webhook');
//fire controllers
webhook(app);

const request = require('request');

function sendMessage(event) {
  let sender = event.sender.id;
  let text = event.message.text;

  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token: 'EAAC1XoDkqLgBAPjVmuN9mV3BqoCkhhN9b2d915jc9LYZAj8WN8ZAtGZCZC0hXjWeQDekEhSXRqtWcHlkXVjkZCiBA3R9i5hDmFY6cYOBaZABE7P15bIXZAdG570q8DuxHNDpLtZABINQ2nAmx5gA5uQJCwkseL7Hx9eYZBUp8Lk9UkolPa1DKcPAY'},
    method: 'POST',
    json: {
      recipient: {id: sender},
      message: {text: text}
    }
  }, function (error, response) {
    if (error) {
        console.log('Error sending message: ', error);
    } else if (response.body.error) {
        console.log('Error: ', response.body.error);
    }
  });
}


const server = app.listen(process.env.PORT || 5000, () => {
    console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});
