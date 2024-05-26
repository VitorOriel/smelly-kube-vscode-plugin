// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import dotenv from 'dotenv'; 

import { events } from './events';

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
	
	let disposable = vscode.commands.registerCommand('extension.inspectFile', () => { events.analyzeFile(context, apiUrl); });
	vscode.workspace.onDidCloseTextDocument((document: vscode.TextDocument) => { events.onCloseFile(document); });
	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
