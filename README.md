# smelly-kube-vscode-plugin

This is the Visual Studio Code plugin for [Smelly Kube](https://github.com/VitorOriel/security-smells-api), used to identify security vulnerabilities in Kubernetes manifests. The extension is already published in [vscode marketplace](https://marketplace.visualstudio.com/items?itemName=vitorwixmix.smelly-kube-vscode-plugin), and can be continuously improved with new features. Feel free to contribute with the extension.

## Running the extension

1. Set the environment variables below in a `.env` file;

| Name | Description | Type | Required? |
| :--- | :--- | :--- | :--- |
| `API_URL` | The Smelly Kube API url and endpoint | string | Yes |

2. Install the dependencies with `npm install .`;
3. Press `F5` to open a new window with your extension loaded through your Visual Studio Code;
4. Run the command from the command palette by pressing (`F1` or `Cmd+Shift+P` on Mac) and typing `Analyze file for vulnerabilities`;

## Operating System

The extension was developed under Ubuntu 22.04.4 LTS

## Technologies

- TypeScript
- Node v20.13.1
- npm v10.5.2
- Visual Studio Code v1.92.0

## Dependencies

Dependencies can be found in [package.json](package.json), and for installing them you must install [node](https://nodejs.org/en/download/package-manager)
