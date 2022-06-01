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
class SortUnits {
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
        this.electron.ipcRenderer.on('sort-options', (event, arg) => {
            this.sortOptions(arg);
        });
        document.getElementById('sort').addEventListener('click', () => {
            this.sort();
        });
        document.getElementById('clearSort').addEventListener('click', () => {
            this.clearSort();
        });
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.sort();
            }
            if (event.code === 'Escape') {
                this.clearSort();
            }
        });
        document.getElementById('sortLanguage').focus();
        let body = document.getElementById('body');
        this.electron.ipcRenderer.send('sortUnits-height', { width: body.clientWidth, height: body.clientHeight });
    }
    filterLanguages(arg) {
        var sortLanguage = document.getElementById('sortLanguage');
        var options = '';
        for (let i = 0; i < arg.length; i++) {
            let lang = arg[i];
            options = options + '<option value="' + lang.code + '">' + lang.name + '</option>';
        }
        sortLanguage.innerHTML = options;
        this.electron.ipcRenderer.send('get-sort');
    }
    sortOptions(arg) {
        if (arg.sortLanguage != undefined) {
            document.getElementById('sortLanguage').value = arg.sortLanguage;
        }
        if (arg.ascending != undefined) {
            document.getElementById('descending').checked = !arg.ascending;
        }
    }
    sort() {
        var language = document.getElementById('sortLanguage').value;
        var desc = document.getElementById('descending').checked;
        this.electron.ipcRenderer.send('set-sort', { sortLanguage: language, ascending: !desc });
    }
    clearSort() {
        this.electron.ipcRenderer.send('clear-sort');
    }
}
new SortUnits();
