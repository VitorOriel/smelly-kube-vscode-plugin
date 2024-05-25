// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import fetch from 'node-fetch';
import dotenv from 'dotenv'; 

type Workload = {
	workload_position: number
	message: string
	suggestion: string
}

type Meta = {
	totalOfSmells: number
}

type Data = {
	smellsReplicaSet: Workload[]
	smellsDeployment: Workload[]
	smellsPod: Workload[]
	smellsJob: Workload[]
	smellsCronJob: Workload[]
	smellsStatefulSet: Workload[]
	smellDemonSet: Workload[]
}

type Response = {
	meta: Meta
	data: Data
}

function getApiUrl(): string {
	dotenv.config();
	const apiUrl = process.env.API_URL;
	if (apiUrl == undefined) {
		throw Error("the environment variable API_URL must be set");
	}
	return String(process.env.API_URL);
}

function sendFile(apiUrl: string, bodyData: any): Promise<Response | undefined> {
	return new Promise<Response | undefined>(async (resolve, reject) => {
		try {
			// Make an HTTP POST request
			const response = await fetch(apiUrl, {
				method: 'POST',
				body: JSON.stringify(bodyData),
				headers: {
					'Content-Type': 'application/json',
				}
			});
			// Check if the request was successful (status code 2xx)
			if (response.ok) {
				const data = await response.json() as Response;
				resolve(data);
			} else {
				vscode.window.showErrorMessage('Request failed with status: ' + response.status);
				resolve(undefined);
			}
		} catch (error) {
			vscode.window.showErrorMessage('Error making request: ' + error);
			resolve(undefined);
		}
	});
}

function decorateLines(editor: vscode.TextEditor, context: vscode.ExtensionContext) {
	const document = editor.document;
	// Split the text into workloads based on the delimiter '---'
	const workloads = editor.document.getText().split('---').map(workload => workload.trim()).filter(workload => workload.length > 0);

	// Define a decoration type with red background for the first line and a gutter icon
    const decorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255, 0, 0, 0.3)', // Red background color with opacity
        gutterIconPath: context.asAbsolutePath('resources/circle-red.svg'), // Path to the red circle icon
        gutterIconSize: 'contain' // Size of the gutter icon
    });

    // Define a hover provider to display information when the user hovers over the gutter icon
    const hoverProvider = vscode.languages.registerHoverProvider(document.languageId, {
        provideHover: (document, position, token) => {
            // Check if the position is within the range of the decorated lines
            if (workloads.some(workload => position.line >= document.positionAt(workload.indexOf('\n')).line && position.line <= document.positionAt(workload.indexOf('\n')).line)) {
                return new vscode.Hover('There is a problem with this line. Hold the mouse over the icon to see details.'); // Placeholder text
            }
        }
    });

    // Iterate over each workload and color the background of the first line
    workloads.forEach(workload => {
        // Get the range of the first line
        const firstLineRange = new vscode.Range(document.positionAt(0), document.positionAt(workload.indexOf('\n')));

        // Add the decoration to the editor
        editor.setDecorations(decorationType, [{ range: firstLineRange }]);
    });

    // Subscribe hover provider to the context subscriptions
    context.subscriptions.push(hoverProvider);
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const apiUrl = getApiUrl();
	
	let disposable = vscode.commands.registerCommand('extension.inspectFile', () => {
        // Get the active text editor
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
			vscode.window.showErrorMessage('No active text editor.');
			return;
		}
		// Get the document associated with the active text editor
		let document = editor.document;
		// Get the text content of the document
		const bodyData = {
			fileName: document.fileName,
			yamlToValidate: document.getText(),
		};
		sendFile(apiUrl, bodyData).then(data => {
			if (data !== undefined) {
				vscode.window.showInformationMessage('Number of vulnerabilities found: ' + data.meta.totalOfSmells);
				for (const [key, value] of Object.entries(data.data)) {
					if (Array.isArray(value) && value.length > 0) {
						for (const v of value) {
							vscode.window.showWarningMessage("Vulnerability found: " + v.message + '\nFix: ' + v.suggestion);
						}
					}
				}
			}
			decorateLines(editor, context);
		});
    });
	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
