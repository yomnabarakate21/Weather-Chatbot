const request = require('request');
const geocoder = require('geocoder');
const apiaiApp = require('apiai')('cb6cc2762df7498cb7e44b0ce9dfa04e');
const apiKey = '4fd9814c4adefbed83bd6f5a3ef05390';
PAGE_ACCESS_TOKEN = 'EAAC1XoDkqLgBACMUSSkwdBjsGEaZCPxhWwtZBYv9gEeQ8sVnREkTO57Q53UrZBLVURKUwK9DTNFdxMgAZCRgs9Yfpn5YpDAPooxymciFvd5GStb5BWukeHG1A3ENETiqkMthjL8BhCbGv54KZB4bfxOmTx2flgNudo7YRPtzKlA2ZA5ORsYsvt'

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
    let text = null;
    if (event.message && event.message.attachments) {
        messageAttachments = event.message.attachments;
        var lat = null;
        var lon = null;
        if (messageAttachments[0].payload.coordinates) {
            lat = messageAttachments[0].payload.coordinates.lat;
            lon = messageAttachments[0].payload.coordinates.long;
            text = `What's the weather in ${lat} , ${lon} in Dubai ?`;

        }

    } else {
        text = event.message.text;

    }
    console.log(text);
    let apiai = apiaiApp.textRequest(text, {
        sessionId: 'random' // use any arbitrary id
    });

    apiai.on('response', (response) => {
        // Got a response from api.ai. Let's POST to Facebook Messenger
        let aiText = response.result.fulfillment.speech;
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
    app.get('/webhook', (req, res) => {
        if (req.query['hub.mode'] && req.query['hub.verify_token'] === process.env.VERIFICATION_TOKEN) {
            res.status(200).send(req.query['hub.challenge']);
        } else {
            console.log('nothing here')
            res.status(403).end();
        }
    });
    app.get("/", function(req, res) {
        res.send("Deployed!");
    });

    /* Handling all messenges */
    app.post('/webhook', (req, res) => {
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
                        //getWeather(event);
                        sendMessageFromApi(event);

                    }
                });
            });
            res.status(200).end();
        }
    });

    app.post('/ai', (req, res) => {
        if (req.body.queryResult.action === 'weather') {
            var restUrl = null;
            if (req.body.queryResult.parameters.number && req.body.queryResult.parameters.number1) {
                let lat = req.body.queryResult.parameters.number;
                let lon = req.body.queryResult.parameters.number1;
                restUrl = `http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
            } else if (req.body.queryResult.parameters['geo-city']) {
                let city = req.body.queryResult.parameters['geo-city'];
                restUrl = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`
            }

            request.get(restUrl, (err, response, body) => {
                if (!err && response.statusCode == 200) {
                    let json = JSON.parse(body);
                    let msg = json.weather[0].description + ' and the temperature is ' + json.main.temp + ' Celsuis ' + 'in ' + json.name;
                    console.log(msg);
                    return res.json({
                        'fulfillmentText': msg,
                        'source': 'weather',

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
