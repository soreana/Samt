'use strict';

// Declare app level module which depends on views, and components
var app = angular.module('myApp', [
    'uiGmapgoogle-maps',
    'ngWebSocket'
]);

app.factory('WebSocketService', ['$websocket', function ($websocket) {
    

    var dataStream = $websocket("ws://localhost:3490/");
    var methods;

    

    dataStream.onMessage(function (message) {
        var temp = JSON.parse(message.data);
        methods.map.markers.push(temp.payload);
        methods.map.update();
    });

    methods = {
        send: function (marker,username) {
            var temp = {
                type: "location",
                payload: marker
            };
            
            temp.payload.username = username;
            
            dataStream.send(JSON.stringify(temp));
        },
        setMap: function (map) {
            methods.map = map;
        }
    };


    return methods;

    // We return this object to anything injecting our service
    // var Service = {};
    // // Keep all pending requests here until they get responses
    // var callbacks = {};
    // // Create a unique callback ID to map requests to responses
    // var currentCallbackId = 0;
    // // Create our websocket object with the address to the websocket
    // var ws = new WebSocket("ws://localhost:8000/socket/");
    //
    // ws.onopen = function(){
    //     console.log("Socket has been opened!");
    // };
    //
    // ws.onmessage = function(message) {
    //     listener(JSON.parse(message.data));
    // };
    //
    // function sendRequest(request) {
    //     var defer = $q.defer();
    //     var callbackId = getCallbackId();
    //     callbacks[callbackId] = {
    //         time: new Date(),
    //         cb:defer
    //     };
    //     request.callback_id = callbackId;
    //     console.log('Sending request', request);
    //     ws.send(JSON.stringify(request));
    //     return defer.promise;
    // }
    //
    // function listener(data) {
    //     var messageObj = data;
    //     console.log("Received data from websocket: ", messageObj);
    //     // If an object exists with callback_id in our callbacks object, resolve it
    //     if(callbacks.hasOwnProperty(messageObj.callback_id)) {
    //         console.log(callbacks[messageObj.callback_id]);
    //         $rootScope.$apply(callbacks[messageObj.callback_id].cb.resolve(messageObj.data));
    //         delete callbacks[messageObj.callbackID];
    //     }
    // }
    // // This creates a new callback ID for a request
    // function getCallbackId() {
    //     currentCallbackId += 1;
    //     if(currentCallbackId > 10000) {
    //         currentCallbackId = 0;
    //     }
    //     return currentCallbackId;
    // }
    //
    // // Define a "getter" for getting customer data
    // Service.getCustomers = function() {
    //     var request = {
    //         type: "get_customers"
    //     };
    //     // Storing in a variable for clarity on what sendRequest returns
    //     var promise = sendRequest(request);
    //     return promise;
    // };
    //
    //
    // return Service;
}]);

app.controller('shangula', ['$scope', 'WebSocketService', function ($scope, WebSocketService) {
    
    $scope.map = {
        username: 'Guest ' + ((Math.random()*0xffff)|0).toString(16),
        center: {
            latitude: 36.2687700,
            longitude: 50.0041000
        },
        zoom: 11,
        markers: [],
        update:function () {
            $scope.$apply();
        },
        events: {
            click: function (map, eventName, originalEventArgs) {
                var e = originalEventArgs[0];
                var lat = e.latLng.lat(), lon = e.latLng.lng();
                var marker = {
                    id: Date.now(),
                    coords: {
                        latitude: lat,
                        longitude: lon
                    }
                };
                $scope.map.markers.push(marker);
                WebSocketService.send(marker,$scope.map.username);
                $scope.$apply();
            }
        }
    };
    
    WebSocketService.setMap($scope.map);

    // angular.extend($scope, {
    //     map: {
    //         center: {
    //             latitude: 36.2687700,
    //             longitude: 50.0041000
    //         },
    //         zoom: 12,
    //         markers: [],
    //         events: {
    //             click: function (map, eventName, originalEventArgs) {
    //                 var e = originalEventArgs[0];
    //                 var lat = e.latLng.lat(),lon = e.latLng.lng();
    //                 var marker = {
    //                     id: Date.now(),
    //                     coords: {
    //                         latitude: lat,
    //                         longitude: lon
    //                     }
    //                 };
    //                 $scope.map.markers.push(marker);
    //                 console.log($scope.map.markers);
    //                 $scope.$apply();
    //             }
    //         }
    //     }
    // });

    $scope.options = {scrollwheel: false};

}]);
