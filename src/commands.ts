import * as vscode from 'vscode';

import { SmellKubernetes, Response, RequestError } from './models';
import { sendFile } from './requests';

export namespace pluginCommands {
    export function analyzeFile(context: vscode.ExtensionContext, apiUrl: string) {
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
		sendFile(apiUrl, bodyData)
			.then((responseJson: Response) => {
				vscode.window.showInformationMessage('Number of vulnerabilities found: ' + responseJson.meta.totalOfSmells);
				decorateLines(editor, context, getSmellKubernetessFromResponse(responseJson));
			})
			.catch((error: RequestError) => {
				vscode.window.showErrorMessage('Error occurred:', error.message);
			});
    }
}

function getSmellKubernetessFromResponse(data: Response): SmellKubernetes[] {
	const workloads: SmellKubernetes[] = [];
	for (const [_, value] of Object.entries(data.data)) {
		for (const workload of value) {
			workloads.push(workload)
		}
	}
	workloads.sort((a, b) => a.workload_position - b.workload_position);
	return workloads;
}

function getHoverMessage(workloads: SmellKubernetes[]): string {
	let message: string = "";
	workloads.forEach((workload) => {
		message = message.concat(`\tIssue: ${workload.message}\n\tFix: ${workload.suggestion}`);
		message = message.concat("\n\n", "─".repeat(40), "\n\n");
	});
	return message;
}

function decorateLines(editor: vscode.TextEditor, context: vscode.ExtensionContext, workloads: SmellKubernetes[]) {
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
	const uniqueSmellKubernetess = workloads.reduce((acc: SmellKubernetes[], current: SmellKubernetes) => {
		if (!acc.some(item => item.workload_position === current.workload_position)) {
			acc.push(current);
		}
		return acc;
	}, []);
	const ranges: vscode.Range[] = [];
    uniqueSmellKubernetess.forEach(workload => {
		const lineRange = document.lineAt(workloadPositionsInText[workload.workload_position]).range;
        ranges.push(lineRange);
    });
	editor.setDecorations(decorationType, ranges);
    context.subscriptions.push(hoverProvider);
}
