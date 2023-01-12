import * as vscode from 'vscode';
import { LineMetricProvider } from './tree/lineMetricProvider';
import { ConfigProvider } from './config/configProvider';
import { joinPath } from './utils';


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let configFilePath: vscode.Uri = joinPath(context.extensionUri, ['config.txt']);
	let wsFolders = vscode.workspace.workspaceFolders;
	
	if (wsFolders !== undefined) {
		let root: vscode.Uri = vscode.Uri.file(wsFolders[0].uri.path);
		let lineMetricProvider = new LineMetricProvider(root, configFilePath);
		context.subscriptions.push(
			vscode.window.createTreeView('explorer', { treeDataProvider: lineMetricProvider })
		);

		let configProvider = new ConfigProvider(context.extensionUri, configFilePath, lineMetricProvider);
		context.subscriptions.push(
			vscode.window.registerWebviewViewProvider("configuration", configProvider)
		);

	} else {
		vscode.window.showInformationMessage(`Please open a directory or workspace to start line metrics.`);
	}
}

// This method is called when your extension is deactivated
export function deactivate() {}
