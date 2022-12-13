const dotenv = require('dotenv');
const { Configuration, OpenAIApi } = require("openai");

dotenv.config(); // Load the API keys and other sensitive information from the .env file

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(config);

/// The main function that will be called when the serverless function is invoked
export default async function handler(request, res) {
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')
    // another common pattern
    // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    )
    if (request.method === 'OPTIONS') {
      res.status(200).end()
      return
    }
 
  const { body } = request

    // Get the value of the subreddit parameter from the query string
  const plot = body.text;

  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: `start a long story to the beginning of a novel, build a main character give the protagonist names. create a dramatic scene around this plot. then give 3 options like a choose your own adventure novel. make one of the options confrontational.\n\nexample:\nChoose your own adventure:\nA)\nB)\nC)\n\nplot: ${plot} \n\nChapter 1\n`,
    max_tokens: 1000
  });

  console.log(response)
  const text = response.data.choices[0].text

  // const promptResponse = await openai.createCompletion({
  //   model: "text-davinci-003",
  //   prompt: `describe a  photo of  this story. the lighting and colors, how its arranged, what style to use. add something distantly related to the story in the photo that doesn't contain words. chose the artistic effect that relates to the plot . add an extra object that is directly related as an analogy. \n\nsummarize the describe in a table \n\nthe story:  \n\n${text}\n\n|EVENT|SETTING|COLOR|FOREGROUND|BACKGROUND|EXTRA OBJECT|RELATED OBJECT|LENS|RENDER|FRAME|EFFECT|STYLE|\n`,
  //   max_tokens: 100
  // });

  // let prompt = promptResponse.data.choices[0].text.replace(/[^\w|]/g, " ").trim();
  // const elements = prompt.split("|");
  // const array = elements.map(element => element.trim()).filter(element => element !== "");
  // prompt = array.join('|')

  // const imageResponse = await openai.createImage({
  //       prompt: `${prompt}`,
  //       n:1,
  //       size:"1024x1024"
  //   })
  
  //   const imageUrl = imageResponse.data.data[0].url;

    let options = [] as string[]

    try {
      let choices = text.split('A)')[1]
      const c = choices.split('C)')[1]
      const b = choices.split('C)')[0].split('B)')[1]
      const a = choices.split('B)')[0]
      options = [a,b,c]
    } catch (error) {
        
    }

    let replot = text.split('A)')[0]
    const replotResponse = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `sumerize this plot into a table of events in order. \n\n|SCENE|EVENT|CHARACTER|\n\nthe plot:${replot}`,
      max_tokens: 1000
    });
    replot = response.data.choices[0].text

    const linesResponse = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `turn the events into a movie script for an into scene. written by Quentin Tarantino. its a action crime comedy movie. \n\nevents:${replot}\n\nplot:${plot}`,
      max_tokens: 1000
    });
    const lines = linesResponse.data.choices[0].text

    const optionsResponse = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `give 3 options like a choose your own adventure novel. make one of the options confrontational.\n\nexample: A)\nB)\nC)\n\nsthe movie script:${lines}`,
      max_tokens: 1000
    });
    const finalText = optionsResponse.data.choices[0].text
    try {
      let choices = finalText.split('A)')[1]
      const c = choices.split('C)')[1]
      const b = choices.split('C)')[0].split('B)')[1]
      const a = choices.split('B)')[0]
      options = [a,b,c]
    } catch (error) {
        
    }

    
  res.json({'text': text.split(':')[0], 'options': options, 'dialog':lines,'replot':replot})
}
