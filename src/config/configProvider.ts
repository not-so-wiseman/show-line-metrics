import * as vscode from 'vscode';
import * as fs from 'fs';
import { joinPath, Check, Visibility, readConfigFile } from '../utils';
import { FileExtension } from '../config/fileExtension';
import { LineMetricProvider } from '../tree/lineMetricProvider';


export class ConfigProvider implements vscode.WebviewViewProvider  {
    public static readonly viewType = 'configuration';
	private _view?: vscode.WebviewView;

	constructor(private readonly _extensionUri: vscode.Uri, private readonly _configFile: vscode.Uri, 
        private lineMetricProvider: LineMetricProvider) {
        vscode.commands.registerCommand('add-extension', r => this.toggleInputVisibility(Visibility.show));
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

        // Assigns HTML to the view
        this._view.webview.html = this.getHTML(webviewView.webview);

        // The HTML for the view contains a JS script that handles 
        //UI interactions and posts messages to the view using the 
        //VS Code API (this is the standard for VS Code Webviews)
        this._view.webview.onDidReceiveMessage((message) => {
            const command = message.command;
            switch (command) {
                case 'input':
                    this.addExtension(message.text);
                    this.lineMetricProvider.refresh();
                    break;
                case 'delete':
                    if (message.text === 'text-field') {
                        this.toggleInputVisibility(Visibility.hide);
                    } else {
                        this.deleteExtensionEntry(message.text);
                        this.lineMetricProvider.refresh();
                    }
                    break;
                case 'check':
                    this.toggleExtensionCheckbox(message.text, Check.check);
                    this.lineMetricProvider.refresh();
                    break;
                case 'uncheck':
                    this.toggleExtensionCheckbox(message.text, Check.uncheck);
                    this.lineMetricProvider.refresh();
                    break;
            }
            if (this._view !== undefined) {
                this._view.webview.html = this.getHTML(webviewView.webview);
            }
        }, undefined);
    }

    /**
     * Reads a file in the plugin used to store what extensions are enabled. 
     * Each line in the files contains a plugin and whether it is enabled 
     * in the form `.<file extension>, <true, false>` for example:
     * `.cpp, false`.  
     * @returns An array of FileExtension objects which contain the 
     * extension's name and whether it is enabled.
     */
    private readConfigFile(): FileExtension[] {
        return readConfigFile(this._configFile);
    }

    /**
     * Reads the HTML file for the webview and injects the correct paths
     * for the style sheet, icons, VS Code Webview UI toolkit, and the 
     * JS script to handle UI logic.
     * @param webview The active webview
     * @returns HTML in the form of a string
     */
    private getHTML(webview: vscode.Webview): string {
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

    /**
     * Gets a list of the enabled extension types and returns the appropraite
     * HTML.
     * @example
     * ```
     * <div class="checkbox">
     *      <vscode-checkbox checked id="cpp">.cpp</vscode-checkbox>
     *      <vscode-button class="icon" appearance="icon" aria-label="Confirm">
     *         <span class="codicon codicon-close"></span>
     *      </vscode-button>
     * </div>
     * * <div class="checkbox">
     *      <vscode-checkbox id="java">.java</vscode-checkbox>
     *      <vscode-button class="icon" appearance="icon" aria-label="Confirm">
     *         <span class="codicon codicon-close"> </span>
     *      </vscode-button>
     * </div>
     * ```
     * @returns HTML for extension checkboxes in the form of a string
     */
    private createCheckboxes(): string {
        let extensions = this.readConfigFile().map(ext => {
            return ext.getHTML();
        });
        return extensions.join('\n');
    }

    /**
     * Toggles the visibility of the text feild used to input additional
     * extension types by the user.
     * @param option 
     */
    public toggleInputVisibility(option: Visibility) {
        if (this._view !== undefined) {
            let hidden = `<div id="add-extension" style="visibility: hidden">`;
            let visible = `<div id="add-extension" style="visibility: visible">`;
            let updatedHTML: string;
            if (option === Visibility.show) {
                updatedHTML = this._view?.webview.html.replace(hidden, visible);
            } else {
                updatedHTML = this._view?.webview.html.replace(visible, hidden);
            }
            this._view.webview.html = updatedHTML;  
        }
    }

    /**
     * Updates the configuration file for the plugin when a extension is unchecked in the view's UI.
     * @param id The extension to be updated, e.g. 'cpp'
     * @param option Whether to check or uncheck the checkbox
     */
    public toggleExtensionCheckbox(id: string, option: Check) {
        let checked = (option === Check.check) ? true : false;
        let extensions = fs.readFileSync(this._configFile.fsPath, {encoding:'utf8', flag:'r'})
            .split(/\r\n|\r|\n/)
            .map(line => {
                let ext = new FileExtension(line);
                if (ext.compare(`${id}`)) {
                    return `.${id}, ${checked}`;
                }
                return line;
            });
        fs.writeFileSync(this._configFile.fsPath, extensions.join('\n')); 
    }

    /**
     * Updates the configuration file for the plugin when a extension is added by the user.
     * @param extType The extension to add, e.g. 'java'
     */
    public addExtension(extType: string) {
        extType = (extType[0] === '.') ? extType.replace('.', '') : extType;
        let duplicate: boolean = false;

        let extensions = this.readConfigFile();
        for(let i = 0; i < extensions.length; i++){
            if (extensions[i].compare(extType)) {
                duplicate = true;
                break;
            }
        };

        if(!duplicate) { 
            fs.appendFileSync(this._configFile.fsPath, `\n.${extType}, true`);
        } else {
            vscode.window.showInformationMessage(`Extension type ${extType} already exists.`);
        };
    }

    /**
     * Updates the configuration file for the plugin when a extension removed by the user.
     * @param extType The extension to remove, e.g. 'c'
     */
    private deleteExtensionEntry(id: string) {
        let isMatch = (ext: FileExtension) => {
            let match = ext.compare(`${id}`);
            return !match;
        };

        let extensions: string = this.readConfigFile()
            .filter(isMatch)
            .map((ext:FileExtension) => ext.toString())
            .join('\n');

    
        fs.writeFileSync(this._configFile.fsPath, extensions); 
    }
}