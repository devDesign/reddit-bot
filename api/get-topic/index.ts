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

  // Get the top post
  const topPost = data.data.children[0].data;

  return topPost;
}

/// The main function that will be called when the serverless function is invoked
export default async function handler(request, context) {

  const endpointUrl = new url.URL(`https://www.reddit.com/r/WritingPrompts/top/.json?limit=1`);

  const topPost = await getTopPost(endpointUrl);

  const permalink = topPost.permalink

  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: `summerize the plot to this story in a few words please. https://reddit.com${permalink}`,
    max_tokens: 50
  });

  context.json({'topic':response.data.choices})
}
