var APP_KEY = 'owmans4v3jkpi5x';

/**
 * Main controller
 * @param {object} $scope - application model
 * @constructor
 */
function NoteController($scope) {
    $scope.folders = {};
    $scope.notes = [];

    $scope.sidebarItems = [];

    var folderTable = null;
    var noteTable = null;
    var settingsTable = null;

    $scope.currentNote = null;


    $scope.currentFolder = null;

    var editor = null;

    $scope.sidebarType = 'folders';
    $scope.activeSidebar = true;

    var settings = {
        darkTheme: true,
        fontSize: 15,
        autoSave: true
    };
    $scope.settings = settings;


    //=========================================================================
    // Editor
    //=========================================================================

    /**
     * Represents the markdown editor
     * @constructor
     */
    var Editor = function () {
        settings.darkTheme = SettingAPI.getByName('darkTheme').get('value');

        var options = {
            container: 'epic-editor',
            basePath: 'static/css',
            clientSideStorage: false,
            theme: {
                base: '/epiceditor.css',
                preview: '/preview-dark.css',
                editor: $scope.settings.darkTheme ? '/epic-dark.css' : '/epic-light.css'
            },
            file: {
                autoSave: 500
            },
            focusOnLoad: true,
            autogrow: {
                minHeight: $(window).height()
            }
        };


        this._editor = new EpicEditor(options);

        var initializeListeners = function (editor) {
            var save = function () {
                $scope.saveNote();
                $scope.$apply();
            };

            editor.on('autosave', save);
    //        editor.on('save', save);  Breaking for some reason that has to do with $apply

            $scope.$watch('settings.darkTheme', function (newValue) {
                SettingAPI.getByName('darkTheme').set('value', newValue);
            });

            $scope.$watch('settings.fontSize', function (newValue) {
                SettingAPI.getByName('fontSize').set('value', newValue);
            });

            $scope.$watch('settings.autoSave', function (newValue) {
                SettingAPI.getByName('autoSave').set('value', newValue);
            });
        };


        /**
         * Get the content of the editor
         * @returns {string} - the content of the editor
         */
        this.getContent = function () {
            return this._editor.exportFile();
        };


        /**
         * Loads content into the editor, replaces existing content
         * @param {string} content - the content to load
         */
        this.loadContent = function (content) {
            this._editor.importFile('epiceditor', content)
        };


        /**
         * Clears the content of the editor
         */
        this.clearContent = function () {
            this.loadContent('');
        };


        /**
         * Append content to the end of the file
         * @param {string} content - the content to append
         */
        this.appendContent = function (content) {
            content = this.getContent() + content;
            this.loadContent(content);
            _editor.save();
        };



        this._editor.load();
        this._editor.focus();
        initializeListeners(this._editor);
        return this;
    };


    //=========================================================================
    // Folders API
    //=========================================================================

    /**
     * API for getting, creating, updating, and deleting Folders
     * @constructor
     * @todo Move this to an Angular Service
     */
    var FolderAPI = function () {};


    /**
     * Get the folders in the datastore
     * @param {object} [fieldValues] - properties of folders, if undefined will get all folders
     * @returns {array} - folders matching given properties
     */
    FolderAPI.query = function (fieldValues) {
        fieldValues = typeof fieldValues !== 'undefined' ? fieldValues : {};
        return folderTable.query(fieldValues);
    };


    /**
     * Get a folder with the specified id
     * @param {string} id - the id of the folder to get
     * @returns {object} Folder with the given id
     */
    FolderAPI.get = function (id) {
        return folderTable.get(id);
    };


    /**
     * Create a new folder
     * @param {string} name - the name of the folder
     * @param {object} [fieldValues] - other properties of the folder
     * @returns {object} Created folder
     */
    FolderAPI.create = function (name, fieldValues) {
        var date = new Date();
        name = typeof name !== 'undefined' ? name : 'New Folder';
        fieldValues = typeof fieldValues !== 'undefined' ? fieldValues : {
            created: date,
            modified: date,
            notes: [],
            name: name
        };

        // Create and return folder
        return folderTable.insert(fieldValues);
    };


    /**
     * Delete folder with the given id
     * @param {string} id - the id of the folder to delete
     * @param {boolean} [include_files=false] - delete the files contained in the folder
     * @returns {object} Deleted folder
     */
    FolderAPI.delete = function (id, include_files) {
        include_files = typeof include_files !== 'undefined' ? include_files : false;

        var folder = FolderAPI.get(id);

        var notes = FolderAPI.query({folder: id});
        for (var i = 0; i < notes.length; i++) {
            var note = notes[i];
            if (include_files) {
                // If include_files, delete the notes in the folder
                note.deleteRecord();
            } else {
                note.set('folder', '')
            }
        }

        // Delete folder
        folder.deleteRecord();
        return folder;
    };


    /**
     * Update a folder with the given properties
     * @param {string} id - the id of the folder to update
     * @param {object} props - the properties to add/change on the folder
     * @returns {object} Updated folder
     */
    FolderAPI.update = function (id, props) {
        var folder = FolderAPI.get(id);
        props = typeof props !== 'undefined' ? props : {};
        props['modified'] = new Date();

        return folder.update(props)
    };


    /**
     * Rename the folder with the given id
     * @param {string} id - the id of the folder to rename
     * @param {string} newName - the new name of the folder
     */
    FolderAPI.rename = function (id, newName) {
        FolderAPI.update(id, {name: newName});
    };


    /**
     * Add a note to the folder. This will not update the note.
     * @param {string} id - the id of the folder
     * @param {string} noteId - the id of the note to add
     */
    FolderAPI.addNote = function (id, noteId) {
        var folder = FolderAPI.get(id);
        folder.get('notes').push(noteId);
    };


    /**
     * Removes a note from the folder. This will not update the note.
     * @param {string} id - the id of the folder
     * @param {string} noteId - the id of the note to remove
     */
    FolderAPI.removeNote = function (id, noteId) {
        var folder = FolderAPI.get(id);
        var notes = folder.get('notes');
        var index = notes.toArray().indexOf(noteId);
        notes.splice(index, 1);
    };


    //=========================================================================
    // Folder Helper Methods
    //=========================================================================
    $scope.createFolder = function (name) {
        FolderAPI.create(name);
        reloadFolders();
    };

    $scope.deleteFolder = function (folder) {
        FolderAPI.delete(folder.getId(), false);
        reloadFolders();
    };

    $scope.renameFolder = function (folderId, newName) {
        FolderAPI.update(folderId, {name: newName});
    };

    var addNoteToFolder = function (folder, noteID) {
        folder.get('notes').push(noteID)
    };


    var removeNoteFromFolder = function (folder, noteId) {
        var notes = folder.get('notes');
        var index = notes.toArray().indexOf(noteId);
        notes.splice(index, 1);
    };

    var reloadFolders = function () {
        var folders = [];
        var folder_entities = FolderAPI.query();
        for (var i = 0; i < folder_entities.length; i++) {
            var folder = folder_entities[i];
            folders.push(folder);
        }
        $scope.folders = folders;
    };

    //=========================================================================
    // Notes API
    //=========================================================================

    /**
     * API for getting, creating, updating, and deleting Notes
     * @constructor
     * @todo Move this to an Angular Service
     */
    var NoteAPI = function () {};


    /**
     * Get the notes in the datastore
     * @param {object} [fieldValues] - properties of notes, if undefined will get all notes
     * @returns {array} - notes matching given properties
     */
    NoteAPI.query = function (fieldValues) {
        fieldValues = typeof fieldValues !== 'undefined' ? fieldValues : {};
        return noteTable.query(fieldValues);
    };


    /**
     * Get the note with the specified id
     * @param {string} id - the id of the note to get
     * @returns {object} Note with the given id
     */
    NoteAPI.get = function (id) {
        return noteTable.get(id);
    };


    /**
     * Create a new note
     * @param {string} name - the name of the note
     * @param {string} folderId - the id of the folder it belongs to
     * @param {string} content - the content of the note
     * @returns {object} Created Note
     */
    NoteAPI.create = function (name, folderId, content) {
        var date = new Date();
        content = typeof content !== 'undefined' ? content : '';

        var values = {
            name: name,
            created: date,
            modified: date,
            content: typeof content !== 'undefined' ? content : '',
            folder: folderId
        };

        if (!values.name || typeof values.name !== 'string') { throw "Invalid Note Name" }
        if (!values.folder || typeof values.folder !== 'string') { throw "Invalid Folder ID" }

        var folder = FolderAPI.get(folderId);
        if (!folder) { throw "Folder does not exist" }

        // Create Note
        var note = noteTable.insert(values);

        // Add note to folder
        addNoteToFolder(folder, note.getId());

        return note;
    };


    /**
     * Delete a note
     * @param {string} id - the id of the note to delete
     */
    NoteAPI.delete = function (id) {
        var note = NoteAPI.get(id);

        // Remove from folder
        var folderId = note.get('folder');
        var folder = FolderAPI.get(folderId);
        if (folder) {
            FolderAPI.removeNote(folderId, note.getId());
        }

        // Delete note
        note.deleteRecord();
        reloadNotes();
        return note;
    };


    /**
     * Update a note with the given id
     * @param {string} id - the id of the note to update
     * @param {object} props - the properties of the note to update
     * @returns {Object} Updated note
     */
    NoteAPI.update = function (id, props) {
        var note = NoteAPI.get(id);

        // Default parameters
        props = typeof props !== 'undefined' ? props : {};

        // Update modified date
        props['modified'] = new Date();

        // Update folder if needed
        newFolderId = props['folder'];
        if (newFolderId) {
            var newFolderId = props['folder'];
            var currentFolderId = note.get('folder');

            // Make sure that folder is actually changing
            if (newFolderId != currentFolderId) {
                // Remove from current folder
                var currentFolder = FolderAPI.get(props['folder']);
                removeNoteFromFolder(currentFolder, id);

                // Add to new folder
                var newFolder = FolderAPI.get(newFolderId);
                addNoteToFolder(newFolder, id)
            }
        }

        return note.update(props)
    };


    /**
     * Rename the note with the given id
     * @param {string} id - the id of the note to rename
     * @param {string} newName - the new name of the note
     * @returns {object} Renamed note
     */
    NoteAPI.rename = function (id, newName) {
        return NoteAPI.update(id, {name: newName})
    };


    /**
     * Get the shortened content of the note
     * @param {string} id - the id of the note
     * @param {number} [maxLength=15] - the max length of the content
     * @param {boolean} [breakOnNewLine=true] - break at a new line
     */
    NoteAPI.getShortContent = function (id, maxLength, breakOnNewLine) {
        // Default params
        maxLength = typeof maxLength !== 'undefined' ? maxLength : 15;
        breakOnNewLine = typeof breakOnNewLine !== 'undefined' ?  breakOnNewLine : true;

        var note = NoteAPI.get(id);
        var content = note.get('content');

        // Split by new line
        var splitByNewLine = content.match(/[^\r\n]+/g);
        if (splitByNewLine) {
            for (var i = 0; i < splitByNewLine.length; i++) {
                var line = splitByNewLine[i].trim();

                if (line.length > 0) {
                    // TODO put line through markdown processor
                    return line.substring(0, maxLength);
                }
            }
        }
        return ''
    };


    //=========================================================================
    // Note Helper Methods
    //=========================================================================
    var reloadNotes = function () {
        $scope.notes = noteTable.query();
        if ($scope.currentNote != null) {
            openNote($scope.currentNote);
        }
    };

    var openNote = function (id) {
        var note = NoteAPI.get(id);
        editor.loadContent(note.get('content'));
        $scope.currentNote = id;
    };
    $scope.openNote = openNote;

    var closeNote = function () {
        $scope.currentNote = null;
        editor.clearContent();
    };
    $scope.closeNote = closeNote;

    var getCreated = function (note) {
        var date = note.get('created');
        var day = date.getDate();
        var month = date.getMonth();
        var year = date.getFullYear();
        return month + '/' + day + '/' + year;
    };
    $scope.getCreated = getCreated;

    $scope.shortContent = function (note) {
        return NoteAPI.getShortContent(note.getId());
    };

    $scope.createNote = function () {
        closeNote();
        saveNote();
    };


    var removeNote = function (note) {
        var id = note.getId();
        if (id == $scope.currentNote) {
            closeNote();
        }
       NoteAPI.delete(id);
    };
    $scope.removeNote = removeNote;


    var saveNote = function () {
        var content = editor.getContent();

        if ($scope.currentNote == null) {
            var note = NoteAPI.create('New Note', $scope.currentFolder.getId(), content);
            $scope.currentNote = note.getId();
            $scope.notes.push(note);
        } else {
            NoteAPI.update($scope.currentNote, {content: content});
        }

//        reloadNotes();

    };
    $scope.saveNote = saveNote;

    $scope.newNote = function () {
        NoteAPI.create('New Note', $scope.currentFolder.getId());
    };


    //=========================================================================
    // Settings API
    //=========================================================================

    /**
     * API for getting, creating, updating, and deleting Settings
     * @constructor
     */
    var SettingAPI = function () {};


    /**
     * Query for settings matching the given values
     * @param [fieldValues] - the values of the settings to get, if undefined gets all settings
     * @returns {array} the settings matching the given values
     */
    SettingAPI.query = function (fieldValues) {
        fieldValues = typeof fieldValues !== 'undefined' ? fieldValues : {};
        return settingsTable.query(fieldValues);
    };


    /**
     * Gets the setting with the given id
     * @param {string} id - the id of the setting to get
     * @returns {object} the setting with the given id
     */
    SettingAPI.get = function (id) {
        return settingsTable.get(id)
    };


    /**
     * Create a new setting
     * @param {string} name - the name of the setting
     * @param {string|boolean|number} value - the value of the setting
     * @returns {object} Created setting
     */
    SettingAPI.create = function (name, value) {
        value = typeof value !== 'undefined' ? value : null;
        return settingsTable.insert({
            name: name,
            value: value
        })
    };


    /**
     * Update setting with the given id
     * @param {string} id - the id of the setting to update
     * @param {object} props - the properties of the setting to update
     * @returns {object} Updated setting
     */
    SettingAPI.update = function (id, props) {
        var setting = SettingAPI.get(id);
        return setting.update(props);
    };


    /**
     * Delete the setting with the given id
     * @param {string} id - the id of the setting to delete
     * @returns {object} Deleted setting
     */
    SettingAPI.delete = function (id) {
        return SettingAPI.get(id).deleteRecord();
    };


    /**
     * Get a setting by its name
     * @param {string} name - the name of the setting to get
     * @returns {object} Setting with given name
     */
    SettingAPI.getByName = function (name) {
        return SettingAPI.query({name: name})[0];
    };


    /**
     * Change the value of a function with the given id
     * @param {string} id - the id of the function to change
     * @param {string|boolean|number} newValue - the new value of the setting
     * @returns {*|Object|Object|Object}
     */
    SettingAPI.changeValue = function (id, newValue) {
        return SettingAPI.update({value: newValue});
    };


    /**
     * Toggle a given setting. The setting must be a boolean setting
     * @param {string} id - the id of the setting to toggle
     * @returns {object} - the updated setting
     */
    SettingAPI.toggle = function (id) {
        var setting = SettingAPI.get(id);
        var value = setting.get('value');

        if (typeof value !== "boolean") {
            throw "Cannot toggle a non-boolean setting"
        }

        return setting.set('value', !value);
    };


    //=========================================================================
    // Settings Helper Methods
    //=========================================================================


    var initializeSettings = function () {
//        Initialize the settings in the datastore
        var db_settings = SettingAPI.query();
        for (var i = 0; i < db_settings.length; i++) {
            db_settings[i].deleteRecord();
        }

        for (var settingName in settings) {
            var value = settings[settingName];

            // Check if in current settings, if not add it
            var setting = SettingAPI.getByName(settingName);
            if (setting === undefined) {
                SettingAPI.create(settingName, value)
            } else {
                settings[setting.get('name')] = setting.get('value');
            }
        }
    };

    //=========================================================================
    // Sidebar
    //=========================================================================

    /**
     * Represents actions to take on the sidebar
     * @constructor
     */
    var Sidebar = function () {};


    /**
     * Open the sidebar
     */
    Sidebar.open = function () {
        $scope.activeSidebar = true;
    };
    $scope.openSidebar = Sidebar.open;


    /**
     * Close the sidebar
     */
    Sidebar.close = function () {
        $scope.activeSidebar = false;
    };
    $scope.closeSidebar = Sidebar.close;


    /**
     * Toggle the sidebar
     */
    Sidebar.toggle = function () {
        $scope.activeSidebar = !$scope.activeSidebar;
    };
    $scope.toggleSidebar = Sidebar.toggle;


    /**
     * Set the content type of the sidebar
     * @param {string} type - the content type of the sidebar
     */
    Sidebar.setContentType = function (type) {
        $scope.sidebarType = type;
    };
    $scope.setSidebarType = Sidebar.setContentType;


    /**
     * Select a folder to be the active folder. Switch to notes.
     * @param {object} folder - the folder to select
     */
    Sidebar.selectFolder = function (folder) {
        if (!folder) {
            throw 'Folder does not exist'
        }

        $scope.currentFolder = folder;
        Sidebar.setContentType('notes');
    };
    $scope.selectFolder = Sidebar.selectFolder;


    //=========================================================================
    // General helper methods
    //=========================================================================
    var clearData = function () {
        var items = SettingAPI.query().concat(NoteAPI.query()).concat(FolderAPI.query());
        console.log(items);
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (!item.isDeleted()) {
                item.deleteRecord();
            }
        }

        reloadFolders();
        reloadNotes();
    };
    $scope.clearData = clearData;


    //=========================================================================
    // Initialize App
    //=========================================================================
    var init = function () {
        noteTable = $scope.datastore.getTable('notes');
        folderTable = $scope.datastore.getTable('folders');
        settingsTable = $scope.datastore.getTable('settings');

//        var ptr = $scope.datastore.SubscribeRecordsChanged(function(records){
//            reloadNotes();
//            reloadFolders();
//            initializeSettings();
//        });

        reloadNotes();
        reloadFolders();

//        clearData();

        initializeSettings();
        editor = Editor();
    };


    $scope.$on('authenticated', function () {
        init();
    });

    $scope.$on('New Image', function (event, url) {
        editor.appendContent('![](' + url + ')');
    });
}
NoteController.$inject = ['$scope'];
