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
        if ($scope.current.note != null && confirm('Are you sure you want to delete this note?')) {
            var id = note.getId();
            if (id == $scope.current.note.getId()) {
                $scope.closeNote();
            }

            $scope.notes.splice($scope.notes.indexOf(note), 1);
            NoteAPI.delete(note);
        }
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

    $scope.resetAll = function () {
        if (confirm('Are you sure you want to erase all your data?')) {
            $scope.current.note = null;
            $scope.notes = [];

            var settings = SettingAPI.query();
            var notes = NoteAPI.query();

            var to_delete = [].concat(settings).concat(notes);

            for (var i = 0; i < to_delete.length; i++) {
                var record = to_delete[i];
                record.deleteRecord();
            }
        }
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

    $scope.$on('unauthenticated', function (event) {
        $scope.overlayActive = true;
        $scope.$apply();
    });

    $scope.$on('authenticated', function (event) {
        $scope.overlayActive = false;
        $scope.$apply();
    });

    // Listeners
}
NoteController.$inject = ['$scope', 'datastore', 'NoteAPI', 'SettingAPI'];