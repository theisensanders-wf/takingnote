

/**
 * Main controller
 * @param {object} $scope - application model
 * @constructor
 */
function NoteController($scope, FolderAPI, NoteAPI, SettingAPI) {
    $scope.notes = null;
    $scope.folders = null;

    FolderAPI.deferredQuery().then(function (_folders) {
        $scope.folders = _folders;
    });
    NoteAPI.deferredQuery().then(function (_notes) {
        $scope.notes = _notes;
    });

    $scope.current = {
        folder: null,
        note: null
    };

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
//        settings.darkTheme = SettingAPI.getByName('darkTheme').get('value');

        var options = {
            container: 'epic-editor',
            basePath: 'static/css',
            clientSideStorage: false,
            theme: {
                base: '/epiceditor.css',
                preview: '/preview-dark.css',
                editor: '/epic-dark.css'
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

//            $scope.$watch('settings.darkTheme', function (newValue) {
//                var setting = SettingAPI.getByName('darkTheme');
//                SettingAPI.changeValue(setting.getId(), newValue);
//            });
//
//            $scope.$watch('settings.fontSize', function (newValue) {
//                var setting = SettingAPI.getByName('fontSize');
//                SettingAPI.changeValue(setting.getId(), newValue);
//            });
//
//            $scope.$watch('settings.autoSave', function (newValue) {
//                var setting = SettingAPI.getByName('autoSave');
//                SettingAPI.changeValue(setting.getId(), newValue);
//            });
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
    var editor = Editor();


    //=========================================================================
    // Folder Helper Methods
    //=========================================================================
    $scope.createFolder = function (name) {
        var folder = FolderAPI.create(name);
        $scope.folders.push(folder);
    };

    $scope.deleteFolder = function (folder) {
        if ($scope.current.folder == folder) {
            $scope.current.folder = null;
        }

        FolderAPI.delete(folder, false);
        $scope.folders.splice($scope.folders.indexOf(folder), 1);
    };

    $scope.renameFolder = function (folderId, newName) {
        FolderAPI.update(folderId, {name: newName});
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
    // Note Helper Methods
    //=========================================================================
    var reloadNotes = function () {
        $scope.notes = NoteAPI.query();
        if ($scope.current.note != null) {
            openNote($scope.current.note);
        }
    };

    $scope.alert = function(file) {
        alert(file);
    };

    var openNote = function (id) {
        var note = NoteAPI.get(id);
        editor.loadContent(note.get('content'));
        $scope.current.note = id;
    };
    $scope.openNote = openNote;

    var closeNote = function () {
        $scope.current.note = null;
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
//
//    $scope.createNote = function () {
//        closeNote();
//        $scope.saveNote();
//    };

    $scope.renameNote = NoteAPI.rename;

    $scope.deleteNote = function (note) {
        var id = note.getId();
        if (id == $scope.current.note) {
            closeNote();
        }

        $scope.notes.splice($scope.notes.indexOf(note), 1);
        NoteAPI.delete(note);
    };

    $scope.createNote = function (name, content) {
        if (!$scope.current.folder) {
            alert('No folder selected');
            throw "No folder selected";
        }

        var note = NoteAPI.create(name, $scope.current.folder.getId(), content);
        $scope.current.note = note.getId();
        $scope.notes.push(note);
    };

    $scope.addNote = function (name, content) {
        editor.clearContent();
        $scope.createNote(name, content);
    };

    $scope.updateNoteContent = function (content) {
        NoteAPI.update($scope.current.note, {content: content});
    };

    $scope.saveNote = function () {
        var content = editor.getContent();

        if ($scope.current.note == null) {
            $scope.createNote('New Note', content);
        } else {
            $scope.updateNoteContent(content);
        }
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
    // General helper methods
    //=========================================================================
    var clearData = function () {
        var items = SettingAPI.query().concat(NoteAPI.query()).concat(FolderAPI.query());
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

    $scope.toggleSidebar = function() {
        $scope.$broadcast('toggleSidebar');
    };


    //=========================================================================
    // Initialize App

    $scope.$on('New Image', function (event, name, url) {
        editor.appendContent('![](' + url + ')');
    });

    $scope.$on('New File', function (event, name, url) {
        editor.appendContent('[' + name + '](' + url + ')');
    });
}
NoteController.$inject = ['$scope', 'FolderAPI', 'NoteAPI', 'SettingAPI'];

/**
 * Controller for the Sidebar
 * @param $scope
 * @constructor
 */
function SidebarController($scope) {
    var FOLDERS = $scope.FOLDERS = 'folders';
    var NOTES = $scope.NOTES = 'notes';
    var SETTINGS = $scope.SETTINGS = 'settings';
    $scope.sidebarType = FOLDERS;

    $scope.activeSidebar = true;

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


    /**
     * Close the sidebar
     */
    Sidebar.close = function () {
        $scope.activeSidebar = false;
    };


    /**
     * Toggle the sidebar
     */
    Sidebar.toggle = function () {
        $scope.activeSidebar = !$scope.activeSidebar;
    };

    /**
     * Set the content type of the sidebar
     * @param {string} type - the content type of the sidebar
     */
    Sidebar.setContentType = function (type) {
        $scope.sidebarType = type;
    };


    /**
     * Select a folder to be the active folder. Switch to notes.
     * @param {object} folder - the folder to select
     */
    Sidebar.selectFolder = function (folder) {
        if (!folder) {
            throw 'Folder does not exist'
        }

        $scope.current.folder = folder;
        Sidebar.setContentType('notes');
    };

    $scope.$on('toggleSidebar', Sidebar.toggle);

    $scope.sidebar = Sidebar;
}
SidebarController.$inject = ['$scope'];


//function EditorController($scope) {
//
//}
//EditorController.$inject = ['$scope', 'FolderAPI', 'NoteAPI', 'SettingAPI'];
