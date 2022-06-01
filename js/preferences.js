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
class Preferences {
    constructor() {
        this.electron = require("electron");
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event, arg) => {
            document.getElementById('theme').href = arg;
        });
        this.electron.ipcRenderer.on('set-preferences', (event, arg) => {
            this.setPreferences(arg);
        });
        this.electron.ipcRenderer.send('get-preferences');
        document.getElementById('savePreferences').addEventListener('click', () => {
            this.savePreferences();
        });
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.savePreferences();
            }
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-preferences');
            }
        });
        document.getElementById('themeColor').focus();
        let body = document.getElementById('body');
        this.electron.ipcRenderer.send('preferences-height', { width: body.clientWidth, height: body.clientHeight });
    }
    setPreferences(arg) {
        document.getElementById('themeColor').value = arg.theme;
        document.getElementById('indentation').value = '' + arg.indentation;
        document.getElementById('threshold').value = '' + arg.threshold;
    }
    savePreferences() {
        var theme = document.getElementById('themeColor').value;
        var indent = Number.parseInt(document.getElementById('indentation').value);
        var threshold = Number.parseInt(document.getElementById('threshold').value);
        var prefs = { theme: theme, threshold: threshold, indentation: indent };
        this.electron.ipcRenderer.send('save-preferences', prefs);
    }
}
new Preferences();
