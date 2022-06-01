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
class ConvertCSV {
    constructor() {
        this.electron = require('electron');
        this.langs = [];
        this.columns = 0;
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event, arg) => {
            document.getElementById('theme').href = arg;
        });
        this.electron.ipcRenderer.send('get-charsets');
        this.electron.ipcRenderer.on('set-charsets', (event, arg) => {
            this.setCharsets(arg);
        });
        this.electron.ipcRenderer.on('set-csvfile', (event, arg) => {
            this.setCsvFile(arg);
        });
        this.electron.ipcRenderer.on('converted-tmx-file', (event, arg) => {
            document.getElementById('tmxFile').value = arg;
        });
        this.electron.ipcRenderer.on('set-preview', (event, arg) => {
            this.setPreview(arg);
        });
        this.electron.ipcRenderer.on('csv-languages', (event, arg) => {
            this.csvLanguages(arg);
        });
        document.getElementById('browseCsvFiles').addEventListener('click', () => {
            this.browseCsvFiles();
        });
        document.getElementById('browseTmxFiles').addEventListener('click', () => {
            this.browseTmxFiles();
        });
        document.getElementById('charSets').addEventListener('change', () => {
            this.refreshPreview();
        });
        document.getElementById('colSeps').addEventListener('change', () => {
            this.refreshPreview();
        });
        document.getElementById('textDelim').addEventListener('change', () => {
            this.refreshPreview();
        });
        document.getElementById('fixQuotes').addEventListener('change', () => {
            this.refreshPreview();
        });
        document.getElementById('optionalDelims').addEventListener('change', () => {
            this.refreshPreview();
        });
        document.getElementById('refreshPreview').addEventListener('click', () => {
            this.refreshPreview();
        });
        document.getElementById('setLanguages').addEventListener('click', () => {
            this.setLanguages();
        });
        document.getElementById('convert').addEventListener('click', () => {
            this.convertFile();
        });
        document.addEventListener('keydown', (event) => { KeyboardHandler.keyListener(event); });
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-convertCsv');
            }
        });
        let body = document.getElementById('body');
        this.electron.ipcRenderer.send('convertCsv-height', { width: body.clientWidth, height: body.clientHeight + 10 });
    }
    setCharsets(arg) {
        let options = '';
        for (let i = 0; i < arg.length; i++) {
            options = options + '<option value="' + arg[i] + '">' + arg[i] + '</option>';
        }
        let charSets = document.getElementById('charSets');
        charSets.innerHTML = options;
        charSets.value = 'UTF-16LE';
        let colSeps = document.getElementById('colSeps');
        colSeps.value = 'TAB';
    }
    browseCsvFiles() {
        this.electron.ipcRenderer.send('get-csvfile');
    }
    setCsvFile(arg) {
        let csvFile = document.getElementById('csvFile');
        csvFile.value = arg;
        let tmxFile = document.getElementById('tmxFile');
        if (tmxFile.value === '') {
            let index = arg.lastIndexOf('.');
            if (index !== -1) {
                tmxFile.value = arg.substring(0, index) + '.tmx';
            }
            else {
                tmxFile.value = arg + '.tmx';
            }
        }
        this.refreshPreview();
    }
    browseTmxFiles() {
        let value = document.getElementById('csvFile').value;
        if (value !== '') {
            let index = value.lastIndexOf('.');
            if (index !== -1) {
                value = value.substring(0, index) + '.tmx';
            }
            else {
                value = value + '.tmx';
            }
        }
        this.electron.ipcRenderer.send('get-converted-tmx', { default: value });
    }
    refreshPreview() {
        let csvFile = document.getElementById('csvFile');
        if (csvFile.value === '') {
            return;
        }
        let columnsSeparator = '';
        let customSep = document.getElementById('customSep').value;
        if (customSep !== '') {
            columnsSeparator = customSep;
        }
        else {
            columnsSeparator = document.getElementById('colSeps').value;
            if (columnsSeparator === 'TAB') {
                columnsSeparator = '\t';
            }
        }
        let textDelimiter = '';
        let customDel = document.getElementById('customDel').value;
        if (customDel !== '') {
            textDelimiter = customDel;
        }
        else {
            textDelimiter = document.getElementById('textDelim').value;
        }
        let arg = {
            csvFile: csvFile.value,
            langs: this.langs,
            charSet: document.getElementById('charSets').value,
            columnsSeparator: columnsSeparator,
            textDelimiter: textDelimiter,
            fixQuotes: document.getElementById('fixQuotes').checked,
            optionalDelims: document.getElementById('optionalDelims').checked
        };
        this.electron.ipcRenderer.send('get-csv-preview', arg);
    }
    setPreview(arg) {
        this.columns = arg.cols;
        document.getElementById('preview').innerHTML = arg.preview;
        document.getElementById('columns').innerHTML = '' + this.columns;
    }
    setLanguages() {
        let csvFile = document.getElementById('csvFile');
        if (csvFile.value === '') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select CSV/Text file', parent: 'convertCSV' });
            return;
        }
        if (this.columns === 0) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Columns not detected', parent: 'convertCSV' });
            return;
        }
        this.electron.ipcRenderer.send('get-csv-languages', { columns: this.columns, languages: this.langs });
    }
    csvLanguages(arg) {
        this.langs = arg;
        this.refreshPreview();
        document.getElementById('convert').focus();
    }
    convertFile() {
        let csvFile = document.getElementById('csvFile');
        if (csvFile.value === '') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select CSV/Text file', parent: 'convertCSV' });
            return;
        }
        let tmxFile = document.getElementById('tmxFile');
        if (tmxFile.value === '') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select TMX file', parent: 'convertCSV' });
            return;
        }
        if (this.langs.length < 2) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Set languages', parent: 'convertCSV' });
            return;
        }
        if (this.langs.length != this.columns) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Set languages for all columns', parent: 'convertCSV' });
            return;
        }
        let columnsSeparator = '';
        let customSep = document.getElementById('customSep').value;
        if (customSep !== '') {
            columnsSeparator = customSep;
        }
        else {
            columnsSeparator = document.getElementById('colSeps').value;
            if (columnsSeparator === 'TAB') {
                columnsSeparator = '\t';
            }
        }
        let textDelimiter = '';
        let customDel = document.getElementById('customDel').value;
        if (customDel !== '') {
            textDelimiter = customDel;
        }
        else {
            textDelimiter = document.getElementById('textDelim').value;
        }
        let arg = {
            csvFile: csvFile.value,
            tmxFile: tmxFile.value,
            langs: this.langs,
            charSet: document.getElementById('charSets').value,
            columnsSeparator: columnsSeparator,
            textDelimiter: textDelimiter,
            fixQuotes: document.getElementById('fixQuotes').checked,
            optionalDelims: document.getElementById('optionalDelims').checked,
            openTMX: document.getElementById('openTMX').checked
        };
        this.electron.ipcRenderer.send('convert-csv-tmx', arg);
    }
}
new ConvertCSV();
