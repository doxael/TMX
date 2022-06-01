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
class SystemInformation {
    constructor() {
        this.electron = require('electron');
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.send('get-version');
        this.electron.ipcRenderer.on('set-theme', (event, arg) => {
            document.getElementById('theme').href = arg;
        });
        this.electron.ipcRenderer.send('get-system-info');
        this.electron.ipcRenderer.on('set-system-info', (event, arg) => {
            this.setInfo(arg);
        });
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-systemInfo');
            }
        });
        this.electron.ipcRenderer.send('systemInfo-height', { width: document.body.clientWidth, height: (document.body.clientHeight + 20) });
    }
    setInfo(info) {
        document.getElementById('tmxeditor').innerText = info.tmxeditor;
        document.getElementById('openxliff').innerText = info.openxliff;
        document.getElementById('java').innerText = info.java;
        document.getElementById('electron').innerText = info.electron;
    }
}
new SystemInformation();
