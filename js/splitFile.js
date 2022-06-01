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
class SplitFile {
    constructor() {
        this.electron = require('electron');
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event, arg) => {
            document.getElementById('theme').href = arg;
        });
        this.electron.ipcRenderer.on('tmx-file', (event, arg) => {
            document.getElementById('file').value = arg;
        });
        document.getElementById('browseFiles').addEventListener('click', () => {
            this.browseFiles();
        });
        document.getElementById('splitFile').addEventListener('click', () => {
            this.splitFile();
        });
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.splitFile();
            }
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-splitFile');
            }
        });
        document.getElementById('file').focus();
        let body = document.getElementById('body');
        this.electron.ipcRenderer.send('splitFile-height', { width: body.clientWidth, height: body.clientHeight });
    }
    splitFile() {
        var file = document.getElementById('file').value;
        if (file === '') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select TMX file', parent: 'splitFile' });
            return;
        }
        var parts = Number.parseInt(document.getElementById('parts').value);
        this.electron.ipcRenderer.send('split-tmx', { file: file, parts: parts });
    }
    browseFiles() {
        this.electron.ipcRenderer.send('select-tmx');
    }
}
new SplitFile();
