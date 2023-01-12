import * as vscode from 'vscode';
import * as fs from 'fs';
import * as pathTool from 'path';
import { FileExtension } from './config/fileExtension';

 /**
     * Reads a file in the plugin used to store what extensions are enabled. 
     * Each line in the files contains a plugin and whether it is enabled 
     * in the form `.<file extension>, <true, false>` for example:
     * `.cpp, false`.  
     * @returns An array of FileExtension objects which contain the 
     * extension's name and whether it is enabled.
     */
 export function readConfigFile(configFilePath: vscode.Uri): FileExtension[] {
    let regEx = new RegExp(/\.\w+\,\s(true|false)/);
    let isMatch = (line:string) => {
        let result = regEx.exec(line);
        if (result !== null) {
            return true;
        }
        return false;
    }

    let contents = fs.readFileSync(configFilePath.fsPath, {encoding:'utf8', flag:'r'});
    let lines: FileExtension[] = contents.split(/\r\n|\r|\n/)
        .filter(line => isMatch(line))
        .map(line => {
            return new FileExtension(line);
        });
    return lines;
}

/**
 * Utility tool to join construct a path.
 * @example
 * Here is an example on how to use the utility:
 * ```
 * // Where context.extensionUri is the location of extension.ts 
 * // (the main entrypoint for the plugin)
 * let styleUri = joinPath(context.extensionUri, ["webview-ui", "style.css"]);
 * // Now you can use the `styleUri` variable to reference the path of the 
 * // project's style sheet:
 * styleUri.fsPath; 
 * ```
 * @param baseDir The root directory of the path
 * @param directories The folders to join to the path
 * @returns A path in the form of a VS Code URI
 */
export function joinPath(baseDir: (vscode.Uri | string), directories: string[]) {
    let path: string = pathTool.join((typeof baseDir === 'string') ? baseDir : baseDir.fsPath, ...directories);
    return vscode.Uri.file(path);
}

/**
 * Checks if a path exists. Is a replacement for the deprecated `fs.exisits()`.
 * @param p  A path to a local file
 */
export function pathExists(p: string | vscode.Uri): boolean {
    try {
        fs.accessSync((typeof p === 'string') ? p : p.fsPath);
    } catch (err) {
        return false;
    }
    return true;
}

/**
 * Utility tool for checking whether a path points to a directory or a file. 
 * @param p A path to a file or a directory
 */
export function isDirectory(p: vscode.Uri | string): boolean {
    return fs.statSync((typeof p === 'string') ? p : p.fsPath).isDirectory();
}

/**
 * Utility tool for separting a folder's or file's name form its path, 
 * i.e. `C:\Users\Test.txt` -> `Test.txt`.
 * @param p A path to a file or a directory
 */
export function getFolderName(p: vscode.Uri | string): string {
    let pathFolders = ((typeof p === 'string') ? p : p.fsPath).split(pathTool.sep).pop();
    return (pathFolders !== undefined) ? pathFolders : "Root";
}

// Used by the `ConfigProvider` class when determining 
// if a checkbox should be checked.
export enum Check {
    check = 'checked',
    uncheck = 'uncheck'
}

// Used by the `ConfigProvider` class when determining 
// if the extension input box should be hidden or visible.
export enum Visibility {
    show = "visible",
    hide = "hidden"
}

