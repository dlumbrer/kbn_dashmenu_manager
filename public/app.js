import moment from 'moment';
import { uiModules } from 'ui/modules';
import uiRoutes from 'ui/routes';

import 'ui/autoload/styles';
import './less/main.less';
import template from './templates/index.html';

document.title = 'Malice - Kibana';

import chrome from 'ui/chrome';

// Set Kibana dark thmeme

uiRoutes.enable();
uiRoutes
.when('/', {
  template,
  resolve: {
    currentTime($http) {
      return $http.get('../api/malice/example').then(function (resp) {
        return resp.data.time;
      });
    }
  }
});

uiModules
.get('app/malice', [])
.controller('maliceHelloWorld', function ($scope, $route, $interval, $http, $location) {

  const _this = this;

  _this.baseUrl = $location.absUrl().match(/(?:\/\w+)(?=\/)/)[0];
  _this.baseUrl = '/app' === _this.baseUrl ? '' : _this.baseUrl;



    $http.get(_this.baseUrl + '/api/get_indices').then((response) => {

       console.log(response)
    }, (error) => {

        console.log(error);
    });

    $http.get(_this.baseUrl + '/api/get_dashboards').then((response) => {

      console.log("DASHBOARDS", response)
    }, (error) => {

        console.log(error);
    });



  $scope.title = 'Malice';
  $scope.description = 'Malice Kibana Plugin';

  const currentTime = moment($route.current.locals.currentTime);
  $scope.currentTime = currentTime.format('HH:mm:ss');
  const unsubscribe = $interval(function () {
    $scope.currentTime = currentTime.add(1, 'second').format('HH:mm:ss');
  }, 1000);
  $scope.$watch('$destroy', unsubscribe);
});
