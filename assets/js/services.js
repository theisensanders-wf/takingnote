var app = angular.module('services', []);

app.service('datastore', function ($q, $rootScope) {

    var APP_KEY = 'qlmhguu4erp09wy';

    var client = new Dropbox.Client({key: APP_KEY});
    var datastore = $q.defer();

    // Try to finish OAuth authorization.
    client.authenticate({interactive: true}, function (error) {
        if (error) {
            alert('Authentication error: ' + error);
        }
    });

    if (client.isAuthenticated()) {
        var datastoreManager = client.getDatastoreManager();
        datastoreManager.openDefaultDatastore(function (error, _datastore) {
            if (error) {
                alert('Error opening default datastore: ' + error);
            }

            $rootScope.$apply(function () {
                datastore.resolve(_datastore);
            });


            // Now you have a datastore. The next few examples can be included here.
        });
        // Client is authenticated. Display UI.
    } else {
        setTimeout(function () {
            $rootScope.$broadcast('unauthenticated');
        }, 200);
    }

    $rootScope.$on('authenticate', function () {
        client.authenticate();
    });

    $rootScope.client = client;
    return datastore.promise;

//    var client = dropstoreClient.create({key: APP_KEY});
//    $rootScope.client = client._client;
//    var datastore = $q.defer();
//
//    debugger;
//
//    client.authenticate({interactive: false})
//        .then(function (datastoreManager) {
//            alert('test');
//            return datastoreManager.openDefaultDatastore();
//        })
//        .then(function (_datastore) {
//            datastore.resolve(_datastore);
//            $rootScope.$broadcast('authenticated');
//        }).then(function () {
//            client.getAccountInfo(function (error, info, obj) {
//                console.log('TEST');
//                console.log(info);
//            })
//        });
//
//    return datastore.promise
});


/**
 * API for getting, creating, updating and various interactions with Notes in the datastore
 * @param $q - Angular Promise Service
 * @param $rootScope - Root Scope service
 * @param datastore - Datastore promise service
 * @constructor
 */
