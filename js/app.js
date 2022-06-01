"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const electron_1 = require("electron");
const fs_1 = require("fs");
const locations_1 = require("./locations");
const SUCCESS = 'Success';
const LOADING = 'Loading';
const COMPLETED = 'Completed';
const ERROR = 'Error';
const EXPIRED = 'Expired';
const SAVING = 'Saving';
const PROCESSING = 'Processing';
class App {
    constructor(args) {
        this.stopping = false;
        if (!(0, fs_1.existsSync)(App.path.join(electron_1.app.getPath('appData'), electron_1.app.name))) {
            (0, fs_1.mkdirSync)(App.path.join(electron_1.app.getPath('appData'), electron_1.app.name), { recursive: true });
        }
        if (process.platform === 'win32' && args.length > 1 && args[1] !== '.') {
            App.argFile = '';
            for (let i = 1; i < args.length; i++) {
                if (args[i] !== '.') {
                    if (App.argFile !== '') {
                        App.argFile = App.argFile + ' ';
                    }
                    App.argFile = App.argFile + args[i];
                }
            }
        }
        if (!electron_1.app.requestSingleInstanceLock()) {
            electron_1.app.quit();
        }
        else {
            if (App.mainWindow) {
                // Someone tried to run a second instance, we should focus our window.
                if (App.mainWindow.isMinimized()) {
                    App.mainWindow.restore();
                }
                App.mainWindow.focus();
            }
        }
        if (process.platform == 'win32') {
            App.javapath = App.path.join(electron_1.app.getAppPath(), 'bin', 'java.exe');
        }
        if (!(0, fs_1.existsSync)(App.path.join(electron_1.app.getPath('appData'), electron_1.app.name))) {
            (0, fs_1.mkdirSync)(App.path.join(electron_1.app.getPath('appData'), electron_1.app.name), { recursive: true });
        }
        this.ls = (0, child_process_1.spawn)(App.javapath, ['-cp', 'lib/h2-1.4.200.jar', '--module-path', 'lib', '-m', 'tmxserver/com.maxprograms.tmxserver.TMXServer', '-port', '8060'], { cwd: electron_1.app.getAppPath(), windowsHide: true });
        (0, child_process_1.execFileSync)(App.javapath, ['--module-path', 'lib', '-m', 'tmxserver/com.maxprograms.tmxserver.CheckURL', 'http://localhost:8060/TMXServer'], { cwd: electron_1.app.getAppPath(), windowsHide: true });
        App.locations = new locations_1.Locations(App.path.join(electron_1.app.getPath('appData'), electron_1.app.name, 'locations.json'));
        this.ls.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });
        this.ls.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });
        electron_1.app.on('open-file', (event, filePath) => {
            event.preventDefault();
            if (App.isReady) {
                App.openFile(filePath);
            }
            else {
                App.argFile = filePath;
            }
        });
        electron_1.app.on('before-quit', (event) => {
            if (!this.ls.killed) {
                event.preventDefault();
                this.stopServer();
            }
        });
        electron_1.app.on('quit', () => {
            electron_1.app.quit();
        });
        electron_1.app.on('window-all-closed', () => {
            electron_1.app.quit();
        });
        electron_1.app.on('ready', () => {
            App.isReady = true;
            App.mainLoaded();
        });
        App.loadDefaults();
        App.loadPreferences();
        electron_1.app.on('ready', () => {
            App.createWindow();
            App.mainWindow.loadURL('file://' + App.path.join(electron_1.app.getAppPath(), 'html', 'index.html'));
            App.mainWindow.on('resize', () => {
                App.saveDefaults();
            });
            App.mainWindow.on('move', () => {
                App.saveDefaults();
            });
            App.mainWindow.show();
            App.mainWindow.on('close', (ev) => {
                ev.cancelBubble = true;
                ev.preventDefault();
                App.close();
            });
            App.checkUpdates(true);
            if (process.platform === 'darwin' && electron_1.app.runningUnderARM64Translation) {
                App.showMessage({
                    type: 'warning',
                    message: 'You are running a version for Macs with Intel processors on a Mac with Apple M1 chipset.'
                });
            }
        });
        electron_1.nativeTheme.on('updated', () => {
            if (App.currentPreferences.theme === 'system') {
                if (electron_1.nativeTheme.shouldUseDarkColors) {
                    App.currentCss = 'file://' + App.path.join(electron_1.app.getAppPath(), 'css', 'dark.css');
                }
                else {
                    App.currentCss = 'file://' + App.path.join(electron_1.app.getAppPath(), 'css', 'light.css');
                }
                App.mainWindow.webContents.send('set-theme', App.currentCss);
            }
        });
        electron_1.ipcMain.on('licenses-clicked', () => {
            App.showLicenses({ from: 'about' });
        });
        electron_1.ipcMain.on('open-license', (event, arg) => {
            App.openLicense(arg);
        });
        electron_1.ipcMain.on('show-help', () => {
            App.showHelp();
        });
        electron_1.ipcMain.on('open-file', () => {
            App.openFileDialog();
        });
        electron_1.ipcMain.on('get-segments', (event, arg) => {
            App.loadOptions = arg;
            App.loadSegments();
        });
        electron_1.ipcMain.on('get-cell-properties', (event, arg) => {
            App.getCellProperties(arg.id, arg.lang);
        });
        electron_1.ipcMain.on('get-row-properties', (event, arg) => {
            App.getRowProperties(arg.id);
        });
        electron_1.ipcMain.on('edit-attributes', (event, arg) => {
            this.editAttributes(arg);
        });
        electron_1.ipcMain.on('get-unit-attributes', (event) => {
            event.sender.send('set-unit-attributes', App.attributesArg);
        });
        electron_1.ipcMain.on('save-attributes', (event, arg) => {
            this.saveAttributes(arg);
        });
        electron_1.ipcMain.on('edit-properties', (event, arg) => {
            this.editProperties(arg);
        });
        electron_1.ipcMain.on('get-unit-properties', (event) => {
            event.sender.send('set-unit-properties', App.propertiesArg);
        });
        electron_1.ipcMain.on('show-add-property', (event) => {
            App.showAddProperty(event);
        });
        electron_1.ipcMain.on('add-new-property', (event, arg) => {
            this.addNewProperty(arg);
        });
        electron_1.ipcMain.on('save-properties', (event, arg) => {
            this.saveProperties(arg);
        });
        electron_1.ipcMain.on('edit-notes', (event, arg) => {
            App.editNotes(arg);
        });
        electron_1.ipcMain.on('get-unit-notes', (event, arg) => {
            event.sender.send('set-unit-notes', App.notesArg);
        });
        electron_1.ipcMain.on('show-add-note', (event, arg) => {
            this.showAddNote(event);
        });
        electron_1.ipcMain.on('add-new-note', (event, arg) => {
            this.addNewNote(arg);
        });
        electron_1.ipcMain.on('save-notes', (event, arg) => {
            this.saveNotes(arg);
        });
        electron_1.ipcMain.on('get-preferences', (event) => {
            event.sender.send('set-preferences', App.currentPreferences);
        });
        electron_1.ipcMain.on('save-preferences', (event, arg) => {
            App.currentPreferences = arg;
            App.savePreferences();
            App.destroyWindow(App.settingsWindow);
            App.loadPreferences();
            App.setTheme();
        });
        electron_1.ipcMain.on('get-theme', (event) => {
            event.sender.send('set-theme', App.currentCss);
        });
        electron_1.ipcMain.on('create-file', (event, arg) => {
            this.createFile(arg);
        });
        electron_1.ipcMain.on('new-file', () => {
            App.createNewFile();
        });
        electron_1.ipcMain.on('save-file', () => {
            App.saveFile();
        });
        electron_1.ipcMain.on('convert-excel', () => {
            App.convertExcel();
        });
        electron_1.ipcMain.on('convert-csv', () => {
            App.convertCSV();
        });
        electron_1.ipcMain.on('convert-csv-tmx', (event, arg) => {
            this.convertCsvTmx(arg);
        });
        electron_1.ipcMain.on('convert-excel-tmx', (event, arg) => {
            this.convertExcelTmx(arg);
        });
        electron_1.ipcMain.on('get-charsets', (event) => {
            this.getCharsets(event);
        });
        electron_1.ipcMain.on('get-csvfile', (event) => {
            this.getCsvFile(event);
        });
        electron_1.ipcMain.on('get-excelfile', (event) => {
            this.getExcelFile(event);
        });
        electron_1.ipcMain.on('get-converted-tmx', (event, arg) => {
            this.getConvertedTMX(event, arg);
        });
        electron_1.ipcMain.on('get-csv-preview', (event, arg) => {
            this.getCsvPreview(event, arg);
        });
        electron_1.ipcMain.on('get-excel-preview', (event, arg) => {
            this.getExcelPreview(event, arg);
        });
        electron_1.ipcMain.on('get-csv-languages', (event, arg) => {
            this.getCsvLanguages(event, arg);
        });
        electron_1.ipcMain.on('get-excel-languages', (event, arg) => {
            this.getExcelLanguages(event, arg);
        });
        electron_1.ipcMain.on('get-csv-lang-args', (event) => {
            event.sender.send('set-csv-lang-args', App.csvLangArgs);
        });
        electron_1.ipcMain.on('set-csv-languages', (event, arg) => {
            this.setCsvLanguages(arg);
        });
        electron_1.ipcMain.on('set-excel-languages', (event, arg) => {
            this.setExcelLanguages(arg);
        });
        electron_1.ipcMain.on('get-excel-lang-args', (event) => {
            event.sender.send('set-excel-lang-args', App.excelLangArgs);
        });
        electron_1.ipcMain.on('show-file-info', () => {
            App.showFileInfo();
        });
        electron_1.ipcMain.on('file-properties', (event) => {
            this.fileProperties(event);
        });
        electron_1.ipcMain.on('select-tmx', (event) => {
            this.selectTmx(event);
        });
        electron_1.ipcMain.on('split-tmx', (event, arg) => {
            this.splitTmx(arg);
        });
        electron_1.ipcMain.on('select-merged-tmx', (event) => {
            this.selectMergedTmx(event);
        });
        electron_1.ipcMain.on('add-tmx-files', (event) => {
            this.addTmxFiles(event);
        });
        electron_1.ipcMain.on('merge-tmx-files', (event, arg) => {
            this.mergeTmxFiles(arg);
        });
        electron_1.ipcMain.on('save-data', (event, arg) => {
            this.saveData(event, arg);
        });
        electron_1.ipcMain.on('replace-text', () => {
            App.replaceText();
        });
        electron_1.ipcMain.on('replace-request', (event, arg) => {
            this.replaceRequest(arg);
        });
        electron_1.ipcMain.on('sort-units', () => {
            App.sortUnits();
        });
        electron_1.ipcMain.on('set-sort', (event, arg) => {
            this.setSort(arg);
        });
        electron_1.ipcMain.on('clear-sort', () => {
            this.clearSort();
        });
        electron_1.ipcMain.on('get-sort', (event) => {
            event.sender.send('sort-options', App.sortOptions);
        });
        electron_1.ipcMain.on('filter-units', () => {
            App.showFilters();
        });
        electron_1.ipcMain.on('filter-options', (event, arg) => {
            this.setFilterOptions(arg);
        });
        electron_1.ipcMain.on('get-filter-options', (event) => {
            event.sender.send('set-filter-options', App.filterOptions);
        });
        electron_1.ipcMain.on('clear-filter-options', () => {
            this.clearFilterOptions();
        });
        electron_1.ipcMain.on('get-filter-languages', (event) => {
            event.sender.send('filter-languages', App.fileLanguages);
        });
        electron_1.ipcMain.on('insert-unit', () => {
            App.insertUnit();
        });
        electron_1.ipcMain.on('delete-units', (event, arg) => {
            this.deleteUnits(arg);
        });
        electron_1.ipcMain.on('change-language', (event, arg) => {
            this.changeLanguage(arg);
        });
        electron_1.ipcMain.on('all-languages', (event) => {
            this.allLanguages(event);
        });
        electron_1.ipcMain.on('remove-language', (event, arg) => {
            this.removeLanguage(arg);
        });
        electron_1.ipcMain.on('add-language', (event, arg) => {
            this.addLanguage(arg);
        });
        electron_1.ipcMain.on('get-source-language', (event) => {
            this.getSourceLanguage(event);
        });
        electron_1.ipcMain.on('change-source-language', (event, arg) => {
            this.changeSourceLanguage(arg);
        });
        electron_1.ipcMain.on('remove-untranslated', (event, arg) => {
            this.removeUntranslated(arg);
        });
        electron_1.ipcMain.on('remove-sameAsSource', (event, arg) => {
            this.removeSameAsSource(arg);
        });
        electron_1.ipcMain.on('consolidate-units', (event, arg) => {
            this.consolidateUnits(arg);
        });
        electron_1.ipcMain.on('get-version', (event) => {
            event.sender.send('set-version', electron_1.app.name + ' ' + electron_1.app.getVersion());
        });
        electron_1.ipcMain.on('show-message', (event, arg) => {
            App.showMessage(arg);
        });
        electron_1.ipcMain.on('get-message-param', (event) => {
            event.sender.send('set-message', App.messageParam);
        });
        electron_1.ipcMain.on('newFile-height', (event, arg) => {
            App.setHeight(App.newFileWindow, arg);
        });
        electron_1.ipcMain.on('close-newFile', () => {
            App.destroyWindow(App.newFileWindow);
        });
        electron_1.ipcMain.on('about-height', (event, arg) => {
            App.setHeight(App.aboutWindow, arg);
        });
        electron_1.ipcMain.on('close-about', () => {
            App.destroyWindow(App.aboutWindow);
        });
        electron_1.ipcMain.on('system-info-clicked', () => {
            App.showSystemInfo();
        });
        electron_1.ipcMain.on('close-systemInfo', () => {
            App.destroyWindow(App.systemInfoWindow);
        });
        electron_1.ipcMain.on('systemInfo-height', (event, arg) => {
            App.setHeight(App.systemInfoWindow, arg);
        });
        electron_1.ipcMain.on('get-system-info', (event) => {
            App.getSystemInformation(event);
        });
        electron_1.ipcMain.on('messages-height', (event, arg) => {
            App.setHeight(App.messagesWindow, arg);
        });
        electron_1.ipcMain.on('close-messages', () => {
            App.destroyWindow(App.messagesWindow);
        });
        electron_1.ipcMain.on('fileInfo-height', (event, arg) => {
            App.setHeight(App.fileInfoWindow, arg);
        });
        electron_1.ipcMain.on('close-fileInfo', () => {
            App.destroyWindow(App.fileInfoWindow);
        });
        electron_1.ipcMain.on('licenses-height', (event, arg) => {
            App.setHeight(App.licensesWindow, arg);
        });
        electron_1.ipcMain.on('close-licenses', () => {
            App.destroyWindow(App.licensesWindow);
        });
        electron_1.ipcMain.on('preferences-height', (event, arg) => {
            App.setHeight(App.settingsWindow, arg);
        });
        electron_1.ipcMain.on('close-preferences', () => {
            App.destroyWindow(App.settingsWindow);
        });
        electron_1.ipcMain.on('attributes-height', (event, arg) => {
            App.setHeight(App.attributesWindow, arg);
        });
        electron_1.ipcMain.on('close-attributes', () => {
            App.destroyWindow(App.attributesWindow);
        });
        electron_1.ipcMain.on('properties-height', (event, arg) => {
            App.setHeight(App.propertiesWindow, arg);
        });
        electron_1.ipcMain.on('close-properties', () => {
            App.destroyWindow(App.propertiesWindow);
        });
        electron_1.ipcMain.on('addProperty-height', (event, arg) => {
            App.setHeight(App.addPropertyWindow, arg);
        });
        electron_1.ipcMain.on('close-addProperty', () => {
            App.destroyWindow(App.addPropertyWindow);
        });
        electron_1.ipcMain.on('notes-height', (event, arg) => {
            App.setHeight(App.notesWindow, arg);
        });
        electron_1.ipcMain.on('close-notes', () => {
            App.destroyWindow(App.notesWindow);
        });
        electron_1.ipcMain.on('addNote-height', (event, arg) => {
            App.setHeight(App.addNotesWindow, arg);
        });
        electron_1.ipcMain.on('close-addNote', () => {
            App.destroyWindow(App.addNotesWindow);
        });
        electron_1.ipcMain.on('convertCsv-height', (event, arg) => {
            App.setHeight(App.convertCsvWindow, arg);
        });
        electron_1.ipcMain.on('convertExcel-height', (event, arg) => {
            App.setHeight(App.convertExcelWindow, arg);
        });
        electron_1.ipcMain.on('close-convertCsv', () => {
            App.destroyWindow(App.convertCsvWindow);
        });
        electron_1.ipcMain.on('close-convertExcel', () => {
            App.destroyWindow(App.convertExcelWindow);
        });
        electron_1.ipcMain.on('csvLanguages-height', (event, arg) => {
            App.setHeight(App.csvLanguagesWindow, arg);
        });
        electron_1.ipcMain.on('excelLanguages-height', (event, arg) => {
            App.setHeight(App.excelLanguagesWindow, arg);
        });
        electron_1.ipcMain.on('close-csvLanguages', () => {
            App.destroyWindow(App.csvLanguagesWindow);
        });
        electron_1.ipcMain.on('close-excelLanguages', () => {
            App.destroyWindow(App.excelLanguagesWindow);
        });
        electron_1.ipcMain.on('splitFile-height', (event, arg) => {
            App.setHeight(App.splitFileWindow, arg);
        });
        electron_1.ipcMain.on('close-splitFile', () => {
            App.destroyWindow(App.splitFileWindow);
        });
        electron_1.ipcMain.on('mergeFiles-height', (event, arg) => {
            App.setHeight(App.mergeFilesWindow, arg);
        });
        electron_1.ipcMain.on('close-mergeFiles', () => {
            App.destroyWindow(App.mergeFilesWindow);
        });
        electron_1.ipcMain.on('replaceText-height', (event, arg) => {
            App.setHeight(App.replaceTextWindow, arg);
        });
        electron_1.ipcMain.on('close-replaceText', () => {
            App.destroyWindow(App.replaceTextWindow);
        });
        electron_1.ipcMain.on('sortUnits-height', (event, arg) => {
            App.setHeight(App.sortUnitsWindow, arg);
        });
        electron_1.ipcMain.on('filters-height', (event, arg) => {
            App.setHeight(App.filtersWindow, arg);
        });
        electron_1.ipcMain.on('addLanguage-height', (event, arg) => {
            App.setHeight(App.addLanguageWindow, arg);
        });
        electron_1.ipcMain.on('close-addLanguage', () => {
            App.destroyWindow(App.addLanguageWindow);
        });
        electron_1.ipcMain.on('changeLanguage-height', (event, arg) => {
            App.setHeight(App.changeLanguageWindow, arg);
        });
        electron_1.ipcMain.on('close-changeLanguage', () => {
            App.destroyWindow(App.changeLanguageWindow);
        });
        electron_1.ipcMain.on('removeLanguage-height', (event, arg) => {
            App.setHeight(App.removeLanguageWindow, arg);
        });
        electron_1.ipcMain.on('close-removeLanguage', () => {
            App.destroyWindow(App.removeLanguageWindow);
        });
        electron_1.ipcMain.on('srcLanguage-height', (event, arg) => {
            App.setHeight(App.srcLanguageWindow, arg);
        });
        electron_1.ipcMain.on('close-srcLanguage', () => {
            App.destroyWindow(App.srcLanguageWindow);
        });
        electron_1.ipcMain.on('removeUntranslated-height', (event, arg) => {
            App.setHeight(App.removeUntranslatedWindow, arg);
        });
        electron_1.ipcMain.on('removeSameAsSource-height', (event, arg) => {
            App.setHeight(App.removeSameAsSourceWindow, arg);
        });
        electron_1.ipcMain.on('close-removeSameAsSource', () => {
            App.destroyWindow(App.removeSameAsSourceWindow);
        });
        electron_1.ipcMain.on('close-removeUntranslated', () => {
            App.destroyWindow(App.removeUntranslatedWindow);
        });
        electron_1.ipcMain.on('consolidate-height', (event, arg) => {
            App.setHeight(App.consolidateWindow, arg);
        });
        electron_1.ipcMain.on('close-consolidate', () => {
            App.destroyWindow(App.consolidateWindow);
        });
        electron_1.ipcMain.on('maintenance-dashboard', () => {
            App.showMaintenanceDashboard();
        });
        electron_1.ipcMain.on('maintenance-height', (event, arg) => {
            App.setHeight(App.maintenanceWindow, arg);
        });
        electron_1.ipcMain.on('close-maintenance', () => {
            App.destroyWindow(App.maintenanceWindow);
        });
        electron_1.ipcMain.on('maintanance-tasks', (event, arg) => {
            App.maintenanceTasks(arg);
        });
        electron_1.ipcMain.on('updates-height', (event, arg) => {
            App.setHeight(App.updatesWindow, arg);
        });
        electron_1.ipcMain.on('close-updates', () => {
            App.destroyWindow(App.updatesWindow);
        });
        electron_1.ipcMain.on('get-versions', (event) => {
            event.sender.send('set-versions', { current: electron_1.app.getVersion(), latest: App.latestVersion });
        });
        electron_1.ipcMain.on('download-latest', () => {
            App.downloadLatest();
        });
        electron_1.ipcMain.on('release-history', () => {
            App.showReleaseHistory();
        });
        // Licenses
        electron_1.ipcMain.on('registerSubscription-height', (event, arg) => {
            App.setHeight(App.registerSubscriptionWindow, arg);
        });
        electron_1.ipcMain.on('registerExpired-height', (event, arg) => {
            App.setHeight(App.registerExpiredWindow, arg);
        });
        electron_1.ipcMain.on('requestEvaluation-height', (event, arg) => {
            App.setHeight(App.requestEvaluationWindow, arg);
        });
        electron_1.ipcMain.on('newSubscription-height', (event, arg) => {
            App.setHeight(App.newSubscriptionWindow, arg);
        });
        electron_1.ipcMain.on('close-newSubscription', () => {
            App.destroyWindow(App.newSubscriptionWindow);
        });
    } // end constructor
    stopServer() {
        let instance = this;
        App.sendRequest({ command: 'stop' }, (data) => {
            if (data.status === SUCCESS) {
                instance.ls.kill();
                electron_1.app.quit();
            }
            else {
                App.showMessage({ type: 'error', message: data.reason });
            }
        }, (reason) => {
            App.showMessage({ type: 'error', message: reason });
        });
    }
    static mainLoaded() {
        if (App.argFile !== '') {
            setTimeout(() => {
                App.openFile(App.argFile);
                App.argFile = '';
            }, 2000);
        }
    }
    static setHeight(window, arg) {
        let rect = window.getBounds();
        rect.height = arg.height + App.verticalPadding;
        window.setBounds(rect);
    }
    static destroyWindow(window) {
        if (window) {
            try {
                let parent = window.getParentWindow();
                window.hide();
                window.destroy();
                window = undefined;
                if (parent) {
                    parent.focus();
                }
                else {
                    App.mainWindow.focus();
                }
            }
            catch (e) {
                console.log(e);
            }
        }
    }
    static showMessage(arg) {
        let parent = App.mainWindow;
        if (arg.parent) {
            switch (arg.parent) {
                case 'preferences':
                    parent = App.settingsWindow;
                    break;
                case 'replaceText':
                    parent = App.replaceTextWindow;
                    break;
                case 'requestEvaluation':
                    parent = App.requestEvaluationWindow;
                    break;
                case 'registerSubscription':
                    parent = App.registerSubscriptionWindow;
                    break;
                case 'registerExpired':
                    parent = App.registerExpiredWindow;
                    break;
                case 'registerNewSubscription':
                    parent = App.newSubscriptionWindow;
                    break;
                case 'addNote':
                    parent = App.addNotesWindow;
                    break;
                case 'addProperty':
                    parent = App.addPropertyWindow;
                    break;
                case 'convertCSV':
                    parent = App.convertCsvWindow;
                    break;
                case 'convertExcel':
                    parent = App.convertExcelWindow;
                    break;
                case 'csvLanguages':
                    parent = App.csvLanguagesWindow;
                    break;
                case 'excelLanguages':
                    parent = App.excelLanguagesWindow;
                    break;
                case 'filters':
                    parent = App.filtersWindow;
                    break;
                case 'mergeFiles':
                    parent = App.mergeFilesWindow;
                    break;
                case 'newFile':
                    parent = App.newFileWindow;
                    break;
                case 'searchReplace':
                    parent = App.replaceTextWindow;
                    break;
                case 'splitFile':
                    parent = App.splitFileWindow;
                    break;
                default: parent = App.mainWindow;
            }
        }
        App.messagesWindow = new electron_1.BrowserWindow({
            parent: parent,
            width: 600,
            minimizable: false,
            maximizable: false,
            resizable: false,
            modal: true,
            show: false,
            icon: App.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        App.messageParam = arg;
        App.messagesWindow.setMenu(null);
        App.messagesWindow.loadURL('file://' + this.path.join(electron_1.app.getAppPath(), 'html', 'messages.html'));
        App.messagesWindow.once('ready-to-show', () => {
            App.messagesWindow.show();
        });
        App.messagesWindow.on('close', () => {
            parent.focus();
        });
        App.setLocation(App.messagesWindow, 'messages.html');
    }
    static createWindow() {
        App.iconPath = App.path.join(electron_1.app.getAppPath(), 'icons', 'tmxeditor.png');
        App.mainWindow = new electron_1.BrowserWindow({
            title: 'TMXEditor',
            width: App.currentDefaults.width,
            height: App.currentDefaults.height,
            x: App.currentDefaults.x,
            y: App.currentDefaults.y,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            },
            show: false,
            icon: App.iconPath
        });
        var fileMenu = electron_1.Menu.buildFromTemplate([
            { label: 'New', accelerator: 'CmdOrCtrl+N', click: () => { App.createNewFile(); } },
            { label: 'Open', accelerator: 'CmdOrCtrl+O', click: () => { App.openFileDialog(); } },
            { label: 'Close', accelerator: 'CmdOrCtrl+W', click: () => { App.closeFile(); } },
            { label: 'Save', accelerator: 'CmdOrCtrl+s', click: () => { App.saveFile(); } },
            { label: 'Save As', click: () => { App.saveAs(); } },
            new electron_1.MenuItem({ type: 'separator' }),
            { label: 'Convert Excel File to TMX', click: () => { App.convertExcel(); } },
            { label: 'Export as Excel File...', click: () => { App.exportExcel(); } },
            new electron_1.MenuItem({ type: 'separator' }),
            { label: 'Convert CSV/TAB Delimited File to TMX', click: () => { App.convertCSV(); } },
            { label: 'Export as TAB Delimited File...', click: () => { App.exportDelimited(); } },
            new electron_1.MenuItem({ type: 'separator' }),
            { label: 'File Properties', click: () => { App.showFileInfo(); } },
            new electron_1.MenuItem({ type: 'separator' }),
            { label: 'Validate TMX File...', click: () => { App.validateFile(); } },
            { label: 'Clean Invalid Characters...', click: () => { App.cleanCharacters(); } },
            new electron_1.MenuItem({ type: 'separator' }),
            { label: 'Split TMX File...', click: () => { App.splitFile(); } },
            { label: 'Merge TMX Files...', click: () => { App.mergeFiles(); } }
        ]);
        var editMenu = electron_1.Menu.buildFromTemplate([
            { label: 'Undo', accelerator: 'CmdOrCtrl+Z', click: () => { App.mainWindow.webContents.undo(); } },
            new electron_1.MenuItem({ type: 'separator' }),
            { label: 'Cut', accelerator: 'CmdOrCtrl+X', click: () => { App.mainWindow.webContents.cut(); } },
            { label: 'Copy', accelerator: 'CmdOrCtrl+C', click: () => { App.mainWindow.webContents.copy(); } },
            { label: 'Paste', accelerator: 'CmdOrCtrl+V', click: () => { App.mainWindow.webContents.paste(); } },
            { label: 'Select All', accelerator: 'CmdOrCtrl+A', click: () => { App.mainWindow.webContents.selectAll(); } },
            new electron_1.MenuItem({ type: 'separator' }),
            { label: 'Confirm Edit', accelerator: 'Alt+Enter', click: () => { App.saveEdits(); } },
            { label: 'Cancel Edit', accelerator: 'Esc', click: () => { App.cancelEdit(); } },
            new electron_1.MenuItem({ type: 'separator' }),
            { label: 'Replace Text...', accelerator: 'CmdOrCtrl+F', click: () => { App.replaceText(); } },
            new electron_1.MenuItem({ type: 'separator' }),
            { label: 'Insert Unit', click: () => { App.insertUnit(); } },
            { label: 'Delete Selected Units', click: () => { App.requestDeleteUnits(); } }
        ]);
        var viewMenu = electron_1.Menu.buildFromTemplate([
            { label: 'Sort Units', accelerator: 'F5', click: () => { App.sortUnits(); } },
            { label: 'Filter Units', accelerator: 'F3', click: () => { App.showFilters(); } },
            new electron_1.MenuItem({ type: 'separator' }),
            { label: 'First Page', accelerator: 'CmdOrCtrl+Shift+PageUp', click: () => { App.firstPage(); } },
            { label: 'Previous Page', accelerator: 'CmdOrCtrl+PageUp', click: () => { App.previousPage(); } },
            { label: 'Next Page', accelerator: 'CmdOrCtrl+PageDown', click: () => { App.nextPage(); } },
            { label: 'Last Page', accelerator: 'CmdOrCtrl+Shift+PageDown', click: () => { App.lastPage(); } },
            new electron_1.MenuItem({ type: 'separator' }),
            new electron_1.MenuItem({ label: 'Toggle Full Screen', role: 'togglefullscreen' }),
            new electron_1.MenuItem({ label: 'Toggle Development Tools', accelerator: 'F12', role: 'toggleDevTools' })
        ]);
        var tasksMenu = electron_1.Menu.buildFromTemplate([
            { label: 'Change Language...', click: () => { App.changeLanguageCode(); } },
            { label: 'Add Language...', click: () => { App.showAddLanguage(); } },
            { label: 'Remove Language...', click: () => { App.showRemoveLanguage(); } },
            { label: 'Change Source Language...', click: () => { App.showChangeSourceLanguage(); } },
            new electron_1.MenuItem({ type: 'separator' }),
            { label: 'Maintenace Dashboard', click: () => { App.showMaintenanceDashboard(); } },
            new electron_1.MenuItem({ type: 'separator' }),
            { label: 'Remove All Tags', click: () => { App.removeTags(); } },
            { label: 'Remove Duplicates', click: () => { App.removeDuplicates(); } },
            { label: 'Remove Untranslated...', click: () => { App.showRemoveUntranslated(); } },
            { label: 'Remove Translation Same as Source...', click: () => { App.showRemoveSameAsSource(); } },
            { label: 'Remove Initial/Trailing Spaces', click: () => { App.removeSpaces(); } },
            { label: 'Consolidate Units...', click: () => { App.showConsolidateUnits(); } }
        ]);
        var helpMenu = electron_1.Menu.buildFromTemplate([
            { label: 'TMXEditor User Guide', accelerator: 'F1', click: () => { App.showHelp(); } },
            new electron_1.MenuItem({ type: 'separator' }),
            { label: 'Check for Updates...', click: () => { App.checkUpdates(false); } },
            { label: 'View Licenses', click: () => { App.showLicenses({ from: 'menu' }); } },
            new electron_1.MenuItem({ type: 'separator' }),
            { label: 'Release History', click: () => { App.showReleaseHistory(); } },
            { label: 'Support Group', click: () => { App.showSupportGroup(); } }
        ]);
        var template = [
            new electron_1.MenuItem({ label: '&File', role: 'fileMenu', submenu: fileMenu }),
            new electron_1.MenuItem({ label: '&Edit', role: 'editMenu', submenu: editMenu }),
            new electron_1.MenuItem({ label: '&View', role: 'viewMenu', submenu: viewMenu }),
            new electron_1.MenuItem({ label: '&Tasks', submenu: tasksMenu }),
            new electron_1.MenuItem({ label: '&Help', role: 'help', submenu: helpMenu })
        ];
        if (process.platform === 'darwin') {
            var appleMenu = electron_1.Menu.buildFromTemplate([
                new electron_1.MenuItem({ label: 'About...', click: () => { App.showAbout(); } }),
                new electron_1.MenuItem({
                    label: 'Preferences...', submenu: [
                        { label: 'Settings', accelerator: 'Cmd+,', click: () => { App.showSettings(); } }
                    ]
                }),
                new electron_1.MenuItem({ type: 'separator' }),
                new electron_1.MenuItem({
                    label: 'Services', role: 'services', submenu: [
                        { label: 'No Services Apply', enabled: false }
                    ]
                }),
                new electron_1.MenuItem({ type: 'separator' }),
                new electron_1.MenuItem({ label: 'Quit TMXEditor', accelerator: 'Cmd+Q', role: 'quit', click: () => { App.close(); } })
            ]);
            template.unshift(new electron_1.MenuItem({ label: 'TMXEditor', role: 'appMenu', submenu: appleMenu }));
        }
        else {
            var help = template.pop();
            template.push(new electron_1.MenuItem({
                label: '&Settings', submenu: [
                    { label: 'Preferences', click: () => { App.showSettings(); } }
                ]
            }));
            template.push(help);
        }
        if (!(0, fs_1.existsSync)(App.path.join(electron_1.app.getPath('appData'), electron_1.app.name, 'recent.json'))) {
            (0, fs_1.writeFile)(App.path.join(electron_1.app.getPath('appData'), electron_1.app.name, 'recent.json'), '{"files" : []}', (err) => {
                if (err) {
                    App.showMessage({ type: 'error', message: err.message });
                    return;
                }
            });
        }
        (0, fs_1.readFile)(App.path.join(electron_1.app.getPath('appData'), electron_1.app.name, 'recent.json'), (err, buf) => {
            if (err instanceof Error) {
                electron_1.Menu.setApplicationMenu(electron_1.Menu.buildFromTemplate(template));
                return;
            }
            var jsonData = JSON.parse(buf.toString());
            var files = jsonData.files;
            if (files !== undefined && files.length > 0) {
                if (process.platform === 'darwin') {
                    template[1].submenu.append(new electron_1.MenuItem({ type: 'separator' }));
                }
                else {
                    template[0].submenu.append(new electron_1.MenuItem({ type: 'separator' }));
                }
                for (let i = 0; i < files.length; i++) {
                    var file = files[i];
                    if ((0, fs_1.existsSync)(file)) {
                        if (process.platform === 'darwin') {
                            template[1].submenu.append(new electron_1.MenuItem({ label: file, click: () => { App.openFile(files[i]); } }));
                        }
                        else {
                            template[0].submenu.append(new electron_1.MenuItem({ label: file, click: () => { App.openFile(files[i]); } }));
                        }
                    }
                }
            }
            if (process.platform == 'win32') {
                template[0].submenu.append(new electron_1.MenuItem({ type: 'separator' }));
                template[0].submenu.append(new electron_1.MenuItem({ label: 'Exit', accelerator: 'Alt+F4', role: 'quit', click: () => { App.close(); } }));
                template[5].submenu.append(new electron_1.MenuItem({ type: 'separator' }));
                template[5].submenu.append(new electron_1.MenuItem({ label: 'About...', click: () => { App.showAbout(); } }));
            }
            if (process.platform === 'linux') {
                template[0].submenu.append(new electron_1.MenuItem({ type: 'separator' }));
                template[0].submenu.append(new electron_1.MenuItem({ label: 'Quit', accelerator: 'Ctrl+Q', role: 'quit', click: () => { App.close(); } }));
                template[5].submenu.append(new electron_1.MenuItem({ type: 'separator' }));
                template[5].submenu.append(new electron_1.MenuItem({ label: 'About...', click: () => { App.showAbout(); } }));
            }
            electron_1.Menu.setApplicationMenu(electron_1.Menu.buildFromTemplate(template));
        });
    }
    static close() {
        if (App.currentFile !== '' && !App.saved) {
            let clicked = electron_1.dialog.showMessageBoxSync(App.mainWindow, {
                type: 'question',
                title: 'Save changes?',
                message: 'Your changes  will be lost if you don\'t save them',
                buttons: ['Don\'t Save', 'Cancel', 'Save'],
                defaultId: 2
            });
            if (clicked === 0) {
                App.saved = true;
            }
            if (clicked === 1) {
                return;
            }
            if (clicked === 2) {
                App.shouldQuit = true;
                App.saveFile();
                return;
            }
        }
        App.mainWindow.removeAllListeners();
        App.mainWindow.close();
    }
    static showAbout() {
        App.aboutWindow = new electron_1.BrowserWindow({
            parent: App.mainWindow,
            width: 620,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: App.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        App.aboutWindow.setMenu(null);
        App.aboutWindow.loadURL('file://' + App.path.join(electron_1.app.getAppPath(), 'html', 'about.html'));
        App.aboutWindow.once('ready-to-show', () => {
            App.aboutWindow.show();
        });
        App.aboutWindow.on('close', () => {
            App.mainWindow.focus();
        });
        App.setLocation(App.aboutWindow, 'about.html');
    }
    static sendRequest(params, success, error) {
        let options = {
            url: 'http://127.0.0.1:8060/TMXServer',
            method: 'POST'
        };
        let request = electron_1.net.request(options);
        let responseData = '';
        request.setHeader('Content-Type', 'application/json');
        request.setHeader('Accept', 'application/json');
        request.on('response', (response) => {
            response.on('error', (e) => {
                error(e.message);
            });
            response.on('aborted', () => {
                error('Request aborted');
            });
            response.on('end', () => {
                try {
                    let json = JSON.parse(responseData);
                    success(json);
                }
                catch (reason) {
                    error(JSON.stringify(reason));
                }
            });
            response.on('data', (chunk) => {
                responseData += chunk.toString();
            });
        });
        request.write(JSON.stringify(params));
        request.end();
    }
    static showSystemInfo() {
        this.systemInfoWindow = new electron_1.BrowserWindow({
            parent: App.aboutWindow,
            width: 430,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: this.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        this.systemInfoWindow.setMenu(null);
        this.systemInfoWindow.loadURL('file://' + this.path.join(electron_1.app.getAppPath(), 'html', 'systemInfo.html'));
        this.systemInfoWindow.once('ready-to-show', () => {
            this.systemInfoWindow.show();
        });
        this.systemInfoWindow.on('close', () => {
            App.aboutWindow.focus();
        });
        App.setLocation(App.systemInfoWindow, 'systemInfo.html');
    }
    static getSystemInformation(event) {
        this.sendRequest({ command: 'systemInfo' }, (data) => {
            data.electron = process.versions.electron;
            event.sender.send('set-system-info', data);
        }, (reason) => {
            App.showMessage({ type: 'error', message: reason });
        });
    }
    static showLicenses(arg) {
        let parent = App.mainWindow;
        if (arg.from === 'about' && App.aboutWindow) {
            parent = App.aboutWindow;
        }
        App.licensesWindow = new electron_1.BrowserWindow({
            parent: parent,
            width: 450,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: App.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        App.licensesWindow.setMenu(null);
        App.licensesWindow.loadURL('file://' + App.path.join(electron_1.app.getAppPath(), 'html', 'licenses.html'));
        App.licensesWindow.once('ready-to-show', () => {
            App.licensesWindow.show();
        });
        App.licensesWindow.on('close', () => {
            parent.focus();
        });
        App.setLocation(App.licensesWindow, 'licenses.html');
    }
    static openLicense(arg) {
        var licenseFile = '';
        var title = '';
        switch (arg.type) {
            case 'TMXEditor':
                licenseFile = 'file://' + App.path.join(electron_1.app.getAppPath(), 'html', 'licenses', 'EclipsePublicLicense1.0.html');
                title = 'Eclipse Public License 1.0';
                break;
            case "electron":
                licenseFile = 'file://' + App.path.join(electron_1.app.getAppPath(), 'html', 'licenses', 'electron.txt');
                title = 'MIT License';
                break;
            case "TypeScript":
            case "MapDB":
                licenseFile = 'file://' + App.path.join(electron_1.app.getAppPath(), 'html', 'licenses', 'Apache2.0.html');
                title = 'Apache 2.0';
                break;
            case "Java":
                licenseFile = 'file://' + App.path.join(electron_1.app.getAppPath(), 'html', 'licenses', 'java.html');
                title = 'GPL2 with Classpath Exception';
                break;
            case "OpenXLIFF":
            case "TMXValidator":
            case "H2":
                licenseFile = 'file://' + App.path.join(electron_1.app.getAppPath(), 'html', 'licenses', 'EclipsePublicLicense1.0.html');
                title = 'Eclipse Public License 1.0';
                break;
            case "JSON":
                licenseFile = 'file://' + App.path.join(electron_1.app.getAppPath(), 'html', 'licenses', 'json.txt');
                title = 'JSON.org License';
                break;
            case "jsoup":
                licenseFile = 'file://' + App.path.join(electron_1.app.getAppPath(), 'html', 'licenses', 'jsoup.txt');
                title = 'MIT License';
                break;
            case "DTDParser":
                licenseFile = 'file://' + App.path.join(electron_1.app.getAppPath(), 'html', 'licenses', 'LGPL2.1.txt');
                title = 'LGPL 2.1';
                break;
            default:
                App.showMessage({ type: 'error', message: 'Unknown license' });
                return;
        }
        var licenseWindow = new electron_1.BrowserWindow({
            parent: App.licensesWindow,
            width: 680,
            height: 400,
            show: false,
            title: title,
            icon: App.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        licenseWindow.setMenu(null);
        licenseWindow.loadURL(licenseFile);
        licenseWindow.once('ready-to-show', () => {
            licenseWindow.show();
        });
        licenseWindow.webContents.on('did-finish-load', () => {
            (0, fs_1.readFile)(App.currentCss.substring('file://'.length), (error, data) => {
                if (!error) {
                    licenseWindow.webContents.insertCSS(data.toString());
                }
            });
        });
        licenseWindow.on('close', () => {
            App.licensesWindow.focus();
        });
        App.setLocation(licenseWindow, 'license.html');
    }
    static showHelp() {
        electron_1.shell.openExternal('file://' + App.path.join(electron_1.app.getAppPath(), 'tmxeditor.pdf'), { activate: true, workingDirectory: electron_1.app.getAppPath() }).catch((error) => {
            App.showMessage({ type: 'error', message: error.message });
        });
    }
    static openFileDialog() {
        electron_1.dialog.showOpenDialog({
            title: 'Open TMX File',
            properties: ['openFile'],
            filters: [
                { name: 'TMX File', extensions: ['tmx'] },
                { name: 'Any File', extensions: ['*'] }
            ]
        }).then((value) => {
            if (!value.canceled) {
                App.openFile(value.filePaths[0]);
                App.saveRecent(value.filePaths[0]);
            }
        }).catch((error) => {
            App.showMessage({ type: 'error', message: error.message });
            console.log(error);
        });
    }
    static openFile(file) {
        App.mainWindow.webContents.send('start-waiting');
        App.mainWindow.webContents.send('set-status', 'Opening file...');
        App.sendRequest({ command: 'openFile', file: file }, (data) => {
            App.currentStatus = data;
            var intervalObject = setInterval(() => {
                if (App.currentStatus.status === COMPLETED) {
                    clearInterval(intervalObject);
                    App.getFileLanguages();
                    App.filterOptions = {};
                    App.sortOptions = {};
                    App.mainWindow.webContents.send('file-loaded', App.currentStatus);
                    App.currentFile = file;
                    App.mainWindow.setTitle(App.currentFile);
                    App.saved = true;
                    App.mainWindow.setDocumentEdited(false);
                    App.mainWindow.webContents.send('end-waiting');
                    return;
                }
                else if (App.currentStatus.status === LOADING) {
                    // it's OK, keep waiting
                    App.mainWindow.webContents.send('status-changed', App.currentStatus);
                }
                else if (App.currentStatus.status === ERROR) {
                    App.mainWindow.webContents.send('end-waiting');
                    App.mainWindow.webContents.send('set-status', '');
                    clearInterval(intervalObject);
                    App.showMessage({ type: 'error', message: App.currentStatus.reason });
                    return;
                }
                else if (App.currentStatus.status === SUCCESS) {
                    // ignore status from 'openFile'
                }
                else {
                    App.mainWindow.webContents.send('end-waiting');
                    clearInterval(intervalObject);
                    electron_1.dialog.showErrorBox('Error', 'Unknown error loading file');
                    return;
                }
                App.getLoadingProgress();
            }, 500);
        }, (reason) => {
            App.mainWindow.webContents.send('end-waiting');
            App.showMessage({ type: 'error', message: reason });
        });
    }
    static getLoadingProgress() {
        App.sendRequest({ command: 'loadingProgress' }, (data) => {
            App.currentStatus = data;
        }, (reason) => {
            console.log(reason);
        });
    }
    static closeFile() {
        if (App.currentFile === '') {
            return;
        }
        if (!App.saved) {
            let clicked = electron_1.dialog.showMessageBoxSync(App.mainWindow, {
                type: 'question',
                title: 'Save changes?',
                message: 'Your changes  will be lost if you don\'t save them',
                buttons: ['Don\'t Save', 'Cancel', 'Save'],
                defaultId: 2
            });
            if (clicked === 0) {
                App.saved = true;
                App.mainWindow.setDocumentEdited(false);
            }
            if (clicked === 1) {
                return;
            }
            if (clicked === 2) {
                App.shouldClose = true;
                App.saveFile();
                return;
            }
        }
        App.mainWindow.webContents.send('set-status', 'Closing file...');
        App.mainWindow.webContents.send('start-waiting');
        App.sendRequest({ command: 'closeFile' }, (data) => {
            App.mainWindow.webContents.send('end-waiting');
            if (data.status === SUCCESS) {
                App.mainWindow.webContents.send('file-closed');
                App.mainWindow.webContents.send('set-status', '');
                App.currentFile = '';
                App.mainWindow.setTitle('TMXEditor');
                App.saved = true;
                App.mainWindow.setDocumentEdited(false);
            }
            else {
                App.showMessage({ type: 'error', message: data.reason });
            }
        }, (reason) => {
            App.mainWindow.webContents.send('end-waiting');
            App.showMessage({ type: 'error', message: reason });
        });
    }
    static getFileLanguages() {
        App.mainWindow.webContents.send('set-status', 'Getting languages...');
        App.sendRequest({ command: 'getLanguages' }, (data) => {
            App.mainWindow.webContents.send('set-status', '');
            if (data.status === SUCCESS) {
                App.fileLanguages = data.languages;
                App.mainWindow.webContents.send('update-languages', App.fileLanguages);
            }
            else {
                App.showMessage({ type: 'error', message: data.reason });
            }
        }, (reason) => {
            App.mainWindow.webContents.send('set-status', '');
            App.showMessage({ type: 'error', message: reason });
        });
    }
    static saveDefaults() {
        var defaults = App.mainWindow.getBounds();
        (0, fs_1.writeFileSync)(App.path.join(electron_1.app.getPath('appData'), electron_1.app.name, 'defaults.json'), JSON.stringify(defaults));
    }
    static loadSegments() {
        if (App.currentFile === '') {
            return;
        }
        var json = {
            command: 'getSegments'
        };
        Object.assign(json, App.loadOptions);
        Object.assign(json, App.filterOptions);
        Object.assign(json, App.sortOptions);
        App.mainWindow.webContents.send('start-waiting');
        App.mainWindow.webContents.send('set-status', 'Loading segments...');
        App.sendRequest(json, (data) => {
            App.mainWindow.webContents.send('set-status', '');
            App.mainWindow.webContents.send('end-waiting');
            if (data.status === SUCCESS) {
                App.mainWindow.webContents.send('update-segments', data);
            }
            else {
                App.showMessage({ type: 'error', message: data.reason });
            }
        }, (reason) => {
            App.mainWindow.webContents.send('end-waiting');
            App.showMessage({ type: 'error', message: reason });
        });
    }
    static loadDefaults() {
        App.currentDefaults = { width: 950, height: 700, x: 0, y: 0 };
        if ((0, fs_1.existsSync)(App.path.join(electron_1.app.getPath('appData'), electron_1.app.name, 'defaults.json'))) {
            try {
                var data = (0, fs_1.readFileSync)(App.path.join(electron_1.app.getPath('appData'), electron_1.app.name, 'defaults.json'));
                App.currentDefaults = JSON.parse(data.toString());
            }
            catch (err) {
                console.log(err);
            }
        }
    }
    static savePreferences() {
        (0, fs_1.writeFileSync)(App.path.join(electron_1.app.getPath('appData'), electron_1.app.name, 'preferences.json'), JSON.stringify(App.currentPreferences));
    }
    static loadPreferences() {
        App.currentPreferences = { theme: 'system', indentation: 2, threshold: 200 };
        let dark = 'file://' + App.path.join(electron_1.app.getAppPath(), 'css', 'dark.css');
        let light = 'file://' + App.path.join(electron_1.app.getAppPath(), 'css', 'light.css');
        let preferencesFile = App.path.join(electron_1.app.getPath('appData'), electron_1.app.name, 'preferences.json');
        if (!(0, fs_1.existsSync)(preferencesFile)) {
            this.savePreferences();
        }
        try {
            var data = (0, fs_1.readFileSync)(preferencesFile);
            App.currentPreferences = JSON.parse(data.toString());
        }
        catch (err) {
            console.log(err);
        }
        if (App.currentPreferences.theme === 'system') {
            if (electron_1.nativeTheme.shouldUseDarkColors) {
                App.currentCss = dark;
            }
            else {
                App.currentCss = light;
            }
        }
        if (App.currentPreferences.theme === 'dark') {
            App.currentCss = dark;
        }
        if (App.currentPreferences.theme === 'light') {
            App.currentCss = light;
        }
    }
    static saveRecent(file) {
        (0, fs_1.readFile)(App.path.join(electron_1.app.getPath('appData'), electron_1.app.name, 'recent.json'), (err, data) => {
            if (err instanceof Error) {
                return;
            }
            var jsonData = JSON.parse(data.toString());
            jsonData.files = jsonData.files.filter((f) => {
                return f !== file;
            });
            jsonData.files.unshift(file);
            if (jsonData.files.length > 8) {
                jsonData.files = jsonData.files.slice(0, 8);
            }
            (0, fs_1.writeFile)(App.path.join(electron_1.app.getPath('appData'), electron_1.app.name, 'recent.json'), JSON.stringify(jsonData), (error) => {
                if (error) {
                    App.showMessage({ type: 'error', message: error.message });
                    return;
                }
            });
        });
        electron_1.app.addRecentDocument(file);
    }
    static getCellProperties(id, lang) {
        App.mainWindow.webContents.send('start-waiting');
        App.sendRequest({ command: 'getTuvData', id: id, lang: lang }, (data) => {
            App.mainWindow.webContents.send('end-waiting');
            data.type = lang;
            App.mainWindow.webContents.send('update-properties', data);
        }, (reason) => {
            App.mainWindow.webContents.send('end-waiting');
            App.showMessage({ type: 'error', message: reason });
        });
    }
    static getRowProperties(id) {
        App.mainWindow.webContents.send('start-waiting');
        App.sendRequest({ command: 'getTuData', id: id }, (data) => {
            App.mainWindow.webContents.send('end-waiting');
            data.type = 'TU';
            App.mainWindow.webContents.send('update-properties', data);
        }, (reason) => {
            App.mainWindow.webContents.send('end-waiting');
            App.showMessage({ type: 'error', message: reason });
        });
    }
    editAttributes(arg) {
        App.attributesWindow = new electron_1.BrowserWindow({
            parent: App.mainWindow,
            width: 670,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: App.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        App.attributesArg = arg;
        App.attributesWindow.setMenu(null);
        App.attributesWindow.loadURL('file://' + App.path.join(electron_1.app.getAppPath(), 'html', 'attributes.html'));
        App.attributesWindow.once('ready-to-show', () => {
            App.attributesWindow.show();
        });
        App.attributesWindow.on('close', () => {
            App.mainWindow.focus();
        });
        App.setLocation(App.attributesWindow, 'attributes.html');
    }
    saveAttributes(arg) {
        App.mainWindow.webContents.send('start-waiting');
        App.destroyWindow(App.attributesWindow);
        arg.command = 'setAttributes';
        App.sendRequest(arg, (data) => {
            App.mainWindow.webContents.send('end-waiting');
            if (data.status === SUCCESS) {
                if (arg.lang === '') {
                    App.getRowProperties(arg.id);
                }
                else {
                    App.getCellProperties(arg.id, arg.lang);
                }
                App.saved = false;
                App.mainWindow.setDocumentEdited(true);
            }
            else {
                App.mainWindow.webContents.send('end-waiting');
                App.showMessage({ type: 'error', message: data.reason });
            }
        }, (reason) => {
            App.mainWindow.webContents.send('end-waiting');
            App.showMessage({ type: 'error', message: reason });
        });
    }
    editProperties(arg) {
        App.propertiesWindow = new electron_1.BrowserWindow({
            parent: App.mainWindow,
            width: 500,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: App.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        App.propertiesArg = arg;
        App.propertiesWindow.setMenu(null);
        App.propertiesWindow.loadURL('file://' + App.path.join(electron_1.app.getAppPath(), 'html', 'properties.html'));
        App.propertiesWindow.once('ready-to-show', () => {
            App.propertiesWindow.show();
        });
        App.propertiesWindow.on('close', () => {
            App.mainWindow.focus();
        });
        App.setLocation(App.propertiesWindow, 'properties.html');
    }
    static showAddProperty(event) {
        App.propertyEvent = event;
        App.addPropertyWindow = new electron_1.BrowserWindow({
            parent: App.propertiesWindow,
            width: 350,
            minimizable: false,
            maximizable: false,
            resizable: false,
            modal: true,
            show: false,
            icon: App.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        App.addPropertyWindow.setMenu(null);
        App.addPropertyWindow.loadURL('file://' + App.path.join(electron_1.app.getAppPath(), 'html', 'addProperty.html'));
        App.addPropertyWindow.once('ready-to-show', () => {
            App.addPropertyWindow.show();
        });
        App.addPropertyWindow.on('close', () => {
            App.propertiesWindow.focus();
        });
        App.setLocation(App.addPropertyWindow, 'addProperty.html');
    }
    addNewProperty(arg) {
        App.destroyWindow(App.addPropertyWindow);
        App.propertyEvent.sender.send('set-new-property', arg);
    }
    saveProperties(arg) {
        App.mainWindow.webContents.send('start-waiting');
        App.destroyWindow(App.propertiesWindow);
        arg.command = 'setProperties';
        App.sendRequest(arg, (data) => {
            App.mainWindow.webContents.send('end-waiting');
            if (data.status === SUCCESS) {
                if (arg.lang === '') {
                    App.getRowProperties(arg.id);
                }
                else {
                    App.getCellProperties(arg.id, arg.lang);
                }
                App.saved = false;
                App.mainWindow.setDocumentEdited(true);
            }
            else {
                App.mainWindow.webContents.send('end-waiting');
                App.showMessage({ type: 'error', message: data.reason });
            }
        }, (reason) => {
            App.mainWindow.webContents.send('end-waiting');
            App.showMessage({ type: 'error', message: reason });
        });
    }
    static editNotes(arg) {
        App.notesWindow = new electron_1.BrowserWindow({
            parent: App.mainWindow,
            width: 500,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: App.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        App.notesArg = arg;
        App.notesWindow.setMenu(null);
        App.notesWindow.loadURL('file://' + App.path.join(electron_1.app.getAppPath(), 'html', 'notes.html'));
        App.notesWindow.once('ready-to-show', () => {
            App.notesWindow.show();
        });
        App.notesWindow.on('close', () => {
            App.mainWindow.focus();
        });
        App.setLocation(App.notesWindow, 'notes.html');
    }
    showAddNote(event) {
        App.notesEvent = event;
        App.addNotesWindow = new electron_1.BrowserWindow({
            parent: App.notesWindow,
            width: 350,
            minimizable: false,
            maximizable: false,
            resizable: false,
            modal: true,
            show: false,
            icon: App.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        App.addNotesWindow.setMenu(null);
        App.addNotesWindow.loadURL('file://' + App.path.join(electron_1.app.getAppPath(), 'html', 'addNote.html'));
        App.addNotesWindow.once('ready-to-show', () => {
            App.addNotesWindow.show();
        });
        App.addNotesWindow.on('close', () => {
            App.notesWindow.focus();
        });
        App.setLocation(App.addNotesWindow, 'addNote.html');
    }
    addNewNote(arg) {
        App.destroyWindow(App.addNotesWindow);
        App.notesEvent.sender.send('set-new-note', arg);
    }
    saveNotes(arg) {
        App.mainWindow.webContents.send('start-waiting');
        App.destroyWindow(App.notesWindow);
        arg.command = 'setNotes';
        App.sendRequest(arg, (data) => {
            App.mainWindow.webContents.send('end-waiting');
            if (data.status === SUCCESS) {
                if (arg.lang === '') {
                    App.getRowProperties(arg.id);
                }
                else {
                    App.getCellProperties(arg.id, arg.lang);
                }
                App.saved = false;
                App.mainWindow.setDocumentEdited(true);
            }
            else {
                App.mainWindow.webContents.send('end-waiting');
                App.showMessage({ type: 'error', message: data.reason });
            }
        }, (reason) => {
            App.mainWindow.webContents.send('end-waiting');
            App.showMessage({ type: 'error', message: reason });
        });
    }
    static showSettings() {
        App.settingsWindow = new electron_1.BrowserWindow({
            parent: App.mainWindow,
            width: 450,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: App.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        App.settingsWindow.setMenu(null);
        App.settingsWindow.loadURL('file://' + App.path.join(electron_1.app.getAppPath(), 'html', 'preferences.html'));
        App.settingsWindow.once('ready-to-show', () => {
            App.settingsWindow.show();
        });
        App.settingsWindow.on('close', () => {
            App.mainWindow.focus();
        });
        App.setLocation(App.settingsWindow, 'preferences.html');
    }
    static setTheme() {
        App.mainWindow.webContents.send('request-theme');
    }
    static createNewFile() {
        App.newFileWindow = new electron_1.BrowserWindow({
            parent: App.mainWindow,
            width: 480,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: App.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        App.newFileWindow.setMenu(null);
        App.newFileWindow.loadURL('file://' + App.path.join(electron_1.app.getAppPath(), 'html', 'newFile.html'));
        App.newFileWindow.once('ready-to-show', () => {
            App.newFileWindow.show();
        });
        App.newFileWindow.on('close', () => {
            App.mainWindow.focus();
        });
        App.setLocation(App.newFileWindow, 'newFile.html');
    }
    createFile(arg) {
        App.destroyWindow(App.newFileWindow);
        if (App.currentFile !== '' && !App.saved) {
            let response = electron_1.dialog.showMessageBoxSync(App.mainWindow, { type: 'question', message: 'Save changes?', buttons: ['Yes', 'No'] });
            if (response === 0) {
                App.saveFile();
            }
        }
        arg.command = 'createFile';
        App.sendRequest(arg, (data) => {
            if (data.status === SUCCESS) {
                App.openFile(data.path);
                App.needsName = true;
            }
            else {
                App.showMessage({ type: 'error', message: data.reason });
            }
        }, (reason) => {
            App.showMessage({ type: 'error', message: reason });
        });
    }
    static saveFile() {
        if (App.currentFile === '') {
            return;
        }
        if (App.needsName) {
            App.saveAs();
            return;
        }
        App.sendRequest({ command: 'saveFile', file: App.currentFile }, (data) => {
            App.currentStatus = data;
            App.mainWindow.webContents.send('set-status', 'Saving...');
            var intervalObject = setInterval(() => {
                if (App.currentStatus.status === COMPLETED) {
                    App.mainWindow.webContents.send('end-waiting');
                    App.mainWindow.webContents.send('set-status', '');
                    clearInterval(intervalObject);
                    App.saved = true;
                    App.mainWindow.setDocumentEdited(false);
                    if (App.shouldClose) {
                        App.shouldClose = false;
                        App.closeFile();
                    }
                    if (App.shouldQuit) {
                        App.close();
                    }
                    return;
                }
                else if (App.currentStatus.status === SAVING) {
                    // it's OK, keep waiting
                }
                else if (App.currentStatus.status === ERROR) {
                    App.mainWindow.webContents.send('end-waiting');
                    App.mainWindow.webContents.send('set-status', '');
                    clearInterval(intervalObject);
                    App.showMessage({ type: 'error', message: App.currentStatus.reason });
                    return;
                }
                else if (App.currentStatus.status === SUCCESS) {
                    // ignore status from 'saveFile'
                }
                else {
                    App.mainWindow.webContents.send('end-waiting');
                    App.mainWindow.webContents.send('set-status', '');
                    clearInterval(intervalObject);
                    electron_1.dialog.showErrorBox('Error', 'Unknown error saving file');
                    return;
                }
                App.getSavingProgress();
            }, 500);
        }, (reason) => {
            App.showMessage({ type: 'error', message: reason });
        });
    }
    static getSavingProgress() {
        App.sendRequest({ command: 'savingProgress' }, (data) => {
            App.currentStatus = data;
        }, (reason) => {
            console.log(reason);
        });
    }
    static saveAs() {
        electron_1.dialog.showSaveDialog({
            title: 'Save TMX File',
            properties: ['showOverwriteConfirmation', 'createDirectory'],
            filters: [
                { name: 'TMX File', extensions: ['tmx'] },
                { name: 'Any File', extensions: ['*'] }
            ]
        }).then((value) => {
            if (!value.canceled) {
                App.currentFile = value.filePath;
                App.needsName = false;
                App.saveFile();
                App.mainWindow.setTitle(App.currentFile);
                App.saveRecent(App.currentFile);
                App.saved = true;
                App.mainWindow.setDocumentEdited(false);
            }
        }).catch((error) => {
            App.showMessage({ type: 'error', message: error.message });
        });
    }
    static convertCSV() {
        App.convertCsvWindow = new electron_1.BrowserWindow({
            parent: App.mainWindow,
            width: 700,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: App.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        App.convertCsvWindow.setMenu(null);
        App.convertCsvWindow.loadURL('file://' + App.path.join(electron_1.app.getAppPath(), 'html', 'convertCSV.html'));
        App.convertCsvWindow.once('ready-to-show', () => {
            App.convertCsvWindow.show();
        });
        App.convertCsvWindow.on('close', () => {
            App.mainWindow.focus();
        });
        App.setLocation(App.convertCsvWindow, 'convertCSV.html');
    }
    static convertExcel() {
        App.convertExcelWindow = new electron_1.BrowserWindow({
            parent: App.mainWindow,
            width: 700,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: App.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        App.convertExcelWindow.setMenu(null);
        App.convertExcelWindow.loadURL('file://' + App.path.join(electron_1.app.getAppPath(), 'html', 'convertExcel.html'));
        App.convertExcelWindow.once('ready-to-show', () => {
            App.convertExcelWindow.show();
        });
        App.convertExcelWindow.on('close', () => {
            App.mainWindow.focus();
        });
        App.setLocation(App.convertExcelWindow, 'convertExcel.html');
    }
    convertCsvTmx(arg) {
        App.destroyWindow(App.convertCsvWindow);
        arg.command = 'convertCsv';
        App.sendRequest(arg, (data) => {
            if (data.status === SUCCESS) {
                if (arg.openTMX) {
                    if (App.currentFile !== '') {
                        App.closeFile();
                    }
                    App.openFile(arg.tmxFile);
                }
                else {
                    App.showMessage({ type: 'info', message: 'File converted' });
                }
            }
            else {
                App.showMessage({ type: 'error', message: data.reason });
            }
        }, (reason) => {
            App.showMessage({ type: 'error', message: reason });
        });
    }
    convertExcelTmx(arg) {
        App.destroyWindow(App.convertExcelWindow);
        arg.command = 'convertExcel';
        App.sendRequest(arg, (data) => {
            if (data.status === SUCCESS) {
                if (arg.openTMX) {
                    if (App.currentFile !== '') {
                        App.closeFile();
                    }
                    App.openFile(arg.tmxFile);
                }
                else {
                    App.showMessage({ type: 'info', message: 'File converted' });
                }
            }
            else {
                App.showMessage({ type: 'error', message: data.reason });
            }
        }, (reason) => {
            App.showMessage({ type: 'error', message: reason });
        });
    }
    getCharsets(event) {
        App.sendRequest({ command: 'getCharsets' }, (data) => {
            if (data.status === SUCCESS) {
                event.sender.send('set-charsets', data.charsets);
            }
            else {
                App.showMessage({ type: 'error', message: data.reason });
            }
        }, (reason) => {
            App.showMessage({ type: 'error', message: reason });
        });
    }
    getCsvPreview(event, arg) {
        arg.command = 'previewCsv';
        App.sendRequest(arg, (data) => {
            if (data.status === SUCCESS) {
                event.sender.send('set-preview', data);
            }
            else {
                App.showMessage({ type: 'error', message: data.reason });
            }
        }, (reason) => {
            App.showMessage({ type: 'error', message: reason });
        });
    }
    getExcelPreview(event, arg) {
        arg.command = 'previewExcel';
        App.sendRequest(arg, (data) => {
            if (data.status === SUCCESS) {
                event.sender.send('set-preview', data.sheets);
            }
            else {
                App.showMessage({ type: 'error', message: data.reason });
            }
        }, (reason) => {
            App.showMessage({ type: 'error', message: reason });
        });
    }
    getCsvFile(event) {
        electron_1.dialog.showOpenDialog({
            title: 'Open CSV/Text File',
            properties: ['openFile'],
            filters: [
                { name: 'CSV/Text File', extensions: ['csv', 'txt'] },
                { name: 'Any File', extensions: ['*'] }
            ]
        }).then((value) => {
            if (!value.canceled) {
                event.sender.send('set-csvfile', value.filePaths[0]);
            }
        }).catch((error) => {
            App.showMessage({ type: 'error', message: error.message });
        });
    }
    getExcelFile(event) {
        electron_1.dialog.showOpenDialog({
            title: 'Open Excel File',
            properties: ['openFile'],
            filters: [
                { name: 'Excel File', extensions: ['xlsx'] },
                { name: 'Any File', extensions: ['*'] }
            ]
        }).then((value) => {
            if (!value.canceled) {
                event.sender.send('set-excelfile', value.filePaths[0]);
            }
        }).catch((error) => {
            App.showMessage({ type: 'error', message: error.message });
        });
    }
    getConvertedTMX(event, arg) {
        electron_1.dialog.showSaveDialog({
            title: 'Converted TMX File',
            defaultPath: arg.default,
            properties: ['showOverwriteConfirmation', 'createDirectory'],
            filters: [
                { name: 'TMX File', extensions: ['tmx'] },
                { name: 'Any File', extensions: ['*'] }
            ]
        }).then((value) => {
            if (!value.canceled) {
                event.sender.send('converted-tmx-file', value.filePath);
            }
        }).catch((error) => {
            App.showMessage({ type: 'error', message: error.message });
        });
    }
    getCsvLanguages(event, arg) {
        App.csvEvent = event;
        App.csvLangArgs = arg;
        App.csvLanguagesWindow = new electron_1.BrowserWindow({
            parent: App.convertCsvWindow,
            modal: false,
            width: 520,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: App.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        App.csvLanguagesWindow.setMenu(null);
        App.csvLanguagesWindow.loadURL('file://' + App.path.join(electron_1.app.getAppPath(), 'html', 'csvLanguages.html'));
        App.csvLanguagesWindow.once('ready-to-show', () => {
            App.csvLanguagesWindow.show();
        });
        App.csvLanguagesWindow.on('close', () => {
            App.convertCsvWindow.focus();
        });
        App.setLocation(App.csvLanguagesWindow, 'csvLanguages.html');
    }
    setCsvLanguages(arg) {
        App.destroyWindow(App.csvLanguagesWindow);
        App.csvEvent.sender.send('csv-languages', arg);
    }
    getExcelLanguages(event, arg) {
        App.excelEvent = event;
        App.excelLangArgs = arg;
        App.excelLanguagesWindow = new electron_1.BrowserWindow({
            parent: App.convertExcelWindow,
            modal: false,
            width: 520,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: App.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        App.excelLanguagesWindow.setMenu(null);
        App.excelLanguagesWindow.loadURL('file://' + App.path.join(electron_1.app.getAppPath(), 'html', 'excelLanguages.html'));
        App.excelLanguagesWindow.once('ready-to-show', () => {
            App.excelLanguagesWindow.show();
        });
        App.excelLanguagesWindow.on('close', () => {
            App.convertExcelWindow.focus();
        });
        App.setLocation(App.excelLanguagesWindow, 'excelLanguages.html');
    }
    setExcelLanguages(arg) {
        App.destroyWindow(App.excelLanguagesWindow);
        App.excelEvent.sender.send('excel-languages', arg);
    }
    static exportDelimited() {
        if (App.currentFile === '') {
            App.showMessage({ type: 'warning', message: 'Open a TMX file' });
            return;
        }
        electron_1.dialog.showSaveDialog({
            title: 'Export TAB Delimited',
            defaultPath: this.currentFile.substring(0, this.currentFile.lastIndexOf('.')) + '.csv',
            properties: ['showOverwriteConfirmation', 'createDirectory'],
            filters: [
                { name: 'CSV File', extensions: ['csv'] },
                { name: 'Text File', extensions: ['txt'] },
                { name: 'Any File', extensions: ['*'] }
            ]
        }).then((value) => {
            if (!value.canceled) {
                App.mainWindow.webContents.send('start-waiting');
                App.sendRequest({ command: 'exportDelimited', file: value.filePath }, (data) => {
                    App.currentStatus = data;
                    App.mainWindow.webContents.send('set-status', 'Exporting...');
                    var intervalObject = setInterval(() => {
                        if (App.currentStatus.status === COMPLETED) {
                            App.mainWindow.webContents.send('end-waiting');
                            App.mainWindow.webContents.send('set-status', '');
                            clearInterval(intervalObject);
                            App.showMessage({ type: 'info', message: 'File exported' });
                            return;
                        }
                        else if (App.currentStatus.status === ERROR) {
                            App.mainWindow.webContents.send('end-waiting');
                            App.mainWindow.webContents.send('set-status', '');
                            clearInterval(intervalObject);
                            App.showMessage({ type: 'error', message: App.currentStatus.reason });
                            return;
                        }
                        else if (App.currentStatus.status === SUCCESS) {
                            // keep waiting
                        }
                        else {
                            App.mainWindow.webContents.send('end-waiting');
                            App.mainWindow.webContents.send('set-status', '');
                            clearInterval(intervalObject);
                            electron_1.dialog.showErrorBox('Error', 'Unknown error exporting file');
                            return;
                        }
                        App.getExportProgress();
                    }, 500);
                }, (reason) => {
                    App.mainWindow.webContents.send('end-waiting');
                    App.showMessage({ type: 'error', message: reason });
                });
            }
        }).catch((error) => {
            App.showMessage({ type: 'error', message: error.message });
        });
    }
    static exportExcel() {
        if (App.currentFile === '') {
            App.showMessage({ type: 'warning', message: 'Open a TMX file' });
            return;
        }
        electron_1.dialog.showSaveDialog({
            title: 'Export Excel File',
            defaultPath: this.currentFile.substring(0, this.currentFile.lastIndexOf('.')) + '.xlsx',
            properties: ['showOverwriteConfirmation', 'createDirectory'],
            filters: [
                { name: 'Excel File', extensions: ['xlsx'] },
                { name: 'Any File', extensions: ['*'] }
            ]
        }).then((value) => {
            if (!value.canceled) {
                App.mainWindow.webContents.send('start-waiting');
                App.sendRequest({ command: 'exportExcel', file: value.filePath }, (data) => {
                    App.currentStatus = data;
                    App.mainWindow.webContents.send('set-status', 'Exporting...');
                    var intervalObject = setInterval(() => {
                        if (App.currentStatus.status === COMPLETED) {
                            App.mainWindow.webContents.send('end-waiting');
                            App.mainWindow.webContents.send('set-status', '');
                            clearInterval(intervalObject);
                            App.showMessage({ type: 'info', message: 'File exported' });
                            return;
                        }
                        else if (App.currentStatus.status === ERROR) {
                            App.mainWindow.webContents.send('end-waiting');
                            App.mainWindow.webContents.send('set-status', '');
                            clearInterval(intervalObject);
                            App.showMessage({ type: 'error', message: App.currentStatus.reason });
                            return;
                        }
                        else if (App.currentStatus.status === SUCCESS) {
                            // keep waiting
                        }
                        else {
                            App.mainWindow.webContents.send('end-waiting');
                            App.mainWindow.webContents.send('set-status', '');
                            clearInterval(intervalObject);
                            electron_1.dialog.showErrorBox('Error', 'Unknown error exporting file');
                            return;
                        }
                        App.getExportProgress();
                    }, 500);
                }, (reason) => {
                    App.mainWindow.webContents.send('end-waiting');
                    App.showMessage({ type: 'error', message: reason });
                });
            }
        }).catch((error) => {
            App.showMessage({ type: 'error', message: error.message });
        });
    }
    static getExportProgress() {
        App.sendRequest({ command: 'exportProgress' }, (data) => {
            App.currentStatus = data;
        }, (reason) => {
            App.showMessage({ type: 'error', message: reason });
        });
    }
    static showFileInfo() {
        if (App.currentFile === '') {
            App.showMessage({ type: 'warning', message: 'Open a TMX file' });
            return;
        }
        App.fileInfoWindow = new electron_1.BrowserWindow({
            parent: App.mainWindow,
            width: 550,
            minimizable: false,
            maximizable: false,
            resizable: true,
            show: false,
            icon: App.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        App.fileInfoWindow.setMenu(null);
        App.fileInfoWindow.loadURL('file://' + App.path.join(electron_1.app.getAppPath(), 'html', 'fileInfo.html'));
        App.fileInfoWindow.once('ready-to-show', () => {
            App.fileInfoWindow.show();
        });
        App.fileInfoWindow.on('close', () => {
            App.mainWindow.focus();
        });
        App.setLocation(App.fileInfoWindow, 'fileInfo.html');
    }
    fileProperties(event) {
        App.sendRequest({ command: 'getFileProperties' }, (data) => {
            if (data.status === SUCCESS) {
                event.sender.send('set-file-properties', data);
            }
            else {
                App.showMessage({ type: 'error', message: data.reason });
            }
        }, (reason) => {
            App.showMessage({ type: 'error', message: reason });
        });
    }
    static validateFile() {
        electron_1.dialog.showOpenDialog({
            title: 'Validate TMX File',
            properties: ['openFile'],
            filters: [
                { name: 'TMX File', extensions: ['tmx'] }
            ]
        }).then((value) => {
            if (!value.canceled) {
                App.mainWindow.webContents.send('start-waiting');
                App.sendRequest({ command: 'validateFile', file: value.filePaths[0] }, (data) => {
                    App.currentStatus = data;
                    App.mainWindow.webContents.send('set-status', 'Validating...');
                    var intervalObject = setInterval(() => {
                        if (App.currentStatus.status === COMPLETED) {
                            App.mainWindow.webContents.send('end-waiting');
                            App.mainWindow.webContents.send('set-status', '');
                            clearInterval(intervalObject);
                            App.showMessage({ type: 'info', message: 'File is valid' });
                            return;
                        }
                        else if (App.currentStatus.status === ERROR) {
                            App.mainWindow.webContents.send('end-waiting');
                            App.mainWindow.webContents.send('set-status', '');
                            clearInterval(intervalObject);
                            App.showMessage({ type: 'error', message: App.currentStatus.reason });
                            return;
                        }
                        else if (App.currentStatus.status === SUCCESS) {
                            // keep waiting
                        }
                        else {
                            App.mainWindow.webContents.send('end-waiting');
                            App.mainWindow.webContents.send('set-status', '');
                            clearInterval(intervalObject);
                            electron_1.dialog.showErrorBox('Error', 'Unknown error validating file');
                            return;
                        }
                        App.getValidatingProgress();
                    }, 500);
                }, (reason) => {
                    App.mainWindow.webContents.send('end-waiting');
                    App.showMessage({ type: 'error', message: reason });
                });
            }
        }).catch((error) => {
            App.showMessage({ type: 'error', message: error.message });
        });
    }
    static getValidatingProgress() {
        App.sendRequest({ command: 'validatingProgress' }, (data) => {
            App.currentStatus = data;
        }, (reason) => {
            App.showMessage({ type: 'error', message: reason });
        });
    }
    static cleanCharacters() {
        electron_1.dialog.showOpenDialog({
            title: 'Clean Characters',
            properties: ['openFile'],
            filters: [
                { name: 'TMX File', extensions: ['tmx'] }
            ]
        }).then((value) => {
            if (!value.canceled) {
                App.mainWindow.webContents.send('start-waiting');
                App.sendRequest({ command: 'cleanCharacters', file: value.filePaths[0] }, (data) => {
                    App.currentStatus = data;
                    App.mainWindow.webContents.send('set-status', 'Cleaning...');
                    var intervalObject = setInterval(() => {
                        if (App.currentStatus.status === COMPLETED) {
                            App.mainWindow.webContents.send('end-waiting');
                            App.mainWindow.webContents.send('set-status', '');
                            clearInterval(intervalObject);
                            App.showMessage({ type: 'info', message: 'File cleaned' });
                            return;
                        }
                        else if (App.currentStatus.status === ERROR) {
                            App.mainWindow.webContents.send('end-waiting');
                            App.mainWindow.webContents.send('set-status', '');
                            clearInterval(intervalObject);
                            App.showMessage({ type: 'error', message: App.currentStatus.reason });
                            return;
                        }
                        else if (App.currentStatus.status === SUCCESS) {
                            // keep waiting
                        }
                        else {
                            App.mainWindow.webContents.send('end-waiting');
                            App.mainWindow.webContents.send('set-status', '');
                            clearInterval(intervalObject);
                            electron_1.dialog.showErrorBox('Error', 'Unknown error cleaning characters');
                            return;
                        }
                        App.getCleaningProgress();
                    }, 500);
                }, (reason) => {
                    App.mainWindow.webContents.send('end-waiting');
                    App.showMessage({ type: 'error', message: reason });
                });
            }
        }).catch((error) => {
            App.showMessage({ type: 'error', message: error.message });
        });
    }
    static getCleaningProgress() {
        App.sendRequest({ command: 'cleaningProgress' }, (data) => {
            App.currentStatus = data;
        }, (reason) => {
            App.showMessage({ type: 'error', message: reason });
        });
    }
    static splitFile() {
        App.splitFileWindow = new electron_1.BrowserWindow({
            parent: App.mainWindow,
            width: 504,
            minimizable: false,
            maximizable: false,
            resizable: true,
            show: false,
            icon: App.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        App.splitFileWindow.setMenu(null);
        App.splitFileWindow.loadURL('file://' + App.path.join(electron_1.app.getAppPath(), 'html', 'splitFile.html'));
        App.splitFileWindow.once('ready-to-show', () => {
            App.splitFileWindow.show();
        });
        App.splitFileWindow.on('close', () => {
            App.mainWindow.focus();
        });
        App.setLocation(App.splitFileWindow, 'splitFile.html');
    }
    splitTmx(arg) {
        App.destroyWindow(App.splitFileWindow);
        arg.command = 'splitFile';
        App.sendRequest(arg, (data) => {
            App.currentStatus = data;
            App.mainWindow.webContents.send('set-status', 'Splitting...');
            var intervalObject = setInterval(() => {
                if (App.currentStatus.status === COMPLETED) {
                    App.mainWindow.webContents.send('end-waiting');
                    App.mainWindow.webContents.send('set-status', '');
                    clearInterval(intervalObject);
                    App.showMessage({ type: 'info', message: 'File split' });
                    return;
                }
                else if (App.currentStatus.status === PROCESSING) {
                    // it's OK, keep waiting
                }
                else if (App.currentStatus.status === ERROR) {
                    App.mainWindow.webContents.send('end-waiting');
                    App.mainWindow.webContents.send('set-status', '');
                    clearInterval(intervalObject);
                    App.showMessage({ type: 'error', message: App.currentStatus.reason });
                    return;
                }
                else if (App.currentStatus.status === SUCCESS) {
                    // ignore status from 'replaceText'
                }
                else {
                    App.mainWindow.webContents.send('end-waiting');
                    App.mainWindow.webContents.send('set-status', '');
                    clearInterval(intervalObject);
                    electron_1.dialog.showErrorBox('Error', 'Unknown error splitting file');
                    return;
                }
                App.getSplitProgress();
            }, 500);
        }, (reason) => {
            App.showMessage({ type: 'error', message: reason });
        });
    }
    static getSplitProgress() {
        App.sendRequest({ command: 'getSplitProgress' }, (data) => {
            App.currentStatus = data;
        }, (reason) => {
            console.log(reason);
        });
    }
    selectTmx(event) {
        electron_1.dialog.showOpenDialog({
            title: 'TMX File',
            properties: ['openFile'],
            filters: [
                { name: 'TMX File', extensions: ['tmx'] },
                { name: 'Any File', extensions: ['*'] }
            ]
        }).then((value) => {
            if (!value.canceled) {
                event.sender.send('tmx-file', value.filePaths[0]);
            }
        }).catch((error) => {
            App.showMessage({ type: 'error', message: error.message });
        });
    }
    static mergeFiles() {
        App.mergeFilesWindow = new electron_1.BrowserWindow({
            parent: App.mainWindow,
            width: 560,
            minimizable: false,
            maximizable: false,
            resizable: true,
            show: false,
            icon: App.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        App.mergeFilesWindow.setMenu(null);
        App.mergeFilesWindow.loadURL('file://' + App.path.join(electron_1.app.getAppPath(), 'html', 'mergeFiles.html'));
        App.mergeFilesWindow.once('ready-to-show', () => {
            App.mergeFilesWindow.show();
        });
        App.mergeFilesWindow.on('close', () => {
            App.mainWindow.focus();
        });
        App.setLocation(App.mergeFilesWindow, 'mergeFiles.html');
    }
    mergeTmxFiles(arg) {
        App.destroyWindow(App.mergeFilesWindow);
        App.mainWindow.webContents.send('start-waiting');
        arg.command = 'mergeFiles';
        App.sendRequest(arg, (data) => {
            App.currentStatus = data;
            App.mainWindow.webContents.send('set-status', 'Merging...');
            var intervalObject = setInterval(() => {
                if (App.currentStatus.status === COMPLETED) {
                    App.mainWindow.webContents.send('end-waiting');
                    App.mainWindow.webContents.send('set-status', '');
                    clearInterval(intervalObject);
                    App.showMessage({ type: 'info', message: 'Files merged' });
                    return;
                }
                else if (App.currentStatus.status === PROCESSING) {
                    // it's OK, keep waiting
                }
                else if (App.currentStatus.status === ERROR) {
                    App.mainWindow.webContents.send('end-waiting');
                    App.mainWindow.webContents.send('set-status', '');
                    clearInterval(intervalObject);
                    App.showMessage({ type: 'error', message: App.currentStatus.reason });
                    return;
                }
                else if (App.currentStatus.status === SUCCESS) {
                    // ignore status from 'mergeFiles'
                }
                else {
                    App.mainWindow.webContents.send('end-waiting');
                    App.mainWindow.webContents.send('set-status', '');
                    clearInterval(intervalObject);
                    App.showMessage({ type: 'error', message: 'Unknown error merging files' });
                    return;
                }
                App.getMergeProgress();
            }, 500);
        }, (reason) => {
            App.mainWindow.webContents.send('end-waiting');
            App.showMessage({ type: 'error', message: reason });
        });
    }
    static getMergeProgress() {
        App.sendRequest({ command: 'getMergeProgress' }, (data) => {
            App.currentStatus = data;
        }, (reason) => {
            console.log(reason);
        });
    }
    static saveEdits() {
        if (App.currentFile === '') {
            return;
        }
        App.mainWindow.webContents.send('save-edit');
    }
    static cancelEdit() {
        if (App.currentFile === '') {
            return;
        }
        App.mainWindow.webContents.send('cancel-edit');
    }
    addTmxFiles(event) {
        electron_1.dialog.showOpenDialog({
            title: 'TMX Files',
            properties: ['openFile', 'multiSelections'],
            filters: [
                { name: 'TMX File', extensions: ['tmx'] },
                { name: 'Any File', extensions: ['*'] }
            ]
        }).then((value) => {
            if (!value.canceled) {
                event.sender.send('tmx-files', value.filePaths);
            }
        }).catch((error) => {
            App.showMessage({ type: 'error', message: error.message });
        });
    }
    selectMergedTmx(event) {
        electron_1.dialog.showSaveDialog({
            title: 'Merged TMX File',
            properties: ['showOverwriteConfirmation', 'createDirectory'],
            filters: [
                { name: 'TMX File', extensions: ['tmx'] },
                { name: 'Any File', extensions: ['*'] }
            ]
        }).then((value) => {
            if (!value.canceled) {
                event.sender.send('merged-tmx-file', value.filePath);
            }
        }).catch((error) => {
            App.showMessage({ type: 'error', message: error.message });
        });
    }
    saveData(event, arg) {
        arg.command = 'saveTuvData';
        App.sendRequest(arg, (data) => {
            if (data.status === SUCCESS) {
                App.mainWindow.setDocumentEdited(true);
                App.saved = false;
                event.sender.send('data-saved', data);
                return;
            }
            App.showMessage({ type: 'error', message: data.reason });
        }, (reason) => {
            App.showMessage({ type: 'error', message: reason });
        });
    }
    static replaceText() {
        if (App.currentFile === '') {
            App.showMessage({ type: 'warning', message: 'Open a TMX file' });
            return;
        }
        App.replaceTextWindow = new electron_1.BrowserWindow({
            parent: App.mainWindow,
            width: 450,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: App.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        App.replaceTextWindow.setMenu(null);
        App.replaceTextWindow.loadURL('file://' + App.path.join(electron_1.app.getAppPath(), 'html', 'searchReplace.html'));
        App.replaceTextWindow.once('ready-to-show', () => {
            App.replaceTextWindow.show();
        });
        App.replaceTextWindow.on('close', () => {
            App.mainWindow.focus();
        });
        App.setLocation(App.replaceTextWindow, 'searchReplace.html');
    }
    replaceRequest(arg) {
        App.destroyWindow(App.replaceTextWindow);
        App.mainWindow.webContents.send('start-waiting');
        arg.command = 'replaceText';
        App.sendRequest(arg, (data) => {
            App.currentStatus = data;
            App.mainWindow.webContents.send('set-status', 'Replacing...');
            var intervalObject = setInterval(() => {
                if (App.currentStatus.status === COMPLETED) {
                    App.mainWindow.webContents.send('end-waiting');
                    App.mainWindow.webContents.send('set-status', '');
                    clearInterval(intervalObject);
                    App.loadSegments();
                    App.getCount();
                    App.saved = false;
                    App.mainWindow.setDocumentEdited(true);
                    return;
                }
                else if (App.currentStatus.status === PROCESSING) {
                    // it's OK, keep waiting
                }
                else if (App.currentStatus.status === ERROR) {
                    App.mainWindow.webContents.send('end-waiting');
                    App.mainWindow.webContents.send('set-status', '');
                    clearInterval(intervalObject);
                    App.showMessage({ type: 'error', message: App.currentStatus.reason });
                    return;
                }
                else if (App.currentStatus.status === SUCCESS) {
                    // ignore status from 'replaceText'
                }
                else {
                    App.mainWindow.webContents.send('end-waiting');
                    App.mainWindow.webContents.send('set-status', '');
                    clearInterval(intervalObject);
                    App.showMessage({ type: 'error', message: 'Unknown error replacing text' });
                    return;
                }
                App.getProcessingProgress();
            }, 500);
        }, (reason) => {
            App.mainWindow.webContents.send('end-waiting');
            App.showMessage({ type: 'error', message: reason });
        });
    }
    static getProcessingProgress() {
        App.sendRequest({ command: 'processingProgress' }, (data) => {
            App.currentStatus = data;
        }, (reason) => {
            console.log(reason);
        });
    }
    static sortUnits() {
        if (App.currentFile === '') {
            App.showMessage({ type: 'warning', message: 'Open a TMX file' });
            return;
        }
        App.sortUnitsWindow = new electron_1.BrowserWindow({
            parent: App.mainWindow,
            width: 450,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: App.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        App.sortUnitsWindow.setMenu(null);
        App.sortUnitsWindow.loadURL('file://' + App.path.join(electron_1.app.getAppPath(), 'html', 'sortUnits.html'));
        App.sortUnitsWindow.once('ready-to-show', () => {
            App.sortUnitsWindow.show();
        });
        App.sortUnitsWindow.on('close', () => {
            App.mainWindow.focus();
        });
        App.setLocation(App.sortUnitsWindow, 'sortUnits.html');
    }
    setSort(arg) {
        App.sortOptions = arg;
        App.destroyWindow(App.sortUnitsWindow);
        App.loadSegments();
        App.mainWindow.webContents.send('sort-on');
    }
    clearSort() {
        App.sortOptions = {};
        App.destroyWindow(App.sortUnitsWindow);
        App.loadSegments();
        App.mainWindow.webContents.send('sort-off');
    }
    static showFilters() {
        if (App.currentFile === '') {
            App.showMessage({ type: 'warning', message: 'Open a TMX file' });
            return;
        }
        App.filtersWindow = new electron_1.BrowserWindow({
            parent: App.mainWindow,
            width: 520,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: App.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        App.filtersWindow.setMenu(null);
        App.filtersWindow.loadURL('file://' + App.path.join(electron_1.app.getAppPath(), 'html', 'filters.html'));
        App.filtersWindow.once('ready-to-show', () => {
            App.filtersWindow.show();
        });
        App.filtersWindow.on('close', () => {
            App.mainWindow.focus();
        });
        App.setLocation(App.filtersWindow, 'filters.html');
    }
    setFilterOptions(arg) {
        App.filterOptions = arg;
        App.destroyWindow(App.filtersWindow);
        this.setFirstPage();
        App.loadSegments();
        App.mainWindow.webContents.send('filters-on');
    }
    setFirstPage() {
        App.loadOptions.start = 0;
        App.mainWindow.webContents.send('set-first-page');
    }
    clearFilterOptions() {
        App.filterOptions = {};
        App.destroyWindow(App.filtersWindow);
        this.setFirstPage();
        App.loadSegments();
        App.mainWindow.webContents.send('filters-off');
    }
    static insertUnit() {
        if (App.currentFile === '') {
            App.showMessage({ type: 'warning', message: 'Open a TMX file' });
            return;
        }
        App.sendRequest({ command: 'insertUnit' }, (data) => {
            if (data.status === SUCCESS) {
                App.mainWindow.webContents.send('unit-inserted', data.id);
                App.saved = false;
                App.mainWindow.setDocumentEdited(true);
            }
            else {
                App.showMessage({ type: 'error', message: data.reason });
            }
        }, (reason) => {
            App.showMessage({ type: 'error', message: reason });
        });
    }
    static requestDeleteUnits() {
        App.mainWindow.webContents.send('request-delete');
    }
    deleteUnits(arg) {
        if (App.currentFile === '') {
            App.showMessage({ type: 'warning', message: 'Open a TMX file' });
            return;
        }
        var selected = arg;
        if (selected.length === 0) {
            App.showMessage({ type: 'warning', message: 'Select units' });
            return;
        }
        App.sendRequest({ command: 'deleteUnits', selected }, (data) => {
            if (data.status === SUCCESS) {
                App.getFileLanguages();
                App.getCount();
                App.loadSegments();
                App.saved = false;
                App.mainWindow.setDocumentEdited(true);
            }
            else {
                App.showMessage({ type: 'error', message: data.reason });
            }
        }, (reason) => {
            App.showMessage({ type: 'error', message: reason });
        });
    }
    static firstPage() {
        App.mainWindow.webContents.send('first-page');
    }
    static previousPage() {
        App.mainWindow.webContents.send('previous-page');
    }
    static nextPage() {
        App.mainWindow.webContents.send('next-page');
    }
    static lastPage() {
        App.mainWindow.webContents.send('last-page');
    }
    static changeLanguageCode() {
        if (App.currentFile === '') {
            App.showMessage({ type: 'warning', message: 'Open a TMX file' });
            return;
        }
        App.changeLanguageWindow = new electron_1.BrowserWindow({
            parent: App.mainWindow,
            width: 490,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: App.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        App.changeLanguageWindow.setMenu(null);
        App.changeLanguageWindow.loadURL('file://' + App.path.join(electron_1.app.getAppPath(), 'html', 'changeLanguage.html'));
        App.changeLanguageWindow.once('ready-to-show', () => {
            App.changeLanguageWindow.show();
        });
        App.changeLanguageWindow.on('close', () => {
            App.mainWindow.focus();
        });
        App.setLocation(App.changeLanguageWindow, 'changeLanguage.html');
    }
    changeLanguage(arg) {
        App.destroyWindow(App.changeLanguageWindow);
        arg.command = 'changeLanguage';
        App.sendRequest(arg, (data) => {
            App.currentStatus = data;
            App.mainWindow.webContents.send('set-status', 'Changing...');
            var intervalObject = setInterval(() => {
                if (App.currentStatus.status === COMPLETED) {
                    App.mainWindow.webContents.send('end-waiting');
                    App.mainWindow.webContents.send('set-status', '');
                    clearInterval(intervalObject);
                    App.getFileLanguages();
                    App.loadSegments();
                    App.saved = false;
                    App.mainWindow.setDocumentEdited(true);
                    return;
                }
                else if (App.currentStatus.status === PROCESSING) {
                    // it's OK, keep waiting
                }
                else if (App.currentStatus.status === ERROR) {
                    App.mainWindow.webContents.send('end-waiting');
                    App.mainWindow.webContents.send('set-status', '');
                    clearInterval(intervalObject);
                    App.showMessage({ type: 'error', message: App.currentStatus.reason });
                    return;
                }
                else if (App.currentStatus.status === SUCCESS) {
                    // ignore status from 'replaceText'
                }
                else {
                    App.mainWindow.webContents.send('end-waiting');
                    App.mainWindow.webContents.send('set-status', '');
                    clearInterval(intervalObject);
                    App.showMessage({ type: 'error', message: 'Unknown error changing language code' });
                    return;
                }
                App.getProcessingProgress();
            }, 500);
        }, (reason) => {
            App.showMessage({ type: 'error', message: reason });
        });
    }
    allLanguages(event) {
        App.sendRequest({ command: 'getAllLanguages' }, (data) => {
            if (data.status === SUCCESS) {
                event.sender.send('languages-list', data.languages);
            }
            else {
                App.showMessage({ type: 'error', message: data.reason });
            }
        }, (reason) => {
            App.showMessage({ type: 'error', message: reason });
        });
    }
    static showRemoveLanguage() {
        if (App.currentFile === '') {
            App.showMessage({ type: 'warning', message: 'Open a TMX file' });
            return;
        }
        App.removeLanguageWindow = new electron_1.BrowserWindow({
            parent: App.mainWindow,
            width: 420,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: App.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        App.removeLanguageWindow.setMenu(null);
        App.removeLanguageWindow.loadURL('file://' + App.path.join(electron_1.app.getAppPath(), 'html', 'removeLanguage.html'));
        App.removeLanguageWindow.once('ready-to-show', () => {
            App.removeLanguageWindow.show();
        });
        App.removeLanguageWindow.on('close', () => {
            App.mainWindow.focus();
        });
        App.setLocation(App.removeLanguageWindow, 'removeLanguage.html');
    }
    removeLanguage(arg) {
        App.destroyWindow(App.removeLanguageWindow);
        App.sendRequest({ command: 'removeLanguage', lang: arg }, (data) => {
            if (data.status === SUCCESS) {
                App.getFileLanguages();
                App.loadSegments();
                App.saved = false;
                App.mainWindow.setDocumentEdited(true);
            }
            else {
                App.showMessage({ type: 'error', message: data.reason });
            }
        }, (reason) => {
            App.showMessage({ type: 'error', message: reason });
        });
    }
    static showAddLanguage() {
        if (App.currentFile === '') {
            App.showMessage({ type: 'warning', message: 'Open a TMX file' });
            return;
        }
        App.addLanguageWindow = new electron_1.BrowserWindow({
            parent: App.mainWindow,
            width: 420,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: App.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        App.addLanguageWindow.setMenu(null);
        App.addLanguageWindow.loadURL('file://' + App.path.join(electron_1.app.getAppPath(), 'html', 'addLanguage.html'));
        App.addLanguageWindow.once('ready-to-show', () => {
            App.addLanguageWindow.show();
        });
        App.addLanguageWindow.on('close', () => {
            App.mainWindow.focus();
        });
        App.setLocation(App.addLanguageWindow, 'addLanguage.html');
    }
    addLanguage(arg) {
        App.destroyWindow(App.addLanguageWindow);
        App.sendRequest({ command: 'addLanguage', lang: arg }, (data) => {
            if (data.status === SUCCESS) {
                App.getFileLanguages();
                App.loadSegments();
                App.saved = false;
                App.mainWindow.setDocumentEdited(true);
            }
            else {
                App.showMessage({ type: 'error', message: data.reason });
            }
        }, (reason) => {
            App.showMessage({ type: 'error', message: reason });
        });
    }
    static showChangeSourceLanguage() {
        if (App.currentFile === '') {
            App.showMessage({ type: 'warning', message: 'Open a TMX file' });
            return;
        }
        App.srcLanguageWindow = new electron_1.BrowserWindow({
            parent: App.mainWindow,
            width: 420,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: App.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        App.srcLanguageWindow.setMenu(null);
        App.srcLanguageWindow.loadURL('file://' + App.path.join(electron_1.app.getAppPath(), 'html', 'srcLanguage.html'));
        App.srcLanguageWindow.once('ready-to-show', () => {
            App.srcLanguageWindow.show();
        });
        App.srcLanguageWindow.on('close', () => {
            App.mainWindow.focus();
        });
        App.setLocation(App.srcLanguageWindow, 'srcLanguage.html');
    }
    getSourceLanguage(event) {
        App.sendRequest({ command: 'getSrcLanguage' }, (data) => {
            if (data.status === SUCCESS) {
                event.sender.send('set-source-language', data);
            }
            else {
                App.showMessage({ type: 'warning', message: data.reason });
            }
        }, (reason) => {
            App.showMessage({ type: 'error', message: reason });
        });
    }
    static removeTags() {
        if (App.currentFile === '') {
            App.showMessage({ type: 'warning', message: 'Open a TMX file' });
            return;
        }
        App.mainWindow.webContents.send('start-waiting');
        App.sendRequest({ command: 'removeTags' }, (data) => {
            App.currentStatus = data;
            App.mainWindow.webContents.send('set-status', 'Removing tags...');
            var intervalObject = setInterval(() => {
                if (App.currentStatus.status === COMPLETED) {
                    App.mainWindow.webContents.send('end-waiting');
                    App.mainWindow.webContents.send('set-status', '');
                    clearInterval(intervalObject);
                    App.loadSegments();
                    App.saved = false;
                    App.mainWindow.setDocumentEdited(true);
                    return;
                }
                else if (App.currentStatus.status === PROCESSING) {
                    // it's OK, keep waiting
                }
                else if (App.currentStatus.status === ERROR) {
                    App.mainWindow.webContents.send('end-waiting');
                    App.mainWindow.webContents.send('set-status', '');
                    clearInterval(intervalObject);
                    App.showMessage({ type: 'error', message: App.currentStatus.reason });
                    return;
                }
                else if (App.currentStatus.status === SUCCESS) {
                    // ignore status from 'removeDuplicates'
                }
                else {
                    App.mainWindow.webContents.send('end-waiting');
                    App.mainWindow.webContents.send('set-status', '');
                    clearInterval(intervalObject);
                    electron_1.dialog.showErrorBox('Error', 'Unknown error removing tags');
                    return;
                }
                App.getProcessingProgress();
            }, 500);
        }, (reason) => {
            App.mainWindow.webContents.send('end-waiting');
            App.showMessage({ type: 'error', message: reason });
        });
    }
    changeSourceLanguage(arg) {
        App.destroyWindow(App.srcLanguageWindow);
        App.sendRequest({ command: 'setSrcLanguage', lang: arg }, (data) => {
            App.saved = false;
            App.mainWindow.setDocumentEdited(true);
            if (data.status !== SUCCESS) {
                App.showMessage({ type: 'warning', message: data.reason });
            }
        }, (reason) => {
            App.showMessage({ type: 'error', message: reason });
        });
    }
    static removeDuplicates() {
        if (App.currentFile === '') {
            App.showMessage({ type: 'warning', message: 'Open a TMX file' });
            return;
        }
        App.mainWindow.webContents.send('start-waiting');
        App.sendRequest({ command: 'removeDuplicates' }, (data) => {
            App.currentStatus = data;
            App.mainWindow.webContents.send('set-status', 'Removing duplicates...');
            var intervalObject = setInterval(() => {
                if (App.currentStatus.status === COMPLETED) {
                    App.mainWindow.webContents.send('end-waiting');
                    App.mainWindow.webContents.send('set-status', '');
                    clearInterval(intervalObject);
                    App.loadSegments();
                    App.getCount();
                    App.saved = false;
                    App.mainWindow.setDocumentEdited(true);
                    return;
                }
                else if (App.currentStatus.status === PROCESSING) {
                    // it's OK, keep waiting
                }
                else if (App.currentStatus.status === ERROR) {
                    App.mainWindow.webContents.send('end-waiting');
                    App.mainWindow.webContents.send('set-status', '');
                    clearInterval(intervalObject);
                    App.showMessage({ type: 'error', message: App.currentStatus.reason });
                    return;
                }
                else if (App.currentStatus.status === SUCCESS) {
                    // ignore status from 'removeDuplicates'
                }
                else {
                    App.mainWindow.webContents.send('end-waiting');
                    App.mainWindow.webContents.send('set-status', '');
                    clearInterval(intervalObject);
                    electron_1.dialog.showErrorBox('Error', 'Unknown error removing duplicates');
                    return;
                }
                App.getProcessingProgress();
            }, 500);
        }, (reason) => {
            App.mainWindow.webContents.send('end-waiting');
            App.showMessage({ type: 'error', message: reason });
        });
    }
    static getCount() {
        App.sendRequest({ command: 'getCount' }, (data) => {
            App.mainWindow.webContents.send('status-changed', data);
        }, (reason) => {
            App.showMessage({ type: 'error', message: reason });
        });
    }
    static showRemoveUntranslated() {
        if (App.currentFile === '') {
            App.showMessage({ type: 'warning', message: 'Open a TMX file' });
            return;
        }
        App.removeUntranslatedWindow = new electron_1.BrowserWindow({
            parent: App.mainWindow,
            width: 470,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: App.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        App.removeUntranslatedWindow.setMenu(null);
        App.removeUntranslatedWindow.loadURL('file://' + App.path.join(electron_1.app.getAppPath(), 'html', 'removeUntranslated.html'));
        App.removeUntranslatedWindow.once('ready-to-show', () => {
            App.removeUntranslatedWindow.show();
        });
        App.removeUntranslatedWindow.on('close', () => {
            App.mainWindow.focus();
        });
        App.setLocation(App.removeUntranslatedWindow, 'removeUntranslated.html');
    }
    static showRemoveSameAsSource() {
        if (App.currentFile === '') {
            App.showMessage({ type: 'warning', message: 'Open a TMX file' });
            return;
        }
        App.removeSameAsSourceWindow = new electron_1.BrowserWindow({
            parent: App.mainWindow,
            width: 470,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: App.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        App.removeSameAsSourceWindow.setMenu(null);
        App.removeSameAsSourceWindow.loadURL('file://' + App.path.join(electron_1.app.getAppPath(), 'html', 'removeSameAsSource.html'));
        App.removeSameAsSourceWindow.once('ready-to-show', () => {
            App.removeSameAsSourceWindow.show();
        });
        App.removeSameAsSourceWindow.on('close', () => {
            App.mainWindow.focus();
        });
        App.setLocation(App.removeSameAsSourceWindow, 'removeSameAsSource.html');
    }
    removeUntranslated(arg) {
        App.destroyWindow(App.removeUntranslatedWindow);
        App.mainWindow.webContents.send('start-waiting');
        arg.command = 'removeUntranslated';
        App.sendRequest(arg, (data) => {
            App.currentStatus = data;
            App.mainWindow.webContents.send('set-status', 'Removing units...');
            var intervalObject = setInterval(() => {
                if (App.currentStatus.status === COMPLETED) {
                    App.mainWindow.webContents.send('end-waiting');
                    App.mainWindow.webContents.send('set-status', '');
                    clearInterval(intervalObject);
                    App.loadSegments();
                    App.getCount();
                    App.saved = false;
                    App.mainWindow.setDocumentEdited(true);
                    return;
                }
                else if (App.currentStatus.status === PROCESSING) {
                    // it's OK, keep waiting
                }
                else if (App.currentStatus.status === ERROR) {
                    App.mainWindow.webContents.send('end-waiting');
                    App.mainWindow.webContents.send('set-status', '');
                    clearInterval(intervalObject);
                    App.showMessage({ type: 'error', message: App.currentStatus.reason });
                    return;
                }
                else if (App.currentStatus.status === SUCCESS) {
                    // ignore status from 'removeUntranslated'
                }
                else {
                    App.mainWindow.webContents.send('end-waiting');
                    App.mainWindow.webContents.send('set-status', '');
                    clearInterval(intervalObject);
                    electron_1.dialog.showErrorBox('Error', 'Unknown error removing untranslated units');
                    return;
                }
                App.getProcessingProgress();
            }, 500);
        }, (reason) => {
            App.mainWindow.webContents.send('end-waiting');
            App.showMessage({ type: 'error', message: reason });
        });
    }
    removeSameAsSource(arg) {
        App.destroyWindow(App.removeSameAsSourceWindow);
        App.mainWindow.webContents.send('start-waiting');
        arg.command = 'removeSameAsSource';
        App.sendRequest(arg, (data) => {
            App.currentStatus = data;
            App.mainWindow.webContents.send('set-status', 'Removing entries...');
            var intervalObject = setInterval(() => {
                if (App.currentStatus.status === COMPLETED) {
                    App.mainWindow.webContents.send('end-waiting');
                    App.mainWindow.webContents.send('set-status', '');
                    clearInterval(intervalObject);
                    App.loadSegments();
                    App.getCount();
                    App.saved = false;
                    App.mainWindow.setDocumentEdited(true);
                    return;
                }
                else if (App.currentStatus.status === PROCESSING) {
                    // it's OK, keep waiting
                }
                else if (App.currentStatus.status === ERROR) {
                    App.mainWindow.webContents.send('end-waiting');
                    App.mainWindow.webContents.send('set-status', '');
                    clearInterval(intervalObject);
                    App.showMessage({ type: 'error', message: App.currentStatus.reason });
                    return;
                }
                else if (App.currentStatus.status === SUCCESS) {
                    // ignore status from 'removeSameAsSource'
                }
                else {
                    App.mainWindow.webContents.send('end-waiting');
                    App.mainWindow.webContents.send('set-status', '');
                    clearInterval(intervalObject);
                    electron_1.dialog.showErrorBox('Error', 'Unknown error removing entries with translation same as source');
                    return;
                }
                App.getProcessingProgress();
            }, 500);
        }, (reason) => {
            App.mainWindow.webContents.send('end-waiting');
            App.showMessage({ type: 'error', message: reason });
        });
    }
    static removeSpaces() {
        if (App.currentFile === '') {
            App.showMessage({ type: 'warning', message: 'Open a TMX file' });
            return;
        }
        App.mainWindow.webContents.send('start-waiting');
        App.sendRequest({ command: 'removeSpaces' }, (data) => {
            App.currentStatus = data;
            App.mainWindow.webContents.send('set-status', 'Removing spaces...');
            var intervalObject = setInterval(() => {
                if (App.currentStatus.status === COMPLETED) {
                    App.mainWindow.webContents.send('end-waiting');
                    App.mainWindow.webContents.send('set-status', '');
                    clearInterval(intervalObject);
                    App.loadSegments();
                    App.saved = false;
                    App.mainWindow.setDocumentEdited(true);
                    return;
                }
                else if (App.currentStatus.status === PROCESSING) {
                    // it's OK, keep waiting
                }
                else if (App.currentStatus.status === ERROR) {
                    App.mainWindow.webContents.send('end-waiting');
                    App.mainWindow.webContents.send('set-status', '');
                    clearInterval(intervalObject);
                    App.showMessage({ type: 'error', message: App.currentStatus.reason });
                    return;
                }
                else if (App.currentStatus.status === SUCCESS) {
                    // ignore status from 'removeSpaces'
                }
                else {
                    App.mainWindow.webContents.send('end-waiting');
                    App.mainWindow.webContents.send('set-status', '');
                    clearInterval(intervalObject);
                    electron_1.dialog.showErrorBox('Error', 'Unknown error removing spaces');
                    return;
                }
                App.getProcessingProgress();
            }, 500);
        }, (reason) => {
            App.mainWindow.webContents.send('end-waiting');
            App.showMessage({ type: 'error', message: reason });
        });
    }
    static showConsolidateUnits() {
        if (App.currentFile === '') {
            App.showMessage({ type: 'warning', message: 'Open a TMX file' });
            return;
        }
        if (App.fileLanguages.length < 3) {
            App.showMessage({ type: 'warning', message: 'File must have at least 3 languages' });
            return;
        }
        App.consolidateWindow = new electron_1.BrowserWindow({
            parent: App.mainWindow,
            width: 470,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: App.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        App.consolidateWindow.setMenu(null);
        App.consolidateWindow.loadURL('file://' + App.path.join(electron_1.app.getAppPath(), 'html', 'consolidateUnits.html'));
        App.consolidateWindow.once('ready-to-show', () => {
            App.consolidateWindow.show();
        });
        App.consolidateWindow.on('close', () => {
            App.mainWindow.focus();
        });
        App.setLocation(App.consolidateWindow, 'consolidateUnits.html');
    }
    consolidateUnits(arg) {
        App.destroyWindow(App.consolidateWindow);
        App.mainWindow.webContents.send('start-waiting');
        arg.command = 'consolidateUnits';
        App.sendRequest(arg, (data) => {
            App.currentStatus = data;
            App.mainWindow.webContents.send('set-status', 'Consolidating...');
            var intervalObject = setInterval(() => {
                if (App.currentStatus.status === COMPLETED) {
                    App.mainWindow.webContents.send('end-waiting');
                    App.mainWindow.webContents.send('set-status', '');
                    clearInterval(intervalObject);
                    App.loadSegments();
                    App.getCount();
                    App.saved = false;
                    App.mainWindow.setDocumentEdited(true);
                    return;
                }
                else if (App.currentStatus.status === PROCESSING) {
                    // it's OK, keep waiting
                }
                else if (App.currentStatus.status === ERROR) {
                    App.mainWindow.webContents.send('end-waiting');
                    App.mainWindow.webContents.send('set-status', '');
                    clearInterval(intervalObject);
                    App.showMessage({ type: 'error', message: App.currentStatus.reason });
                    return;
                }
                else if (App.currentStatus.status === SUCCESS) {
                    // ignore status from 'consolidateUnits'
                }
                else {
                    App.mainWindow.webContents.send('end-waiting');
                    App.mainWindow.webContents.send('set-status', '');
                    clearInterval(intervalObject);
                    electron_1.dialog.showErrorBox('Error', 'Unknown error consolidating units');
                    return;
                }
                App.getProcessingProgress();
            }, 500);
        }, (reason) => {
            App.mainWindow.webContents.send('end-waiting');
            App.showMessage({ type: 'error', message: reason });
        });
    }
    static showMaintenanceDashboard() {
        if (App.currentFile === '') {
            App.showMessage({ type: 'warning', message: 'Open a TMX file' });
            return;
        }
        App.maintenanceWindow = new electron_1.BrowserWindow({
            parent: App.mainWindow,
            width: 470,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: App.iconPath,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        App.maintenanceWindow.setMenu(null);
        App.maintenanceWindow.loadURL('file://' + App.path.join(electron_1.app.getAppPath(), 'html', 'maintenance.html'));
        App.maintenanceWindow.once('ready-to-show', () => {
            App.maintenanceWindow.show();
        });
        App.maintenanceWindow.on('close', () => {
            App.mainWindow.focus();
        });
        App.setLocation(App.maintenanceWindow, 'maintenance.html');
    }
    static maintenanceTasks(arg) {
        App.destroyWindow(App.maintenanceWindow);
        App.mainWindow.webContents.send('start-waiting');
        arg.command = 'processTasks';
        App.sendRequest(arg, (data) => {
            App.currentStatus = data;
            App.mainWindow.webContents.send('set-status', 'Processing...');
            var intervalObject = setInterval(() => {
                if (App.currentStatus.status === COMPLETED) {
                    App.mainWindow.webContents.send('end-waiting');
                    App.mainWindow.webContents.send('set-status', '');
                    clearInterval(intervalObject);
                    App.loadSegments();
                    App.getCount();
                    App.saved = false;
                    App.mainWindow.setDocumentEdited(true);
                    return;
                }
                else if (App.currentStatus.status === PROCESSING) {
                    // it's OK, keep waiting
                }
                else if (App.currentStatus.status === ERROR) {
                    App.mainWindow.webContents.send('end-waiting');
                    App.mainWindow.webContents.send('set-status', '');
                    clearInterval(intervalObject);
                    App.showMessage({ type: 'error', message: App.currentStatus.reason });
                    return;
                }
                else if (App.currentStatus.status === SUCCESS) {
                    // ignore status from 'consolidateUnits'
                }
                else {
                    App.mainWindow.webContents.send('end-waiting');
                    App.mainWindow.webContents.send('set-status', '');
                    clearInterval(intervalObject);
                    electron_1.dialog.showErrorBox('Error', 'Unknown error performing maintenance');
                    return;
                }
                App.getProcessingProgress();
            }, 500);
        }, (reason) => {
            App.mainWindow.webContents.send('end-waiting');
            App.showMessage({ type: 'error', message: reason });
        });
    }
    static showReleaseHistory() {
        electron_1.shell.openExternal('https://www.maxprograms.com/products/tmxlog.html');
    }
    static showSupportGroup() {
        electron_1.shell.openExternal('https://groups.io/g/maxprograms/');
    }
    static downloadLatest() {
        let downloadsFolder = electron_1.app.getPath('downloads');
        let url = new URL(App.downloadLink);
        let path = url.pathname;
        path = path.substring(path.lastIndexOf('/') + 1);
        let file = downloadsFolder + (process.platform === 'win32' ? '\\' : '/') + path;
        if ((0, fs_1.existsSync)(file)) {
            (0, fs_1.unlinkSync)(file);
        }
        let request = electron_1.net.request({
            url: App.downloadLink,
            session: electron_1.session.defaultSession
        });
        App.mainWindow.webContents.send('set-status', 'Downloading...');
        App.updatesWindow.destroy();
        request.on('response', (response) => {
            let fileSize = Number.parseInt(response.headers['content-length']);
            let received = 0;
            response.on('data', (chunk) => {
                received += chunk.length;
                if (process.platform === 'win32' || process.platform === 'darwin') {
                    App.mainWindow.setProgressBar(received / fileSize);
                }
                App.mainWindow.webContents.send('set-status', 'Downloaded: ' + Math.trunc(received * 100 / fileSize) + '%');
                (0, fs_1.appendFileSync)(file, chunk);
            });
            response.on('end', () => {
                App.mainWindow.webContents.send('set-status', '');
                electron_1.dialog.showMessageBox({
                    type: 'info',
                    message: 'Update downloaded'
                });
                if (process.platform === 'win32' || process.platform === 'darwin') {
                    App.mainWindow.setProgressBar(0);
                    electron_1.shell.openPath(file).then(() => {
                        electron_1.app.quit();
                    }).catch((reason) => {
                        electron_1.dialog.showErrorBox('Error', reason);
                    });
                }
                if (process.platform === 'linux') {
                    electron_1.shell.showItemInFolder(file);
                }
            });
            response.on('error', (reason) => {
                App.mainWindow.webContents.send('set-status', '');
                electron_1.dialog.showErrorBox('Error', reason);
                if (process.platform === 'win32' || process.platform === 'darwin') {
                    App.mainWindow.setProgressBar(0);
                }
            });
        });
        request.end();
    }
    static setLocation(window, key) {
        if (App.locations.hasLocation(key)) {
            let position = App.locations.getLocation(key);
            window.setPosition(position.x, position.y, true);
        }
        window.addListener('moved', () => {
            let bounds = window.getBounds();
            App.locations.setLocation(key, bounds.x, bounds.y);
        });
    }
    static checkUpdates(silent) {
        electron_1.session.defaultSession.clearCache().then(() => {
            let request = electron_1.net.request({
                url: 'https://maxprograms.com/tmxeditor.json',
                session: electron_1.session.defaultSession
            });
            request.on('response', (response) => {
                let responseData = '';
                response.on('data', (chunk) => {
                    responseData += chunk;
                });
                response.on('end', () => {
                    try {
                        let parsedData = JSON.parse(responseData);
                        if (electron_1.app.getVersion() !== parsedData.version) {
                            App.latestVersion = parsedData.version;
                            switch (process.platform) {
                                case 'darwin':
                                    App.downloadLink = process.arch === 'arm64' ? parsedData.arm64 : parsedData.darwin;
                                    break;
                                case 'win32':
                                    App.downloadLink = parsedData.win32;
                                    break;
                                case 'linux':
                                    App.downloadLink = parsedData.linux;
                                    break;
                            }
                            App.updatesWindow = new electron_1.BrowserWindow({
                                parent: App.mainWindow,
                                width: 600,
                                minimizable: false,
                                maximizable: false,
                                resizable: false,
                                show: false,
                                icon: this.iconPath,
                                webPreferences: {
                                    nodeIntegration: true,
                                    contextIsolation: false
                                }
                            });
                            App.updatesWindow.setMenu(null);
                            App.updatesWindow.loadURL('file://' + this.path.join(electron_1.app.getAppPath(), 'html', 'updates.html'));
                            App.updatesWindow.once('ready-to-show', () => {
                                App.updatesWindow.show();
                            });
                            App.updatesWindow.on('close', () => {
                                App.mainWindow.focus();
                            });
                        }
                        else {
                            if (!silent) {
                                App.showMessage({
                                    type: 'info',
                                    message: 'There are currently no updates available'
                                });
                            }
                        }
                    }
                    catch (reason) {
                        if (!silent) {
                            App.showMessage({
                                type: 'error',
                                message: reason.message
                            });
                        }
                    }
                });
            });
            request.end();
        });
    }
}
App.path = require('path');
App.shouldQuit = false;
App.javapath = App.path.join(electron_1.app.getAppPath(), 'bin', 'java');
App.saved = true;
App.shouldClose = false;
App.currentFile = '';
App.currentStatus = {};
App.argFile = '';
App.isReady = false;
App.filterOptions = {};
App.loadOptions = {
    start: 0,
    count: 200
};
App.sortOptions = {};
App.needsName = false;
App.verticalPadding = 46;
new App(process.argv);
