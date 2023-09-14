const express = require("express");
const app = express();
require('dotenv').config();
const port = process.env.PORT || 3000; 
const axios = require("axios"); 
const { Octokit } = require("@octokit/rest");
// const { Octokit } = require('github');
const cors = require("cors");
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const session = require('express-session');
app.use(cors());
app.use(express.json());
app.use(session({
  secret: 'code-convertor', // Replace with a strong, random secret
  resave: false,
  saveUninitialized: true,
}));

let accessToken = "";
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

const callbackUrl = 'https://advance-code-player.vercel.app/home.html';

app.get('/auth/github', (req, res) => {
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.CLIENT_ID}&redirect_uri=${callbackUrl}`;
    res.redirect(authUrl);
});


// GitHub callback handler
app.get('/getToken', async (req, res) => {
    const code = req.query.code;
    const error = req.query.error; 

    if (error) {
        return res.status(403).send('Access denied by the user.');
    }
    // Exchange the code for an access token
    try {
        const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            code: code
        }, {
            headers: {
                Accept: 'application/json'
            }
        });

         accessToken = tokenResponse.data.access_token;
        // console.log(accessToken);
        req.session.accessToken = accessToken;
        // Use the access token to fetch the user's GitHub profile
        const userResponse = await axios.get('https://api.github.com/user', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        const userProfile = userResponse.data;
       res.redirect('http://localhost:3000/repositories');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error occurred during authentication.');
    }
});


// Define an endpoint to push code to GitHub
// app.post('/push-to-repo', async (req, res) => {
//   try {
//     // Extract data from the request body
//     const {accessToken, repoName, fileName, commitMessage, code } = req.body;

//     // Define the GitHub API endpoint for creating a new file
//     const apiUrl = `https://api.github.com/repos/${repoName}/contents/${fileName}`;

//     // Construct the request payload
//     const requestData = {
//       message: commitMessage,
//       content: Buffer.from(code).toString('base64'), // Convert code to base64
//     };

//     // Set the authorization header with the GitHub access token
//     const headers = {
//       Authorization: `Bearer ${accessToken}`,
//     };

//     // Make a PUT request to create or update the file in the repository
//     const response = await axios.put(apiUrl, requestData, { headers });

//     if (response.status === 201) {
//       res.status(201).json({ message: 'File created successfully!' });
//     } else {
//       res.status(response.status).json({ message: 'Failed to create file.' });
//     }
//   } catch (error) {
//     console.error('Error pushing code to repository:', error.message);
//     res.status(500).json({ message: 'Internal server error.' });
//   }
// });

app.get('/repositories', async (req, res) => {

  if (!accessToken) {
    return res.status(401).send('Unauthorized');
  }

  try {
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
    // console.log(repositoriesData)
    res.json({"accessToken":accessToken ,"data": repositoriesData});
  } catch (error) {
    console.error('Error fetching repositories:', error.message);
    res.status(500).send('Error fetching repositories');
  }
});

app.post("/push-to-repo", async(req,res)=>{
    try {
      // const access_Token = req.session.accessToken;
      const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const ownerUsername = userResponse.data.login;
    console.log(ownerUsername)
    const {repo, path, commitMessage, content} = req.body;
    const base64EncodedContent = Buffer.from(content).toString('base64');

    // Create or update the file in the repository
    const response = await axios({
      method: 'POST', // Use 'put' to update an existing file, or 'post' to create a new file
      url: `https://api.github.com/repos/${ownerUsername}/${repo}/contents/${path}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      data: {
        message: commitMessage,
        content: base64EncodedContent,
      },
    });

    res.json({ message: 'Code pushed to repository successfully' });
  
      res.json({ message: 'Code pushed to repository successfully', response });
    } catch (error) {
      // console.error(error);
      res.status(500).json({ error: 'Error pushing code to repository', "msg":error.message });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
