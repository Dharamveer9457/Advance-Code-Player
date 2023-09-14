const express = require("express");
const app = express();
require('dotenv').config();
const port = process.env.PORT || 3000; 
const axios = require("axios"); 
const cors = require("cors");
const { Octokit } = require('@octokit/rest');
app.use(cors());
app.use(express.json());

// Define an endpoint to generate quotes
app.post('/convert', async (req, res) => {
    const { code, language } = req.body;
    const apiKey = process.env.apikey;
  
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/engines/text-davinci-002/completions',
        {
          prompt: `Act as a code convertor. I will provide you the code and you have to convert it to ${language}. No need to explain the code. Just provide the converted code. Also, if there are two or three code snippet convert all the code seperately.\n ${code}`,
          max_tokens: 500, // Adjust as needed
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`
          },
        }
      );
  
      const convertedCode = response.data.choices[0].text;
      res.json({ convertedCode });
    } catch (error) {
      console.error('Error converting code:', error);
      res.status(500).json({ error: 'An error occurred while converting code.' });
    }
  });

app.post('/debug', async (req, res) => {
    const { code } = req.body;
    const apiKey = process.env.apikey;
  
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/engines/text-davinci-002/completions',
        {
          prompt: `Act as a code debugger. I will provide you the code snippet and you have to debug it. You have to provide me the response in output section and also explain the code.\n ${code}`,
          max_tokens: 500, // Adjust as needed
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`
          },
        }
      );
  
      const debuggedCode = response.data.choices[0].text;
      res.json({ debuggedCode });
    } catch (error) {
      console.error('Error converting code:', error);
      res.status(500).json({ error: 'An error occurred while converting code.' });
    }
  })

app.post('/quality', async (req, res) => {
    const { code } = req.body;
    const apiKey = process.env.apikey;
  
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/engines/text-davinci-002/completions',
        {
          prompt: `Act as a code quality checker. I will provide you the code snippet and you have to check quality of the code. You have to provide me your suggestions to improve the code. And also tell me what is need to be fix to make the code looks better and understandable to everyone.\n ${code}`,
          max_tokens: 1000, // Adjust as needed
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`
          },
        }
      );
  
      const checkedCode = response.data.choices[0].text;
      res.json({ checkedCode });
    } catch (error) {
      console.error('Error converting code:', error);
      res.status(500).json({ error: 'An error occurred while converting code.' });
    }
  })

const callbackUrl = 'https://advance-code-player.vercel.app/';

app.get('/auth/github', (req, res) => {
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.github_client_ID}&redirect_uri=${callbackUrl}`;
    res.redirect(authUrl);
});

// GitHub callback handler
app.get('/auth/github/callback', async (req, res) => {
    const code = req.query.code;
    const error = req.query.error; // Check for the 'error' query parameter

    if (error) {
        // User denied access, handle the error as needed
        return res.status(403).send('Access denied by the user.');
    }
    // Exchange the code for an access token
    try {
        const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
            client_id: process.env.github_client_ID,
            client_secret: process.env.github_client_secret,
            code: code
        }, {
            headers: {
                Accept: 'application/json'
            }
        });

        const accessToken = tokenResponse.data.access_token;

        // Use the access token to fetch the user's GitHub profile
        const userResponse = await axios.get('https://api.github.com/user', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        const userProfile = userResponse.data;

        // You can now use the user profile data as needed
        console.log(userProfile);
        // Redirect the user to the desired page after successful authentication
        res.redirect('/repositories');
        // res.json({"token":accessToken, "msg":"User logged in successfully."});
    } catch (error) {
        console.error(error);
        res.status(500).send('Error occurred during authentication.');
    }
});

// Define an endpoint to push code to GitHub
app.post('/push-to-github', async (req, res) => {
  const { token, repository, filePath, content } = req.body;

  const octokit = new Octokit({ auth: token });

  try {
    const response = await octokit.repos.createOrUpdateFileContents({
      owner: repository.owner,
      repo: repository.name,
      path: filePath,
      message: "Auto-generated code",
      content: Buffer.from(content).toString('base64'),
    });

    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error('GitHub push error:', error);
    res.status(500).json({ error: 'Failed to push code to GitHub.' });
  }
});


app.get('/repositories', async (req, res) => {
  // Check if the user is authenticated (you can use session or token validation here)
  if (!req.session.accessToken) {
    return res.status(401).send('Unauthorized');
  }

  try {
    const accessToken = req.session.accessToken;

    // Fetch the user's repositories from the GitHub API
    const repositoriesResponse = await axios.get(
      'https://api.github.com/user/repos',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const repositoriesData = repositoriesResponse.data;

    // You can customize the response or render a template with the repository data
    res.json(repositoriesData);
  } catch (error) {
    console.error('Error fetching repositories:', error.message);
    res.status(500).send('Error fetching repositories');
  }
});



app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});