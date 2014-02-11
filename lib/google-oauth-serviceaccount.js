process.env.TZ = 'UTC';
var request = require('request');
var crypto = require('crypto');
var config = require('nconf');
var fs = require('fs');
var async = require('async');
var GAuth = function(config) {
    this.config = config;
    this.baseAuthUrl = 'https://accounts.google.com/o/oauth2/token';
};
GAuth.prototype.auth = function(callback) {
    var self = this;
    config.defaults(this.config);
    var keyFile = config.get('keyFile');
    var jwtHeader = {
        alg: "RS256",
        typ: "JWT"
    };
    var jwtHeaderB64 = this.base64urlEncode(JSON.stringify(jwtHeader)), currentTimestamp = Math.floor(new Date().getTime() / 1000), jwtClaim = config.get('claim');
    jwtClaim.exp = currentTimestamp + (config.get('expiresInMinutes') * 60);
    jwtClaim.iat = currentTimestamp;
    var jwtClaimB64 = this.base64urlEncode(JSON.stringify(jwtClaim)), signatureInput = jwtHeaderB64 + '.' + jwtClaimB64;
    this.sign(signatureInput, keyFile, function(err, signature) {
        if (err) {
            callback(err);
        } else {
            var JWT = [signatureInput, signature].join('.');
            request.post({
                url: self.baseAuthUrl,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                form: {
                    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                    assertion: JWT
                }
            }, function(err, res, body) {
                if (err) {
                    callback(err, null);
                } else {
                    if (res.statusCode == 200) {
                        try {
                            var parsedBody = JSON.parse(body);
                            if (parsedBody.hasOwnProperty('access_token')) {
                                callback(null, JSON.parse(body).access_token);
                            } else if (parsedBody.hasOwnProperty('errors')) {
                                callback(new Error("Google Service Account Authorization: failed to retrieve an access token"), body);
                            }
                        } catch (err) {
                            callback(new Error("Google Service Account Authorization: failed to retrieve an access token"), body);
                        }
                    } else {
                        callback(new Error("Google Service Account Authorization: failed to retrieve an access token"), body);
                    }
                }
            });
        }

    });
};
GAuth.prototype.sign = function(inStr, keyPath, callback) {
    var self = this;
    async.waterfall([
        function checkKey(next) {
            fs.readFile(keyPath, function(err, data) {
                if (err) {
                    next(err);
                } else {
                    next(null, data)
                }
            });
        }, function signWithKeyAndVerify(keyData, next) {
            var sig = crypto.createSign('RSA-SHA256').update(inStr).sign(keyData, 'base64'), verifier = crypto.createVerify("RSA-SHA256");
            verifier.update(inStr);
            if (verifier.verify(keyData, sig, 'base64')) {
                next(null, sig);
            } else {
                next(new Error('Error has happened while signing '))
            }
        }
    ], function(err, data) {
        if (err) {
            callback(err);
        } else {
            callback(null, self.base64urlEscape(data))
        }
    });
};
GAuth.prototype.base64urlEncode = function(str) {
    return this.base64urlEscape(new Buffer(str).toString('base64'));
};
GAuth.prototype.base64urlEscape = function(str) {
    return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};
module.exports = function(config) {
    return new GAuth(config);
}
