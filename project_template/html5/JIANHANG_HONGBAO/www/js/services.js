angular.module('starter.services', [])

  .factory('CreateService', function () {

    return {};
  })

  .factory('HistoryService', function () {

    return {};
  })

  .factory('$transactionPassword', ['$rootScope', '$ionicModal', '$q',
    function ($rootScope, $ionicModal, $q) {


      return function (_option) {
        var deferred = $q.defer();
        var option = _option || {};
        option.scope = (option.scope || $rootScope).$new();

        var passwordUnits = [];
        option.scope.__passwordUnitCount = 0;

        option.scope.__closePasswordModal = function () {
          option.scope.transactionPasswordModal.hide();
          deferred.reject({data: passwordUnits.join(''), type: 'CLOSE'});
        };

        option.scope.__inputPassword = function (_value) {
          if (passwordUnits.length < 6) {
            passwordUnits.push(_value);
            option.scope.__passwordUnitCount = passwordUnits.length;
            deferred.notify({data: _value, type: "INPUT"});
            if (passwordUnits.length === 6) {
              option.scope.transactionPasswordModal.hide();
              deferred.resolve(passwordUnits.join(''));
            }
          }
        };

        option.scope.__deletePassword = function () {
          if (passwordUnits.length > 0) {
            var deleteValue = passwordUnits.pop();
            option.scope.__passwordUnitCount = passwordUnits.length;
            deferred.notify({data: deleteValue, type: 'DELETE'});
          }
        };

        $ionicModal.fromTemplateUrl('templates/service/transactionPasswordModal.html', {
          animation: "slide-in-up",
          scope: option.scope,
        }).then(function (modal) {
          option.scope.transactionPasswordModal = modal;
          option.scope.transactionPasswordModal.show();

          option.scope.$on('$destroy', function () {
            option.scope.transactionPasswordModal.remove();
          });

        });

        return deferred.promise;
      };

    }])

  .factory('$selectConversationUser', ['$rootScope', '$ionicModal', '$q',
    function ($rootScope, $ionicModal, $q) {


      function initViewPersons(persons, selectPersons) {

        var initPersons = persons.map(function (person) {

          person.isChecked = false;
          if (selectPersons) {
            for (var i = 0, n = selectPersons.length; i < n; i++) {
              if (person.login_name == selectPersons[i].login_name) {
                person.isChecked = true;
                break;
              }
            }
          }

          return person;
        });

        return initPersons;

      };


      return function (_option) {

        var deferred = $q.defer();

        var option = _option || {};

        option.scope = (option.scope || $rootScope).$new();
        option.scope.selectPersons = _option.selectPersons || [];
        option.scope.persons = initViewPersons(_option.persons || [], _option.selectPersons || []);
        option.scope.isSingle = _option.isSingle || false;
        option.scope.cssClass = _option.cssClass || 'assertive';

        $ionicModal.fromTemplateUrl('templates/service/selectConversationUserModal.html', {
          animation: "slide-in-right",
          scope: option.scope,
        }).then(function (modal) {
          option.scope.modal = modal;
          option.scope.modal.show();

          option.scope.$on('$destroy', function () {
            option.scope.modal.remove();
          });

          option.scope.closeModal = function () {
            option.scope.modal.hide();
          };

          option.scope.confirm = function () {
            deferred.resolve(option.scope.selectPersons);
            option.scope.closeModal();
          };

          option.scope.change = function (person) {

            if (option.scope.isSingle) {
              initViewPersons(option.scope.persons);
              person.isChecked = true;
            }

            option.scope.selectPersons = option.scope.persons.filter(function (person) {
              return person.isChecked;
            });
          }

        });

        return deferred.promise;
      };

    }])

  .factory("RestfulResourcesAddressService", ['RestfulResourceAddress', 'RestfulResources',
    function (RestfulResourceAddress, RestfulResources) {

      var restfulResourceAddress = RestfulResourceAddress;

      return {
        setRestfulResourceAddress: function (address) {
          restfulResourceAddress = address;
        },
        getRestfulResourceAddress: function () {
          return restfulResourceAddress;
        }
      };

    }])

  .factory("$HttpResource", ['$q', '$timeout', '$http', '$httpParamSerializerJQLike', '$ionicLoading',
    'MXAPP', 'MXCommonService', 'AppStatus',
    function ($q, $timeout, $http, $httpParamSerializerJQLike, $ionicLoading, MXAPP, MXCommonService, AppStatus) {

      function httpResource(type, url, params, isShowLoading) {

        var defered = $q.defer();

        if (null == isShowLoading) {
          isShowLoading = true;
        }

        isShowLoading = isShowLoading && true;

        if (isShowLoading) {
          $ionicLoading.show({
            template: '<ion-spinner class="spinner-panda"></ion-spinner><div class="text-center"><span>正在加载</span></div>',
            duration: 60000
          });
        }

        AppStatus.check().then(
          function (response) {
            MXCommonService.MXCommon.getSsoToken().then(
              function (ssoToken) {
                $http.defaults.headers.common.Authorization = 'bearer.minxing.' + MXAPP.CLIENT_FLAG + ' ' + ssoToken;

                $http({
                  url: url,
                  method: type,
                  data: $httpParamSerializerJQLike(params),
                  headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                  }
                }).success(function (data) {
                  $timeout(function () {
                    if (data && data.code == '00') {
                      defered.resolve(data.context);
                    } else {
                      defered.reject({message: data.message});
                    }
                  });
                }).error(function (error) {
                  $timeout(function () {
                    defered.reject({message: "服务繁忙,请稍候重试!"});
                  });
                }).finally(function () {
                  $timeout(function () {
                    if (isShowLoading) {
                      $ionicLoading.hide();
                    }
                  });
                });
              },
              function () {
                $ionicLoading.hide();
                defered.reject();
              }
            );
          },
          function (response) {
            $ionicLoading.hide();
            defered.reject(response);
          }
        );

        return defered.promise;
      }

      return {
        get: function (url, data, isShowLoading) {
          return httpResource("GET", url, data, isShowLoading);
        },
        post: function (url, data, isShowLoading) {
          return httpResource("POST", url, data, isShowLoading);
        },
        httpResource: httpResource
      };

    }])

  .factory("UserInteractiveService", ['$ionicPopup', '$ionicLoading', '$q',
    function ($ionicPopup, $ionicLoading, $q) {


      function toast(message) {
        return ionicPopupAlert({template: message});
      }

      function ionicPopupAlert(parameters) {

        var option = {
          title: "提示信息",
          template: '',
          okText: '知道了',
          okType: 'button-assertive'
        };

        option = angular.extend({}, option, parameters);

        return $ionicPopup.alert(option);
      }

      function ionicLoadingShow(message) {
        var loadingConfig = {
          duration: 60000,
          template: '<ion-spinner class="spinner-panda"></ion-spinner><div class="text-center"><span>' + message || '正在加载' + '</span></div>'
        };

        return $ionicLoading.show(loadingConfig);
      }

      function ionicLoadingHide() {
        $ionicLoading.hide();
      }

      function confirmPopup(parameters) {

        var deferred = $q.defer();

        var option = {
          title: '确认提醒',
          template: '您确定此操作么？',
          cancelText: '取消',
          cancelType: 'button-assertive button-outline',
          okText: '确定',
          okType: 'button-assertive'
        };

        option = angular.extend({}, option, parameters);

        $ionicPopup.confirm(option)
          .then(function (res) {
            if (res) {
              deferred.resolve();
            } else {
              deferred.reject();
            }
          });

        return deferred.promise;

      }

      return {
        toast: toast,
        alert: ionicPopupAlert,
        loading: {
          show: ionicLoadingShow,
          hide: ionicLoadingHide
        },
        confirm: confirmPopup
      }

    }])

  .factory("MXCommonService", ['$q', 'AppStatus', 'MXAPP', function ($q, AppStatus, MXAPP) {

    var currentUser = null;
    var serverUrl = null;
    var ssoToken = null;

    function getCurrentUser() {

      var deferred = $q.defer();

      try {
        if (currentUser) {
          console.log("----------------------");
          console.log(currentUser);
          console.log("----------------------");
          deferred.resolve(currentUser);
        } else {
          AppStatus.check().then(
            function (response) {
              MXCommon.getCurrentUser(
                function (result) {
                  console.log("----------------------");
                  console.log(result);
                  console.log("----------------------");
                  currentUser = result;
                  deferred.resolve(currentUser);
                }, function () {
                  deferred.reject();
                }
              );
            },
            function (response) {
              deferred.reject(response);
            }
          );
        }
      } catch (e) {
        deferred.resolve();
      }

      return deferred.promise;

    }

    function shareToChatAuto(_options) {

      var options = angular.extend({}, {
        'title': '', //分享标题
        'image_url': '', //缩略图url
        'url': '', //分享url
        'app_url': '', //app_url,原生的页面。如果是分享的html页面，该字段设置为空
        'description': '', //分享描述
        'source_id': '', //资源id,比如应用商店中的应用的id,或者公众号的id
        'source_type': '', // 值为ocu或app，资源类型
        'conversation_id': '' // 群聊的conversation_id
      }, _options);

      var deferred = $q.defer();

      try {
        AppStatus.check().then(
          function (response) {
            MXShare.shareToChatAuto(options
              , function () {
                deferred.resolve();
              }, function () {
                deferred.reject();
              }
            );
          },
          function (response) {
            deferred.reject(response);
          }
        );
      } catch (error) {
        deferred.reject();
      }

      return deferred.promise;
    }

    function sendRedpackageMessage(_options, conversationID) {
      var deferred = $q.defer();
      try {
        var options = angular.extend({}, {
          "data": {
            "launch_url": "",
            "red_packet_bg_normal_url": "",
            "red_packet_bg_selected_url": "",
            "red_packet_description": "查看红包",
            "red_packet_icon_url": "red pocket",
            "red_packet_title": "恭喜发财，大吉大利！",
            "red_packet_trademark": "红包"
          },
          "key": "red_packet"
        }, _options);
        AppStatus.check().then(
          function (response) {
            MXChat.sendPluginMessage([options, conversationID]
              , function (result) {
                deferred.resolve(result);
              }, function (result) {
                deferred.reject(result);
              }
            );
          },
          function (response) {
            deferred.reject(response);
          }
        );
      } catch (error) {
        deferred.reject(error);
      }

      return deferred.promise;
    }

    function getConversationByID(conversation_id) {

      var deferred = $q.defer();

      try {
        AppStatus.check().then(
          function (response) {
            MXChat.getConversationByID(conversation_id,
              function (result) {
                console.log("----------------------");
                console.log(typeof result);
                console.log(result);
                console.log("----------------------");
                deferred.resolve(JSON.parse(result));
              }, function (error) {
                deferred.reject("获取当前聊天人错误" + JSON.stringify(error));
              });
          },
          function (response) {
            deferred.reject(response);
          }
        );
      } catch (e) {
        deferred.reject(e.name + ":" + e.message);
      }

      return deferred.promise;
    }


    function getServerUrl() {

      var deferred = $q.defer();

      try {
        if (serverUrl) {
          deferred.resolve(serverUrl);
        } else {
          AppStatus.check().then(
            function (response) {
              MXCommon.getServerUrl(
                function (url) {
                  serverUrl = url;
                  deferred.resolve(serverUrl);
                }, function () {
                  deferred.reject();
                }
              );
            },
            function (response) {
              deferred.reject(response);
            }
          );
        }
      } catch (e) {
        deferred.resolve("http://im.zsmarter.com");
      }

      return deferred.promise;
    }

    function getSsoToken() {

      var deferred = $q.defer();
      try {
        if (ssoToken) {
          deferred.resolve(ssoToken);
        } else {
          AppStatus.check().then(
            function (response) {
              MXCommon.getSSOToken(MXAPP.ID,
                function (ssoTokenP) {
                  ssoToken = ssoTokenP;
                  deferred.resolve(ssoToken);
                }, function () {
                  deferred.reject();
                }
              );
            },
            function (response) {
              deferred.reject(response);
            }
          );
        }
      } catch (e) {
        deferred.resolve();
      }

      return deferred.promise;
    }

    return {
      MXCommon: {
        getCurrentUser: getCurrentUser,
        getServerUrl: getServerUrl,
        getSsoToken: getSsoToken
      },
      MXShare: {
        shareToChatAuto: shareToChatAuto
      },
      MXChat: {
        getConversationByID: getConversationByID,
        sendRedpackageMessage:sendRedpackageMessage
      }
    }

  }])
  .service('AppStatus', ['$q', 'APP_STATUS', function ($q, APP_STATUS) {
    this.check = function () {
      var delay = $q.defer();
      var startTime = new Date().getTime();
      if (APP_STATUS.ready) {
        delay.resolve('ready');
      } else {
        APP_STATUS.MIN_XING_READY.then(function (response) {
            delay.resolve('ready');
          },
          function (response) {
            delay.reject('应用启动超时请重新进入应用,或联系管理员!');
          });
      }
      return delay.promise;
    }
  }])
  .service('AppStatus', ['$q', 'APP_STATUS', function ($q, APP_STATUS) {
    this.check = function () {
      var delay = $q.defer();
      var startTime = new Date().getTime();
      if (APP_STATUS.ready) {
        delay.resolve('ready');
      } else {
        APP_STATUS.MIN_XING_READY.then(function (response) {
            delay.resolve('ready');
          },
          function (response) {
            delay.reject('应用启动超时请重新进入应用,或联系管理员!');
          });
      }
      return delay.promise;
    }
  }])
  .run(function ($ionicPlatform, $http, $rootScope, $location, $ionicHistory, $q,
                 GetNative, APP_STATUS) {
    var delay = $q.defer();
    APP_STATUS.MIN_XING_READY = delay.promise;
    //当进入页面时就获取ssoToken以及服务器地址
    function onDeviceReady() {
      //APP.AppRuntimeInfo =
      GetNative(delay);
    }
    document.addEventListener("deviceready", onDeviceReady, false);
  })
  .factory('GetNative', function ($http, $rootScope, MXAPP, APP_STATUS) {
    return function (delay) {
      getSSOToken(MXAPP.ID);
      function tokenCallBack(result) {
        //将获取到的token数据放到header中的authorization字段中
        $http.defaults.headers.common['authorization'] = 'bearer.minxing.' + MXAPP.CLIENT_FLAG + ' ' + result;
        APP_STATUS.ready = true;
        delay.resolve({ready: true});
      }


      function getSSOToken(appID) {
        try { //通过appID获取ssoToken方法
          MXCommon.getSSOToken(
            appID,
            tokenCallBack
          );
        } catch (error) {
          APP_STATUS.ready = false;
          delay.resolve({ready: false});
        }
      }
    };
  })
  .constant('APP_STATUS', {
      ready: false,
      MIN_XING_READY: null
    }
  );
