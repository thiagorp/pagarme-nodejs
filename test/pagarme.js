var should = require('should');
var testUtils = require('./utils');

var api = require('../index');
var pagarme = api(testUtils.getApiKey());

describe('PagarMe', function() {

    it('should load all models on initialization', function() {
        pagarme.transactions.should.be.ok;
    });

    it('should load api key', function() {
        pagarme._api.key.should.be.equal(testUtils.getApiKey());
    });

});