const request = require('request');
const apiaiApp = require('apiai')('cb6cc2762df7498cb7e44b0ce9dfa04e');
const apiKey = '4fd9814c4adefbed83bd6f5a3ef05390';
 PAGE_ACCESS_TOKEN = 'EAAC1XoDkqLgBAMRzhWeQsU0uZCrZCdL5GdZAZBanN72jfXbtecO5kq7svT6P6xtt46R5N3jo7A6Xvh1M5yuB0BstFdUTQhqq98BOmCB0nd2972p5CSZAgqG2KDc7DZBHyNcHfpQljpaH7oJF8mIOrHKZAtqpm1ZCgYnrjiIIHdl3HWUD5VCcMiZBz'

function sendMessage(event, Location) {
    let sender = event.sender.id;
    let text = Location;

    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {
            access_token: PAGE_ACCESS_TOKEN
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

function sendMessageFromApi(event) {

    let sender = event.sender.id;
    let text = event.message.text;
    let apiai = apiaiApp.textRequest(text, {
        sessionId: 'random' // use any arbitrary id
    });

    apiai.on('response', (response) => {
        // Got a response from api.ai. Let's POST to Facebook Messenger
        let aiText = response.result.fulfillment.speech;
        request({
            url: 'https://graph.facebook.com/v2.6/me/messages',
            qs: {
                access_token:PAGE_ACCESS_TOKEN
            },
            method: 'POST',
            json: {
                recipient: {
                    id: sender
                },
                message: {
                    text: aiText
                }
            }
        }, function(error, response) {
            if (error) {
                console.log('Error sending message: ', error);
            } else if (response.body.error) {
                console.log('Error: ', response.body.error);
            }
        });

    });

    apiai.on('error', (error) => {
        console.log(error);
    });

    apiai.end();


}

function getWeather(event) {
    messageAttachments = event.message.attachments;
    var lat = null;
    var lon = null;
    if (messageAttachments[0].payload.coordinates) {
        lat = messageAttachments[0].payload.coordinates.lat;
        lon = messageAttachments[0].payload.coordinates.long;

    }
    var url = `http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
    request(url, function(err, response, body) {
        if (err) {
            console.log('error:', error);
        } else {
            let json = JSON.parse(body)
            let message = `It's ${json.weather[0].description} and the temperature is ${json.main.temp} degrees Celsuis in ${json.name}!`;
            console.log(message);
            sendMessage(event, message);
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
                        sendMessageFromApi(event);
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

    app.post('/ai', (req, res) => {

        if (req.body.queryResult.action === 'weather') {
            console.log(' am printing the request here');
            console.log(req.body);
            let city = req.body.queryResult.parameters['geo-city'];
            var restUrl = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`

            request.get(restUrl, (err, response, body) => {
                if (!err && response.statusCode == 200) {
                    let json = JSON.parse(body);
                    let msg = json.weather[0].description + ' and the temperature is ' + json.main.temp + ' C';
                    console.log(msg);
                    return res.json({
                        fulfillmentText: msg,
                        source: 'weather'
                    });
                } else {
                    return res.status(400).json({
                        status: {
                            code: 400,
                            errorType: 'I failed to look up the city name.'
                        }
                    });
                }
            })
        }
    });


}
