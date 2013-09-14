/**
 * Main controller
 * @param {object} $scope - application model
 * @constructor
 */
function NoteController($scope, datastore, NoteAPI, SettingAPI) {
    $scope.notes = null;

    NoteAPI.deferredQuery().then(function (_notes) {
        $scope.notes = _notes;
    });

    SettingAPI.deferredQuery().then(function (_settings) {
        var lastOpenedNote = NoteAPI.get(SettingAPI.getByName('lastOpenedNote').get('value'));
        $scope.openNote(lastOpenedNote);
    });

    $scope.current = {note: null};

    $scope.overlayActive = true;

    $scope.sidebarActive = true;
    $scope.toggleSidebar = function () {
        $scope.sidebarActive = !$scope.sidebarActive;
    };


    //=========================================================================
    // Note Helper Methods
    //=========================================================================
    $scope.openNote = function (note) {
        $scope.current.note = note;
    };

    $scope.closeNote = function () {
        $scope.current.note = null;
    };

    $scope.deleteNote = function (note) {
        var id = note.getId();
        if (id == $scope.current.note.getId()) {
            $scope.closeNote();
        }

        $scope.notes.splice($scope.notes.indexOf(note), 1);
        NoteAPI.delete(note);
    };

    $scope.createNote = function (name, content) {
        var note = NoteAPI.create(name, content);
        $scope.notes.push(note);
        $scope.openNote(note);
    };

    $scope.isActiveNote = function (note) {
        if ($scope.current.note != null) {
            return note.getId() == $scope.current.note.getId();
        }
        return false;
    };

//    $scope.getModified = function(note) {
//        return N
//    };

    $scope.authenticate = function () {
        $scope.$emit('authenticate');
    };

    $scope.$watch('current.note', function (value) {
        if (value != null) {
            var name = 'lastOpenedNote';
            var noteId = value.getId();
            var setting = SettingAPI.getByName(name);
            if (!setting) {
                setting = SettingAPI.create(name, noteId)
            } else {
                setting = SettingAPI.changeValue(setting, noteId)
            }
        }
    });

    $scope.$on('unauthenticated', function(event) {
        $scope.overlayActive = true;
        $scope.$apply();
    });

    $scope.$on('authenticated', function(event) {
        $scope.overlayActive = false;
        $scope.$apply();
    });

    // Listeners

    $scope.$on('New Image', function (event, name, url) {
        var note = $scope.current.note;
        $scope.current.note = null;

        var md_formatted = '![' + name + '](' + url + ')';
        var content = note.get('content');
        content += md_formatted;
        note = note.update({content: content});

        $scope.current.note = note;
        $scope.$apply();
    });

    $scope.$on('New File', function (event, name, url) {
        alert('new file');
//        editor.appendContent('[' + name + '](' + url + ')');
    });
}
NoteController.$inject = ['$scope', 'datastore', 'NoteAPI', 'SettingAPI'];