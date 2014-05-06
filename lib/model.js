'use strict';

var _ = require('underscore');
var https = require('https');
var utils = require('./utils');
var PagarMeError = require('./error');

Model.createMethod = function(obj) {

    var reqMethod = obj.method.toUpperCase();
    var urlData = obj.urlData || '';
    var params = urlData.match(/\{(\w+)\}/g) || [];

    return function() {

        var args = Array.prototype.slice.call(arguments);
        var callback = args.length && typeof args[args.length-1] == 'function' && args.pop();
        var body = args.length > params.length && args.pop() || {};

        _.each(params, function(param) {
            urlData = urlData.replace(param, args[0]);
            args = args.slice(1);
        });


        body['api_key'] = this._pagarme.getApiKey();

        body = utils.stringfyBody(body);

        var requestOptions = {
            hostname: this._pagarme.baseUrl(),
            path: this._pagarme.buildPath(this.path + urlData),
            method: reqMethod,
            headers: {
                'Accept': '*/*',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': body.length
            }
        };

        var req = https.request(requestOptions, this._handleResponse(callback));

        req.on('error', this._handleError(callback));
        req.write(body);
        req.end();
    };
};

function Model(pagarme) {

    this._pagarme = pagarme;

};

Model.prototype = {

    create: Model.createMethod({
        method: 'POST'
    }),

    all: Model.createMethod({
        method: 'GET'
    }),

    get: Model.createMethod({
        method: 'GET',
        urlData: '/{id}'
    }),

    _handleResponse: function(callback) {
        return function(res) {
            var data = '';

            res.on('data', function(chunk) {
                data += chunk;
            });

            res.on('end', function() {
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

    _handleError: function(callback) {
        return function(e) {
            if (callback) {
                callback(e, null);
            }
        };
    }

};

Model.extend = function(sub) {
    var _super = this;
    var _constructor = function() {
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