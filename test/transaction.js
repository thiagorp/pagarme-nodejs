'use strict';

var should = require('should');
var async = require('async');
var _ = require('underscore');

var utils = require('./utils');
var PagarMe = utils.pagarMe;
var transactions = PagarMe.transactions;

var testTransactionResponse = function (transaction) {
    transaction.id.should.be.ok;
    transaction.card_holder_name.should.be.ok;
    transaction.card_holder_name.should.equal('Jose da Silva');
    transaction.date_created.should.be.ok;
    transaction.amount.should.equal(1000);
    parseInt(transaction.installments).should.equal(1);
    transaction.payment_method.should.equal('credit_card');
    transaction.status.should.equal('paid');
    should.equal(transaction.refuse_reason, null);
};

var testCustomerResponse = function (customer) {
    customer.id.should.be.ok;
    customer.document_type.should.equal('cpf');
    customer.name.should.equal('Jose da Silva');
    customer.born_at.should.be.ok;
};

describe('Transaction', function () {
    it('should be able to charge anything', function (done) {
        transactions.create(utils.getTransactionObj(), function (err, transaction) {
            should.not.exist(err);
            testTransactionResponse(transaction);
            done();
        });
    });

    it('should be able to refund', function (done) {

        async.seq(function (next) {
            transactions.create(utils.getTransactionObj(), function (err, transaction) {
                should.not.exist(err);
                testTransactionResponse(transaction);
                next(null, transaction);
            });
        }, function (transaction) {
            transactions.refund(transaction.id, function (err, transaction) {
                should.not.exist(err);
                transaction.status.should.equal('refunded');
                done();
            });
        })();
    });

    it('should be able to find by anything', function (done) {
        var criteria = {
            customer: {
                document_number: 36433809847
            },
            page: 2,
            count: 10
        };
        transactions.findBy(criteria, function (err, transactions) {
            transactions.should.have.lengthOf(10);
            _.each(transactions, function (transaction) {
                transaction.customer.document_number.should.equal('36433809847')
            });
            done();
        });
    });

    it('should be able to create transaction with boleto', function (done) {
        transactions.create({
            payment_method: 'boleto',
            amount: 1000
        }, function (err, transaction) {
            transaction.payment_method.should.equal('boleto');
            transaction.status.should.equal('waiting_payment');
            transaction.amount.should.equal(1000);
            done();
        });
    });

    it('should be able to send metadata', function (done) {
        async.seq(function (next) {
            transactions.create(utils.getTransactionObj({
                metadata: {
                    event: {
                        name: 'Evento foda',
                        id: 335
                    }
                }
            }), function (err, transaction) {
                should.not.exist(err);
                transaction.metadata.should.be.ok;
                next(null, transaction);
            })
        }, function (obj) {
            transactions.findById(obj.id, function (err, transaction) {
                should.not.exist(err);
                transaction.metadata.event.id.should.equal('335');
                transaction.metadata.event.name.should.equal('Evento foda');
                done();
            });
        })();
    });

    it('should be able to find transaction by id', function (done) {
        async.seq(function (next) {
            transactions.create(utils.getTransactionObj(), function (err, transaction) {
                testTransactionResponse(transaction);
                next(null, transaction);
            });
        }, function (obj) {
            transactions.findById(obj.id, function (err, transaction) {
                transaction.id.should.equal(obj.id);
                done();
            });
        })();
    });

    it('should be able to create transaction with customer', function (done) {
        var transactionObj = utils.getTransactionWithCustomerObj();
        transactions.create(transactionObj, function (err, transaction) {
            should.not.exist(err);
            testTransactionResponse(transaction);
            transaction.address.street.should.equal(transactionObj.customer.address.street);
            testCustomerResponse(transaction.customer);
            done();
        });
    });

    it('should be able to refund transaction with customer', function (done) {
        async.seq(function (next) {
            transactions.create(utils.getTransactionWithCustomerObj(), function (err, transaction) {
                should.not.exist(err);
                testTransactionResponse(transaction);
                testCustomerResponse(transaction.customer);
                next(null, transaction);
            });
        }, function(obj) {
            transactions.refund(obj.id, function (err, transaction) {
                should.not.exist(err);
                transaction.status.should.equal('refunded');
                done();
            });
        })();
    });

    it('should validate invalid transaction', function (done) {
        async.series([
            function(next) {
                transactions.create({amount: '1000', card_number: '123456', card_holder_name: 'Jose da Silva'}, function (err, data) {
                    err.should.be.ok;
                    err.errors[0].parameter_name.should.equal('card_number');
                    next();
                });
            }, function(next) {
                transactions.create({card_number: '4111111111111111', amount: '1000'}, function (err, data) {
                    err.should.be.ok;
                    err.errors[0].parameter_name.should.equal('card_holder_name');
                    next();
                });
            }, function(next) {
                transactions.create({card_number: '4111111111111111', amount: '1000', card_holder_name: 'Jose da Silva', card_expiration_date: '10'}, function (err, data) {
                    err.should.be.ok;
                    err.errors[0].parameter_name.should.equal('card_expiration_date');
                    next();
                });
            }, function(next) {
                transactions.create({card_number: '4111111111111111', amount: '1000', card_holder_name: 'Jose da Silva', card_expiration_date: '1510'}, function (err, data) {
                    err.should.be.ok;
                    err.errors[0].parameter_name.should.equal('card_expiration_date');
                    next();
                });
            }, function(next) {
                transactions.create({card_number: '4111111111111111', amount: '1000', card_holder_name: 'Jose da Silva', card_expiration_date: '1216'}, function (err, data) {
                    err.should.be.ok;
                    err.errors[0].parameter_name.should.equal('card_cvv');
                    next();
                });
            }
        ], function() {
            done();
        });
    });
});