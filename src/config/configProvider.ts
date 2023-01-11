import * as vscode from 'vscode';
import * as fs from 'fs';
import * as pathTool from 'path';
import { joinPath } from '../resources/utils';
import { FileExtension } from '../config/fileExtension';
import { assert } from 'console';
import { JSDOM } from 'jsdom';

export class ConfigProvider implements vscode.WebviewViewProvider  {
    public static readonly viewType = 'configuration';
	private _view?: vscode.WebviewView;

	constructor(private readonly _extensionUri: vscode.Uri, private readonly _configFile: vscode.Uri) {
        //vscode.commands.registerCommand('remove-extension', r => this.addExtension(r));
        vscode.commands.registerCommand('add-extension', r => this.showInput());
    }
    
    resolveWebviewView(
        webviewView: vscode.WebviewView, 
        context: vscode.WebviewViewResolveContext<unknown>, 
        token: vscode.CancellationToken): void | Thenable<void> {
        
        this._view = webviewView;

        this._view.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri
            ]
        };

        this._view.webview.html = this._getHTML(webviewView.webview);

        this._view.webview.onDidReceiveMessage((message) => {
            const command = message.command;
            switch (command) {
                case 'input':
                    vscode.window.showInformationMessage(message.text);
                    this.addExtension(message.text);
                    if (this._view !== undefined) {
                        this._view.webview.html = this._getHTML(webviewView.webview);
                    }
                    break;
                case 'delete':
                    vscode.window.showInformationMessage(message.text);
                    break;
            }
        }, undefined);
    }

    public show() {
        if (!this._view?.visible) {
            this._view?.show();
        }
    }

    public close() {
        if (this._view?.visible) {
            console.log("close");
        }
    }

    

    public showInput() {
        if (this._view !== undefined) {
            let hidden = `<div id="add-extension" style="visibility: hidden">`;
            let visible = `<div id="add-extension" style="visibility: visible">`;
            let updatedHTML = this._view?.webview.html.replace(hidden, visible);
            this._view.webview.html = updatedHTML;
        }
    }

    public addExtension(extType: string) {
        if (extType[0] !== '.') {
            extType = `.${extType}`;
        }
        fs.appendFileSync(this._configFile.fsPath, `\n${extType}, true`);
    }

    public uncheckExtension(r:any) {
        console.log(r);
    }



    private _getHTML(webview: vscode.Webview): string {
        const HTMLPath = webview.asWebviewUri(
            joinPath(this._extensionUri, ['configPanel.html'])
        );
        let HTML = fs.readFileSync(HTMLPath.fsPath, {encoding:'utf8', flag:'r'});

        // Local path to main script run in the webview
        const toolkitUri = webview.asWebviewUri(
            joinPath(this._extensionUri, ['node_modules', '@vscode/webview-ui-toolkit', 'dist', 'toolkit.js'])
        );
        // Local path to css styles
        const styleUri = webview.asWebviewUri(
            joinPath(this._extensionUri, ['webview-ui', 'style.css'])
        );
        // Path to codicons (VS Code's icon library)
        const iconsUri = webview.asWebviewUri(
            joinPath(this._extensionUri, ['node_modules', '@vscode/codicons', 'dist', 'codicon.css'])
        );
        // Functionaility for vscode webview-ui kit
        const mainUri = webview.asWebviewUri(
            joinPath(this._extensionUri, ['webview-ui', 'main.js'])
        );

        let checkboxes: string = this.createCheckboxes();

        return eval("`"+HTML+"`");
    }

    


    private createCheckboxes(): string {
        let extensions = this.readConfigFile().map(ext => {
            return ext.getHTML();
        });
        return extensions.join('\n');
    }

    
    
    private readConfigFile(): FileExtension[] {
        let contents = fs.readFileSync(this._configFile.fsPath, {encoding:'utf8', flag:'r'});
        let lines: FileExtension[] = contents.split(/\r\n|\r|\n/).map(line => {
            return new FileExtension(line);
        });
        return lines;
    }

    
    private setConfigFile(types: string[]): boolean {
        let data: string = types.join('\n');
        fs.writeFile(this._configFile.fsPath, data, {encoding: "utf8"}, (err) => {
            if (err) {
                vscode.window.showInformationMessage(`Could not set configuration file. ${err}`);
                return false;
            }
        });
        return true;
    }

    private compareExtensions(path: vscode.Uri, types: string[]): boolean {
        let extension: string = path.fsPath.split('.')[2];
        types.forEach(type => {
            if (extension === type) {
                return true;
            }
        });
        return false;
    }


    
}