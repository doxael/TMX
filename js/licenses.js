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
class Licenses {
    constructor() {
        this.electron = require('electron');
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event, arg) => {
            document.getElementById('theme').href = arg;
        });
        document.getElementById('TMXEditor').addEventListener('click', () => {
            this.openLicense('TMXEditor');
        });
        document.getElementById('electron').addEventListener('click', () => {
            this.openLicense('electron');
        });
        document.getElementById('TypeScript').addEventListener('click', () => {
            this.openLicense('TypeScript');
        });
        document.getElementById('Java').addEventListener('click', () => {
            this.openLicense('Java');
        });
        document.getElementById('OpenXLIFF').addEventListener('click', () => {
            this.openLicense('OpenXLIFF');
        });
        document.getElementById('TMXValidator').addEventListener('click', () => {
            this.openLicense('TMXValidator');
        });
        document.getElementById('JSON').addEventListener('click', () => {
            this.openLicense('JSON');
        });
        document.getElementById('H2').addEventListener('click', () => {
            this.openLicense('H2');
        });
        document.getElementById('MapDB').addEventListener('click', () => {
            this.openLicense('MapDB');
        });
        document.getElementById('jsoup').addEventListener('click', () => {
            this.openLicense('jsoup');
        });
        document.getElementById('DTDParser').addEventListener('click', () => {
            this.openLicense('DTDParser');
        });
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-licenses');
            }
        });
        let body = document.getElementById('body');
        this.electron.ipcRenderer.send('licenses-height', { width: body.clientWidth, height: body.clientHeight });
    }
    openLicense(type) {
        this.electron.ipcRenderer.send('open-license', { type: type });
    }
}
new Licenses();
