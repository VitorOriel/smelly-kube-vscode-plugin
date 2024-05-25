"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __importStar(require("vscode"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const dotenv_1 = __importDefault(require("dotenv"));
function getApiUrl() {
    dotenv_1.default.config();
    const apiUrl = process.env.API_URL;
    if (apiUrl == undefined) {
        throw Error("the environment variable API_URL must be set");
    }
    return String(process.env.API_URL);
}
function sendFile(apiUrl, bodyData) {
    return new Promise(async (resolve, reject) => {
        try {
            // Make an HTTP POST request
            const response = await (0, node_fetch_1.default)(apiUrl, {
                method: 'POST',
                body: JSON.stringify(bodyData),
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            // Check if the request was successful (status code 2xx)
            if (response.ok) {
                const data = await response.json();
                resolve(data);
            }
            else {
                vscode.window.showErrorMessage('Request failed with status: ' + response.status);
                resolve(undefined);
            }
        }
        catch (error) {
            vscode.window.showErrorMessage('Error making request: ' + error);
            resolve(undefined);
        }
    });
}
function getWorkloadsFromResponse(data) {
    const workloads = [];
    for (const [_, value] of Object.entries(data.data)) {
        for (const workload of value) {
            workloads.push(workload);
        }
    }
    workloads.sort((a, b) => a.workload_position - b.workload_position);
    return workloads;
}
function getHoverMessage(workloads) {
    let message = "";
    workloads.forEach((workload) => {
        message = message.concat(`\tIssue: ${workload.message}\n\tFix: ${workload.suggestion}`);
        message = message.concat("\n\n", "─".repeat(40), "\n\n");
    });
    return message;
}
function decorateLines(editor, context, workloads) {
    const document = editor.document;
    const lines = document.getText().split('\n');
    let workloadPositionsInText = [];
    if (lines[0] !== "---") {
        workloadPositionsInText.push(0);
    }
    for (const [i, value] of lines.entries()) {
        if (value === "---") {
            workloadPositionsInText.push(i + 1);
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
    const uniqueWorkloads = workloads.reduce((acc, current) => {
        if (!acc.some(item => item.workload_position === current.workload_position)) {
            acc.push(current);
        }
        return acc;
    }, []);
    const ranges = [];
    uniqueWorkloads.forEach(workload => {
        const lineRange = document.lineAt(workloadPositionsInText[workload.workload_position]).range;
        ranges.push(lineRange);
    });
    editor.setDecorations(decorationType, ranges);
    context.subscriptions.push(hoverProvider);
}
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
    const apiUrl = "http://localhost:3000/api/v1/smelly";
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
exports.activate = activate;
// This method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map