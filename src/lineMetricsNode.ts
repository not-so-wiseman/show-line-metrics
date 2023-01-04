import * as vscode from 'vscode';
import * as fs from 'fs';
import { assert } from 'console';
import { isDirectory, joinPath } from './utils';

export class LineMetricsNode extends vscode.TreeItem {
    lines = 0;
    counted = 0;

    constructor( private readonly path: vscode.Uri, label: string) {
        super(
            label,
            isDirectory(path) ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
        );
        this.description = `${this.lines}`;
        this.tooltip = `${this.lines} lines of code in ${this.label}`;
    }

    public isDirectory(): boolean {
        return isDirectory(this.path);
    }

    public getChildren(): LineMetricsNode[] {
        if (this.isDirectory()) {
            let children: LineMetricsNode[] = fs.readdirSync(this.path.fsPath, {withFileTypes: true}).map( f => {
                return new LineMetricsNode(joinPath(this.path, [f.name]), f.name);
            });
            return children;
        }
        return [];
    }

    public countLines(): number {
        assert(!isDirectory(this.path)); 
		const file = fs.readFileSync(this.path.fsPath, {encoding:'utf8', flag:'r'});
		return file.split(/\r\n|\r|\n/).length;
    }

    public getLineCount(): number {
        return this.lines;
    }

    public setLineCount(lines: number) {
        this.lines = lines;
        this.description = `${this.lines}`;
        this.tooltip = `${this.lines} lines of code in ${this.label}`;
    }

    public getPath(): string {
        return this.path.fsPath;
    }

    



  //iconPath = {
    //light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
    //dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
  //};
}