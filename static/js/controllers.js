var APP_KEY = '3r8ynvj5hvg8hqr';

function NoteController($scope, dropstoreClient) {
    $scope.folders = {};
    $scope.notes = [];

    var folderTable = null;
    var noteTable = null;
    var settingsTable = null;

    var currentFile = null;
    var editor = null;

    var settings = {
        darkTheme: true,
        fontSize: 20,
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
//                defaultContent: 'Start Typing'
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

        initializeListeners();

        editor.load();
        editor.focus();
    };


    //=========================================================================
    // Editor Listeners
    //=========================================================================
    var initializeListeners = function () {
        editor.on('autosave', function () {
            $scope.saveNote();
            $scope.$apply();
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
        return folderTable.insert(fieldValues);
    };

    var deleteFolder = function (id, include_files) {
        /*
         Delete folder from datastore, if include_files then delete files in folder
         */
        include_files = typeof include_files !== 'undefined' ? include_files : false;

        var folder = getFolder(id);

        // If include_files, delete the notes in the folder
        if (include_files) {
            var notes = getNotes({folder: id});
            for (var i = 0; i < notes.length; i++) {
                notes[i].deleteRecord();
            }
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
        var notes = folder.get('notes').append(noteID);
        folder.set('notes', notes);
    };

    var removeNoteFromFolder = function (folder, noteId) {
        var notes = removeFromArray(folder.get('notes'), noteId);
        folder.set('notes', notes);
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
        folderId = typeof folderId !== 'undefined' ? folderId : '';
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

    var orphanedNote = function(note) {
        var folderId = note.get('folder');
        return folderId != null && folderId.length > 0;
    };


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
        for (var settingName in settings) {
            var value = settings[settingName];

            // Check if in current settings, if not add it
            var setting = getSettingByName(settingName);
            if (setting === undefined) {
                createSetting(name, value)
            } else {
                settings[setting.get('name')] = setting.get('value');
            }
        }
    };


    //=========================================================================
    // General helper methods
    //=========================================================================
    var removeFromArray = function (array, item) {
        var index = array.indexOf(item);
        array.splice(index, 1);
    };

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


    //=========================================================================
    // Initialize App
    //=========================================================================
    var init = function () {
        initializeSettings();
        initializeEditor();
    };


    //=========================================================================
    // Dropbox Authentication
    //=========================================================================
    dropstoreClient.create({key: APP_KEY})
        .authenticate({interactive: true})
        .then(function (datastoreManager) {
            return datastoreManager.openDefaultDatastore();
        })
        .then(function (datastore) {
            noteTable = datastore.getTable('notes');
            folderTable = datastore.getTable('folders');
            settingsTable = datastore.getTable('settings');

            reloadNotes();
            reloadFolders();
            init();
            return datastore;
        });

}
NoteController.$inject = ['$scope', 'dropstoreClient'];