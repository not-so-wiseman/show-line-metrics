
import * as vscode from 'vscode';
import { LineMetricsNode } from './lineMetricsNode';
import { getFolderName, pathExists } from './utils';
import * as pathTool from 'path';
import { assert } from 'console';

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
        if (this.path === undefined) {
            vscode.window.showInformationMessage('There are no files open to parse for line metrics!');
            return Promise.resolve([]);

        } else if (!pathExists(this.path)){
            vscode.window.showInformationMessage(`${this.path} is not a valid directory!`);
            return Promise.resolve([]);

        } else {
            let label = getFolderName(this.path);
            let rootNode: LineMetricsNode = new LineMetricsNode(this.path, label);
            return Promise.resolve(this.getDirLineMetrics(rootNode));
        }
    }


    /**
     * Given the path to package.json, read all its dependencies and devDependencies.
     */
    private getDirLineMetrics(rootNode: LineMetricsNode): LineMetricsNode[] {
        try {
            let children: LineMetricsNode[] = this.parseFiles(rootNode);
            return children;

        } catch (error) {
            vscode.window.showInformationMessage(`Error: ${error}`);
            return [];
        }    
    }


    /*
    * Traverse through the file directories and get the lines per files and lines per directory
    */
    private parseFiles(root: LineMetricsNode) : LineMetricsNode[] {
        const files: LineMetricsNode[] = [];

        const preOrderHelper = (node: LineMetricsNode) => {
            files.push(node);
            console.log(node.getPath());

            //recursively call function on all node children
            if (node.isDirectory()) {
                let children: LineMetricsNode[] = node.getChildren();
                let sum: number = 0;

                // get line counts for all of the directory's children
                for (const child of children) {
                    preOrderHelper(child);
                    // add child's line count to the directory's total line count
                    let lines = child.countLines();
                    child.setLineCount(lines);
                    sum += lines;
                }
                node.setLineCount(sum);
            }
            return true;
        };

        preOrderHelper(root);
        return files;
    }
}

