// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import fetch from 'node-fetch';
import dotenv from 'dotenv'; 

function getApiUrl(): string {
	dotenv.config();
	const apiUrl = process.env.API_URL;
	if (apiUrl == undefined) {
		throw Error("the environment variable API_URL must be set");
	}
	return String(process.env.API_URL);
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const apiUrl = getApiUrl();
	
	let disposable = vscode.commands.registerCommand('extension.inspectFile', () => {
        // Get the active text editor
        let editor = vscode.window.activeTextEditor;
        if (editor) {
            // Get the document associated with the active text editor
            let document = editor.document;
            // Get the text content of the document
            let text = document.getText();
            vscode.window.showInformationMessage(`Sucessfully reat the file, len: ${text.length}`);
			(async () => {
				try {
					// Make an HTTP POST request
					const response = await fetch(apiUrl, {
						method: 'POST',
						body: text,
						headers: {
							'Content-Type': 'text/plain'
						}
					});
					// Check if the request was successful (status code 2xx)
					if (response.ok) {
						let data = await response.json(); // Parse response body as JSON
						vscode.window.showInformationMessage('Request successful. Response: ' + JSON.stringify(data));
					} else {
						vscode.window.showErrorMessage('Request failed with status: ' + response.status);
					}
				} catch (error) {
					vscode.window.showErrorMessage('Error making request: ' + error);
				}
			})();
        } else {
            vscode.window.showErrorMessage('No active text editor.');
        }
    });
	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
