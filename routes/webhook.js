const request = require('request');

function sendMessage(event) {
    let sender = event.sender.id;
    let text = event.message.text;

    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {
            access_token: 'EAAC1XoDkqLgBAPjVmuN9mV3BqoCkhhN9b2d915jc9LYZAj8WN8ZAtGZCZC0hXjWeQDekEhSXRqtWcHlkXVjkZCiBA3R9i5hDmFY6cYOBaZABE7P15bIXZAdG570q8DuxHNDpLtZABINQ2nAmx5gA5uQJCwkseL7Hx9eYZBUp8Lk9UkolPa1DKcPAY'
        },
        method: 'POST',
        json: {
            recipient: {
                id: sender
            },
            message: {
                text: text
            }
        }
    }, function(error, response) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
}

function getWeather(event) {
    console.log('ana geet');
    let apiKey = '4fd9814c4adefbed83bd6f5a3ef05390';
    messageAttachments = event.message.attachments;
    var lat = null;
    var lon = null;
    if (messageAttachments[0].payload.coordinates) {
        lat = messageAttachments[0].payload.coordinates.lat;
        lon = messageAttachments[0].payload.coordinates.long;
        console.log("lat : " + lat + " ,long : " + lon + "\n");

    }
    var url = `http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`
    request(url, function(err, response, body) {
        if (err) {
            console.log('error:', error);
        } else {
            let weather = JSON.parse(body)
            let message = `It's ${weather.main.temp} degrees in ${weather.name}!`;
            console.log(message);
        }
    });
}


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
                    //in the case of text
                    if (event.message && event.message.text) {
                        sendMessage(event);
                    }
                    //in case of location
                    if (event.message && event.message.attachments) {
                        getWeather(event);

                    }
                });
            });
            res.status(200).end();
        }
    });




}
