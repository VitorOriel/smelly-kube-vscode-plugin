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
function decorateLines(editor, text) {
    const document = editor.document;
    // Split the text into workloads based on the delimiter '---'
    const workloads = text.split('---').map(workload => workload.trim()).filter(workload => workload.length > 0);
    // Define a decoration type with red background for the first line
    const decorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255, 0, 0, 0.3)' // Red background color with opacity
    });
    // Iterate over each workload and color the background of the first line
    workloads.forEach(workload => {
        // Get the range of the first line
        const firstLineRange = new vscode.Range(document.positionAt(0), document.positionAt(workload.indexOf('\n')));
        // Add the decoration to the editor
        editor.setDecorations(decorationType, [{ range: firstLineRange }]);
    });
}
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
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
            decorateLines(editor, document.getText());
        });
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
// This method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map