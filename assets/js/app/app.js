'use strict';

var app = angular.module('elstudio', [
  'ngRoute',
  'ngSanitize',
  'elstudio.services', 
  'elstudio.templates',
  'elstudio.controllers.site'
]);

app.config(function ($routeProvider, $httpProvider) {
  
  var routes = {
    '/': {
      templateUrl: '/site/index',
      controller: 'SiteCtrl'
    },
    '/about': {
      templateUrl: '/site/about',
      controller: 'SiteCtrl'
    },
    '/account': {
      templateUrl: '/site/account',
      controller: 'SiteCtrl'
    },
    '/career': {
      templateUrl: '/site/career',
      controller: 'SiteCtrl'
    },
    '/class': {
      templateUrl: '/site/class',
      controller: 'SiteCtrl'
    },
    '/contact': {
      templateUrl: '/site/contact',
      controller: 'SiteCtrl'
    },
    '/faq': {
      templateUrl: '/site/faq',
      controller: 'SiteCtrl'
    },
    '/first-ride': {
      templateUrl: '/site/first-ride',
      controller: 'SiteCtrl'
    },
    '/instructors': {
      templateUrl: '/site/instructors',
      controller: 'SiteCtrl'
    },
    '/rates-and-packages': {
      redirectTo: '/rates'
    },
    '/rates': {
      templateUrl: '/site/rates',
      controller: 'SiteCtrl'
    },
    '/rewards': {
      templateUrl: '/site/rewards',
      controller: 'SiteCtrl'
    },
    '/schedule': {
      templateUrl: '/site/schedule',
      controller: 'SiteCtrl'
    },
    '/whats-new': {
      templateUrl: '/site/whats-new',
      controller: 'SiteCtrl'
    },
    '/workouts': {
      templateUrl: '/site/workouts',
      controller: 'SiteCtrl'
    }
  };

  angular.forEach(routes, function (route, path) {
    if (typeof route.resolve != 'object') {
      route.resolve = {};
    }
    // angular.extend(route.resolve, {
    //   user: function (AuthService) {
    //     return AuthService.setCurrentUser();
    //   }
    // });
    $routeProvider.when(path, route);
  });
  
  $routeProvider.otherwise({
    redirectTo: '/notfound'
  });
});