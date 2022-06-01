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
class ExcelLanguages {
    constructor() {
        this.electron = require('electron');
        this.options = '<option value="none">Select Language</option>';
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event, arg) => {
            document.getElementById('theme').href = arg;
        });
        this.electron.ipcRenderer.send('all-languages');
        this.electron.ipcRenderer.on('languages-list', (event, arg) => {
            this.languagesList(arg);
        });
        this.electron.ipcRenderer.on('set-excel-lang-args', (event, arg) => {
            this.setExcelLangArgs(arg);
        });
        document.getElementById('setExcelLanguages').addEventListener('click', () => {
            this.setExcelLanguages();
        });
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.setExcelLanguages();
            }
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-excelLanguages');
            }
        });
        let body = document.getElementById('body');
        this.electron.ipcRenderer.send('excelLanguages-height', { width: body.clientWidth, height: body.clientHeight });
    }
    languagesList(arg) {
        for (let i = 0; i < arg.length; i++) {
            let lang = arg[i];
            this.options = this.options + '<option value="' + lang.code + '">' + lang.name + '</option>';
        }
        this.electron.ipcRenderer.send('get-excel-lang-args');
    }
    setExcelLangArgs(arg) {
        this.columns = arg.columns;
        var rows = '';
        for (let i = 0; i < this.columns.length; i++) {
            rows = rows + '<tr><td class="noWrap middle">Column ' + this.columns[i] + '</td><td class="middle"><select id="lang_' + i + '" class="table_select">' + this.options + '</select></td></tr>';
        }
        document.getElementById('langsTable').innerHTML = rows;
        var langs = arg.languages;
        for (let i = 0; i < langs.length; i++) {
            document.getElementById('lang_' + i).value = langs[i];
        }
    }
    setExcelLanguages() {
        var langs = [];
        for (let i = 0; i < this.columns.length; i++) {
            var lang = document.getElementById('lang_' + i).value;
            if (lang !== 'none') {
                langs.push(lang);
            }
            else {
                this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select all languages', parent: 'excelLanguages' });
                return;
            }
        }
        this.electron.ipcRenderer.send('set-excel-languages', langs);
    }
}
new ExcelLanguages();
