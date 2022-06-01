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
class ConvertExcel {
    constructor() {
        this.electron = require('electron');
        this.previewTables = [];
        this.columns = [];
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event, arg) => {
            document.getElementById('theme').href = arg;
        });
        document.getElementById('browseExcelFiles').addEventListener('click', () => {
            this.browseExcelFiles();
        });
        this.electron.ipcRenderer.on('set-excelfile', (event, arg) => {
            this.setExcelFile(arg);
        });
        document.getElementById('browseTmxFiles').addEventListener('click', () => {
            this.browseTmxFiles();
        });
        this.electron.ipcRenderer.on('converted-tmx-file', (event, arg) => {
            document.getElementById('tmxFile').value = arg;
        });
        document.getElementById('refreshPreview').addEventListener('click', () => {
            this.refreshPreview();
        });
        document.getElementById('sheetSelect').addEventListener('change', () => {
            this.sheetChanged();
        });
        this.electron.ipcRenderer.on('set-preview', (event, arg) => {
            this.setPreview(arg);
        });
        this.electron.ipcRenderer.on('excel-languages', (event, arg) => {
            this.excelLanguages(arg);
        });
        document.getElementById('convert').addEventListener('click', () => {
            this.convertExcel();
        });
        document.addEventListener('keydown', (event) => { KeyboardHandler.keyListener(event); });
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-convertExcel');
            }
        });
        document.getElementById('setLanguages').addEventListener('click', () => {
            this.getLanguages();
        });
        let body = document.getElementById('body');
        this.electron.ipcRenderer.send('convertExcel-height', { width: body.clientWidth, height: body.clientHeight });
    }
    browseExcelFiles() {
        this.electron.ipcRenderer.send('get-excelfile');
    }
    setExcelFile(arg) {
        let excelFile = document.getElementById('excelFile');
        excelFile.value = arg;
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
        let value = document.getElementById('excelFile').value;
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
        let excelFile = document.getElementById('excelFile');
        if (excelFile.value === '') {
            return;
        }
        let arg = {
            excelFile: excelFile.value,
        };
        this.electron.ipcRenderer.send('get-excel-preview', arg);
    }
    setPreview(data) {
        this.previewTables = [];
        this.columns = [];
        this.langs = [];
        let preview = document.getElementById('preview');
        let sheetSelect = document.getElementById('sheetSelect');
        if (data.length == 0) {
            preview.innerHTML = '<pre id="preview" style="width: 100%;">Preview not available</pre>';
            sheetSelect.innerHTML = '';
            return;
        }
        let options = '';
        for (let i = 0; i < data.length; i++) {
            options = options + '<option value="' + i + '">' + data[i].name + '</option>';
        }
        sheetSelect.innerHTML = options;
        for (let i = 0; i < data.length; i++) {
            let sheet = data[i];
            let sheetData = sheet.data;
            let previewTable = document.createElement('table');
            previewTable.classList.add('stripes');
            let thead = document.createElement('thead');
            let headRow = document.createElement('tr');
            thead.appendChild(headRow);
            previewTable.appendChild(thead);
            for (let h = 0; h < sheet.columns; h++) {
                let th = document.createElement('th');
                th.id = sheetData[0][h];
                th.innerText = sheetData[0][h];
                headRow.appendChild(th);
            }
            for (let h = 1; h < sheetData.length; h++) {
                let tr = document.createElement('tr');
                previewTable.appendChild(tr);
                for (let j = 0; j < sheet.columns; j++) {
                    let td = document.createElement('td');
                    td.innerText = sheetData[h][j];
                    tr.appendChild(td);
                }
            }
            if (i === 0) {
                preview.innerHTML = '';
                preview.appendChild(previewTable);
            }
            this.previewTables.push(previewTable);
            this.columns.push(sheetData[0]);
        }
        if (data.length === 1 && data[0].langs) {
            this.excelLanguages(data[0].langs);
        }
    }
    sheetChanged() {
        let sheetSelect = document.getElementById('sheetSelect');
        let selected = sheetSelect.selectedIndex;
        let preview = document.getElementById('preview');
        preview.innerHTML = '';
        preview.appendChild(this.previewTables[selected]);
        for (let i = 0; i < this.columns[selected].length; i++) {
            let th = document.getElementById(this.columns[selected][i]);
            th.innerText = this.columns[selected][i];
        }
        this.langs = [];
    }
    getLanguages() {
        let excelFile = document.getElementById('excelFile');
        if (excelFile.value === '') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select Excel file', parent: 'convertExcel' });
            return;
        }
        let sheetSelect = document.getElementById('sheetSelect');
        let selected = sheetSelect.selectedIndex;
        this.electron.ipcRenderer.send('get-excel-languages', { columns: this.columns[selected], languages: this.langs });
    }
    excelLanguages(arg) {
        this.langs = arg;
        let sheetSelect = document.getElementById('sheetSelect');
        let selected = sheetSelect.selectedIndex;
        for (let i = 0; i < this.columns[selected].length; i++) {
            let th = document.getElementById(this.columns[selected][i]);
            th.innerText = this.columns[selected][i] + ' (' + this.langs[i] + ')';
        }
        document.getElementById('convert').focus();
    }
    convertExcel() {
        let excelFile = document.getElementById('excelFile');
        if (excelFile.value === '') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select Excel file', parent: 'convertExcel' });
            return;
        }
        let tmxFile = document.getElementById('tmxFile');
        if (tmxFile.value === '') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select TMX file', parent: 'convertExcel' });
            return;
        }
        if (this.langs.length === 0) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Set languages', parent: 'convertExcel' });
            return;
        }
        let sheetSelect = document.getElementById('sheetSelect');
        let selected = sheetSelect.selectedOptions[0].text;
        let arg = {
            excelFile: excelFile.value,
            tmxFile: tmxFile.value,
            sheet: selected,
            langs: this.langs,
            openTMX: document.getElementById('openTMX').checked
        };
        this.electron.ipcRenderer.send('convert-excel-tmx', arg);
    }
}
new ConvertExcel();
