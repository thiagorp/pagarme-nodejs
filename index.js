var models = {

};

function PagarMe (key) {

    if (!(this instanceof PagarMe)) {
        return new PagarMe(key);
    }

    this._api = {
        key: key,
        endpoint: 'https://api.pagar.me',
        version: '1'
    };

    this._loadModels();
};

PagarMe.prototype = {

    _loadModels: function() {
        for (var model in models) {
            this[model] = new models[model](this);
        }
    }

};

//module.exports = PagarMe;