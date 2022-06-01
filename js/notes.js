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
class Notes {
    constructor() {
        this.electron = require('electron');
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event, arg) => {
            document.getElementById('theme').href = arg;
        });
        this.electron.ipcRenderer.send('get-unit-notes');
        this.electron.ipcRenderer.on('set-unit-notes', (event, arg) => {
            this.currentId = arg.id;
            this.currentType = arg.type;
            this.notes = arg.notes;
            this.drawNotes();
        });
        this.electron.ipcRenderer.on('set-new-note', (event, arg) => {
            this.notes.push(arg.note);
            this.drawNotes();
            document.getElementById('save').focus();
        });
        document.getElementById('add').addEventListener('click', () => {
            this.addNote();
        });
        document.getElementById('delete').addEventListener('click', () => {
            this.deleteNotes();
        });
        document.getElementById('save').addEventListener('click', () => {
            this.saveNotes();
        });
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-notes');
            }
        });
        let body = document.getElementById('body');
        this.electron.ipcRenderer.send('notes-height', { width: body.clientWidth, height: body.clientHeight });
    }
    drawNotes() {
        var rows = '';
        let length = this.notes.length;
        for (let i = 0; i < length; i++) {
            var note = this.notes[i];
            rows = rows + '<tr id="note_' + i + '"><td><input type="checkbox" class="middle"></td><td class="middle noWrap fill_width">' + note + '</td></tr>';
        }
        document.getElementById('notesTable').innerHTML = rows;
    }
    saveNotes() {
        var lang = this.currentType === 'TU' ? '' : this.currentType;
        var arg = {
            id: this.currentId,
            lang: lang,
            notes: this.notes
        };
        this.electron.ipcRenderer.send('save-notes', arg);
    }
    addNote() {
        this.electron.ipcRenderer.send('show-add-note');
    }
    deleteNotes() {
        var collection = document.getElementsByClassName('rowCheck');
        for (let i = 0; i < collection.length; i++) {
            var check = collection[i];
            if (check.checked) {
                this.removeNote(check.parentElement.parentElement.id);
            }
        }
        this.drawNotes();
        document.getElementById('save').focus();
    }
    removeNote(id) {
        var copy = [];
        let length = this.notes.length;
        for (let i = 0; i < length; i++) {
            if (id !== 'note_' + i) {
                copy.push(this.notes[i]);
            }
        }
        this.notes = copy;
    }
}
new Notes();
