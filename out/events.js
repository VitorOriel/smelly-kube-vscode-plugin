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
exports.events = void 0;
const vscode = __importStar(require("vscode"));
const requests_1 = require("./requests");
const hoverProvidersMap = new Map();
var events;
(function (events) {
    function analyzeFile(context, apiUrl) {
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
        (0, requests_1.sendFile)(apiUrl, bodyData)
            .then((responseJson) => {
            vscode.window.showInformationMessage(`Number of vulnerabilities found: ${responseJson.meta.totalOfSmells}`);
            decorateLines(context, editor, getSmellKubernetessFromResponse(responseJson));
        })
            .catch((error) => {
            vscode.window.showErrorMessage(`An error occurs during the request: ${error.message}`);
        });
    }
    events.analyzeFile = analyzeFile;
    function onCloseFile(document) {
        const hoverProviders = hoverProvidersMap.get(document);
        if (hoverProviders !== undefined) {
            for (const hoverProvider of hoverProviders) {
                hoverProvider.dispose();
            }
        }
    }
    events.onCloseFile = onCloseFile;
})(events || (exports.events = events = {}));
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
function getHoverMessage(workload) {
    let message = "";
    message = message.concat(`**Issue**: \`${workload.message}\``);
    message = message.concat(`\n\n**Suggestion**: \`${workload.suggestion}\``);
    return message;
}
function registerHover(context, document, workloads, workloadPositionsInText) {
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
            hoverProviders = [];
        }
        hoverProviders.push(hoverProvider);
        hoverProvidersMap.set(document, hoverProviders);
    }
}
function colourLine(editor, workloads, workloadPositionsInText) {
    const uniqueSmellKubernetess = workloads.reduce((acc, current) => {
        if (!acc.some(item => item.workload_position === current.workload_position)) {
            acc.push(current);
        }
        return acc;
    }, []);
    const ranges = [];
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
function decorateLines(context, editor, workloads) {
    const document = editor.document;
    const lines = document.getText().split('\n');
    let workloadPositionsInText = [];
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
//# sourceMappingURL=events.js.map