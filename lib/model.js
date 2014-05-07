'use strict';

var _ = require('underscore');
var https = require('https');
var utils = require('./utils');
var async = require('async');
var PagarMeError = require('./error');

Model.createMethod = function (obj) {

    var reqMethod = obj.method.toUpperCase();
    var urlData = obj.urlData || '';
    var params = urlData.match(/\{(\w+)\}/g) || [];

    var beforeHook = obj.before;

    return function () {

        var args = Array.prototype.slice.call(arguments);
        var callback = args.length && typeof args[args.length - 1] == 'function' && args.pop();
        var body = args.length > params.length && args.pop() || {};
        var path = urlData;
        var that = this;

        if (args.length < params.length) {
            var expectedArgs = [];

            _.each(params, function (arg) {
                expectedArgs.push(arg.substr(1, arg.length - 2));
            });

            throw {name: 'MissingArguments', message: 'This function expects the following parameters: ' + expectedArgs.join(', ')};
            return;
        }

        _.each(params, function (param) {
            path = urlData.replace(param, args[0]);
            args = args.slice(1);
        });

        async.series([function (next) {
            if (beforeHook) {
                beforeHook.apply(that, [body, next]);
            } else {
                next(null);
            }
        }], function (err, results) {

            if (err) {
                if (callback) {
                    callback(err, null);
                    return;
                }
            }

            body['api_key'] = that._pagarme.getApiKey();

            body = utils.stringfyBody(body);

            var requestOptions = {
                hostname: that._pagarme.baseUrl(),
                path: that._pagarme.buildPath(that.path + path),
                method: reqMethod,
                headers: {
                    'Accept': '*/*',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': body.length
                }
            };

            var req = https.request(requestOptions, that._handleResponse(callback));

            req.on('error', that._handleError(callback));
            req.write(body);
            req.end();

        });
    };
};

var builtInMethods = {

    create: Model.createMethod({
        method: 'POST'
    }),

    all: Model.createMethod({
        method: 'GET'
    }),

    findById: Model.createMethod({
        method: 'GET',
        urlData: '/{id}'
    }),

    update: Model.createMethod({
        method: 'PUT',
        urlData: '/{id}'
    }),

    findBy: Model.createMethod({
        method: 'GET'
    })
};

function Model(pagarme) {
    this._pagarme = pagarme;
    var exclude = this.exclude || [];

    //Add the basic built in methods
    for (var name in builtInMethods) {
        if (exclude.indexOf(name) == -1 && !this[name]) {
            this[name] = builtInMethods[name];
        }
    }
};

Model.prototype = {

    _handleResponse: function (callback) {
        return function (res) {
            var data = '';

            res.on('data', function (chunk) {
                data += chunk;
            });

            res.on('end', function () {
                if (callback) {
                    var responseObj = JSON.parse(data);

                    if (res.statusCode / 100 === 2) {
                        callback(null, responseObj);
                    } else {
                        var e = new PagarMeError(responseObj.errors);
                        callback(e, null);
                    }
                }
            });
        };
    },

    _handleError: function (callback) {
        return function (e) {
            if (callback) {
                callback(e, null);
            }
        };
    }

};

Model.extend = function (sub) {
    var _super = this;
    var _constructor = function () {
        _super.apply(this, arguments);
    };

    _constructor.prototype = Object.create(_super.prototype);

    for (var i in sub) {
        if (sub.hasOwnProperty(i)) {
            _constructor.prototype[i] = sub[i];
        }
    }

    return _constructor;
};

module.exports = Model;