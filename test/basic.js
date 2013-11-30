/**
 * API Tests
 *
 *
 */
module.exports = {

  "Google Authentication and Storage List": function( done ) {

    this.timeout( 10000 );

    var account     = require( 'google-oauth-serviceaccount' );
    var googleapis  = require( 'googleapis' );
    var auth        = new googleapis.OAuth2Client();

    account.auth( function( err, access_token ) {

      auth.credentials = {
        access_token: access_token
      };

      googleapis.discover( 'storage', 'v1beta2' ).execute( function( err, client ) {

        client.should.have.properties( 'storage', 'clients' );

        client.storage.objects.list({
          bucket: 'media.discodonniepresents.com',
          prefix: '2012/05/',
          maxResults: 5,
          fields: 'items(componentCount,contentDisposition,contentLanguage,contentType,id,mediaLink,metadata,name,selfLink,size,updated)'
        }).withAuthClient( auth ).execute( function( err, result, res ) {
            result.should.have.property( 'items' );
            result.items[0].should.have.properties( 'id', 'name', 'metadata' );
            done();
          });

      })

    });

  }

}