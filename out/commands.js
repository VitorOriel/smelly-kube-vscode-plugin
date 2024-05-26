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
Object.defineProperty(exports, "__esModule", { value: true });
exports.pluginCommands = void 0;
const vscode = __importStar(require("vscode"));
const requests_1 = require("./requests");
var pluginCommands;
(function (pluginCommands) {
    function analyzeFile(context, apiUrl) {
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
        (0, requests_1.sendFile)(apiUrl, bodyData)
            .then((responseJson) => {
            vscode.window.showInformationMessage('Number of vulnerabilities found: ' + responseJson.meta.totalOfSmells);
            decorateLines(editor, context, getSmellKubernetessFromResponse(responseJson));
        })
            .catch((error) => {
            vscode.window.showErrorMessage('Error occurred:', error.message);
        });
    }
    pluginCommands.analyzeFile = analyzeFile;
})(pluginCommands || (exports.pluginCommands = pluginCommands = {}));
function getSmellKubernetessFromResponse(data) {
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
    const uniqueSmellKubernetess = workloads.reduce((acc, current) => {
        if (!acc.some(item => item.workload_position === current.workload_position)) {
            acc.push(current);
        }
        return acc;
    }, []);
    const ranges = [];
    uniqueSmellKubernetess.forEach(workload => {
        const lineRange = document.lineAt(workloadPositionsInText[workload.workload_position]).range;
        ranges.push(lineRange);
    });
    editor.setDecorations(decorationType, ranges);
    context.subscriptions.push(hoverProvider);
}
//# sourceMappingURL=commands.js.map