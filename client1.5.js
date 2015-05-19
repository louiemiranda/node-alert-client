/**
 * Client library under node.js for responding on PUSH alert request from the server.
 * *Proof of concept
 *
 * Version 1.5; July 19, 2013
 * - Improved error handling for pool and query
 * - Added query and return status in JSON
 * - Creation of another resource specifically for bounce email status
 *
 * Version 1.4; July 9, 2013
 * - Fixes on http and https when detecting IP
 * - Replaced instruction to just raw encrypted string that will be decrypted on client node
 * - Additional key for stronger validation
 * - Security measures to add the allowed ip
 * - Added in_array equivalent from PHP
 * - Added SSL certificate for stronger data encapsulation
 * - @TODO Retrieve notes from v1.0, 1.1, 1.2 and 1.3 (July 4, 2013)
 *
 * @author Louie Miranda (lmiranda@gmail.com)
 * @version 1.5
 */

//var http = require("http");
var https = require('https');
var url = require("url");
var fs = require('fs');
var underscore = require('underscore');
var mysql = require('mysql');
var options = {
	key: fs.readFileSync('alert.key'),
	cert: fs.readFileSync('alert.cert') // 5 years valid
};
var pool = mysql.createPool({
	host : 'localhost',
	user : 'alerts',
	password : 'alerts123*',
	database : 'alerts',
	multipleStatements: false, // multiple statements is disabled for security reasons
	insecureAuth: true // Allow connecting to MySQL instances that ask for the old (insecure) authentication method.
});

console.log('Starting ALERT CLIENT NODE...');

start();

