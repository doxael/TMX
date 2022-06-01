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
class AddProperty {
    constructor() {
        this.electron = require('electron');
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event, arg) => {
            document.getElementById('theme').href = arg;
        });
        document.getElementById('saveProperty').addEventListener('click', () => {
            this.saveProperty();
        });
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.saveProperty();
            }
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-addProperty');
            }
        });
        let body = document.getElementById('body');
        this.electron.ipcRenderer.send('addProperty-height', { width: body.clientWidth, height: body.clientHeight });
    }
    saveProperty() {
        var type = document.getElementById('type').value;
        if (type === '') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Enter type', parent: 'addProperty' });
            return;
        }
        var value = document.getElementById('value').value;
        if (value === '') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Enter value', parent: 'addProperty' });
            return;
        }
        if (!this.validateType(type)) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Invalid type', parent: 'addProperty' });
            return;
        }
        this.electron.ipcRenderer.send('add-new-property', { type: type, value: value });
    }
    validateType(type) {
        var length = type.length;
        for (let i = 0; i < length; i++) {
            var c = type.charAt(i);
            if (c === ' ' || c === '<' || c === '&') {
                return false;
            }
        }
        return true;
    }
}
new AddProperty();
