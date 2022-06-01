/*******************************************************************************
 * Copyright (c) 2018-2022 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/
class RemoveUntranslated {
    constructor() {
        this.electron = require("electron");
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event, arg) => {
            document.getElementById('theme').href = arg;
        });
        this.electron.ipcRenderer.send('get-filter-languages');
        this.electron.ipcRenderer.on('filter-languages', (event, arg) => {
            this.filterLanguages(arg);
        });
        this.electron.ipcRenderer.on('set-source-language', (event, arg) => {
            if (arg.srcLang !== '*all*') {
                document.getElementById('sourceLanguage').value = arg.srcLang;
            }
        });
        document.getElementById('removeUntranslated').addEventListener('click', () => {
            this.removeUntranslated();
        });
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.removeUntranslated();
            }
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-removeUntranslated');
            }
        });
        document.getElementById('sourceLanguage').focus();
        let body = document.getElementById('body');
        this.electron.ipcRenderer.send('removeUntranslated-height', { width: body.clientWidth, height: body.clientHeight });
    }
    filterLanguages(arg) {
        var sourceLanguage = document.getElementById('sourceLanguage');
        var options = '';
        for (let i = 0; i < arg.length; i++) {
            let lang = arg[i];
            options = options + '<option value="' + lang.code + '">' + lang.name + '</option>';
        }
        sourceLanguage.innerHTML = options;
        this.electron.ipcRenderer.send('get-source-language');
    }
    removeUntranslated() {
        var srcLang = document.getElementById('sourceLanguage').value;
        this.electron.ipcRenderer.send('remove-untranslated', { srcLang: srcLang });
    }
}
new RemoveUntranslated();
