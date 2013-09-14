

/**
 * Main controller
 * @param {object} $scope - application model
 * @constructor
 */
function NoteController($scope, NoteAPI) {
    $scope.notes = null;

    NoteAPI.deferredQuery().then(function (_notes) {
        $scope.notes = _notes;
    });

    $scope.current = {
        note: null
    };

    $scope.sidebarActive = true;


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


//        this._editor.load();
//        this._editor.focus();
//        initializeListeners(this._editor);
        return this;
    };
//    var editor = Editor();

    //=========================================================================
    // Note Helper Methods
    //=========================================================================
//    var reloadNotes = function () {
//        $scope.notes = NoteAPI.query();
//        if ($scope.current.note != null) {
//            openNote($scope.current.note);
//        }
//    };

    $scope.openNote = function (note) {
        $scope.current.note = note;
    };

    $scope.closeNote = function () {
        $scope.current.note = null;
    };

    $scope.deleteNote = function (note) {
        var id = note.getId();
        if (id == $scope.current.note) {
            $scope.closeNote();
        }

        $scope.notes.splice($scope.notes.indexOf(note), 1);
        NoteAPI.delete(note);
    };

    $scope.createNote = function (name, content) {
        var note = NoteAPI.create(name, content);
        $scope.current.note = note.getId();
        $scope.notes.push(note);
    };

    $scope.updateNoteContent = function (note, content) {
        NoteAPI.update({content: content})
    };

    // Listeners

    $scope.$on('New Image', function (event, name, url) {
        editor.appendContent('![](' + url + ')');
    });

    $scope.$on('New File', function (event, name, url) {
        editor.appendContent('[' + name + '](' + url + ')');
    });
}
NoteController.$inject = ['$scope', 'NoteAPI', 'SettingAPI'];