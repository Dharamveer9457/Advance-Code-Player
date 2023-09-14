const codeEditor = document.getElementById("editor");
const convertBtn = document.getElementById("convert");
const debugBtn = document.getElementById("debug");
const qualityBtn = document.getElementById("quality-check");
const outputRes = document.getElementById("converted-code");
const selectLanguage = document.getElementById("language");
const githubAuthButton = document.getElementById("github-auth");
const repositorySelect = document.getElementById("repository");
const pushToGithubButton = document.getElementById("pushToGithub");
const modal = document.getElementById('myModal');
const closeModal = document.getElementById('closeModal');
const pushCodeButton = document.getElementById('pushCode');
const folderInput = document.getElementById('folder');
const commitMessageInput = document.getElementById('commitMessage');

convertBtn.addEventListener("click",convertCode);
debugBtn.addEventListener("click", debugCode);
qualityBtn.addEventListener("click", qualityCheck);

// Event listener for the "Push Code to GitHub" button
pushToGithubButton.addEventListener('click', () => {
    modal.style.display = 'block'; // Display the modal
    populateRepositories();
});

// Event listener to close the modal
closeModal.addEventListener('click', () => {
    modal.style.display = 'none'; // Hide the modal
});

function convertCode(){
    const code = editor.getValue();
    const language = selectLanguage.value;

    if (code === "//Write your code here...") {
        Swal.fire({
            icon: 'error',
            title: 'Editor cannot be empty',
            text: 'Type the code to convert',
            confirmButtonText: 'OK'
          });
    }else if(language === ""){
        Swal.fire({
            icon: 'error',
            title: 'Language not selected',
            text: 'Please select a language',
            confirmButtonText: 'OK'
          });
    }
     else {
        fetch(`https://code-generator-fbiy.onrender.com/convert`,{
            method: 'POST',
            headers : {'Content-Type': 'application/json'},
            body : JSON.stringify({"code":code, "language":language})
        })
        .then((response) => response.json())
        .then((data) => {
            outputRes.innerHTML = `Output:- \n ${data.convertedCode}`
        })
        .catch((error) => {
            console.error("Error fetching quote:", error);
        });
    }
}

function debugCode(){
    const code = editor.getValue();
    
    if (code === "//Write your code here...") {
        Swal.fire({
            icon: 'error',
            title: 'Editor cannot be empty',
            text: 'Type the code to convert',
            confirmButtonText: 'OK'
          });
    }
     else {
        fetch(`https://code-generator-fbiy.onrender.com/debug`,{
            method: 'POST',
            headers : {'Content-Type': 'application/json'},
            body : JSON.stringify({"code":code})
        })
        .then((response) => response.json())
        .then((data) => {
            outputRes.innerHTML = `Output:- \n ${data.debuggedCode}`
        })
        .catch((error) => {
            console.error("Error fetching quote:", error);
        });
    }
}

function qualityCheck(){
    const code = editor.getValue();
    if (code === "//Write your code here...") {
        Swal.fire({
            icon: 'error',
            title: 'Editor cannot be empty',
            text: 'Type the code to convert',
            confirmButtonText: 'OK'
          });
    }
     else {
        fetch(`https://code-generator-fbiy.onrender.com/quality`,{
            method: 'POST',
            headers : {'Content-Type': 'application/json'},
            body : JSON.stringify({"code":code})
        })
        .then((response) => response.json())
        .then((data) => {
            outputRes.innerHTML = `Output:- \n ${data.checkedCode}`
        })
        .catch((error) => {
            console.error("Error fetching quote:", error);
        });
    }
}

async function populateRepositories() {
    try {
        // Make a GET request to your /api/github-repositories endpoint
        const response = await fetch('https://advance-code-player.onrender.com/repositories', {
            method: 'GET',
            headers: {
              Accept: 'application/json',
            },
          });
      
          if (response.ok) {
            const repositoriesData = await response.json();
            // const repositorySelect = document.getElementById('repository');
            repositorySelect.innerHTML = ''; // Clear existing options
      
            if (repositoriesData.length === 0) {
              repositorySelect.innerHTML = '<option value="">No repositories found.</option>';
            } else {
              repositoriesData.forEach(repo => {
                const option = document.createElement('option');
                option.value = repo.name;
                option.text = repo.name;
                repositorySelect.appendChild(option);
              });
            }
          } else {
            console.error('Error fetching repositories:', response.statusText);
          }
        } catch (error) {
          console.error('Error fetching repositories:', error.message);
        }      
}

pushCodeButton.addEventListener('click', async () => {
    const accessToken = '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'; // Replace with your GitHub access token
    const repoName = repoNameInput.value;
    const fileName = fileNameInput.value;
    const commitMessage = commitMessageInput.value;
    const code = outputRes.innerHTML;

    try {
      // Make a POST request to your API endpoint
      const response = await fetch('https://advance-code-player.onrender.com/push-to-repo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken,
          repoName,
          fileName,
          commitMessage,
          code,
        }),
      });

      if (response.ok) {
        alert('Code pushed to GitHub successfully!');
        modal.style.display = 'none';
      } else {
        const responseData = await response.json();
        alert(`Error: ${responseData.message}`);
      }
    } catch (error) {
      console.error('Error pushing code to GitHub:', error.message);
      alert('An error occurred while pushing code to GitHub.');
    }
  });