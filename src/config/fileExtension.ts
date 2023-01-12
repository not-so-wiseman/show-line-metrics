import { assert } from 'console';


export class FileExtension {
    public readonly extension: string;
    private checked: boolean;

    /**
     * @param line A single line read from the plugin's configuration file.
     * Each line in this configuration file is in the form:
     * `.<file extension>, <true, false>` for example:
     * `.cpp, false`.
     */
    constructor(line: string) {
        let contents = line.replace(" ", "").split(',');
        assert(contents.length === 2);
        this.extension = contents[0]; 
        this.checked = (contents[1] === 'true') ? true : false;
    }


    public compare(extension: string) {
        return this.extension === extension;
    }


    public isChecked(): boolean {
        return this.checked;
    }


    public check() {
        this.checked = true;
    }


    public uncheck() {
        this.checked = false;
    }

    /**
     * @returns The HTML for a checkbox depending on whether the
     * extension is enabled (checked) or disabled (unchecked). 
     */
    public getHTML(): string {
        let id = this.extension.replace(".", "").toLowerCase();

        if (this.isChecked()) {
            return `
            <div class="checkbox">
                <vscode-checkbox class="green" checked id="${id}">${this.extension}</vscode-checkbox>
                <vscode-button class="icon green" appearance="icon" aria-label="Confirm">
                    <span class="codicon codicon-close"> </span>
                </vscode-button>
            </div>
            `;
        }
        return `
        <div class="checkbox">
            <vscode-checkbox id="${id}">${this.extension}</vscode-checkbox>
            <vscode-button class="icon" appearance="icon" aria-label="Confirm">
                <span class="codicon codicon-close"> </span>
            </vscode-button>
        </div>
        `;
    }
}