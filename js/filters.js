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
class Filters {
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
        this.electron.ipcRenderer.on('set-filter-options', (event, arg) => {
            this.setFilterOptions(arg);
        });
        this.electron.ipcRenderer.on('set-source-language', (event, arg) => {
            if (arg.srcLang !== '*all*') {
                document.getElementById('sourceLanguage').value = arg.srcLang;
            }
        });
        document.getElementById('filterText').addEventListener('keydown', (event) => {
            if (process.platform === 'darwin' && event.code === 'KeyV' && (event.metaKey || event.ctrlKey)) {
                navigator.clipboard.readText().then(clipText => document.getElementById('filterText').value += clipText);
            }
        });
        document.getElementById('filterUntranslated').addEventListener('click', () => {
            this.togleSourceLanguage();
        });
        document.getElementById('applyFilters').addEventListener('click', () => {
            this.applyFilters();
        });
        document.getElementById('clearFilters').addEventListener('click', () => {
            this.clearFilters();
        });
        document.addEventListener('keydown', (event) => { KeyboardHandler.keyListener(event); });
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.applyFilters();
            }
            if (event.code === 'Escape') {
                this.clearFilters();
            }
        });
        document.getElementById('filterText').focus();
        let body = document.getElementById('body');
        this.electron.ipcRenderer.send('filters-height', { width: body.clientWidth, height: body.clientHeight });
    }
    togleSourceLanguage() {
        var checked = document.getElementById('filterUntranslated').checked;
        document.getElementById('sourceLanguage').disabled = !checked;
    }
    filterLanguages(arg) {
        var sourceLanguage = document.getElementById('sourceLanguage');
        var filterLanguage = document.getElementById('filterLanguage');
        var options = '';
        for (let i = 0; i < arg.length; i++) {
            let lang = arg[i];
            options = options + '<option value="' + lang.code + '">' + lang.name + '</option>';
        }
        sourceLanguage.innerHTML = options;
        filterLanguage.innerHTML = options;
        this.electron.ipcRenderer.send('get-filter-options');
        this.electron.ipcRenderer.send('get-source-language');
    }
    setFilterOptions(arg) {
        if (arg.filterText !== undefined) {
            document.getElementById('filterText').value = arg.filterText;
        }
        if (arg.filterLanguage !== undefined) {
            document.getElementById('filterLanguage').value = arg.filterLanguage;
        }
        if (arg.caseSensitiveFilter !== undefined) {
            document.getElementById('caseSensitiveFilter').checked = arg.caseSensitiveFilter;
        }
        if (arg.filterUntranslated !== undefined) {
            document.getElementById('filterUntranslated').checked = arg.filterUntranslated;
        }
        if (arg.regExp !== undefined) {
            document.getElementById('regularExpression').checked = arg.regExp;
        }
        if (arg.filterSrcLanguage !== undefined) {
            document.getElementById('sourceLanguage').value = arg.filterSrcLanguage;
        }
    }
    applyFilters() {
        var filterText = document.getElementById('filterText').value;
        var filterLanguage = document.getElementById('filterLanguage').value;
        var caseSensitiveFilter = document.getElementById('caseSensitiveFilter').checked;
        var regExp = document.getElementById('regularExpression').checked;
        var filterUntranslated = document.getElementById('filterUntranslated').checked;
        var filterSrcLanguage = document.getElementById('sourceLanguage').value;
        if (!filterUntranslated && filterText.length === 0) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Enter text to search', parent: 'filters' });
            return;
        }
        var filterOptions = {
            filterText: filterText,
            filterLanguage: filterLanguage,
            caseSensitiveFilter: caseSensitiveFilter,
            filterUntranslated: filterUntranslated,
            regExp: regExp,
            filterSrcLanguage: filterSrcLanguage
        };
        this.electron.ipcRenderer.send('filter-options', filterOptions);
    }
    clearFilters() {
        this.electron.ipcRenderer.send('clear-filter-options');
    }
}
new Filters();
