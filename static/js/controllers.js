var APP_KEY = '3r8ynvj5hvg8hqr';

function NoteController($scope, dropstoreClient) {
    $scope.notes = [];

    var noteTable = null;
    var settingsTable = null;

    var currentFile = null;
    var editor = null;

    $scope.settings = {
        darkTheme: true
    };

    //=========================================================================
    // Editor
    //=========================================================================
    var initializeEditor = function () {
        $scope.settings.darkTheme = getSetting('darkTheme').get('value');
        var theme = $scope.settings.darkTheme ? '/epic-dark.css' : '/epic-light.css';
        console.log($scope.settings.darkTheme);
        console.log(theme);

        var epicOptions = {
            container: 'epic-editor',
            basePath: 'static/css',
            clientSideStorage: false,
            theme: {
                base: '/epiceditor.css',
                preview: '/github.css',
                editor: $scope.settings.darkTheme ? '/epic-dark.css' : '/epic-light.css'
            },
            file: {
                autoSave: 1000
            },
            focusOnLoad: true,
            autogrow: true
        };

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
    // Notes API
    //=========================================================================
    var getNotes = function (fieldValues) {
        // Return the notes in the datastore
        fieldValues = typeof fieldValues !== 'undefined' ? fieldValues : {};
        return noteTable.query(fieldValues);
    };

    var getNote = function (id) {
        // Return the note with the specified ID
        return noteTable.get(id);
    };

    var createNote = function (content, fieldValues) {
        // Create a new note in the datastore with the given content
        var date = new Date();
        content = typeof content !== 'undefined' ? content : '';
        fieldValues = typeof fieldValues !== 'undefined' ? fieldValues : {
            created: date,
            modified: date,
            content: content
        };
        return noteTable.insert(fieldValues);
    };

    var deleteNote = function (id) {
        // Delete the note for the datastore
        var note = getNote(id).deleteRecord();
        reloadNotes();
        return note;
    };

    var updateNote = function (id, props) {
        // Update the note with the given properties
        var note = getNote(id);
        props = typeof props !== 'undefined' ? props : {};
        props['modified'] = new Date();
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

    var closeNote = function () {
        currentFile = null;
        loadContent('');
        editor.focus();
    };

    var getCreated = function (note) {
        var date = note.get('created');
        var day = date.getDate();
        var month = date.getMonth();
        var year = date.getFullYear();
        var string = month + '/' + day + '/' + year
        return string
    };


    //=========================================================================
    // Settings API
    //=========================================================================
    var getSettings = function () {
        return settingsTable.query();
    };

    var getSetting = function (setting) {
        return settingsTable.query({name: setting})[0]
    };

    var createSetting = function (name, value) {
        // Create a new setting with the given name and value
        value = typeof value !== 'undefined' ? value : false;
        return settingsTable.insert({
            name: name,
            value: value
        })
    };

    var updateSetting = function (name, value) {
        var setting = getSetting(name);
        return setting.set('value', value);
    };

    var toggleSetting = function (name) {
        var setting = getSetting(name);
        var newValue = !setting.get('value');
        return setting.set('value', newValue);
    };

    var initializeSettings = function () {
        // Initialize the settingss
//        var currentSettings = getSettings();
        for (var setting in $scope.settings) {
            var name = setting;
            var value = $scope.settings[name];

            // Check if in current settings, if not add it
            var setting = getSetting(name);
            if (setting === undefined) {
                createSetting(name, value)
            } else {
                $scope.settings[setting.get('name')] = setting.get('value');
            }

        }
    };


    //=========================================================================
    // Scope Methods
    //=========================================================================
    $scope.openNote = openNote;
    $scope.closeNote = closeNote;
    $scope.getCreated = getCreated;

    $scope.removeNote = function (note) {
        var id = note.getId();
        if (id == currentFile) {
            closeNote();
        }
        deleteNote(id);
    };

    $scope.saveNote = function () {
        var content = getContent();

        if (currentFile == null) {
            var note = createNote(content);
            currentFile = note.getId();
        } else {
            updateNote(currentFile, {content: content});
        }

        reloadNotes();
    };

    $scope.getContentShort = function (note) {
        return note.get('content').substr(0, 10);
    };

    $scope.toggleTheme = function () {
        var setting = toggleSetting('darkTheme');
    };


    //=========================================================================
    // Initialize App
    //=========================================================================
    var init = function () {
        initializeEditor();

        initializeSettings();
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
            settingsTable = datastore.getTable('settings');

            reloadNotes();
            init();
            return datastore;
        });

}
NoteController.$inject = ['$scope', 'dropstoreClient'];