var NoteAPIService = function ($q, $rootScope, datastore) {
    var table;
    var _deferredTable = $q.defer();

    datastore.then(function (_datastore) {
        table = _datastore.getTable('notes');
        _deferredTable.resolve(table);
    });
    var tablePromise = _deferredTable.promise


    datastore.then(function (_datastore) {
        table = _datastore.getTable('notes');
        $rootScope.$broadcast('notes');
    });


    /**
     * Get the notes in the datastore
     * @param {object} [fieldValues] - properties of notes, if undefined will get all notes
     * @returns {array} - notes matching given properties
     */
    this.query = function (fieldValues) {
        fieldValues = typeof fieldValues !== 'undefined' ? fieldValues : {};
        return table.query(fieldValues);
    };


    /**
     * Get the notes in the datastore wrapped in an angular deferred promise
     * @param {object} [fieldValues] - properties of notes, if undefined will get all notes
     * @returns {function} - promise
     */
    this.deferredQuery = function (fieldValues) {
        fieldValues = typeof fieldValues !== 'undefined' ? fieldValues : {};

        var deferredQuery = $q.defer();
        tablePromise.then(function (table) {
            deferredQuery.resolve(table.query(fieldValues));
        });
        return deferredQuery.promise;
    };


    /**
     * Get the note with the specified id
     * @param {string} id - the id of the note to get
     * @returns {object} Note with the given id
     */
    this.get = function (id) {
        return table.get(id);
    };


    /**
     * Create a new note
     * @param {string} name - the name of the note
     * @param {string} content - the content of the note
     * @returns {object} Created Note
     */
    this.create = function (name, content) {
        var date = new Date();
        content = typeof content !== 'undefined' ? content : '';

        var values = {
            name: name,
            created: date,
            modified: date,
            content: typeof content !== 'undefined' ? content : '',
            tags: []
        };

        if (!values.name || typeof values.name !== 'string') {
            throw "Invalid Note Name"
        }

        // Create Note
        return table.insert(values);
    };


    /**
     * Delete a note
     * @param {string|object} note - the note or the id of the note to delete
     */
    this.delete = function (note) {
        note = typeof note == 'string' ? this.get(note) : note;

        // Delete note
        note.deleteRecord();
        return note;
    };


    /**
     * Update a note with the given id
     * @param {string|object} note - the note or the id of the note to update
     * @param {object} props - the properties of the note to update
     * @returns {Object} Updated note
     */
    this.update = function (note, props) {
        note = typeof note == 'string' ? this.get(note) : note;

        // Default parameters
        props = typeof props !== 'undefined' ? props : {};

        // Update modified date
        props['modified'] = new Date();
        console.log(props['modified']);

        return note.update(props)
    };


    /**
     * Rename the note with the given id
     * @param {string|object} note - the note or the id of the note to rename
     * @param {string} newName - the new name of the note
     * @returns {object} Renamed note
     */
    this.rename = function (note, newName) {
        return this.update(note, {name: newName})
    };


    /**
     * Get the shortened content of the note
     * @param {string|object} note - the note or the id of the note
     * @param {number} [maxLength=15] - the max length of the content
     * @param {boolean} [breakOnNewLine=true] - break at a new line
     */
    this.getShortContent = function (note, maxLength, breakOnNewLine) {
        note = typeof note == 'string' ? this.get(note) : note;

        // Default params
        maxLength = typeof maxLength !== 'undefined' ? maxLength : 15;
        breakOnNewLine = typeof breakOnNewLine !== 'undefined' ? breakOnNewLine : true;

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
};
app.service('NoteAPI', NoteAPIService);


/**
 * API for getting, creating, updating and various interactions with Settings in the datastore
 * @param $q - Angular Promise Service
 * @param $rootScope - Root Scope service
 * @param datastore - Datastore promise service
 * @constructor
 */
var SettingAPIService = function ($q, $rootScope, datastore) {
    var table;
    var _deferredTable = $q.defer();

    datastore.then(function (datastore) {
        table = datastore.getTable('setting');
        _deferredTable.resolve(table);
    });
    var tablePromise = _deferredTable.promise;


    datastore.then(function (datastore) {
        table = datastore.getTable('settings');
    });


    /**
     * Query for settings matching the given values
     * @param [fieldValues] - the values of the settings to get, if undefined gets all settings
     * @returns {array} the settings matching the given values
     */
    this.query = function (fieldValues) {
        fieldValues = typeof fieldValues !== 'undefined' ? fieldValues : {};
        return table.query(fieldValues);
    };

    /**
     * Get the settings in the datastore wrapped in an angular deferred promise
     * @param {object} [fieldValues] - properties of settings, if undefined will get all settings
     * @returns {function} - promise
     */
    this.deferredQuery = function (fieldValues) {
        fieldValues = typeof fieldValues !== 'undefined' ? fieldValues : {};

        var deferredQuery = $q.defer();
        tablePromise.then(function (table) {
            deferredQuery.resolve(table.query(fieldValues));
        });
        return deferredQuery.promise;
    };


    /**
     * Gets the setting with the given id
     * @param {string} id - the id of the setting to get
     * @returns {object} the setting with the given id
     */
    this.get = function (id) {
        return table.get(id)
    };


    /**
     * Create a new setting
     * @param {string} name - the name of the setting
     * @param {string|boolean|number} value - the value of the setting
     * @returns {object} Created setting
     */
    this.create = function (name, value) {
        value = typeof value !== 'undefined' ? value : null;
        return table.insert({
            name: name,
            value: value
        })
    };


    /**
     * Update setting with the given id
     * @param {string|object} setting - the setting or id of the setting to update
     * @param {object} props - the properties of the setting to update
     * @returns {object} Updated setting
     */
    this.update = function (setting, props) {
        setting = typeof setting == 'string' ? this.get(setting) : setting;
        return setting.update(props);
    };


    /**
     * Delete the setting with the given id
     * @param {string|object} setting - the setting or id of the setting to delete
     * @returns {object} Deleted setting
     */
    this.delete = function (setting) {
        setting = typeof setting == 'string' ? this.get(setting) : setting;
        return setting.deleteRecord();
    };


    /**
     * Get a setting by its name
     * @param {string} name - the name of the setting to get
     * @returns {object} Setting with given name
     */
    this.getByName = function (name) {
        return this.query({name: name})[0];
    };


    /**
     * Change the value of a function with the given id
     * @param {string|object} setting - the setting or id of the setting to change
     * @param {string|boolean|number} newValue - the new value of the setting
     * @returns {*|Object|Object|Object}
     */
    this.changeValue = function (setting, newValue) {
        setting = typeof setting == 'string' ? this.get(setting) : setting;
        return this.update(setting, {value: newValue});
    };


    /**
     * Toggle a given setting. The setting must be a boolean setting
     * @param {string|object} setting - the setting or id of the setting to toggle
     * @returns {object} - the updated setting
     */
    this.toggle = function (setting) {
        setting = typeof setting == 'string' ? this.get(setting) : setting;
        var value = setting.get('value');

        if (typeof value !== "boolean") {
            throw "Cannot toggle a non-boolean setting"
        }

        return setting.set('value', !value);
    };
};
app.service('SettingAPI', SettingAPIService);


app.service('fileUpload', function ($rootScope) {
    var isImage = function (fileType) {
        return fileType.match('image*') !== null;
    };


    this.upload = function (file) {
        if (file !== undefined) {
            var image = isImage(file.type);
            var path = '/' + file.type.split('/')[0] + '/' + file.name;

            if (isImage(file.type)) {
                image = true;
                path = '/image/' + file.name;
            }

            var result = $rootScope.client.writeFile(path, file, function (error, stat) {
                // Get url
                $rootScope.client.makeUrl(path, {download: true}, function (error, shareUrl) {

                    if (image) {
                        $rootScope.$broadcast('New Image', file.name, shareUrl.url);
                    } else {
                        $rootScope.$broadcast('New File', file.name, shareUrl.url)
                    }

                    $rootScope.$apply();
                });
            });
        } else {
            alert('Invalid file');
        }
    }
});
//
//app.service('noteContent', function () {
//    this.addContent
//})

