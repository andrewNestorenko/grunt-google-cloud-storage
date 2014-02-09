process.env.TZ = 'UTC';
var request = require('request');
var crypto = require('crypto');
var config = require('nconf');
var fs = require('fs');


var auth = function(callback) {
    config.argv().env().file({
        file: 'oauth-config.json'
    });
    config.defaults({
        keyFile: "/Users/Nestor/Project/JS/UD/grunt-google-cloud-storage/key/certificates.pem",
        expiresInMinutes: 60,
        claim: {
            "iss": "908383940405@developer.gserviceaccount.com",
            "scope": "https://www.googleapis.com/auth/devstorage.full_control",
            "aud": "https://accounts.google.com/o/oauth2/token"
        }
    });
    var keyFile = config.get('keyFile');
    if (!fs.existsSync(keyFile)) {
        console.log("keyFile not found:" + keyFile);
        process.exit(1);
    }
    var jwtHeader = {
        alg: "RS256",
        typ: "JWT"
    };
    var jwtHeaderB64 = base64urlEncode(JSON.stringify(jwtHeader));
    var iat = Math.floor(new Date().getTime() / 1000);
    var exp = iat + (config.get('expiresInMinutes') * 60);
    var jwtClaim = config.get('claim');
    jwtClaim.exp = exp;
    jwtClaim.iat = iat;
    var jwtClaimB64 = base64urlEncode(JSON.stringify(jwtClaim));
    var signatureInput = jwtHeaderB64 + '.' + jwtClaimB64;
    var JWT = null;
    var signature = sign(signatureInput, keyFile);
    JWT = signatureInput + '.' + signature;
    console.log("JWT:"+JWT);
    request.post({
        url: 'https://accounts.google.com/o/oauth2/token',
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
                console.log("STATUS:200");
                callback(err, JSON.parse(body).access_token);
            } else {
                console.log('STATUS: ' + res.statusCode);
                // logger.debug('HEADERS: ' + JSON.stringify(res.headers));
                console.log('Response:\n' + body);
                callback(new Error("failed to retrieve an access token"), body);
            }
        }
    });
}
function sign(inStr, keyPath) {
    var key = fs.readFileSync(keyPath);
    if (key.length == 0) {
        console.log("most likely invalid key file: " + keyPath);
    }
    var sig = crypto.createSign('RSA-SHA256').update(inStr).sign(key, 'base64');
    //verification
    var verifier = crypto.createVerify("RSA-SHA256");
    verifier.update(inStr);
    if (verifier.verify(key, sig, 'base64')) {
        console.log("signature verified with:"+keyPath);
    } else {
        console.log("signature NOT verified with:" + keyPath);
    }
    return base64urlEscape(sig);
}
function base64urlEncode(str) {
    return base64urlEscape(new Buffer(str).toString('base64'));
}
function base64urlEscape(str) {
    return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
module.exports.auth = auth;