function start() {
	function onRequest(request, response) {
		var pathname = url.parse(request.url).pathname;
		var url_parts = url.parse(request.url, true);
		var params = url_parts.query;
		var rawinstructions = params.instructions
		//var remote_addr = request.connection.remoteAddress; // Use when http
		var remote_addr = request.connection.socket.remoteAddress // Use when https
		var allowed_addr = ['127.0.0.1', '10.8.0.14', '192.168.1.120', '10.8.0.14', '10.8.0.6'];

		console.log("Request received from: " + remote_addr);

		console.log("Pathname " + pathname + " received.");
		console.log("Params:");
		console.log(params);

		/**
		 * Required condition on every request that a key should be sent as well.
		 */

		// Key for server alerts
		if (params.key == 'c5d5cb6da63958ef653034726b0e90091379f03dc6c06c03cbd3eb98222397b20659c33f5687e9145d8f371c1c73260121c689024f42c57985b337ad3b70b906') {
			var keyswitch = true;
		}

		// Key specifically for email bounce only
		else if (params.key == '27dc1ccab2a91c10a5db6f7b2101c8a22c474c7c0ce20b7f1d84bea50a8c3f7ea4c809c48dab81d810a2ce8055b5af748ab4fe690b48da6631324f35094b203d') {
			var keyswitch_emailbounce = true;
		}

		else {
			var keyswitch = false;
			console.log('Invalid key request, returning 403.');
			response.statusCode = 403;
			response.end('403 Forbidden\n');
		}

		// Allow only on specific IP address
		if (!in_array(remote_addr, allowed_addr)) {
			var remoteaddrswitch = false;
			console.log('Invalid requesting IP, returning 403.');
			response.statusCode = 403;
			response.end('403 Forbidden\n');
		}
		else {
			var remoteaddrswitch = true;
		}

		/**
		 * General Query Resource
		 */
		if (pathname == '/query' && keyswitch && remoteaddrswitch) {

			var b = new Buffer(rawinstructions, 'base64')
			var instructions = b.toString();
			//console.log('decrypt:');
			//console.log(instructions);

			// Query condition
			//var query = 'SELECT ' + fields + ' FROM ' + table + ' WHERE ' + where + ' ' + conditions;
			//var query = url.parse.unescape(instructions);
			//var query = querystring.unescape(instructions);
			var query = instructions;
			console.log('query:');
			console.log(query);

			pool.getConnection(function(err, connection) {

				//if (err) throw err;
				if (err) {
					console.log(err);
					response.write(JSON.stringify(err, null, 0));
					response.end();
				}

				try {

					connection.query(query, function(err, rows) {

						if (err) {
							console.log(err);
							response.write(JSON.stringify(err, null, 0));
							response.end();
						}

						try {

							//if (err) throw err;

							console.log('Return:');
							console.log(rows);

							response.write(JSON.stringify(rows, null, 0));

							connection.end();
							response.end();

						} catch (err) {
							console.log(err);
							response.end();
						}

					});

				} catch (err) {

					console.log(err);
					response.end();

				}

			});

		}
		/**
		 * Specific bounce email status resource
		 */
		else if (pathname == '/bouncemailstatus' && keyswitch_emailbounce && remoteaddrswitch) {

			var array = rawinstructions.split(',');
			console.log('array:');
			console.log(array);
			var instruction = "'" + array.join("','") + "'";
			var query = "SELECT count(l.id) as Count, l.email as Email FROM bounce_logs l WHERE l.email IN (" + instruction + ") GROUP BY l.email;";
			//var query = "SELECT l.email FROM bounce_logs l WHERE l.email IN (" + instruction + ") GROUP BY l.email;";
			console.log('query:');
			console.log(query);

			//response.write("bouncemailstatus");
			//response.end();

			pool.getConnection(function(err, connection) {
				//if (err) throw err;

				if (err) {
					console.log(err);
					response.write(JSON.stringify(err, null, 0));
					response.end();
				}

				try {

					connection.query(query, function(err, rows) {
						//if (err) throw err;

						if (err) {
							console.log(err);
							response.write(JSON.stringify(err, null, 0));
							response.end();
						}

						try {

							console.log('Return:');
							console.log(rows);
							/**
							 * [
							 * 	{ email: 'imscottishtony@aol.com' },
							 * { email: 'twoweipew@sexylingeriegarte.com' }
							 * ]
							 */

							// Declare validarr as array
							var validarr = new Array;
							var resarr = new Array;

							// Loop over the data rows
							rows.forEach(function(entry) {

								console.log('entry:');
							    console.log(entry.email);

								// Push for each entry.email into an array
								validarr.push(entry.email);

							});

							console.log('validarr:');
							console.log(validarr);

							// Check difference from request and result
							var diff = underscore._.difference(array, validarr);
							console.log('diff:');
							console.log(diff);

							/**
							 * 8. A validator (autonomous, cron script) will look through all records with an email_status of 1
							 * and check a Node.js script on the Ziinga side. This Node.js script queries whether an email exists
							 * in bounces.bounce_logs and returns 1 for bounced, 0 for not exists (c/o Louie).
							 * If the validator gets 0 for an email address, email_status = (Validated).
							 * If the validator gets 1 for an email address, email_status = (Invalidated).
							 */

							// Try to return a valid result
							var resarr = validarr, diff;
							console.log('resarr:');
							console.log(resarr);

							response.write(JSON.stringify(rows, null, 0));

							connection.end();
							response.end();

						} catch (err) {

							console.log(err);
							response.end();

						}

					});

				} catch (err) {

					console.log(err);
					response.end();

				}

			});

		}
		else {

			response.write("Invalid request.");
			response.end();
		}

	}
	https.createServer(options, onRequest).listen(33214);
}


function in_array (needle, haystack, argStrict) {
  // *     example 1: in_array('van', ['Louie', 'Elsie', 'World']);
  // *     returns 1: true
  // *     example 2: in_array('vlado', {0: 'Kevin', vlado: 'van', 1: 'Zonneveld'});
  // *     returns 2: false
  // *     example 3: in_array(1, ['1', '2', '3']);
  // *     returns 3: true
  // *     example 3: in_array(1, ['1', '2', '3'], false);
  // *     returns 3: true
  // *     example 4: in_array(1, ['1', '2', '3'], true);
  // *     returns 4: false
  var key = '',
    strict = !! argStrict;

  if (strict) {
    for (key in haystack) {
      if (haystack[key] === needle) {
        return true;
      }
    }
  } else {
    for (key in haystack) {
      if (haystack[key] == needle) {
        return true;
      }
    }
  }

  return false;
}