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
class NewFile {
    constructor() {
        this.electron = require('electron');
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event, arg) => {
            document.getElementById('theme').href = arg;
        });
        this.electron.ipcRenderer.send('all-languages');
        this.electron.ipcRenderer.on('languages-list', (event, arg) => {
            this.languagesList(arg);
        });
        document.getElementById('createFile').addEventListener('click', () => {
            this.createFile();
        });
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.createFile();
            }
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-newFile');
            }
        });
        let body = document.getElementById('body');
        this.electron.ipcRenderer.send('newFile-height', { width: body.clientWidth, height: body.clientHeight });
    }
    languagesList(arg) {
        var srcLanguage = document.getElementById('srcLanguage');
        var tgtLanguage = document.getElementById('tgtLanguage');
        var options = '';
        for (let i = 0; i < arg.length; i++) {
            let lang = arg[i];
            options = options + '<option value="' + lang.code + '">' + lang.name + '</option>';
        }
        srcLanguage.innerHTML = options;
        tgtLanguage.innerHTML = options;
    }
    createFile() {
        var srcLanguage = document.getElementById('srcLanguage');
        var tgtLanguage = document.getElementById('tgtLanguage');
        if (srcLanguage.value === tgtLanguage.value) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select different languages', parent: 'newFile' });
            return;
        }
        this.electron.ipcRenderer.send('create-file', { srcLang: srcLanguage.value, tgtLang: tgtLanguage.value });
    }
}
new NewFile();
