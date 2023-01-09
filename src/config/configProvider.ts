import * as vscode from 'vscode';
import * as fs from 'fs';
import * as pathTool from 'path';
import { joinPath } from '../resources/utils';

export class ConfigProvider implements vscode.WebviewViewProvider  {
    public static readonly viewType = 'configuration';
	private _view?: vscode.WebviewView;

	constructor(private readonly _extensionUri: vscode.Uri,) { }

    
    resolveWebviewView(
        webviewView: vscode.WebviewView, 
        context: vscode.WebviewViewResolveContext<unknown>, 
        token: vscode.CancellationToken): void | Thenable<void> {
        
        this._view = webviewView;

        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri
            ]
        };

        webviewView.webview.html = this._getHTML(webviewView.webview);
    }



    private _getHTML(webview: vscode.Webview): string {
        // Local path to main script run in the webview
        const toolkitUri = webview.asWebviewUri(
            joinPath(this._extensionUri, ['webview-ui', 'toolkit.min.js'])
        );
        // Local path to css styles
        const styleUri = webview.asWebviewUri(
            joinPath(this._extensionUri, ['webview-ui', 'style.css'])
        );
        const mainUri = webview.asWebviewUri(
            joinPath(this._extensionUri, ['webview-ui', 'main.js'])
        );

        return /*html*/ `
            <!DOCTYPE html>
            <html lang="en">
              <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <script type="module" src="${toolkitUri}"></script>
                  <script type="module" src="${mainUri}"></script>
                  <link rel="stylesheet" href="${styleUri}">
                  <title>Configuration</title>
              </head>
              <body id="webview-body">
              <vscode-button id="howdy">Howdy!</vscode-button>
              </body>
            </html>
        `;
    }

    /*
    private readConfigFile() {
        let contents = fs.readFileSync(this._configFilePath.fsPath, {encoding:'utf8', flag:'r'});
        return contents.split(/\r\n|\r|\n/);
    }*/

    /*
    private setConfigFile(types: string[]): boolean {
        let data: string = types.join('\n');
        fs.writeFile(this._configFilePath.fsPath, data, {encoding: "utf8"}, (err) => {
            if (err) {
                vscode.window.showInformationMessage(`Could not set configuration file. ${err}`);
                return false;
            }
        });
        return true;
    }*/

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