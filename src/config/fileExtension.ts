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
        this.extension = contents[0].replace('.', '').toLowerCase(); 
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
     * 
     */
    public toString() {
        return `.${this.extension}, ${(this.checked) ? true: false}`;
    }

    /**
     * @returns The HTML for a checkbox depending on whether the
     * extension is enabled (checked) or disabled (unchecked). 
     */
    public getHTML(): string {
        let id = this.extension.replace(".", "").toLowerCase();

        if (this.isChecked()) {
            return `
            <section slot="start" style="display:flex; align-items: center; justify-content: space-between;">
                <vscode-checkbox checked id="${id}-checkbox">.${this.extension}</vscode-checkbox>
                <vscode-button id="${id}-delete" appearance="icon" aria-label="Delete" style="margin-right: 10px;">
                    <span class="codicon codicon-close"></span>
                </vscode-button>
            </section>
            `;
        }
        return `
        <section slot="start" style="display:flex; align-items: center; justify-content: space-between;">
            <vscode-checkbox class="green" style="margin: 0;" id="${id}-checkbox">.${this.extension}</vscode-checkbox>
            <vscode-button id="${id}-delete" appearance="icon"  aria-label="Delete" style="margin-right: 10px;">
                <span class="codicon codicon-close"></span>
            </vscode-button>
        </section>
        `;
    }
}