const request = require('request');
const apiaiApp = require('apiai')('cb6cc2762df7498cb7e44b0ce9dfa04e');
const  WEATHER_API_KEY = '4fd9814c4adefbed83bd6f5a3ef05390';
module.exports = function(app) {
        app.post('/ai', (req, res) => {
            console.log('ana hena');
                    if (req.body.result.action === 'weather') {
                        let city = req.body.result.parameters['geo-city'];
                        let restUrl = 'http://api.openweathermap.org/data/2.5/weather?APPID=' + WEATHER_API_KEY + '&q=' + city;

                        request.get(restUrl, (err, response, body) => {
                            if (!err && response.statusCode == 200) {
                                let json = JSON.parse(body);
                                let msg = json.weather[0].description + ' and the temperature is ' + json.main.temp + ' ℉';
                                return res.json({
                                    speech: msg,
                                    displayText: msg,
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
