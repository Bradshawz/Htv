'use strict';

app.directive('short', function() {
  return {
    require: 'ngModel',
    link: function(scope, elem, attrs, ctrl) {
      scope.$watch(function() {
        var pass = ctrl.$modelValue;
        if (pass !== undefined) {
          return 6 <= pass.length;
        } else {
          return true;
        }
      }, function(currentValue) {
        ctrl.$setValidity('short', currentValue);
      });
    }
  };
});