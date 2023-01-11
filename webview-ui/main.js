// Get access to the VS Code API from within the webview context
const vscode = acquireVsCodeApi();

// Just like a regular webpage we need to wait for the webview
// DOM to load before we can reference any of the HTML elements
// or toolkit components
window.addEventListener("load", main);

function main() {
  getInput();
  deleteEntry();
}


function getInput() {
  const inputBox = document.getElementById("input");
  inputBox.addEventListener("keypress", (e) => {
    if (e.key === 'Enter') {
      vscode.postMessage({
        command: 'input',
        text: `${inputBox.value}`
      }); 
    }
  });
}


function deleteEntry() {
  const closeButtons = document.getElementsByTagName("vscode-button");

  closeButtons.array.forEach(btn => {
    btn.addEventListener("click", (e) => {
      let entry = btn.parent.children.getElementsByTagName('vscode-checkbox').text;
      vscode.postMessage({
        command: 'delete',
        text: `${entry}`
      }); 
    });
  });
}