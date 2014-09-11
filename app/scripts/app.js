/* global app:true */
'use strict';

var app = angular.module('hatchling', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ngRoute',
  'firebase',
  'ui.sortable',
  'ui.bootstrap',
  'youtube-embed'
]);
app.config(["$routeProvider", function ($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'views/home.html'
    })
    .when('/register', {
      templateUrl: 'views/register.html',
      controller: 'AuthCtrl'
    })
    .when('/recovery', {
      templateUrl: 'views/recovery.html',
      controller: 'RecoverCtrl'
    })
    .when('/login', {
      templateUrl: 'views/login.html',
      controller: 'AuthCtrl'
    })
    .when('/terms', {
      templateUrl: 'views/terms.html'
    })
    .when('/contact', {
      templateUrl: 'views/contact.html'
    })
    .when('/users/:username', {
      templateUrl: 'views/profile.html',
      controller: 'ProfileCtrl',
      resolve: {
        manyChannels: ["$q", "$route", "$firebase", "FIREBASE_URL", function($q, $route, $firebase, FIREBASE_URL) {
          var deffered = $q.defer();
          var defferedTwo = $q.defer();
          var defferedThree = $q.defer();
          var defferedFour = $q.defer();
          var promises = [];
          promises.push(deffered.promise);
          promises.push(defferedTwo.promise);
          promises.push(defferedThree.promise);
          promises.push(defferedFour.promise);
          var username = $route.current.params.username;
          var channels = [];
          var shownChannels = [];
          var shownFavourites = [];
          var favourites = [];
          var allChannels = $firebase(new Firebase(FIREBASE_URL + 'allCounters'));
          var favouritesRef = new Firebase(FIREBASE_URL + 'users/' + username + '/favourites');
          var channelsRef = new Firebase(FIREBASE_URL + 'users/' + username + '/channels');

          channelsRef.once('value', function(snap) {
            var loopAmount = snap.numChildren();
            if (loopAmount !== 0) {
              var tempCount = 4;
              snap.forEach(function(childSnap) {
                var idRef = allChannels.$child(childSnap.val().channelId);
                idRef.$on('loaded', function() {
                  if (tempCount > 0) {
                    shownChannels.push(idRef);
                  }
                  channels.push(idRef);
                  tempCount = tempCount - 1;
                  loopAmount--;
                  if (loopAmount === 0) {
                    deffered.resolve(channels);
                    defferedTwo.resolve(shownChannels);
                  }
                });
              });
            } else {
              deffered.resolve(channels);
              defferedTwo.resolve(shownChannels);
            }
          });

          favouritesRef.once('value', function(snap) {
            var loopAmount = snap.numChildren();
            if (loopAmount !== 0) {
              var tempCount = 4;
              snap.forEach(function(childSnap) {
                var idRef = allChannels.$child(childSnap.val());
                idRef.$on('value', function() {
                  if (idRef.img !== undefined) {
                    if (tempCount > 0) {
                      shownFavourites.push(idRef);
                    }
                    favourites.push(idRef);
                    tempCount = tempCount - 1;
                  }
                  loopAmount--;
                  if (loopAmount === 0) {
                    defferedThree.resolve(favourites);
                    defferedFour.resolve(shownFavourites);
                  }
                });
              });
            } else {
              defferedThree.resolve(favourites);
              defferedFour.resolve(shownFavourites);
            }
          });
          return $q.all(promises);
        }]
      }
    })
    .when('/createchannel/:username', {
      templateUrl: 'views/createchannel.html',
      controller: 'CreateCtrl',
      resolve: {
        userStuff: ["$q", "$timeout", "$route", "User", "Channel", function($q, $timeout, $route, User, Channel) {
          var wait = function(toReturn) {
            var repeat = false;
            angular.forEach(toReturn, function(channel) {
              if (channel.img === undefined) {
                repeat = true;
              }
              if (repeat) {
                $timeout(function(){wait(toReturn);},100);
              } else {
                deffered.resolve(toReturn);
              }
            });
          };
          var deffered = $q.defer();
          var result = User.findByUsername($route.current.params.username);
          result.$on('loaded', function() {
            var toReturn = {};
            var counter = 0;
            angular.forEach(result.channels, function() {
              counter++;
            });
            if (counter === 0) {
              deffered.resolve(toReturn);
            }
            angular.forEach(result.channels, function(channelItems) {
              toReturn[channelItems.channelId] = Channel.find(channelItems.channelId);
              toReturn[channelItems.channelId].info = Channel.getInfo(channelItems.channelId);
              counter--;
              if (counter === 0) {
                wait(toReturn);
              }
            });
          });
          return deffered.promise;
        }]
      }
    })
    .when('/createchannel/:username/:channelId', {
      templateUrl: 'views/channelcontent.html',
      controller: 'ChannelCtrl'
    })
    .when('/watch', {
      templateUrl: 'views/watch.html',
      controller: 'WatchCtrl',
      resolve: {
        categories: ["$q", "FIREBASE_URL", function($q, FIREBASE_URL) {
          var deffered = $q.defer();
          var categories = [];
          var categoriesRef = new Firebase(FIREBASE_URL + 'categoryCounters');
          categoriesRef.once('value', function(snap) {
            var counter = snap.numChildren();
            snap.forEach(function(childSnap) {
              categories.push({category: childSnap.val(), priority: childSnap.getPriority()});
              counter--;
              if (counter === 0) {
                deffered.resolve(categories);
              }
            });
          });
          return deffered.promise;
        }]
      }
    })
    .when('/watch/all', {
      templateUrl: 'views/all.html',
      controller: 'AllCtrl',
      resolve: {
        allChannels: ["$q", "FIREBASE_URL", "$firebase", "$filter", function($q, FIREBASE_URL, $firebase, $filter) {
          var deffered = $q.defer();
          var allRef = $firebase(new Firebase(FIREBASE_URL + 'allCounters'));
          allRef.$on('loaded', function() {
            var returnItem = $filter('orderByPriority')(allRef);
            deffered.resolve(returnItem);
          });
          return deffered.promise;
        }]
      }
    })
    .when('/watch/all/:category/:channelId', {
      templateUrl: 'views/television.html',
      controller: 'TelevisionCtrl',
      resolve: {
        username: ["$firebaseSimpleLogin", "FIREBASE_URL", "$q", "$rootScope", "$timeout", "$firebase", "$route", "Presence", function($firebaseSimpleLogin, FIREBASE_URL, $q, $rootScope, $timeout, $firebase, $route, Presence) {
          var deffered = $q.defer();
          var defferedTwo = $q.defer();
          var defferedThree = $q.defer();
          var defferedFour = $q.defer();
          var defferedFive = $q.defer();
          var offsetRef = new Firebase(FIREBASE_URL + '.info/serverTimeOffset');
          var promises = [];
          promises.push(deffered.promise);
          promises.push(defferedTwo.promise);
          promises.push(defferedThree.promise);
          promises.push(defferedFour.promise);
          promises.push(defferedFive.promise);
          offsetRef.once('value', function(snap) {
            var offset = snap.val();
            defferedFive.resolve(offset);
          });
          var channelCount = 0;
          channelCount = Presence.getOnlineUserCount() + 1;
          var channelUsers = Presence.addPresence();
          defferedThree.resolve(channelUsers);
          defferedFour.resolve(channelCount);
          var showProgramRef = $firebase(new Firebase(FIREBASE_URL + 'channels/' + $route.current.params.channelId));
          showProgramRef.$on('loaded', function() {
            deffered.resolve(showProgramRef);
          });
          var ref = $firebaseSimpleLogin(new Firebase(FIREBASE_URL));
          ref.$getCurrentUser().then(function(user) {
            if (user !== null) {
              repeat();
            } else {
              defferedTwo.resolve();
            }
          });
          var repeat = function() {
            if ($rootScope.currentUser === undefined) {
              $timeout(function(){repeat();},0);
            } else {
              defferedTwo.resolve();
            }
          };
          return $q.all(promises);
        }]
      }
    })
    .when('/watch/:category', {
      templateUrl: 'views/channels.html',
      controller: 'ChannelsCtrl',
      resolve: {
        channels: ["$q", "FIREBASE_URL", "$firebase", "$filter", "$route", function($q, FIREBASE_URL, $firebase, $filter, $route) {
          var deffered = $q.defer();
          var category = $route.current.params.category;
          var channelsRef = $firebase(new Firebase(FIREBASE_URL + 'counters/' + category));
          channelsRef.$on('loaded', function() {
            var returnChannels = $filter('orderByPriority')(channelsRef);
            deffered.resolve(returnChannels);
          });
          return deffered.promise;
        }]
      }
    })
    .when('/watch/:category/:channelId', {
      templateUrl: 'views/television.html',
      controller: 'TelevisionCtrl',
      resolve: {
        username: ["$firebaseSimpleLogin", "FIREBASE_URL", "$q", "$rootScope", "$timeout", "$firebase", "$route", "Presence", function($firebaseSimpleLogin, FIREBASE_URL, $q, $rootScope, $timeout, $firebase, $route, Presence) {
          var deffered = $q.defer();
          var defferedTwo = $q.defer();
          var defferedThree = $q.defer();
          var defferedFour = $q.defer();
          var defferedFive = $q.defer();
          var offsetRef = new Firebase(FIREBASE_URL + '.info/serverTimeOffset');
          var promises = [];
          promises.push(deffered.promise);
          promises.push(defferedTwo.promise);
          promises.push(defferedThree.promise);
          promises.push(defferedFour.promise);
          promises.push(defferedFive.promise);
          offsetRef.once('value', function(snap) {
            var offset = snap.val();
            defferedFive.resolve(offset);
          });
          var channelUsers = Presence.addPresence();
          var channelCount = 0;
          defferedThree.resolve(channelUsers);
          channelCount = Presence.getOnlineUserCount() + 1;
          defferedFour.resolve(channelCount);
          var showProgramRef = $firebase(new Firebase(FIREBASE_URL + 'channels/' + $route.current.params.channelId));
          showProgramRef.$on('loaded', function() {
            deffered.resolve(showProgramRef);
          });
          var ref = $firebaseSimpleLogin(new Firebase(FIREBASE_URL));
          ref.$getCurrentUser().then(function(user) {
            if (user !== null) {
              repeat();
            } else {
              defferedTwo.resolve();
            }
          });
          var repeat = function() {
            if ($rootScope.currentUser === undefined) {
              $timeout(function(){repeat();},0);
            } else {
              defferedTwo.resolve();
            }
          };
          return $q.all(promises);
        }]
      }
    })
    .when('/favourites/:username', {
      templateUrl: 'views/favourites.html',
      controller: 'FavouritesCtrl',
      resolve: {
        favChannels: ["$firebase", "FIREBASE_URL", "$route", "$filter", "$q", function($firebase, FIREBASE_URL, $route, $filter, $q) {
          var place = 0;
          var deffered = $q.defer();
          var channels = [];
          var channelsRef = $firebase (new Firebase(FIREBASE_URL + 'allCounters'));
          var favouritesRef = $firebase(new Firebase(FIREBASE_URL + 'users/' + $route.current.params.username + '/favourites'));
          favouritesRef.$on('loaded', function() {
            channelsRef.$on('loaded', function() {
              var channelIds = $filter('orderByPriority')(favouritesRef);
              if (channelIds.$add === undefined) {
                angular.forEach(channelIds, function(id) {
                  if (channelsRef[id] !== undefined) {
                    channels[place] = {'id':id, 'name':channelsRef[id].name, 'category':channelsRef[id].category, 'viewers':channelsRef[id].viewers, 'img':channelsRef[id].img};
                    place++;
                  }
                });
                deffered.resolve(channels);
              }
            });
          });
          return deffered.promise;
        }]
      }
    })
    .when('/settings/:username', {
      templateUrl: 'views/settings.html',
      controller: 'SettingsCtrl',
      resolve: {
        user: ["$firebaseSimpleLogin", "FIREBASE_URL", "$rootScope", "$q", "$timeout", function($firebaseSimpleLogin, FIREBASE_URL, $rootScope, $q, $timeout) {
          var deffered = $q.defer();
          var ref = $firebaseSimpleLogin(new Firebase(FIREBASE_URL));
          ref.$getCurrentUser().then(function(user) {
            if (user !== null) {
              repeat();
            }
          });
          var repeat = function() {
            if ($rootScope.currentUser === undefined) {
              $timeout(function(){repeat();},0);
            } else {
              deffered.resolve();
            }
          };
          return deffered.promise;
        }]
      }
    })
    .otherwise({
      redirectTo: '/'
    });
}])
.constant('FIREBASE_URL', 'https://shining-fire-9932.firebaseio.com/');
app.constant('BLANK_PICTURE', 'https://i.imgur.com/JzWIbVB.png');
app.run(["$rootScope", "$window", function($rootScope, $window) {
  $rootScope.$on('$routeChangeSuccess', function() {
    $window.scrollTo(0,0);
  });
}]);