module.exports = {

    stringfyBody: function(body, parent) {
        var ret = [];

        for (var k in body) {
            var current_key = parent ? parent + "[" + encodeURIComponent(k) + "]" : encodeURIComponent(k);

            if (body[k] instanceof Array) {
                ret.push(this.stringfyArray(body[k], current_key));
            } else if (body[k] instanceof Object) {
                ret.push(this.stringfyBody(body[k], current_key));
            } else {
                ret.push(current_key + '=' + encodeURIComponent(body[k]));
            }
        }

        return ret.join('&');
    },

    stringfyArray: function(array, parent) {
        var ret = [];

        for (var i = 0; i < array.length; i++) {
            if (array[i] instanceof Array) {
                ret.push(this.stringfyArray(array[i], parent));
            } else if (array[i] instanceof Object) {
                ret.push(this.stringfyBody(array[i], parent));
            } else {
                ret.push(parent + '[]=' + encodeURI(array[i]))
            }
        }

        return ret.join('&');
    }

};