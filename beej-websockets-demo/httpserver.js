#!/usr/bin/env node

/**
 * Simple NodeJS webserver demo
 *
 * For learning purposes only
 *
 * Copyright (c) 2015 Brian "Beej Jorgensen" Hall <beej@beej.us>
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

"use strict";

var http = require('http'),
	url = require('url'),
	path = require('path'),
	fs = require('fs');

var port = 3490; // http://localhost:3490/

// Use current directory as base directory for all file serving
var basedir = process.cwd();

var server;

/**
 * Returns a MIME type for a file extension
 *
 * This is a cheesy function for demo purposes only. In real life, use
 * something sensible like one of the many NodeJS MIME libraries, e.g.
 * https://www.npmjs.com/package/mime
 */
function getMIMEType(filename) {
	var mimeTypes = {
		'.js': 'application/javascript',
		'.jpg': 'image/jpg',
		'.png': 'image/png',
		'.html': 'text/html'
	};

	// Get the file extension, .html, .js, etc.
	var ext = path.extname(filename);

	if (ext in mimeTypes) {
		return mimeTypes[ext];
	}

	// If we don't recognize it, just return this default
	return 'text/plain';
}

/**
 * Locate a filename for a specific path
 */
function getFilenameFromPath(filepath, callback) {
	// Get all those %20s and stuff out of there:
	filepath = decodeURI(filepath.replace(/\+/g, '%20'));

	// Normalize will translate out all the ./ and ../ parts out of the
	// path and turn it into a plain, absolute path.
	var filename = path.normalize(basedir + path.sep + filepath);
	var st;

	/**
	 * Called when the fs.stat() call completes
	 */
	function onStatComplete(err, stats) {
		if (err) {
			return callback(err, filename);
		}

		// If it's a directory, try looking for index.html:
		if (stats.isDirectory()) {
			filename = path.normalize(filename + path.sep + 'index.html');
			fs.stat(filename, onStatComplete);
			return;
		}

		// If the result's a file, return the name
		if (stats.isFile()) {
			return callback(null, filename)
		} else {
			return callback(new Error("Unknown file type"), filename);
		}
	}

	// First make sure the file is still in the base directory
	// for security reasons:
	if (filename.substring(0, basedir.length) != basedir) {
		// If not, 404 it
		var err = new Error("Not Found");
		err.code = 'ENOENT';
		return callback(err, filename);
	}

	// Now see if we can find the file:
	fs.stat(filename, onStatComplete);
}

/**
 * The main HTTP handler
 */
function httpHandler(request, response) {
	/**
	 * Called when the filename has been ascertained
	 */
	function onGotFilename(err, filename) {

		/**
		 * Helper function to return errors in the response
		 */
		function writeError(err) {
			if (err.code == 'ENOENT') {
				// File not found
				response.writeHead(404, { 'Content-Type': 'text/plain' });
				response.write('404 Not Found\n');
				response.end();
				console.log("Not Found: " + filename);
			} else {
				// Any other error
				response.writeHead(500, { 'Content-Type': 'text/plain' });
				response.write('500 Internal Server Error\n');
				response.end();
				console.log("Internal Server Error: " + filename + ": " + err.code);
			}
		}

		if (err) {
			writeError(err);
		} else {
			// No errors getting the filename, so go ahead and read it.
			fs.readFile(filename, "binary", function (err, file) {
				if (err) {
					writeError(err);
				} else {
					// No errors reading the file, so write the response

					// Get the MIME type first
					var mimeType = getMIMEType(filename);
					response.writeHead(200, { 'Content-Type': mimeType });
					response.write(file, "binary");
					response.end();
					console.log("Sending file: " + filename);
				}
			});
		}
	}

	// Extract the part of the URL after the host:port. This is the
	// filename the browser is looking for:
	var path = url.parse(request.url).pathname;

	// Try to find the actual file associated with this path:
	getFilenameFromPath(path, onGotFilename);
}

/**
 * Start the HTTP server
 */
function startHTTPServer() {
	server = http.createServer(httpHandler).listen(port);

	console.log("Listening on port " + port);

	return server;
}

// exports
exports.start = startHTTPServer;

// if we're running standalone, go ahead and start the server
if (require.main == module) {
	startHTTPServer();
}
