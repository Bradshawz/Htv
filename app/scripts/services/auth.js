'use strict';

app.factory('Auth',
  function ($firebaseSimpleLogin, FIREBASE_URL, $rootScope, $window) {
    var ref = new Firebase(FIREBASE_URL);

    var auth = $firebaseSimpleLogin(ref);

    var Auth = {
      register: function (user) {
        return auth.$createUser(user.email, user.password);
      },
      signedIn: function () {
        return auth.user !== null;
      },
      login: function (user) {
        return auth.$login('password', user);
      },
      logout: function () {
        auth.$logout();
        $window.location.reload();
      },
      newPassword: function (email, oldPassword, newPassword) {
        return auth.$changePassword(email, oldPassword, newPassword);
      },
      emailReset: function(email) {
        return auth.$sendPasswordResetEmail(email);
      }
    };

    $rootScope.signedIn = function () {
      return Auth.signedIn();
    };

    return Auth;
  }
);
