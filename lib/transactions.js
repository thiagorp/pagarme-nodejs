var Model = require('./model');
var PagarMeError = require('./error');

var utils = require('./utils');

var async = require('async');
var _ = require('underscore');
var ursa = require('ursa');

_.mixin({ "eachSlice": function (obj, size, iterator, context) {
    for (var i = 0, l = obj.length; i < l; i += size) {
        iterator.call(context, obj.slice(i, i + size), i, obj);
    }
}});

var unsetCreditCardInformation = function (obj) {
    delete obj.card_number;
    delete obj.card_expiration_date;
    delete obj.card_holder_name;
    delete obj.card_cvv;
}

var createParameterError = function (field, message) {
    return {
        parameter_name: field,
        type: 'invalid_parameter',
        message: message
    };
};

var isValidCreditCard = function (number) {
    var s1 = 0;
    var s2 = 0;
    var reversedNumber = number.split("").reverse();

    _.eachSlice(reversedNumber, 2, function(arr) {
        s1 += parseInt(arr[0]);
        var d = parseInt(arr[1]) * 2;
        if (d >= 10) {
            d -= 9;
        }
        s2 += d;
    });

    return (s1 + s2) % 10 == 0;
};

var getCreditCardErrors = function (body) {
    var errors = [];

    if (body.payment_method == 'credit_card') {
        if (!body.card_number || body.card_number.toString().length > 20 || !isValidCreditCard(body.card_number.toString())) {
            errors.push(createParameterError('card_number', 'Número do cartão inválido.'));
        }

        if (!body.card_holder_name || body.card_holder_name.length == 0) {
            errors.push(createParameterError('card_holder_name', 'Nome do portador inválido.'));
        }

        if (typeof body.card_expiration_date == "number") {
            body.card_expiration_date = body.card_expiration_date.toString();
        }

        if (!body.card_expiration_date || body.card_expiration_date.length != 4) {
            errors.push(createParameterError('card_expiration_date', 'Data de expiração inválida.'));
        } else {
            var expirationMonth = parseInt(body.card_expiration_date.substr(0, 2));
            var expirationYear = parseInt(body.card_expiration_date.substr(2, 2));

            if (expirationMonth <= 0 || expirationMonth > 12) {
                errors.push(createParameterError('card_expiration_date', 'Mês de expiração inválido.'));
            }

            if (expirationYear <= 0) {
                errors.push(createParameterError('card_expiration_date', 'Ano de expiração inválido.'));
            }
        }

        if (!body.card_cvv || body.card_cvv.length < 3 || body.card_cvv.length > 4) {
            errors.push(createParameterError('card_cvv', 'Código de segurança inválido.'));
        }
    }

    if (errors.length) {
        return new PagarMeError(errors);
    } else {
        return false;
    }
};

var generateCardHash = function (body, next) {
    var cont = false;
    var hash = '';

    this._cardHash(function (err, data) {

        var key = ursa.createPublicKey(new Buffer(data.public_key));
        var cardObj = {
            card_number: body.card_number,
            card_holder_name: body.card_holder_name,
            card_expiration_date: body.card_expiration_date,
            card_cvv: body.card_cvv
        };
        var cardData = utils.stringfyBody(cardObj);
        var encoded = key.encrypt(new Buffer(cardData, 'utf8'), 'utf8', 'base64', ursa.RSA_PKCS1_PADDING);

        body.card_hash = data.id + '_' + encoded;
        next();

    });
};

var beforeCreate = function (body, callback) {
    body.payment_method = body.payment_method || 'credit_card';
    body.installments = body.installments || 1;
    body.status = body.status || 'local';

    var error = body.card_hash ? null : getCreditCardErrors(body);
    var that = this;

    async.series([function (next) {
        if (!body.card_hash && !error) {
            generateCardHash.apply(that, [body, next]);
        } else {
            next();
        }
    }], function (err, data) {
        unsetCreditCardInformation(body);

        if (error) {
            callback(error);
            return;
        }

        callback();
    });
};

module.exports = Model.extend({
    path: '/transactions',

    create: Model.createMethod({
        method: 'POST',
        before: beforeCreate
    }),

    refund: Model.createMethod({
        method: 'POST',
        urlData: '/{id}/refund'
    }),

    _cardHash: Model.createMethod({
        method: 'GET',
        urlData: '/card_hash_key'
    })
});