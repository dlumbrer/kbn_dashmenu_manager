import moment from 'moment';
import { uiModules } from 'ui/modules';
import uiRoutes from 'ui/routes';

import 'ui/autoload/styles';
import './less/main.less';
import template from './templates/index.html';

document.title = 'Menu manager - Kibana';

import chrome from 'ui/chrome';
import { SSL_OP_NO_SESSION_RESUMPTION_ON_RENEGOTIATION } from 'constants';

// Set Kibana dark thmeme

uiRoutes.enable();
uiRoutes
.when('/', {
  template,
  resolve: {
    currentTime($http) {
      return $http.get('../api/kbn_dashmenu_management/example').then(function (resp) {
        return resp.data.time;
      });
    }
  }
});

uiModules
.get('app/kbn_dashmenu_management', [])
.controller('mainController', function ($scope, $route, $interval, $http, $location) {

  const _this = this;

  _this.baseUrl = $location.absUrl().match(/(?:\/\w+)(?=\/)/)[0];
  _this.baseUrl = '/app' === _this.baseUrl ? '' : _this.baseUrl;

  //Get all the data neccessary from ES
  $http.get(_this.baseUrl + '/api/get_indices').then((response) => {
    console.log("INDICES", response)
  }, (error) => {
    console.log(error);
  });

  $http.get(_this.baseUrl + '/api/get_dashboards').then((response) => {
    console.log("DASHBOARDS", response)
    $scope.dashboards = response.data.dashboards
  }, (error) => {
    console.log(error);
  });

  $http.get(_this.baseUrl + '/api/get_metadashboard').then((response) => {
    console.log("METADASHBOARD", response)
    $scope.metadashboard = response.data.metadashboard[0]._source.metadashboard
  }, (error) => {
    console.log(error);
  });
  //////////////////////////

  //Open Adding forms
  $scope.addItem = function(key) {
    $scope.simpleAdding = true;
    if($scope.isDict($scope.metadashboard[key])){
      $scope.currentParent = key;
      $scope.complexAdding = false;
    }else{
      $scope.currentParent = "root";
      $scope.complexAdding = true;
    }
  }
  ///////

  //Adding item
  $scope.addSimple = function(){
    if($scope.currentParent != "root"){
      $scope.metadashboard[$scope.currentParent][$scope.simpleTitleSelected] = $scope.simpleDashboardSelected;
      return
    }
    $scope.metadashboard[$scope.simpleTitleSelected] = $scope.simpleDashboardSelected;
  }
  $scope.addParent = function(){
    $scope.metadashboard[$scope.parentTitleSelected] = {};
  }

  //Check if an item is dictionary
  $scope.isDict = function(v) {
    return (typeof v==='object' && v!==null && !(v instanceof Array) && !(v instanceof Date))
  }

  //Update menu
  $scope.updateMenu = function(){
    //Create new mapping
    var menuMapping = {
      "properties": {
        "metadashboard" : {
          "properties": {
            "git" : {
              "type": "text"
            },
            "help" : {
              "type": "text"
            },
            "jira" : {
              "properties": {
                "overview" : {
                  "type": "text"
                },
                "help" : {
                  "type": "text"
                }
              }
            },
            "jola" : {
              "type": "text"
            }
          }
        }
      }
    }

    var newMapping = {"properties": {"metadashboard" : {"properties": {}}}};

    for (var k in $scope.metadashboard){
      if($scope.isDict($scope.metadashboard[k])){
        newMapping.properties.metadashboard.properties[k] = {"properties": {}}
        for (var i in $scope.metadashboard[k]){
          newMapping.properties.metadashboard.properties[k].properties[i] = {"type": "text"}
        }
      }else{
        newMapping.properties.metadashboard.properties[k] = {"type": "text"}
      }
    }

    console.log("NEW MAPPING", newMapping);

    

    $http.post(_this.baseUrl + '/api/update_mapping', newMapping).then((response) => {
      console.log("RESPUESTA DEL POST", response)

      var newMetadashboard = {
        "metadashboard": $scope.metadashboard
      }

      $http.post(_this.baseUrl + '/api/update_metadashboard', newMetadashboard).then((response) => {
        console.log("RESPUESTA DEL POST 2", response)
      }, (error) => {
        console.log(error);
      });
    }, (error) => {
      console.log(error);
    });
  }

  $scope.title = 'Custom menu manager';
  $scope.description = 'kbn_dashmenu_management Plugin';

  const currentTime = moment($route.current.locals.currentTime);
  $scope.currentTime = currentTime.format('HH:mm:ss');
  const unsubscribe = $interval(function () {
    $scope.currentTime = currentTime.add(1, 'second').format('HH:mm:ss');
  }, 1000);
  $scope.$watch('$destroy', unsubscribe);
});
