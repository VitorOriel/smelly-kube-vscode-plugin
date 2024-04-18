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
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
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
                    const response = await (0, node_fetch_1.default)('http://localhost:8000', {
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