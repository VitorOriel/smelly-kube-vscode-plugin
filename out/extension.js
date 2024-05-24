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
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
    const apiUrl = getApiUrl();
    let disposable = vscode.commands.registerCommand('extension.inspectFile', () => {
        // Get the active text editor
        let editor = vscode.window.activeTextEditor;
        if (editor) {
            // Get the document associated with the active text editor
            let document = editor.document;
            // Get the text content of the document
            const bodyData = {
                fileName: document.fileName,
                yamlToValidate: document.getText(),
            };
            (async () => {
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
                        vscode.window.showInformationMessage('Number of vulnerabilities found: ' + data['totalOfSmells']);
                        for (const [key, value] of Object.entries(data)) {
                            if (key !== 'totalOfSmells') {
                                if (Array.isArray(value) && value.length > 0) {
                                    for (const v of value) {
                                        vscode.window.showWarningMessage("Vulnerability found: " + v.message + '\nFix: ' + v.suggestion);
                                    }
                                }
                            }
                        }
                    }
                    else {
                        vscode.window.showErrorMessage('Request failed with status: ' + response.status);
                    }
                }
                catch (error) {
                    vscode.window.showErrorMessage('Error making request: ' + error);
                }
            })();
        }
        else {
            vscode.window.showErrorMessage('No active text editor.');
        }
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
// This method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map