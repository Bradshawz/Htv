'use strict';

app.factory('User', function ($firebase, FIREBASE_URL, $rootScope) {
  var ref = new Firebase(FIREBASE_URL + 'users');

  var users = $firebase(ref);

  var User = {
    create: function (authUser, username) {
      /* jshint camelcase: false */
      users[username] = {
        username: username,
        $priority: authUser.uid
      };

      users.$save(username).then(function () {
        setCurrentUser(username);
      });
    },
    findByUsername: function (username) {
      if (username) {
        return users.$child(username);
      }
    },
    getCurrent: function () {
      return $rootScope.currentUser;
    },
    signedIn: function () {
      return $rootScope.currentUser !== undefined;
    },
    toggleChat: function(hideChat) {
      return users.$child($rootScope.currentUser.username).$child('hiddenChat').$set(hideChat);
    }
  };

  function setCurrentUser (username) {
    $rootScope.currentUser = User.findByUsername(username);
  }

  $rootScope.$on('$firebaseSimpleLogin:login', function (e, authUser) {
    var query = $firebase(ref.startAt(authUser.uid).endAt(authUser.uid));

    query.$on('loaded', function () {
      setCurrentUser(query.$getIndex()[0]);
    });
  });

  $rootScope.$on('$firebaseSimpleLogin:Logout', function () {
    delete $rootScope.currentUser;
  });

  return User;
});
