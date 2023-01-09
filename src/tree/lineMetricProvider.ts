
import * as vscode from 'vscode';
import { LineMetricsNode } from './lineMetricsNode';
import { getFolderName, pathExists } from '../resources/utils';
import { ConfigFile } from '../config/configFileInterface';

export class LineMetricProvider implements vscode.TreeDataProvider<LineMetricsNode> {
    constructor(private path: vscode.Uri) {
        if (!pathExists(path)) {
            vscode.window.showInformationMessage(`${path} is not a valid directory!`);
        }
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
                let rootNode: LineMetricsNode = new LineMetricsNode(this.path, label);
                return Promise.resolve(rootNode.getChildren());
            }
        }
    }

    public refresh() {
        let wsFolders = vscode.workspace.workspaceFolders;
        if (wsFolders !== undefined) {
            this.path = vscode.Uri.file(wsFolders[0].uri.path);
            this.m_onDidDataChange.fire();
        } else {
            vscode.window.showInformationMessage(`Could not refresh Show Line Metrics Plugin.`);
        }
    }
}
