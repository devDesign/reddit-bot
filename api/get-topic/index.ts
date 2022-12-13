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

  const endpointUrl = new url.URL(`https://www.reddit.com/r/WritingPrompts/top/.json?limit=100`);

  const topPost = await getTopPost(endpointUrl);

  const permalink = topPost.permalink

  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: `summerize the plot to this story and make up a setting. https://reddit.com${permalink}`,
    max_tokens: 100
  });

  const text = response.data.choices[0].text

  const titleResponse = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: `come up with the title this book. no quotes. the plot: ${text}`,
    max_tokens: 100
  });

  let title = titleResponse.data.choices[0].text.replace(/^\s*['"]+|['"]+\s*$/g, '');

  const promptResponse = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: `summarize this plot into a description of a  photo. explain the subject, how it looks and the lighting and colors. the plot:  ${text}`,
    max_tokens: 100
  });

  const prompt = promptResponse.data.choices[0].text

  const imageResponse = await openai.createImage({
        prompt: `${prompt}. Photo, Hyper Detail, 8K, HD, Octane Rendering, Unreal Engine, V-Ray, full hd -- s5000 --uplight --q 3 --stop 80--w 0.5 --ar 1:3 --no-text`,
        n:1,
        size:"1024x1024"
    })

  const imageUrl = imageResponse.data.data[0].url;

  context.json({'topic': text, 'image': imageUrl, 'title': title })
}
