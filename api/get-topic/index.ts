const axios = require('axios');
const url = require('url'); 
const dotenv = require('dotenv');
const { Configuration, OpenAIApi } = require("openai");

dotenv.config(); // Load the API keys and other sensitive information from the .env file

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(config);

const getTopPost = async (endpointUrl) => {
  const response = await axios.get(endpointUrl);

  const data = response.data

  // Get a random number between 0 and 9
  var randomNumber = Math.floor(Math.random() * 100);

  // Get the top post
  const topPost = data.data.children[randomNumber].data;

  return topPost;
}

/// The main function that will be called when the serverless function is invoked
export default async function handler(request, context) {

  const endpointUrl = new url.URL(`https://www.reddit.com/r/vancouver/new/.json?limit=100`);

  const topPost = await getTopPost(endpointUrl);

  const permalink = topPost.permalink

  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: `summerize the plot to this story. dont give away the ending. https://reddit.com${permalink}`,
    max_tokens: 500
  });

  console.log(response)
  const text = response.data.choices[0].text

  const titleResponse = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: `respond with a book title. \n\nthe plot: ${text}.`,
    max_tokens: 100
  });

  let title = titleResponse.data.choices[0].text.replace(/^\s*['"]+|['"]+\s*$/g, '');

  const promptResponse = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: `describe a  photo of  this plot. the lighting and colors, how its arrange add something distantly related to the plot in the photo that doesn't contain words. \n\nsummarize the describe in a table \n\nthe plot:  \n\n${text}\n\n|SETTING|COLOR|FOREGROUND|BACKGROUND|EXTRA OBJECT|RELATED OBJECT|LENS|MEDIUM|\n`,
    max_tokens: 100
  });

  let prompt = promptResponse.data.choices[0].text.replace(/[^\w|]/g, " ").trim();
  const elements = prompt.split("|");
  const array = elements.map(element => element.trim()).filter(element => element !== "");
  prompt = array.join('|')

  const imageResponse = await openai.createImage({
        prompt: `${prompt}`,
        n:1,
        size:"1024x1024"
    })

  const trailerResponse = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: `summerize the plot to this story.make like movie trailer. the plot: ${text}.`,
    max_tokens: 500
  });
  const trailer = response.data.choices[0].text


  const imageUrl = imageResponse.data.data[0].url;
  context.json({'topic': text, 'image': imageUrl, 'title': title, 'link': 'https://old.reddit.com/'+permalink, 'trailer': trailer })
}
