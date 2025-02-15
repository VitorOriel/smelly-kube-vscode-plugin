import * as vscode from 'vscode';

import { SmellKubernetes, Response, RequestError } from './models';
import { sendFile } from './requests';

const hoverProvidersMap: Map<vscode.TextDocument, vscode.Disposable[]> = new Map();

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
				vscode.window.showInformationMessage(`Number of vulnerabilities found: ${responseJson.meta.totalOfSmells}`);
				decorateLines(context, editor, getSmellKubernetessFromResponse(responseJson));
			})
			.catch((error: RequestError) => {
				vscode.window.showErrorMessage(`An error occurs during the request: ${error.message}`);
			});
	}

	export function onCloseFile(document: vscode.TextDocument) {
		const hoverProviders = hoverProvidersMap.get(document);
		if (hoverProviders !== undefined) {
			for (const hoverProvider of hoverProviders) {
				hoverProvider.dispose();
			}
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

function getHoverMessage(workload: SmellKubernetes): string {
	let message: string = "";
	message = message.concat(`**Issue**: \`${workload.message}\``);
	message = message.concat(`\n\n**Suggestion**: \`${workload.suggestion}\``);
	return message;
}

function registerHover(context: vscode.ExtensionContext, document: vscode.TextDocument, workloads: SmellKubernetes[], workloadPositionsInText: number[]) {
	for (const workload of workloads) {
		const hoverProvider = vscode.languages.registerHoverProvider(document.languageId, {
			provideHover: (document, position, token) => {
				if (position.line == workloadPositionsInText[workload.workload_position]) {
					return new vscode.Hover(getHoverMessage(workload));
				}
			}
		});
		context.subscriptions.push(hoverProvider);
		let hoverProviders = hoverProvidersMap.get(document);
		if (hoverProviders === undefined) {
			hoverProviders = [] as vscode.Disposable[];
		}
		hoverProviders.push(hoverProvider);
		hoverProvidersMap.set(document, hoverProviders);
	}
}

function colourLine(editor: vscode.TextEditor, workloads: SmellKubernetes[], workloadPositionsInText: number[]) {
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
	const backgroundDecoration = vscode.window.createTextEditorDecorationType({
		backgroundColor: 'rgba(255, 0, 0, 0.3)',
		overviewRulerColor: 'red',
		overviewRulerLane: vscode.OverviewRulerLane.Full,
		isWholeLine: true,
	});
	editor.setDecorations(backgroundDecoration, ranges);
	const borderDecoration = vscode.window.createTextEditorDecorationType({
		borderStyle: "dotted",
		borderColor: "white",
		borderWidth: "0.5px",
	});
	editor.setDecorations(borderDecoration, ranges);
}

function decorateLines(context: vscode.ExtensionContext, editor: vscode.TextEditor, workloads: SmellKubernetes[]) {
	const document = editor.document;
	const lines = document.getText().split('\n');
	let workloadPositionsInText: number[] = [];
	if (lines[0] === "---") {
		workloadPositionsInText.push(0);
	}
	const workloadSignature = "apiVersion";
	for (const [i, value] of lines.entries()) {
		if (value.substring(0, workloadSignature.length) === workloadSignature) {
			workloadPositionsInText.push(i);
		}
	}
	registerHover(context, document, workloads, workloadPositionsInText);
	colourLine(editor, workloads, workloadPositionsInText);
}
