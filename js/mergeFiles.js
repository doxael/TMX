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
class MergeFiles {
    constructor() {
        this.electron = require('electron');
        this.files = [];
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event, arg) => {
            document.getElementById('theme').href = arg;
        });
        this.electron.ipcRenderer.on('merged-tmx-file', (event, arg) => {
            document.getElementById('file').value = arg;
        });
        this.electron.ipcRenderer.on('tmx-files', (event, arg) => {
            this.tmxFiles(arg);
        });
        document.getElementById('browseMergedFile').addEventListener('click', () => {
            this.browseMergedFile();
        });
        document.getElementById('addFiles').addEventListener('click', () => {
            this.addFiles();
        });
        document.getElementById('deleteFiles').addEventListener('click', () => {
            this.deleteFiles();
        });
        document.getElementById('mergeFiles').addEventListener('click', () => {
            this.mergeFiles();
        });
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.mergeFiles();
            }
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-mergeFiles');
            }
        });
        document.getElementById('file').focus();
        let body = document.getElementById('body');
        this.electron.ipcRenderer.send('mergeFiles-height', { width: body.clientWidth, height: body.clientHeight + 10 });
    }
    mergeFiles() {
        var file = document.getElementById('file').value;
        if (file === '') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select merged TMX file', parent: 'mergeFiles' });
            return;
        }
        if (this.files.length === 0) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Add TMX files', parent: 'mergeFiles' });
            return;
        }
        if (this.files.length < 2) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Add more TMX files', parent: 'mergeFiles' });
            return;
        }
        this.electron.ipcRenderer.send('merge-tmx-files', { merged: file, files: this.files });
    }
    browseMergedFile() {
        this.electron.ipcRenderer.send('select-merged-tmx');
    }
    addFiles() {
        this.electron.ipcRenderer.send('add-tmx-files');
    }
    tmxFiles(arg) {
        for (let i = 0; i < arg.length; i++) {
            if (!this.contains(this.files, arg[i])) {
                this.files.push(arg[i]);
            }
        }
        this.files.sort();
        var rows = '';
        for (let i = 0; i < this.files.length; i++) {
            rows = rows + '<tr><td><input type="checkbox" class="rowCheck"></td><td>' + this.files[i] + '</td></tr>';
        }
        document.getElementById('table').innerHTML = rows;
    }
    contains(array, value) {
        for (let i = 0; i < array.length; i++) {
            if (array[i] === value) {
                return true;
            }
        }
        return false;
    }
    deleteFiles() {
        var collection = document.getElementsByClassName('rowCheck');
        var selected = [];
        for (let i = 0; i < collection.length; i++) {
            var checkbox = collection[i];
            if (checkbox.checked) {
                var file = checkbox.parentElement.nextElementSibling.innerHTML;
                selected.push(file);
            }
        }
        if (selected.length == 0) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select files', parent: 'mergeFiles' });
            return;
        }
        var array = [];
        for (let i = 0; i < this.files.length; i++) {
            if (!this.contains(selected, this.files[i])) {
                array.push(this.files[i]);
            }
        }
        array.sort();
        this.files = array;
        var rows = '';
        for (let i = 0; i < this.files.length; i++) {
            rows = rows + '<tr><td><input type="checkbox" class="rowCheck"></td><td>' + this.files[i] + '</td></tr>';
        }
        document.getElementById('table').innerHTML = rows;
    }
}
new MergeFiles();
