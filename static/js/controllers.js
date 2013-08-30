var APP_KEY = 'owmans4v3jkpi5x';

function NoteController($scope) {
    $scope.folders = {};
    $scope.notes = [];

    var folderTable = null;
    var noteTable = null;
    var settingsTable = null;

    var recentlyModifiedFolder = '';
    var currentFile = null;
    var editor = null;

    var settings = {
        darkTheme: true,
        fontSize: 15,
        autoSave: true
    };
    $scope.settings = settings;


    //=========================================================================
    // Editor
    //=========================================================================
    var initializeEditor = function () {
        settings.darkTheme = getSettingByName('darkTheme').get('value');
        var theme = settings.darkTheme ? '/epic-dark.css' : '/epic-light.css';

        var epicOptions = {
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

        // Set background color
        var background_color = $scope.settings.darkTheme ? 'rgb(41, 41, 41)' : '#fff';
        $('body').css('background-color', background_color);

        editor = new EpicEditor(epicOptions);
        editor.load();
        editor.focus();

        initializeListeners();
    };


    //=========================================================================
    // Editor Listeners
    //=========================================================================
    var initializeListeners = function () {
        var save = function () {
            $scope.saveNote();
            $scope.$apply();
        };

        editor.on('autosave', save);
//        editor.on('save', save);  Breaking for some reason that has to do with $apply

        $scope.$watch('settings.darkTheme', function (newValue) {
            getSettingByName('darkTheme').set('value', newValue);
        });

        $scope.$watch('settings.fontSize', function (newValue) {
            getSettingByName('fontSize').set('value', newValue);
        });

        $scope.$watch('settings.autoSave', function (newValue) {
            getSettingByName('autoSave').set('value', newValue);
        });
    };


    //=========================================================================
    // Folders API
    //=========================================================================
    var getFolders = function (fieldValues) {
        /*
         Return the folders in the datastore
         */
        fieldValues = typeof fieldValues !== 'undefined' ? fieldValues : {};
        return folderTable.query(fieldValues);
    };

    var getFolder = function (id) {
        /*
         Return the folder with the specified ID
         */
        return folderTable.get(id);
    };

    var createFolder = function (name, fieldValues) {
        /*
         Create a new folder in the datastore with the given name
         */
        var date = new Date();
        name = typeof name !== 'undefined' ? name : 'New Folder';
        fieldValues = typeof fieldValues !== 'undefined' ? fieldValues : {
            created: date,
            modified: date,
            notes: [],
            name: name
        };

        // Create folder
        var folder = folderTable.insert(fieldValues);

        // Add as recently modified folder
        recentlyModifiedFolder = folder.getId();

        return folder;
    };

    var deleteFolder = function (id, include_files) {
        /*
         Delete folder from datastore, if include_files then delete files in folder
         */
        include_files = typeof include_files !== 'undefined' ? include_files : false;

        var folder = getFolder(id);

        var notes = getNotes({folder: id});
        for (var i = 0; i < notes.length; i++) {
            var note = notes[i];
            if (include_files) {
                // If include_files, delete the notes in the folder
                note.deleteRecord();
            } else {
                note.set('folder', '')
            }
        }

        // Remove from recentlyModifiedFile if necessary
        if (folder.getId() == recentlyModifiedFolder) {
            recentlyModifiedFolder = '';
        }

        // Delete folder
        folder.deleteRecord();
        return folder;
    };

    var updateFolder = function (id, props) {
        /*
         Update the note with the given properties
         */
        var folder = getFolder(id);
        props = typeof props !== 'undefined' ? props : {};
        props['modified'] = new Date();

        // Add as recently modified folder
        recentlyModifiedFolder = id;

        return folder.update(props)
    };

    //=========================================================================
    // Folder Helper Methods
    //=========================================================================
    $scope.createFolder = function () {
        var name = 'New Folder';
        createFolder(name);
        reloadFolders();
    };

    $scope.deleteFolder = function (folder) {
        deleteFolder(folder.getId(), false);
        reloadFolders();
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
        var folder_entities = getFolders();
        for (var i = 0; i < folder_entities.length; i++) {
            var folder = folder_entities[i];
            folders.push(folder);
        }
        $scope.folders = folders;
    };

    //=========================================================================
    // Notes API
    //=========================================================================
    var getNotes = function (fieldValues) {
        /*
         Return the notes in the datastore
         */
        fieldValues = typeof fieldValues !== 'undefined' ? fieldValues : {};
        return noteTable.query(fieldValues);
    };

    var getNote = function (id) {
        /*
         Return the note with the specified ID
         */
        return noteTable.get(id);
    };

    var createNote = function (content, folderId, fieldValues) {
        /*
         Create a new note in the datastore with the given content
         */
        var date = new Date();

        // Default parameters
        content = typeof content !== 'undefined' ? content : '';
        folderId = typeof folderId !== 'undefined' ? folderId : recentlyModifiedFolder;
        fieldValues = typeof fieldValues !== 'undefined' ? fieldValues : {
            created: date,
            modified: date,
            content: content,
            folder: folderId
        };

        // Create Note
        var note = noteTable.insert(fieldValues);

        // If folder specified, insert into folder
        if (folderId.length > 0) {
            var folder = getFolder(folderId);
            console.log(folder);
            addNoteToFolder(folder, note.getId())
        }

        return note;
    };

    var deleteNote = function (id) {
        /*
         Delete the note for the datastore
         */
        var note = getNote(id);

        // Remove from folder
        var folderId = note.get('folder');
        if (folderId != null && folderId.length > 0) {
            removeNoteFromFolder(getFolder(folderId), note);
        }

        // Delete note
        note.deleteRecord();
        reloadNotes();
        return note;
    };

    var updateNote = function (id, props) {
        /*
         Update the note with the given properties
         */
        var note = getNote(id);

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
                var currentFolder = getFolder(props['folder']);
                removeNoteFromFolder(currentFolder, id);

                // Add to new folder
                var newFolder = getFolder(newFolderId);
                addNoteToFolder(newFolder, id)
            }
        }

        return note.update(props)
    };


    //=========================================================================
    // Note Helper Methods
    //=========================================================================
    var loadContent = function (content) {
        editor.importFile('epiceditor', content)
    };

    var getContent = function () {
        return editor.exportFile();
    };

    var reloadNotes = function () {
        $scope.notes = noteTable.query();
        if (currentFile != null) {
            openNote(currentFile);
        }
    };

    var openNote = function (id) {
        var note = getNote(id);
        loadContent(note.get('content'));
        currentFile = id;
    };
    $scope.openNote = openNote;

    var closeNote = function () {
        currentFile = null;
        loadContent('');
        editor.focus();
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


    var removeNote = function (note) {
        var id = note.getId();
        if (id == currentFile) {
            closeNote();
        }
        deleteNote(id);
    };
    $scope.removeNote = removeNote;

    var saveNote = function () {
        var content = getContent();

        if (currentFile == null) {
            var note = createNote(content);
            currentFile = note.getId();
        } else {
            updateNote(currentFile, {content: content});
        }

        reloadNotes();
    };
    $scope.saveNote = saveNote;


    //=========================================================================
    // Settings API
    //=========================================================================
    var getSettings = function (fieldValues) {
        /*
         Query for all the settings in the datastore with the specified properties
         */
        fieldValues = typeof fieldValues !== 'undefined' ? fieldValues : {};
        return settingsTable.query(fieldValues);
    };

    var getSetting = function (id) {
        /*
         Get a specific setting from the datastore
         */
        return settingsTable.get(id)
    };

    var createSetting = function (name, value) {
        /*
         Create a new setting with the given name and value
         */
        value = typeof value !== 'undefined' ? value : null;
        return settingsTable.insert({
            name: name,
            value: value
        })
    };

    var updateSetting = function (id, value) {
        /*
         Update the setting with the given id with a specified value
         */
        var setting = getSetting(id);
        return setting.set('value', value);
    };


    //=========================================================================
    // Settings Helper Methods
    //=========================================================================
    var getSettingByName = function (name) {
        return getSettings({name: name})[0];
    };

    var toggleSetting = function (name) {
        var setting = getSettingByName(name);
        var newValue = !setting.get('value');
        return setting.set('value', newValue);
    };

    var initializeSettings = function () {
        // Initialize the settings in the datastore
//        var db_settings = getSettings();
//        for (var i = 0; i < db_settings.length; i++) {
//            db_settings[i].deleteRecord();
//        }

        for (var settingName in settings) {
            var value = settings[settingName];

            // Check if in current settings, if not add it
            var setting = getSettingByName(settingName);
            if (setting === undefined) {
                createSetting(settingName, value)
            } else {
                settings[setting.get('name')] = setting.get('value');
            }
        }
    };


    //=========================================================================
    // General helper methods
    //=========================================================================
    $scope.getContentShort = function (note) {
        return note.get('content').substr(0, 10);
    };

    $scope.toggleTheme = function () {
        var setting = toggleSetting('darkTheme');
    };

    var syncData = function () {
        var folders = getFolders();
        for (var i = 0; i < folders.length; i++) {
            var folder = folders[i];
            $scope.folders[folder] = getNotes({folder: folder.getId()});
        }
    };

    var clearData = function () {
        var items = getSettings().concat(getFolders()).concat(getNotes());
        console.log(items);
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (!item.isDeleted()) {
                item.deleteRecord();
            }
        }
    };


    //=========================================================================
    // Initialize App
    //=========================================================================
    var init = function () {
        noteTable = $scope.datastore.getTable('notes');
        folderTable = $scope.datastore.getTable('folders');
        settingsTable = $scope.datastore.getTable('settings');

        var ptr = $scope.datastore.SubscribeRecordsChanged(function(records){
            reloadNotes();
            reloadFolders();
            initializeSettings();
        });

        reloadNotes();
        reloadFolders();

//        clearData();

        initializeSettings();
        initializeEditor();
    };

    $scope.$on('authenticated', function () {
        init();
    });

    $scope.$on('New Image', function (event, url) {
        console.log(url);
        var content = getContent();
        content += '![](' + url + ')';
        loadContent(content);
        editor.save();
    });
}
NoteController.$inject = ['$scope', 'dropstoreClient'];
