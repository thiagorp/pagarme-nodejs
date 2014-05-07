'use strict';

var _ = require('underscore');

var utils = module.exports = {

    pagarMe: require('../index')('ak_test_Rw4JR98FmYST2ngEHtMvVf5QJW7Eoo'),

    getApiKey: function () {
        return 'ak_test_Rw4JR98FmYST2ngEHtMvVf5QJW7Eoo';
    },

    getTransactionObj: function (params) {
        params = params || {};

        return _.extend({
            card_number: '4901720080344448',
            card_holder_name: 'Jose da Silva',
            card_expiration_date: '1015',
            card_cvv: '314',
            amount: 1000
        }, params);
    },

    getTransactionWithCustomerObj: function (params) {
        params = params || {};

        return _.extend(this.getTransactionObj(), {
            customer: {
                name: 'Jose da Silva',
                document_number: '36433809847',
                email: 'henrique@pagar.me',
                address: {
                    street: 'Av. Brigadeiro Faria Lima',
                    neighborhood: 'Itaim bibi',
                    zipcode: '01452000',
                    street_number: 2941,
                },
                phone: {
                    ddd: 12,
                    number: '981433533',
                },
                sex: 'M',
                born_at: '1970-10-11'
            }
        }, params);
    }

};