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
class SourceLanguage {
    constructor() {
        this.electron = require('electron');
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event, arg) => {
            document.getElementById('theme').href = arg;
        });
        this.electron.ipcRenderer.send('get-filter-languages');
        this.electron.ipcRenderer.on('filter-languages', (event, arg) => {
            this.filterLanguages(arg);
        });
        this.electron.ipcRenderer.on('set-source-language', (event, arg) => {
            document.getElementById('language').value = arg.srcLang;
        });
        document.getElementById('change').addEventListener('click', () => {
            this.changeSrcLanguage();
        });
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.changeSrcLanguage();
            }
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-srcLanguage');
            }
        });
        document.getElementById('language').focus();
        let body = document.getElementById('body');
        this.electron.ipcRenderer.send('srcLanguage-height', { width: body.clientWidth, height: body.clientHeight });
    }
    filterLanguages(arg) {
        var language = document.getElementById('language');
        var options = '<option value="*all*">Any Language</option>';
        for (let i = 0; i < arg.length; i++) {
            let lang = arg[i];
            options = options + '<option value="' + lang.code + '">' + lang.name + '</option>';
        }
        language.innerHTML = options;
        this.electron.ipcRenderer.send('get-source-language');
    }
    changeSrcLanguage() {
        var language = document.getElementById('language');
        this.electron.ipcRenderer.send('change-source-language', language.value);
    }
}
new SourceLanguage();
