// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as fs from 'fs';
import * as vscode from 'vscode';
import { LineMetricProvider } from './lineMetricProvider';
import * as pathTool from 'path';
import { open } from 'node:fs/promises';
import { privateEncrypt } from 'crypto';
import { assert } from 'console';
import { isDirectory } from './utils';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "show-line-metrics" is now active!');
	
	
	let wsFolders = vscode.workspace.workspaceFolders;
	if (wsFolders !== undefined) {
		let root: vscode.Uri = vscode.Uri.file(wsFolders[0].uri.path);
		vscode.window.createTreeView('package-dependencies', {
			treeDataProvider: new LineMetricProvider(root)
		});
	} else {
		vscode.window.showInformationMessage(`Please open a directory or workspace to start line metrics.`);
	}
}

// This method is called when your extension is deactivated
export function deactivate() {}
