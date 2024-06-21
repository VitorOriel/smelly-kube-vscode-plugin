import * as vscode from 'vscode';

import { SmellKubernetes, Response, RequestError } from './models';
import { sendFile } from './requests';

interface HoverProviderInfo {
	disposable: vscode.Disposable;
	fileName: string;
}

const hoverProviders: Map<vscode.TextDocument, HoverProviderInfo> = new Map();

export namespace events {
	export function analyzeFile(context: vscode.ExtensionContext, apiUrl: string) {
		let editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active text editor.');
			return;
		}
		let document = editor.document;
		const bodyData = {
			fileName: document.fileName,
			yamlToValidate: document.getText(),
		};
		sendFile(apiUrl, bodyData)
			.then((responseJson: Response) => {
				vscode.window.showInformationMessage('Number of vulnerabilities found: ' + responseJson.meta.totalOfSmells);
				decorateLines(context, editor, getSmellKubernetessFromResponse(responseJson));
			})
			.catch((error: RequestError) => {
				vscode.window.showErrorMessage('Error occurred:', error.message);
			});
	}

	export function onCloseFile(document: vscode.TextDocument) {
		const providerInfo = hoverProviders.get(document);
		if (providerInfo !== undefined) {
			providerInfo.disposable.dispose();
		}
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

function registerHover(context: vscode.ExtensionContext, document: vscode.TextDocument, workloads: SmellKubernetes[], workloadPositionsInText: number[]) {
	const hoverProvider = vscode.languages.registerHoverProvider(document.languageId, {
		provideHover: (document, position, token) => {
			for (const workload of workloads) {
				if (position.line == workloadPositionsInText[workload.workload_position]) {
					return new vscode.Hover(getHoverMessage(workloads.filter(w => w.workload_position === workload.workload_position)));
				}
			}
		}
	});
	context.subscriptions.push(hoverProvider);
	hoverProviders.set(document, {disposable: hoverProvider, fileName: document.fileName} as HoverProviderInfo);
}

function colourLine(editor: vscode.TextEditor, workloads: SmellKubernetes[], workloadPositionsInText: number[]) {
	const decorationType = vscode.window.createTextEditorDecorationType({
		backgroundColor: 'rgba(255, 0, 0, 0.3)',
	});
	const uniqueSmellKubernetess = workloads.reduce((acc: SmellKubernetes[], current: SmellKubernetes) => {
		if (!acc.some(item => item.workload_position === current.workload_position)) {
			acc.push(current);
		}
		return acc;
	}, []);
	const ranges: vscode.Range[] = [];
	uniqueSmellKubernetess.forEach(workload => {
		const lineRange = editor.document.lineAt(workloadPositionsInText[workload.workload_position]).range;
		ranges.push(lineRange);
	});
	editor.setDecorations(decorationType, ranges);
}

function decorateLines(context: vscode.ExtensionContext, editor: vscode.TextEditor, workloads: SmellKubernetes[]) {
	const document = editor.document;
	const lines = document.getText().split('\n');
	let workloadPositionsInText: number[] = [];
	const workloadSignature = "apiVersion";
	for (const [i, value] of lines.entries()) {
		if (value.substring(0, workloadSignature.length) === workloadSignature) {
			workloadPositionsInText.push(i);
		}
	}
	registerHover(context, document, workloads, workloadPositionsInText);
	colourLine(editor, workloads, workloadPositionsInText);
}
