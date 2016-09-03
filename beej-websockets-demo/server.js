#!/usr/bin/env node

/**
 * This starts the HTTP server, and then starts the Websocket server on
 * top of that.
 */

"use strict";

var httpServer = require("./httpserver.js"),
	wsServer = require("./wsserver.js");

var server = httpServer.start();
wsServer.start(server);
