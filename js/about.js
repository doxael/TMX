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
class About {
    constructor() {
        this.electron = require('electron');
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event, arg) => {
            document.getElementById('theme').href = arg;
        });
        this.electron.ipcRenderer.send('get-version');
        this.electron.ipcRenderer.on('set-version', (event, arg) => {
            document.getElementById('version').innerHTML = arg;
        });
        document.getElementById('system').addEventListener('click', () => {
            this.electron.ipcRenderer.send('system-info-clicked');
            document.getElementById('system').blur();
        });
        document.getElementById('licenses').addEventListener('click', () => {
            this.electron.ipcRenderer.send('licenses-clicked');
            document.getElementById('licenses').blur();
        });
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-about');
            }
        });
        setTimeout(() => {
            let body = document.getElementById('body');
            this.electron.ipcRenderer.send('about-height', { width: body.clientWidth, height: body.clientHeight });
        }, 200);
    }
}
new About();
