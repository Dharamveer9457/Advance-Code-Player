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
        const response = await fetch('https://api.github.com/user/repos', {
            headers: {
                'Authorization': 'Bearer YOUR_ACCESS_TOKEN' // Replace with your access token
            }
        });

        if (response.ok) {
            const repositories = await response.json();
            repositories.forEach(repo => {
                const option = document.createElement('option');
                option.value = repo.full_name;
                option.textContent = repo.full_name;
                repositorySelect.appendChild(option);
            });
        } else {
            console.error('Error fetching repositories.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

pushCodeButton.addEventListener('click', async () => {
    // Retrieve input values
    const repository = document.getElementById('repository').value;
    const filePath = document.getElementById('filePath').value;
    const content = document.getElementById('content').value;

    // Make an API request to push the code to GitHub
    try {
        const response = await fetch('/push-to-github', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token,
                repository,
                filePath : folderInput.value,
                content : outputRes.value
            })
        });

        if (response.ok) {
            alert('Code pushed to GitHub successfully!');
        } else {
            alert('Error pushing code to GitHub.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred.');
    }

    // Close the modal after pushing the code
    modal.style.display = 'none';
});