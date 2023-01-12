import * as vscode from 'vscode';
import * as fs from 'fs';
import { isDirectory, joinPath } from '../utils';
import { readConfigFile } from '../utils';
import { FileExtension } from '../config/fileExtension';

export class LineMetricsNode extends vscode.TreeItem {
    lines = 0;
    children: LineMetricsNode[] = [];

    constructor( private readonly path: vscode.Uri, label: string, private configPath: vscode.Uri) {
        super(
            label,
            isDirectory(path) ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
        );

        if (this.isDirectory()) {
            this.children = this._getChildren();
        } 
    
        this.lines = this.countLines();
        this.description = `${this.lines}`;
        this.tooltip = `${this.lines} lines of code in ${this.label}`;
    }


    /**
     * Recursively gets the children of a file directory structure. 
     * @returns An array of the children of this node
     */
    private _getChildren(): LineMetricsNode[] {
        if (this.isDirectory()) {
            let children: LineMetricsNode[] = fs.readdirSync(this.path.fsPath, {withFileTypes: true}).map( f => {
                return new LineMetricsNode(joinPath(this.path, [f.name]), f.name, this.configPath);
            });
            
            let extensions: FileExtension[] = readConfigFile(this.configPath).filter(ext => {
                return ext.isChecked();
            });
            return children.filter((node: LineMetricsNode) => node.isEnabled(extensions));
        }
        return [];
    }


    public getChildren(): LineMetricsNode[] {
        return this.children;
    }

    /**
     * Checks if the current node points to file that is enabled by the 
     * plugin's configuration file.
     * @param extensions A list of the allowed extensions from the plugin's configuration file
     * @returns true if the node points to a file with an allowed extension or to a directory
     */
    private isEnabled(extensions: FileExtension[]): boolean {
        if (this.isDirectory()) { return true; }

        let ext: string = "." + this.path.fsPath.split('.')[1];
        if (extensions.some((extType: FileExtension) => extType.compare(ext))) {
            return true;
        }
         return false;
    }

    /**
     * Counts either the number of lines in a file, or if the node is a directory, it 
     * sums the line numbers for all files in the directory recursively.
     * @returns the total number of lines in a file or directory
     */
    private countLines(): number {
        if (this.isDirectory()) {
            let dirTotalLines = 0;
            this.children.forEach( child => {
                dirTotalLines += child.lines;
            });
            return dirTotalLines;
        } else {
            const file = fs.readFileSync(this.path.fsPath, {encoding:'utf8', flag:'r'});
            return file.split(/\r\n|\r|\n/).length;
        }
    }

    /**
     * Sets the number of lines in a node and updates it's UI attributes.
     * @param lines The number of lines in a file
     */
    public setLineCount(lines: number) {
        this.lines = lines;
        this.description = `${this.lines}`;
        this.tooltip = `${this.lines} lines of code in ${this.label}`;
    }

    // Checks if the node is a directory
    public isDirectory(): boolean {
        return isDirectory(this.path);
    }

    // Returns the path of the node as a string
    public getPath(): string {
        return this.path.fsPath;
    }
}