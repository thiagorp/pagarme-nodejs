function PagarMeError(errors) {
    this.name = 'PagarMeError';

    var errorMessages = [];

    for (var i = 0; i < errors.length; i++) {
        errorMessages.push(errors[i].message);
    }

    this.message = errorMessages.join("\n");
    this.errors = errors;
}

PagarMeError.prototype = Error.prototype;

module.exports = PagarMeError;