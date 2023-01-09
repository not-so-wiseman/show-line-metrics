import * as vscode from 'vscode';
import * as fs from 'fs';
import * as pathTool from 'path';

export function joinPath(baseDir: (vscode.Uri | string), directories: string[]) {
    let path: string = pathTool.join((typeof baseDir === 'string') ? baseDir : baseDir.fsPath, ...directories);
    return vscode.Uri.file(path);
}

export function pathExists(p: string | vscode.Uri): boolean {
    try {
        fs.accessSync((typeof p === 'string') ? p : p.fsPath);
    } catch (err) {
        return false;
    }
    return true;
}

export function isDirectory(p: vscode.Uri | string): boolean {
    return fs.statSync((typeof p === 'string') ? p : p.fsPath).isDirectory();
}

export function getFolderName(p: vscode.Uri | string): string {
    let pathFolders = ((typeof p === 'string') ? p : p.fsPath).split(pathTool.sep).pop();
    return (pathFolders !== undefined) ? pathFolders : "Root";
}

export function read(path: vscode.Uri): string {
    let contents = fs.readFileSync(path.fsPath, {encoding:'utf8', flag:'r'});
    return contents;
}

