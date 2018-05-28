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
    $scope.editItemForm = false;
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
      $scope.metadashboard[$scope.currentParent][$scope.simpleTitleSelected] = $scope.simpleDashboardSelected.replace(/ /g,"-");
      return
    }
    $scope.metadashboard[$scope.simpleTitleSelected] = $scope.simpleDashboardSelected.replace(/ /g,"-");
  }
  $scope.addParent = function(){
    $scope.metadashboard[$scope.parentTitleSelected] = {};
  }

  //Edit item form
  $scope.editItem = function(key, value, keyson, valueson){
    $scope.simpleAdding = false;
    $scope.complexAdding = false;
    $scope.editItemForm = true;
    //Check if dict in order to show the dashboard list
    $scope.editNotDict = !$scope.isDict(value)
    if(keyson && valueson){
      $scope.editParentSelected = key;
      $scope.editTitleSelected = keyson;
      $scope.prevEditTitleSelected = keyson;
      $scope.editDashboardSelected = valueson.replace("-", " ");
      return
    }
    $scope.editParentSelected = undefined;
    $scope.editTitleSelected = key;
    $scope.prevEditTitleSelected = key;
    $scope.editDashboardSelected = value.replace("-", " ");
  }

  //Save Edit Item
  $scope.saveEditItem = function(){
    //Change new key and delete oldkey
    if($scope.editTitleSelected != $scope.prevEditTitleSelected){
      Object.defineProperty($scope.metadashboard, $scope.editTitleSelected,
        Object.getOwnPropertyDescriptor($scope.metadashboard, $scope.prevEditTitleSelected));
      delete $scope.metadashboard[$scope.prevEditTitleSelected];
      return
    }
    //Check if it is a son or is a root item
    if($scope.editParentSelected){
      $scope.metadashboard[$scope.editParentSelected][$scope.editTitleSelected] = $scope.editDashboardSelected.replace(/ /g,"-");
      return
    }
    $scope.metadashboard[$scope.editTitleSelected] = $scope.editDashboardSelected.replace(/ /g,"-");
  }

  //Delete item



  //Check if an item is dictionary
  $scope.isDict = function(v) {
    return (typeof v==='object' && v!==null && !(v instanceof Array) && !(v instanceof Date))
  }

  //Update menu
  $scope.updateMenu = function(){
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

    

    $http.post(_this.baseUrl + '/api/delete_metadashboard').then((response) => {
      console.log("RESPUESTA DEL POST DELETE METADASHBOARD", response)
      //First delete metadashboard
      $http.post(_this.baseUrl + '/api/update_mapping', newMapping).then((response) => {
        console.log("RESPUESTA DEL POST MAPPINGS METADASHBOARD", response)
        var newMetadashboard = {
          "metadashboard": $scope.metadashboard
        }
        //Then, update metadashboard
        $http.post(_this.baseUrl + '/api/update_metadashboard', newMetadashboard).then((response) => {
          console.log("RESPUESTA DEL POST PUT METADASHBOARD", response)
        }, (error) => {
          console.log(error);
        });
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
