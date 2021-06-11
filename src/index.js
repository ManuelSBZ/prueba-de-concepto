const express = require('express')
const cors = require('cors')
const axios = require('axios')
const {WebhookClient} = require('dialogflow-fulfillment');
const app = express()
const port = 3000

app.use(express.json())
app.use(cors())
app.post('/webhook', async (req, res) => {
  const agent = new WebhookClient({ request: req, response: res })
  console.log("Dialogflow Request headers: " + JSON.stringify(req.headers));
  console.log("Dialogflow Request body: " + JSON.stringify(req.body));
  async function weatherAgain(agent){
    return getPronostic(agent)
  } 
  async function getPronostic(agent) {

    const city =  agent.parameters['geo-city']
    if (['', undefined, null].includes(city)){
      return fallback(agent)
    }
    try {
      const request = {
        method: 'GET',
        params: {
          appid: '62b52e4db0cdbb0b58d063f9e72ba080',
          units: 'metric',
          lang: 'es',
          q: city,
        },
        url: 'https://api.openweathermap.org/data/2.5/weather'
      }
      const response = await axios(request)
      console.log("after response")
      agent.add(`general: ${response.data.weather[0].description}, temperatura promedio: ${response.data.main.temp}°C, humedad: ${response.data.main.humidity}%`);
    } catch (e) {
      const message = e.response
      if (!message) throw new Error(e.message)
      else throw new Error(message.data.error)
    }
    agent.add(`alguna otra ciudad para saber su clima?`)
  }
  let intentMap = new Map();
  intentMap.set('getPronostic', getPronostic)
  intentMap.set('weatherAgain', weatherAgain)
  // intentMap.set('your intent name here', yourFunctionHandler);
  // intentMap.set('your intent name here', googleAssistantHandler);
  agent.handleRequest(intentMap)
})
app.post('/weather/webhook', async (req, res) => {
  console.log("Dialogflow Request headers: " + JSON.stringify(req.headers));
  console.log("Dialogflow Request body: " + JSON.stringify(req.body));
  let jsonResponse
    if ( req.body.sessionInfo.parameters.ciudad ) {
      try {
        const {city} = req.body.sessionInfo.parameters.ciudad
        const request = {
          method: 'GET',
          params: {
            appid: '62b52e4db0cdbb0b58d063f9e72ba080',
            units: 'metric',
            lang: 'es',
            q: city,
          },
          url: 'https://api.openweathermap.org/data/2.5/weather'
        }
        const response = await axios(request)
        console.log("after response")
        jsonResponse = {
          //fulfillment text response to be sent to the agent if there are no defined responses for the specified tag
          fulfillment_response: {
            messages: [
              {
                text: {
                  ////fulfillment text response to be sent to the agent
                  text: [
                    `${city} \n general: ${response.data.weather[0].description} \n temperatura promedio: ${response.data.main.temp}°C \n humedad: ${response.data.main.humidity}%`,
                  ]
                }
              }
            ]
          }
        }
      } catch (e) {
        const message = e.response
        if (!message) throw new Error(e.message)
        else throw new Error(message.data.error)
      }
    } else {
      let tag = "foo"  
      jsonResponse = {
        //fulfillment text response to be sent to the agent if there are no defined responses for the specified tag
        fulfillment_response: {
          messages: [
            {
              text: {
                ////fulfillment text response to be sent to the agent
                text: [
                  `There are no fulfillment responses defined for "${tag}"" tag`
                ]
              }
            }
          ]
        }
      };
    }

res.json(jsonResponse)
}
)
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
