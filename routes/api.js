const request = require('request');
const apiaiApp = require('apiai')('cb6cc2762df7498cb7e44b0ce9dfa04e');
const apiKey = '4fd9814c4adefbed83bd6f5a3ef05390';
module.exports = function(app) {
    app.post('/ai', (req, res) => {
        if (req.body.queryResult.action === 'weather') {
            var restUrl = null;
            //in case a locattion with lat and lon was given
            if (req.body.queryResult.parameters.number && req.body.queryResult.parameters.number1) {
                let lat = req.body.queryResult.parameters.number;
                let lon = req.body.queryResult.parameters.number1;
                restUrl = `http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
            } //in case a city name was given
            else if (req.body.queryResult.parameters['geo-city']) {
                let city = req.body.queryResult.parameters['geo-city'];
                restUrl = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`
            }

            request.get(restUrl, (err, response, body) => {
                if (!err && response.statusCode == 200) {
                    let json = JSON.parse(body);
                    let msg = json.weather[0].description + ' and the temperature is ' + json.main.temp + ' Celsuis ' + 'in ' + json.name;
                    return res.json({
                        'fulfillmentText': msg,
                        'source': 'weather',
                        "outputContexts": [{
                            "name": "projects/weather-bot-fdd00/agent/sessions/a1a13100-e04b-0d56-c9d3-d0b22cf39116/contexts/location",
                            "lifespanCount": 5,
                            "parameters": {
                                "geo-city.original": json.name,
                                "geo-city": json.name,

                            }
                        }]

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
        } //if the user asked for further details.
        else if (req.body.queryResult.action === 'details') {
            if (req.body.queryResult.parameters.loc) {
                let city = req.body.queryResult.parameters.loc;
                restUrl = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;
                request.get(restUrl, (err, response, body) => {
                    if (!err && response.statusCode == 200) {
                        let json = JSON.parse(body);
                        let msg = 'temp = ' + json.main.temp + ' Celsuis\r\nhumidity = ' + json.main.humidity + '%\r\npressure = ' + json.main.pressure + ' hPa\r\nmin_temp = ' + json.main.temp_min + ' Celsuis \r\nmax_temp = ' + json.main.temp_max + ' Celcuis';
                        return res.json({
                            'fulfillmentText': msg,
                            'source': 'details',
                            "outputContexts": [{
                                "name": "projects/weather-bot-fdd00/agent/sessions/a1a13100-e04b-0d56-c9d3-d0b22cf39116/contexts/location",
                                "lifespanCount": 5,
                                "parameters": {
                                    "geo-city.original": json.name,
                                    "geo-city": json.name,

                                }
                            }]

                        });
                    } else {
                        return res.status(400).json({
                            status: {
                                code: 400,
                                errorType: 'I failed to look up the city name.'
                            }
                        });
                    }
                });


            }



        }
    });
}
