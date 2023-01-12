
import * as vscode from 'vscode';
import { LineMetricsNode } from './lineMetricsNode';
import { getFolderName, pathExists } from '../utils';

export class LineMetricProvider implements vscode.TreeDataProvider<LineMetricsNode> {
    private _onDidChangeTreeData: vscode.EventEmitter<LineMetricsNode | undefined> = 
        new vscode.EventEmitter<LineMetricsNode | undefined>();

    readonly onDidChangeTreeData ? : vscode.Event<LineMetricsNode | undefined> = this._onDidChangeTreeData.event;

    
    constructor(private path: vscode.Uri, private configFilePath: vscode.Uri) {
        if (!pathExists(path)) {
            vscode.window.showInformationMessage(`${path} is not a valid directory!`);
        }
        vscode.commands.registerCommand('refresh', () => this.refresh());
    }

    getTreeItem(element: LineMetricsNode): vscode.TreeItem {
        return element;
    }

    getChildren(element?: LineMetricsNode): Thenable<LineMetricsNode[]> {
        if (element) {
            return Promise.resolve(element.getChildren());
        } else {
            if (this.path === undefined) {
                vscode.window.showInformationMessage('There are no files open to parse for line metrics!');
                return Promise.resolve([]);

            } else if (!pathExists(this.path)){
                vscode.window.showInformationMessage(`${this.path} is not a valid directory!`);
                return Promise.resolve([]);

            } else {
                let label = getFolderName(this.path);
                let rootNode: LineMetricsNode = new LineMetricsNode(this.path, label, this.configFilePath);
                return Promise.resolve(rootNode.getChildren());
            }
        }
    }

    refresh() {
        let wsFolders = vscode.workspace.workspaceFolders;
        if (wsFolders !== undefined) {
            this.path = vscode.Uri.file(wsFolders[0].uri.path);
            this._onDidChangeTreeData.fire(undefined);
        }
    }
}

