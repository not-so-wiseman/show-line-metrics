import * as vscode from 'vscode';
import * as fs from 'fs';
import * as pathTool from 'path';
import { joinPath } from '../resources/utils';
import { FileExtension } from '../config/fileExtension';
import { assert } from 'console';
import { JSDOM } from 'jsdom';
import { LineMetricsNode } from '../tree/lineMetricsNode';

export class ConfigProvider implements vscode.WebviewViewProvider  {
    public static readonly viewType = 'configuration';
	private _view?: vscode.WebviewView;

	constructor(private readonly _extensionUri: vscode.Uri, private readonly _configFile: vscode.Uri) {
        //vscode.commands.registerCommand('remove-extension', r => this.addExtension(r));
        vscode.commands.registerCommand('add-extension', r => this.toggleInputVisibility('show'));
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
            vscode.window.showInformationMessage(`${message.text}`);
            const command = message.command;
            switch (command) {
                case 'input':
                    this.addExtension(message.text);
                    break;
                case 'delete':
                    if (message.text === 'text-field') {
                        this.toggleInputVisibility('hide');
                    } else {
                        this.deleteExtensionEntry(message.text);
                    }
                    break;
            }
            if (this._view !== undefined) {
                this._view.webview.html = this._getHTML(webviewView.webview);
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

    

    public toggleInputVisibility(option: string) {
        if (this._view !== undefined) {
            let hidden = `<div id="add-extension" style="visibility: hidden">`;
            let visible = `<div id="add-extension" style="visibility: visible">`;
            let updatedHTML: string;
            if (option === 'show') {
                updatedHTML = this._view?.webview.html.replace(hidden, visible);
            } else {
                updatedHTML = this._view?.webview.html.replace(visible, hidden);
            }
            this._view.webview.html = updatedHTML   
        }
    }

    public addExtension(extType: string) {
        extType = (extType[0] !== '.') ? `.${extType}` : extType;
        let duplicate: boolean = false;

        let extensions = this.readConfigFile();
        for(let i = 0; i < extensions.length; i++){
            if (extensions[i].compare(extType)) {
                duplicate = true;
                break;
            }
        };

        if(!duplicate) { 
            fs.appendFileSync(this._configFile.fsPath, `\n${extType}, true`);
        } else {
            vscode.window.showInformationMessage(`Extension type ${extType} already exists.`);
        };
    }

    public toggleExtensionCheckbox(id: string, option: string): string {
        let checked = (option === 'checked') ? true : false;
        let extensions = fs.readFileSync(this._configFile.fsPath, {encoding:'utf8', flag:'r'})
            .split(/\r\n|\r|\n/)
            .map(line => {
                let ext = new FileExtension(line);
                if (ext.compare(`.${id}`)) {
                    return `.${id}, ${checked}`;
                }
                return line;
            });
        return extensions.join('\n');
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

    
    private deleteExtensionEntry(id: string) {
        let extensions = fs.readFileSync(this._configFile.fsPath, {encoding:'utf8', flag:'r'})
            .split(/\r\n|\r|\n/);

        let isMatch = (line: string) => {
            let ext = new FileExtension(line);
            let match = ext.compare(`.${id}`);
            return !match;
        }

        let newConfigContents: string = extensions.filter(isMatch).join('\n');
        fs.writeFileSync(this._configFile.fsPath, newConfigContents); 
    }

   


    
}