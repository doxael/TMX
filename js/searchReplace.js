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
class SearchReplace {
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
        document.addEventListener('keydown', (event) => { KeyboardHandler.keyListener(event); });
        document.getElementById('replace').addEventListener('click', () => {
            this.replace();
        });
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.replace();
            }
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-replaceText');
            }
        });
        document.getElementById('searchText').focus();
        let body = document.getElementById('body');
        this.electron.ipcRenderer.send('replaceText-height', { width: body.clientWidth, height: body.clientHeight });
    }
    filterLanguages(arg) {
        var language = document.getElementById('language');
        var options = '';
        for (let i = 0; i < arg.length; i++) {
            let lang = arg[i];
            options = options + '<option value="' + lang.code + '">' + lang.name + '</option>';
        }
        language.innerHTML = options;
    }
    replace() {
        var searchText = document.getElementById('searchText').value;
        var replaceText = document.getElementById('replaceText').value;
        var language = document.getElementById('language').value;
        if (searchText.length === 0) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Enter text to search', parent: 'searchReplace' });
            return;
        }
        if (replaceText.length === 0) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Enter replacement text', parent: 'searchReplace' });
            return;
        }
        var regularExpression = document.getElementById('regularExpression').checked;
        this.electron.ipcRenderer.send('replace-request', { search: searchText, replace: replaceText, lang: language, regExp: regularExpression });
    }
}
new SearchReplace();
