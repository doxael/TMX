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
class ChangeLanguages {
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
        this.electron.ipcRenderer.on('languages-list', (event, arg) => {
            this.languageList(arg);
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                this.changeLanguage();
            }
        });
        document.getElementById('changeLanguage').addEventListener('click', () => {
            this.changeLanguage();
        });
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.changeLanguage();
            }
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-changeLanguage');
            }
        });
        document.getElementById('currentLanguage').focus();
        let body = document.getElementById('body');
        this.electron.ipcRenderer.send('changeLanguage-height', { width: body.clientWidth, height: body.clientHeight });
    }
    languageList(arg) {
        var newLanguage = document.getElementById('newLanguage');
        var options = '';
        for (let i = 0; i < arg.length; i++) {
            let lang = arg[i];
            options = options + '<option value="' + lang.code + '">' + lang.name + '</option>';
        }
        newLanguage.innerHTML = options;
    }
    filterLanguages(arg) {
        var currentLanguage = document.getElementById('currentLanguage');
        var options = '';
        for (let i = 0; i < arg.length; i++) {
            let lang = arg[i];
            options = options + '<option value="' + lang.code + '">' + lang.name + '</option>';
        }
        currentLanguage.innerHTML = options;
        this.electron.ipcRenderer.send('all-languages');
    }
    changeLanguage() {
        var currentLanguage = document.getElementById('currentLanguage');
        var newLanguage = document.getElementById('newLanguage');
        this.electron.ipcRenderer.send('change-language', { oldLanguage: currentLanguage.value, newLanguage: newLanguage.value });
    }
}
new ChangeLanguages();
