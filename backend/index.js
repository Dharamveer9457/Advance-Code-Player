const express = require("express");
const app = express();
require('dotenv').config();
const port = process.env.PORT || 3000; 
const axios = require("axios"); 
const { Octokit } = require("@octokit/rest");
const cors = require("cors");
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const session = require('express-session');
app.use(cors());
app.use(express.json());
app.use(session({
  secret: 'code-convertor', 
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

app.post("/push-to-repo", async (req, res) => {
  const { accessToken, repo, branchName, fileName, commitMessage, fileContent, owner } = req.body;
  const octokit = new Octokit({
    auth: accessToken,
  });

  try {
    // Fetch the branch information
    const { data: branchData } = await octokit.repos.getBranch({
      owner,
      repo,
      branch: branchName, 
    });
    // console.log(data)

    // Get the latest commit on the branch
    const latestCommitSha = branchData.commit.sha;

    // Get the current tree of the latest commit
    const { data: treeData } = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: latestCommitSha,
      recursive: true,
    });

    // Find the file if it already exists in the tree
    const file = treeData.tree.find((item) => item.path === fileName);

    if (file) {
      // If the file exists, update it
      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: fileName,
        message: commitMessage,
        content: Buffer.from(fileContent).toString("base64"),
        sha: file.sha,
        branch: branchName, 
      });
    } else {
      // If the file doesn't exist, create it
      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: fileName,
        message: commitMessage,
        content: Buffer.from(fileContent).toString("base64"),
        branch: branchName, 
      });
    }

    console.log(`File "${fileName}" created/updated successfully!`);
    res.json({ isSuccess: true });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ isSuccess: false }); 
  }
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
