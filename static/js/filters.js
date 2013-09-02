angular.module('filters', [])
    .filter('isInFolder', function () {
        return function (notes, folderId) {
            var i;
            if (folderId == null) {
//                var orphanedNotes = [];
//                for (i = 0; i < notes.length; i++) {
//                    folderId = notes[i].get('folder');
//                    if (!folderId || folderId.length < 1) {
//                        orphanedNotes.push(notes[i]);
//                    }
//                }
//                return orphanedNotes;
                return notes;
            } else {
                var notesInFolder = [];
                for (i = 0; i < notes.length; i++) {
                    if (notes[i].get('folder') == folderId) {
                        notesInFolder.push(notes[i]);
                    }
                }
                return notesInFolder;
            }


        }
    })
    .filter('isOrphaned', function () {
        return function (notes) {
            var orphanedNotes = [];
            for (var i = 0; i < notes.length; i++) {
                var folderId = notes[i].get('folder');
                if (!folderId || folderId.length < 1) {
                    orphanedNotes.push(notes[i]);
                }
            }
            return orphanedNotes;
        }

    });
