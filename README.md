# node-alert-client
Node.js client application to receive API like requests like SQL query

This is a project I made for responding to PUSH alert request from a server, a proof-of-concept that was deployed into production.

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
