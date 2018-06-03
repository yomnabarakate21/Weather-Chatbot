const request = require('request');
module.exports = function(app) {
//validation for facebook login
app.get('/', (req, res) => {
    if (req.query['hub.mode'] && req.query['hub.verify_token'] === 'random') {
        res.status(200).send(req.query['hub.challenge']);
    } else {
        console.log('nothing here')
        res.status(403).end();
    }
});

/* Handling all messenges */
app.post('/', (req, res) => {
    console.log(req.body);
    if (req.body.object === 'page') {
        req.body.entry.forEach((entry) => {
            entry.messaging.forEach((event) => {
                if (event.message && event.message.text) {
                    sendMessage(event);
                    console.log(event)
                }
            });
        });
        res.status(200).end();
    }
});

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



}
