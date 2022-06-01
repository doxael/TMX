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
class Properties {
    constructor() {
        this.electron = require('electron');
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event, arg) => {
            document.getElementById('theme').href = arg;
        });
        this.electron.ipcRenderer.send('get-unit-properties');
        this.electron.ipcRenderer.on('set-unit-properties', (event, arg) => {
            this.setUnitProperties(arg);
        });
        this.electron.ipcRenderer.on('set-new-property', (event, arg) => {
            this.setNewProperty(arg);
        });
        document.getElementById('addProperty').addEventListener('click', () => {
            this.addProperty();
        });
        document.getElementById('deleteProperties').addEventListener('click', () => {
            this.deleteProperties();
        });
        document.getElementById('save').addEventListener('click', () => {
            this.saveProperties();
        });
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-properties');
            }
        });
        let body = document.getElementById('body');
        this.electron.ipcRenderer.send('properties-height', { width: body.clientWidth, height: body.clientHeight });
    }
    setUnitProperties(arg) {
        this.currentId = arg.id;
        this.currentType = arg.type;
        this.props = arg.props;
        this.drawProperties();
    }
    saveProperties() {
        var lang = this.currentType === 'TU' ? '' : this.currentType;
        var arg = {
            id: this.currentId,
            lang: lang,
            properties: this.props
        };
        this.electron.ipcRenderer.send('save-properties', arg);
    }
    addProperty() {
        this.electron.ipcRenderer.send('show-add-property');
    }
    setNewProperty(arg) {
        var prop = [arg.type, arg.value];
        this.props.push(prop);
        this.drawProperties();
        document.getElementById('save').focus();
    }
    deleteProperties() {
        var collection = document.getElementsByClassName('rowCheck');
        for (let i = 0; i < collection.length; i++) {
            var check = collection[i];
            if (check.checked) {
                this.removeProperty(check.parentElement.parentElement.id);
            }
        }
        this.drawProperties();
        document.getElementById('save').focus();
    }
    drawProperties() {
        var rows = '';
        for (let i = 0; i < this.props.length; i++) {
            var pair = this.props[i];
            rows = rows + '<tr id="' + pair[0] + '"><td><input type="checkbox" class="rowCheck"></td><td class="noWrap">' + pair[0] + '</td><td class="noWrap">' + pair[1] + '</td></tr>';
        }
        document.getElementById('propsTable').innerHTML = rows;
    }
    removeProperty(type) {
        var copy = [];
        for (let i = 0; i < this.props.length; i++) {
            var pair = this.props[i];
            if (pair[0] !== type) {
                copy.push(pair);
            }
        }
        this.props = copy;
    }
}
new Properties();
