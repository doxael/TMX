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
class AddLanguage {
    constructor() {
        this.electron = require('electron');
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event, arg) => {
            document.getElementById('theme').href = arg;
        });
        this.electron.ipcRenderer.send('all-languages');
        this.electron.ipcRenderer.on('languages-list', (event, arg) => {
            this.languageList(arg);
        });
        document.getElementById('addLanguage').addEventListener('click', () => {
            this.addLanguage();
        });
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.addLanguage();
            }
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-addLanguage');
            }
        });
        document.getElementById('language').focus();
        let body = document.getElementById('body');
        this.electron.ipcRenderer.send('addLanguage-height', { width: body.clientWidth, height: body.clientHeight });
    }
    languageList(arg) {
        var language = document.getElementById('language');
        var options = '';
        for (let i = 0; i < arg.length; i++) {
            let lang = arg[i];
            options = options + '<option value="' + lang.code + '">' + lang.name + '</option>';
        }
        language.innerHTML = options;
    }
    addLanguage() {
        var language = document.getElementById('language');
        this.electron.ipcRenderer.send('add-language', language.value);
    }
}
new AddLanguage();
