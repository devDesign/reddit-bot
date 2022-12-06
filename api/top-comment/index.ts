const axios = require('axios');
const url = require('url'); 
const dotenv = require('dotenv');
const Reddit = require('reddit');
const { Configuration, OpenAIApi } = require("openai");

dotenv.config(); // Load the API keys and other sensitive information from the .env file

const reddit = new Reddit({
  username: process.env.REDDIT_USERNAME,
  password: process.env.REDDIT_PASSWORD,
  appId: process.env.REDDIT_APP_ID,
  appSecret: process.env.REDDIT_APP_SECRET,
  userAgent: "MyApp/1.0.0 (http://example.com)",
});

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

  const { query } = request

  // Get the value of the subreddit parameter from the query string
  const subreddit = query.subreddit;

  // Set the URL of the Reddit API endpoint
  const endpointUrl = new url.URL(`https://www.reddit.com/r/${subreddit}/top/.json?limit=1`);

  const topPost = await getTopPost(endpointUrl);

  const comment = topPost.title

  // Generate a response to the comment using the OpenAI API
  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: `respond to this reddit post with a ${subreddit} analogy and make it funny. the post: ${comment}`,
    max_tokens: 100
  });

  try {
    // Finally, post the response to the comment
    await reddit.post('/api/comment', {
      parent: topPost.name,
      text: response.data.choices[0].text,
    });
  } catch (error) {
    context.json({'title': comment, 'analogy' :response.data.choices, "error": true})
    return;
  }
  
  context.json({'title': comment, 'analogy' :response.data.choices})
}
