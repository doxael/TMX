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
class AddNote {
    constructor() {
        this.electron = require('electron');
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event, arg) => {
            document.getElementById('theme').href = arg;
            document.getElementById('note').focus();
        });
        document.getElementById('saveNote').addEventListener('click', () => {
            this.saveNote();
        });
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.saveNote();
            }
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-addNote');
            }
        });
        let body = document.getElementById('body');
        this.electron.ipcRenderer.send('addNote-height', { width: body.clientWidth, height: body.clientHeight });
    }
    saveNote() {
        var note = document.getElementById('note').value;
        if (note === '') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Enter note', parent: 'addNote' });
            return;
        }
        this.electron.ipcRenderer.send('add-new-note', { note: note });
    }
}
new AddNote();
