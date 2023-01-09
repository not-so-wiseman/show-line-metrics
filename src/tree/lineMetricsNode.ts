import * as vscode from 'vscode';
import * as fs from 'fs';
import * as pathTool from 'path';
import { isDirectory, joinPath } from '../resources/utils';
import path = require('path');

export class LineMetricsNode extends vscode.TreeItem {
    lines = 0;
    children: LineMetricsNode[] = [];

    constructor( private readonly path: vscode.Uri, label: string) {
        super(
            label,
            isDirectory(path) ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
        );

        if (this.isDirectory()) {
            this.children = this._getChildren();
        } 

        this.lines = this._countLines();
        this.description = `${this.lines}`;
        this.tooltip = `${this.lines} lines of code in ${this.label}`;
    }

    private _getChildren(): LineMetricsNode[] {
        if (this.isDirectory()) {
            let children: LineMetricsNode[] = fs.readdirSync(this.path.fsPath, {withFileTypes: true}).map( f => {
                return new LineMetricsNode(joinPath(this.path, [f.name]), f.name);
            });
            return children;
        }
        return [];
    }

    public getChildren(): LineMetricsNode[] {
        return this.children;
    }

    private _countLines(): number {
        if (this.isDirectory()) {
            let dirTotalLines = 0;
            this.children.forEach( child => {
                dirTotalLines += child.getLineCount();
            });
            return dirTotalLines;
        } else {
            const file = fs.readFileSync(this.path.fsPath, {encoding:'utf8', flag:'r'});
            return file.split(/\r\n|\r|\n/).length;
        }
    }

    public getLineCount(): number {
        return this.lines;
    }

    public setLineCount(lines: number) {
        this.lines = lines;
        this.description = `${this.lines}`;
        this.tooltip = `${this.lines} lines of code in ${this.label}`;
    }

    public isDirectory(): boolean {
        return isDirectory(this.path);
    }

    public getPath(): string {
        return this.path.fsPath;
    }

    /*
    iconPath = {
        light: pathTool.join(__filename, '..', '..', 'resources', 'light_theme', 'hash.svg'),
        dark: pathTool.join(__filename, '..', '..', 'resources', 'dark_theme', 'hash.svg')
    };
    */
}