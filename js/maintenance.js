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
class Maintenance {
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
            if (arg.srcLang !== '*all*') {
                document.getElementById('sourceLanguage').value = arg.srcLang;
            }
        });
        document.getElementById('untranslated').addEventListener('click', () => {
            this.sourceLanguageEnabled();
        });
        document.getElementById('consolidate').addEventListener('click', () => {
            this.sourceLanguageEnabled();
        });
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.execute();
            }
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-maintenance');
            }
        });
        document.getElementById('execute').addEventListener('click', () => {
            this.execute();
        });
        let body = document.getElementById('body');
        this.electron.ipcRenderer.send('maintenance-height', { width: body.clientWidth, height: body.clientHeight });
    }
    sourceLanguageEnabled() {
        let untranslated = document.getElementById('untranslated');
        let consolidate = document.getElementById('consolidate');
        let sourceLanguage = document.getElementById('sourceLanguage');
        sourceLanguage.disabled = !(untranslated.checked || consolidate.checked);
    }
    filterLanguages(arg) {
        let sourceLanguage = document.getElementById('sourceLanguage');
        let options = '';
        for (let i = 0; i < arg.length; i++) {
            let lang = arg[i];
            options = options + '<option value="' + lang.code + '">' + lang.name + '</option>';
        }
        sourceLanguage.innerHTML = options;
        if (arg.length < 3) {
            let consolidate = document.getElementById('consolidate');
            consolidate.checked = false;
            consolidate.disabled = true;
        }
        this.electron.ipcRenderer.send('get-source-language');
    }
    execute() {
        let params = {
            tags: document.getElementById('tags').checked,
            untranslated: document.getElementById('untranslated').checked,
            duplicates: document.getElementById('duplicates').checked,
            spaces: document.getElementById('spaces').checked,
            consolidate: document.getElementById('consolidate').checked,
            sourceLanguage: document.getElementById('sourceLanguage').value
        };
        this.electron.ipcRenderer.send('maintanance-tasks', params);
    }
}
new Maintenance();
