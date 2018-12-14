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
  template
});

uiModules
.get('app/kbn_dashmenu_management', [])
.controller('mainController', function ($scope, $route, $interval, $http, $location) {

  const _this = this;

  _this.baseUrl = $location.absUrl().match(/(?:\/\w+)(?=\/)/)[0];
  _this.baseUrl = '/app' === _this.baseUrl ? '' : _this.baseUrl;

  //Utils funcs
  function hideAllForms(){
    $scope.editItemForm = false;
    $scope.simpleAdding = false;
    $scope.complexAdding = false;
    $scope.confirmDeleteForm = false;
    $scope.editNotDict = false;
  }

  const showForbiddenError = () => {
    $scope.errorMessage = true;
    $scope.errorCode = "Error 403: Forbidden"
    $scope.errorDescription = "You have not access to do this action, please login as a different user"
  }

  const showUnexpectedError = () => {
    $scope.errorMessage = true;
    $scope.errorCode = "Unexpected Error"
    $scope.errorDescription = "Unexpected error during querying ElasticSearch"
  } 

  /////

  $http.get(_this.baseUrl + '/api/get_dashboards').catch(function (err) {
    // Catch unathourized error
    if (err.status === 403) {
        showForbiddenError()
        return -1;
    } else if (err.status === -1){
        // Other errors
        showUnexpectedError()
        return -1;
    }
  }).then((response) => {
    if(response !== -1){
      console.log("Dashboards retrieved from the petition", response)
      $scope.dashboards = response.data.dashboards
    }
  }, (error) => {
    console.log(error);
  });

  $http.get(_this.baseUrl + '/api/get_metadashboard').catch(function (err) {
    // Catch unathourized error
    if (err.status === 403) {
        showForbiddenError()
        return -1;
    } else if (err.status === -1){
        // Other errors
        showUnexpectedError()
        return -1;
    }
  }).then((response) => {
    if(response !== -1){
      console.log("Metadashboard retrieved from the petition", response)
      $scope.metadashboard = response.data.metadashboard[0]._source.metadashboard
    }
  }, (error) => {
    console.log(error);
  });
  //////////////////////////


  /////////////////////// Adding forms //////////////////
  $scope.addItem = function(n_parent, item) {
    hideAllForms();
    $scope.simpleAdding = true;
    if(item === "root"){
      $scope.currentParentName = "root";
      $scope.complexAdding = true;
    }else{
      $scope.indexParent = n_parent;
      $scope.currentParentName = item.name;
      $scope.currentParent = item;
    }
  }

  // Add item that is a link (entry)
  $scope.addSimple = function(){
    // Build the object
    let dash = {
      title: $scope.simpleTitleSelected,
      name: $scope.simpleNameSelected,
      description: $scope.simpleDescriptionSelected,
      type: "entry",
      panel_id: $scope.simpleDashboardSelected.replace(/ /g,"-").split("dashboard:")[1]
    }

    // Adding to a parent
    if($scope.currentParentName !== "root"){
      $scope.metadashboard[$scope.indexParent].dashboards.push(dash)
      return
    }
    //Adding to the root menu
    $scope.metadashboard.push(dash)
  }

  // Add item that will have submenu
  $scope.addParent = function(){
    let dash = {
      title: $scope.parentTitleSelected,
      name: $scope.parentNameSelected,
      description: $scope.parentDescriptionSelected,
      type: "menu",
      dashboards: []
    }
    $scope.metadashboard.push(dash)
  }

  //////////////////////////////////////////////////////

  //////////////////EDIT ITEM/////////////////////////////////////////
  $scope.editItem = function(n_parent, item, n_son, subitem){
    hideAllForms();
    $scope.editItemForm = true;
    if(subitem){
      // Is a child so we have to define the parent
      $scope.editingEntry = true;
      $scope.indexParent = n_parent;
      $scope.currentParent = item;
      $scope.indexSon = n_son;
      $scope.currentSon = subitem;
      $scope.editTitleSelected = subitem.title;
      $scope.editNameSelected = subitem.name;
      $scope.editDescriptionSelected = subitem.description;
      $scope.editDashboardSelected = "dashboard:" + subitem.panel_id;
      return
    }
    // Is a parent just is a link
    $scope.editingEntry = (item.type === "entry")
    $scope.indexParent = n_parent;
    $scope.currentParent = item;
    $scope.indexSon = undefined;
    $scope.currentSon = undefined;
    $scope.editTitleSelected = item.title;
    $scope.editNameSelected = item.name;
    $scope.editDescriptionSelected = item.description;
    $scope.editDashboardSelected = "dashboard:" + item.panel_id;
  }

  //Save Edit Item
  $scope.saveEditItem = function(){
    hideAllForms();
    if ($scope.currentSon){
      $scope.metadashboard[$scope.indexParent].dashboards[$scope.indexSon] = {
        title: $scope.editTitleSelected,
        name: $scope.editNameSelected,
        description: $scope.editDescriptionSelected,
        type: "entry",
        panel_id: $scope.editDashboardSelected.replace(/ /g,"-").split("dashboard:")[1]
      }
    }else{
      let dashEdited = {
        title: $scope.editTitleSelected,
        name: $scope.editNameSelected,
        description: $scope.editDescriptionSelected,
      }
      if ($scope.editingEntry) {
        dashEdited.type = "entry";
        dashEdited.panel_id = $scope.editDashboardSelected.replace(/ /g,"-").split("dashboard:")[1]
      }else{
        dashEdited.type = "menu";
        dashEdited.dashboards = $scope.metadashboard[$scope.indexParent].dashboards
      }
      $scope.metadashboard[$scope.indexParent] = dashEdited
    }
    // Reset params
    $scope.indexParent = undefined;
    $scope.currentParent = undefined;
    $scope.indexSon = undefined;
    $scope.currentSon = undefined;
  }
  //////////////////////////////////////////////////////////////////////////

  //////////////////DELETE ITEM/////////////////////////////////////////
  $scope.deleteItemPrev = function(n_parent, item, n_son, subitem){
    hideAllForms();
    $scope.confirmDeleteForm = true;
    //Check if dict in order to show the dashboard list
    $scope.editNotDict = (item.type === "entry")
    if(subitem){
      $scope.isSonToDelete = true;
      $scope.editNotDict = true;
      $scope.index_parent = n_parent;
      $scope.deleteSelected = subitem.name;
      $scope.index_to_delete = n_son;
      return
    }
    $scope.isSonToDelete = false;
    $scope.deleteSelected = item.name;
    $scope.index_to_delete = n_parent;
  }

  $scope.deleteEditItem = function(){
    hideAllForms();
    if($scope.isSonToDelete){
      $scope.metadashboard[$scope.index_parent].dashboards.splice($scope.index_to_delete, 1)
      return
    }
    $scope.metadashboard.splice($scope.index_to_delete, 1)
  }
  //////////////////////////////////////////////////////////////////////////

  /////////////////////////REORDER ITEM/////////////////////////////////////

  $scope.reorderItem = (i, item, n_parent, subitem, n_son) => {
    if(subitem){
      if ($scope.metadashboard[n_parent].dashboards[n_son + i]){
        let item_aux = $scope.metadashboard[n_parent].dashboards[n_son + i];
        $scope.metadashboard[n_parent].dashboards[n_son + i] = $scope.metadashboard[n_parent].dashboards[n_son]
        $scope.metadashboard[n_parent].dashboards[n_son] = item_aux
      }
      return
    }
    if ($scope.metadashboard[n_parent + i]) {
      let item_aux = $scope.metadashboard[n_parent + i];
      $scope.metadashboard[n_parent + i] = $scope.metadashboard[n_parent]
      $scope.metadashboard[n_parent] = item_aux
    }
    return
  }

  //////////////////////////////////////////////////////////////////////////


  //Export metadashboard to a JSON file
  $scope.exportJsonMetadashboard = function(){
    var hiddenElement = document.createElement('a');

    hiddenElement.href = 'data:attachment/text,' + encodeURI(JSON.stringify($scope.metadashboard));
    hiddenElement.target = '_blank';
    hiddenElement.download = 'metadashboard.json';
    hiddenElement.click();
  }


  //Update menu
  $scope.updateMenu = function(){
    var dynamicMapping = {"properties": {"metadashboard" : {"type": "object", "dynamic": "true"}}};

    $http.post(_this.baseUrl + '/api/delete_metadashboard').catch(function (err) {
      // Catch unathourized error
      if (err.status === 403) {
          showForbiddenError()
          return -1
      } else if (err.status === -1){
          // Other errors
          showUnexpectedError()
          return -1;
      }
    }).then((response) => {
      if(response !== -1){
        console.log("Response of the metadashboard DELETE", response)
        //First delete metadashboard
        $http.post(_this.baseUrl + '/api/update_mapping', dynamicMapping).catch(function (err) {
          // Catch unathourized error
          if (err.status === 403) {
              showForbiddenError()
              return -1;
          } else if (err.status === -1){
              // Other errors
              showUnexpectedError()
              return -1;
          }
        }).then((response) => {
          if(response !== -1){
            console.log("Response of the updating metadashboard mapping POST", response)
            var newMetadashboard = {
              "metadashboard": $scope.metadashboard
            }
            //Then, update metadashboard
            $http.post(_this.baseUrl + '/api/update_metadashboard', newMetadashboard).catch(function (err) {
              // Catch unathourized error
              if (err.status === 403) {
                  showForbiddenError()
                  return -1;
              } else if (err.status === -1){
                  // Other errors
                  showUnexpectedError()
                  return -1;
              }
            }).then((response) => {
              if(response !== -1){
                console.log("Response of the updating metadashboard POST", response)
              }
            }, (error) => {
              console.log(error);
            });
          }
        }, (error) => {
          console.log(error);
        });
      }
      
    }, (error) => {
      console.log(error);
    });
  }

  $scope.title = 'Menu manager';
  $scope.description = 'Customize your navigation menu';

  const currentTime = moment($route.current.locals.currentTime);
  $scope.currentTime = currentTime.format('HH:mm:ss');
  const unsubscribe = $interval(function () {
    $scope.currentTime = currentTime.add(1, 'second').format('HH:mm:ss');
  }, 1000);
  $scope.$watch('$destroy', unsubscribe);

});
