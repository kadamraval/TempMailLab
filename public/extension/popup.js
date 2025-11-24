const generateButton = document.getElementById('generate-button');
const copyButton = document.getElementById('copy-button');
const emailOutput = document.getElementById('email-output');
const copyFeedback = document.getElementById('copy-feedback');

const domains = [
    'tempmailer.com',
    'quickmail.dev',
    'inboxgenie.net',
];

function generateRandomString(length) {
  let result = '';
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

function generateNewEmail() {
    const randomPrefix = generateRandomString(10);
    const randomDomain = domains[Math.floor(Math.random() * domains.length)];
    const newEmail = `${randomPrefix}@${randomDomain}`;
    emailOutput.value = newEmail;
    copyFeedback.textContent = '';
}

function copyToClipboard() {
    if (!emailOutput.value) return;
    navigator.clipboard.writeText(emailOutput.value)
        .then(() => {
            copyFeedback.textContent = 'Copied!';
            setTimeout(() => {
                copyFeedback.textContent = '';
            }, 2000);
        })
        .catch(err => {
            console.error('Failed to copy text: ', err);
            copyFeedback.textContent = 'Failed to copy';
        });
}

// Load the last email from storage when the popup opens
chrome.storage.local.get(['tempEmail'], function(result) {
    if (result.tempEmail) {
        emailOutput.value = result.tempEmail;
    }
});

generateButton.addEventListener('click', () => {
    generateNewEmail();
    // Save the new email to storage
    chrome.storage.local.set({tempEmail: emailOutput.value});
});

copyButton.addEventListener('click', copyToClipboard);
