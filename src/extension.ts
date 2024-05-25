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

function getWorkloadsFromResponse(data: Response): Workload[] {
	const workloads: Workload[] = [];
	for (const [_, value] of Object.entries(data.data)) {
		for (const workload of value) {
			workloads.push(workload)
		}
	}
	workloads.sort((a, b) => a.workload_position - b.workload_position);
	return workloads;
}

function getHoverMessage(workloads: Workload[]): string {
	let message: string = "";
	workloads.forEach((workload) => {
		message = message.concat(`\tIssue: ${workload.message}\n\tFix: ${workload.suggestion}`);
		message = message.concat("\n\n", "─".repeat(40), "\n\n");
	});
	return message;
}

function decorateLines(editor: vscode.TextEditor, context: vscode.ExtensionContext, workloads: Workload[]) {
	const document = editor.document;
	const lines = document.getText().split('\n');
	let workloadPositionsInText: number[] = [];
	if (lines[0] !== "---") {
		workloadPositionsInText.push(0);
	}
	for (const [i, value] of lines.entries()) {
		if (value === "---") {
			workloadPositionsInText.push(i+1);
		}
	}
	// Define a decoration type with red background for the first line and a gutter icon
    const decorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255, 0, 0, 0.3)', // Red background color with opacity
    });
    // Define a hover provider to display information when the user hovers over the gutter icon
    const hoverProvider = vscode.languages.registerHoverProvider(document.languageId, {
        provideHover: (document, position, token) => {
			for (const workload of workloads) {
				if (position.line == workloadPositionsInText[workload.workload_position]) {
					return new vscode.Hover(getHoverMessage(workloads.filter(w => w.workload_position === workload.workload_position)));
				}
			}
        }
    });
	const uniqueWorkloads = workloads.reduce((acc: Workload[], current: Workload) => {
		if (!acc.some(item => item.workload_position === current.workload_position)) {
			acc.push(current);
		}
		return acc;
	}, []);
	const ranges: vscode.Range[] = [];
    uniqueWorkloads.forEach(workload => {
		const lineRange = document.lineAt(workloadPositionsInText[workload.workload_position]).range;
        ranges.push(lineRange);
    });
	editor.setDecorations(decorationType, ranges);
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
		sendFile(apiUrl, bodyData).then(responseJson => {
			if (responseJson !== undefined) {
				vscode.window.showInformationMessage('Number of vulnerabilities found: ' + responseJson.meta.totalOfSmells);
				decorateLines(editor, context, getWorkloadsFromResponse(responseJson));
			}
		});
    });
	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
