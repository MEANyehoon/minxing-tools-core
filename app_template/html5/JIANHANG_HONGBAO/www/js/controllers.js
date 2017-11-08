angular.module('starter.controllers', [])


  .controller('CreateCtrl', ['$scope', '$ionicHistory', '$state', '$location', 'MXCommonService', '$rootScope', 'UserInteractiveService', '$HttpResource', 'RestfulResourcesAddressService', 'RestfulResources',
    function ($scope, $ionicHistory, $state, $location, MXCommonService, $rootScope, UserInteractiveService, $HttpResource, RestfulResourcesAddressService, RestfulResources) {

      $scope.$on('$ionicView.beforeEnter', function (e) {

        $scope.conversation_id = $state.params.conversation_id;

        $scope.backView = $ionicHistory.backView();

        if ($scope.conversation_id) {

          MXCommonService.MXChat.getConversationByID($scope.conversation_id)
            .then(function (result) {

              MXCommonService.MXCommon.getCurrentUser()
                .then(function (currentUser) {

                  result.persons = result.persons.filter(function (person) {

                    if (person.login_name == currentUser.login_name) {
                      return false;
                    }

                    return true;
                  });

                  result.persons.push(currentUser);

                  var routerParams = {
                    conversation_id: $scope.conversation_id,
                    conversations: result,
                    clear: true
                  };

                  if (result && result.persons && result.persons.length > 0) {

                    var router = "";

                    if (result.persons.length > 2) {
                      router = "redPackage.createMultiple";
                    } else {
                      router = "redPackage.createSingle";
                    }

                    var has_password = "false";

                    if (window.localStorage) {
                      has_password = window.localStorage.getItem(currentUser.login_name + ".has_password");
                    }


                    if (has_password == "true") {
                      $state.go(router, routerParams);
                    } else {
                      $HttpResource.post(RestfulResourcesAddressService.getRestfulResourceAddress() + RestfulResources.QUERY_ACCOUNT_INFO)
                        .then(function (data) {
                          if (data) {
                            if (data.flag) {
                              if (window.localStorage) {
                                window.localStorage.setItem(currentUser.login_name + ".has_password", "true");
                              }
                              $state.go(router, routerParams);
                            } else {
                              UserInteractiveService
                                .alert({template: "您没有设置账户密码，请先设置密码。“应用》我的账户》账户设置》设置密码”"})
                                .then(function () {
                                  $rootScope.MXWebUIBack();
                                });
                            }
                          } else {
                            alert("查询账户信息出错");
                            $rootScope.MXWebUIBack();
                          }
                        }, function (error) {
                          if (error && error.message) {
                            UserInteractiveService.alert({template: error.message})
                              .then(function () {
                                $rootScope.MXWebUIBack();
                              });
                          } else {
                            UserInteractiveService.alert({template: JSON.stringify(error)})
                              .then(function () {
                                $rootScope.MXWebUIBack();
                              });
                          }

                        });
                    }

                  } else {
                    $rootScope.MXWebUIBack();
                  }

                }, function () {
                  $rootScope.MXWebUIBack();
                });

            }, function (error) {
              alert(error);
              $rootScope.MXWebUIBack();
            });
        } else {
          $state.go("redPackage.history", {clear: true});
        }

      });

    }])

  .controller('CreateSingleCtrl', ['$rootScope', '$scope', '$ionicSlideBoxDelegate', '$ionicHistory', '$transactionPassword', '$state', 'RestfulResources', 'RestfulResourcesAddressService', '$HttpResource', 'MXCommonService', 'MXAPP', 'UserInteractiveService',
    function ($rootScope, $scope, $ionicSlideBoxDelegate, $ionicHistory, $transactionPassword, $state, RestfulResources, RestfulResourcesAddressService, $HttpResource, MXCommonService, MXAPP, UserInteractiveService) {

      $scope.$on('$ionicView.beforeEnter', function (e) {
        $scope.redPackageSingle = {};

        $scope.conversationId = $state.params.conversation_id;
        $scope.conversations = $state.params.conversations;

        $scope.clear = $state.params.clear;

        if ($state.params.clear) {
          $ionicHistory.clearCache();
          $ionicHistory.clearHistory();
        }

        $scope.backView = $ionicHistory.backView();

      });

      $scope.sendRedPackage = function () {

        MXCommonService.MXCommon.getCurrentUser()
          .then(function (currentUser) {

            var params = angular.extend({
              userId: currentUser.login_name,
              receiverType: "1",
              allotType: "1",
              totalCount: 1,
              conversationId: $scope.conversationId,
              receiverId: $scope.conversations.persons.filter(function (person) {
                if (person.login_name == currentUser.login_name) {
                  return false;
                }
                return true;
              }).map(function (person) {
                return person.login_name;
              }).join(",")

            }, $scope.redPackageSingle);

            $HttpResource.post(RestfulResourcesAddressService.getRestfulResourceAddress() + RestfulResources.PREP_CREATE, params)
              .then(function (data) {
                $scope.confirmSendRedPackage(data.result);
              }, function (error) {
                if (error && error.message) {
                  UserInteractiveService.alert({template: error.message})
                    .then(function () {
                    });
                } else {
                  UserInteractiveService.alert({template: JSON.stringify(error)})
                    .then(function () {
                    });
                }
              });

          }, function (error) {
            alert("获取红包创建人失败");
          });

      };

      $scope.confirmSendRedPackage = function (prepKey) {

        $transactionPassword({scope: $scope})
          .then(function (password) {

            var payPassword = CryptoJS.MD5(password).toString();
            var params = {
              confirmKey: prepKey,
              payPassword: payPassword
            };
            $HttpResource.post(RestfulResourcesAddressService.getRestfulResourceAddress() + RestfulResources.CREATE, params)
              .then(function (data) {

                //MXCommonService.MXShare.shareToChatAuto({
                //  'title': '个人红包', //分享标题
                //  'image_url': 'http://upload.admin5.com/2015/0116/1421395046813.jpg', //缩略图url
                //  'url': '', //分享url
                //  'app_url': 'launchApp://' + MXAPP.ID + '?receive=' + data.hongbaoId, //app_url,原生的页面。如果是分享的html页面，该字段设置为空
                //  'description': $scope.redPackageSingle.blessings || "恭喜发财，万事如意！", //分享描述
                //  'source_id': MXAPP.ID, //资源id,比如应用商店中的应用的id,或者公众号的id
                //  'source_type': 'app', // 值为ocu或app，资源类型
                //  'conversation_id': $scope.conversationId // 群聊的conversation_id
                //}).then(function () {
                //  $rootScope.MXWebUIBack();
                //}, function () {
                //  UserInteractiveService.alert({template: "发送红包失败"})
                //    .then(function () {
                //    });
                //
                //});
                var jsonParams = {
                  "data": {
                    "launch_url": "launchApp://" + MXAPP.ID + '?receive=' + data.hongbaoId,
                    //"red_packet_bg_normal_url": "http://upload.admin5.com/2015/0116/1421395046813.jpg",
                    //"red_packet_bg_selected_url": "http://img.25pp.com/uploadfile/soft/images/2015/0604/20150604094047852.jpg",
                    "red_packet_description": '个人红包',
                    //"red_packet_icon_url": "http://img.25pp.com/uploadfile/app/icon/20160513/1463111679850069.jpg",
                    "red_packet_title": $scope.redPackageSingle.blessings || "恭喜发财，万事如意！",
                    "red_packet_trademark": "红包"
                  },
                  "key": "red_packet"
                };
                MXCommonService.MXChat.sendRedpackageMessage(jsonParams,$scope.conversationId)
                  .then(function () {
                    $rootScope.MXWebUIBack();
                  }, function () {
                    UserInteractiveService.alert({template: "红包发送失败"})
                      .then(function () {
                      });
                  });

              }, function (error) {
                if (error && error.message) {
                  UserInteractiveService.alert({template: error.message})
                    .then(function () {
                    });
                } else {
                  UserInteractiveService.alert({template: JSON.stringify(error)})
                    .then(function () {
                    });
                }
              });

          });

      }
    }])

  .controller('CreateMultipleCtrl', ['$rootScope', '$scope', '$ionicSlideBoxDelegate', '$ionicHistory',
    '$transactionPassword', '$state', '$selectConversationUser', 'MXCommonService', '$HttpResource',
    'RestfulResourcesAddressService', 'RestfulResources', 'MXAPP', 'UserInteractiveService', '$filter',
    function ($rootScope, $scope, $ionicSlideBoxDelegate, $ionicHistory, $transactionPassword, $state,
              $selectConversationUser, MXCommonService, $HttpResource, RestfulResourcesAddressService,
              RestfulResources, MXAPP, UserInteractiveService, $filter) {
      $scope.tabsFlag = 0;

      $scope.$on('$ionicView.beforeEnter', function (e) {
        $scope.redPackage = {'GROUP': {}};

        $scope.conversationId = $state.params.conversation_id;
        $scope.conversations = $state.params.conversations;
        $scope.clear = $state.params.clear;

        if ($state.params.clear) {
          $ionicHistory.clearCache();
          $ionicHistory.clearHistory();
        }

        $scope.tabsFlag = 0;

        $scope.backView = $ionicHistory.backView();

        $scope.selectPersons = [];

      });

      $scope.selectConversationUser = function () {

        $selectConversationUser({
          scope: $scope,
          persons: $scope.conversations && $scope.conversations.persons,
          selectPersons: $scope.selectPersons
        }).then(function (result) {
          $scope.selectPersons = result;
        });

      };


      //手势状态联动-tabs to silde
      $scope.$watch("tabsFlag", function (value) {
        $scope.redPackage.GROUP.amount = null;
        $scope.redPackage.GROUP.totalCount = null;
        $ionicSlideBoxDelegate.slide(value);
      });

      //手势状态联动-silde to tabs
      $scope.tabsSlideChanged = function (index) {
        $scope.tabsFlag = index;
      };

      $scope.$watch("redPackage.GROUP.amount", function (newValue, oldValue) {
        // if(newValue != oldValue){
        if (newValue) {
          var _amount = newValue * 1;
          _amount = $filter('number')(_amount, 0).replace(/[, -]+/g, '') * 1;
          $scope.redPackage.GROUP.amount = _amount;
        }

        //}
      });
      $scope.$watch("redPackage.GROUP.totalCount", function (newValue, oldValue) {
        // if(newValue != oldValue){
        if (newValue) {
          var _amount = newValue * 1;
          _amount = $filter('number')(_amount, 0).replace(/[, -]+/g, '') * 1;
          $scope.redPackage.GROUP.totalCount = _amount;
        }

        //}
      });


      $scope.sendRedPackage = function (type) {
        //发红包预处理
        var redPackage;
        var params = {};
        if ("GROUP_RANDOM" == type) {
          redPackage = $scope.redPackage["GROUP"];
          params = angular.extend({}, redPackage, {
            receiverType: "0",//0 群，1 人 2企业
            allotType: "0",//1 平均，0手气
            conversationId: $scope.conversationId,
            receiverId: $scope.conversations.persons.map(function (person) {
              return person.login_name;
            }).join(",")
          });
        } else if ("GROUP_AVG" == type) {
          redPackage = $scope.redPackage["GROUP"];
          params = angular.extend({}, redPackage, {
            receiverType: "0",//0 群，1 人 2企业
            allotType: "1",//1 平均，0手气
            conversationId: $scope.conversationId,
            receiverId: $scope.conversations.persons.map(function (person) {
              return person.login_name;
            }).join(",")
          });
          params.amount = params.amount * params.totalCount;
        } else {
          redPackage = $scope.redPackage[type];
          params = angular.extend({}, $scope.redPackage[type], {
            receiverType: "2",//0 群，1 人 2企业
            allotType: "1",//1 平均，0手气
            conversationId: $scope.conversationId,
            totalCount: $scope.selectPersons.length,
            amount: $scope.redPackage[type].amount * $scope.selectPersons.length,
            receiverId: $scope.selectPersons.map(function (person) {
              return person.login_name;
            }).join(",")
          });
        }
        //params.receiverId;
        //params.receiverId = null;
        $HttpResource.post(RestfulResourcesAddressService.getRestfulResourceAddress() + RestfulResources.PREP_CREATE, params)
          .then(function (data) {
            $scope.confirmSendRedPackage(type, redPackage, data.result);
          }, function (error) {
            if (error && error.message) {
              UserInteractiveService.alert({template: error.message})
                .then(function () {
                });
            } else {
              UserInteractiveService.alert({template: JSON.stringify(error)})
                .then(function () {
                });
            }
          });
      }

      $scope.confirmSendRedPackage = function (type, redPackage, prepKey) {

        $transactionPassword({scope: $scope})
          .then(function (password) {

            var payPassword = CryptoJS.MD5(password).toString();
            var params = {
              confirmKey: prepKey,
              payPassword: payPassword
            };

            $HttpResource.post(RestfulResourcesAddressService.getRestfulResourceAddress() + RestfulResources.CREATE, params)
              .then(function (data) {

                //MXCommonService.MXShare.shareToChatAuto({
                //  'title': type == 'GROUP_RANDOM' ? '手气红包' : (type == 'GROUP_AVG' ? '普通红包' : '企业红包'), //分享标题
                //  'image_url': 'http://upload.admin5.com/2015/0116/1421395046813.jpg', //缩略图url
                //  'url': '', //分享url
                //  'app_url': 'launchApp://' + MXAPP.ID + '?receive=' + data.hongbaoId, //app_url,原生的页面。如果是分享的html页面，该字段设置为空
                //  'description': redPackage.blessings || "恭喜发财，万事如意！", //分享描述
                //  'source_id': MXAPP.ID, //资源id,比如应用商店中的应用的id,或者公众号的id
                //  'source_type': 'app', // 值为ocu或app，资源类型
                //  'conversation_id': $scope.conversationId // 群聊的conversation_id
                //}).then(function () {
                //  $rootScope.MXWebUIBack();
                //}, function () {
                //  UserInteractiveService.alert({template: "红包发送失败"})
                //    .then(function () {
                //    });
                //});

                var jsonParams = {
                  "data": {
                    "launch_url": "launchApp://" + MXAPP.ID + '?receive=' + data.hongbaoId,
                    //"red_packet_bg_normal_url": "http://upload.admin5.com/2015/0116/1421395046813.jpg",
                    //"red_packet_bg_selected_url": "http://img.25pp.com/uploadfile/soft/images/2015/0604/20150604094047852.jpg",
                    "red_packet_description": 'GROUP_RANDOM' ? '手气红包' : (type == 'GROUP_AVG' ? '普通红包' : '企业红包'),
                    //"red_packet_icon_url": "http://img.25pp.com/uploadfile/app/icon/20160513/1463111679850069.jpg",
                    "red_packet_title": redPackage.blessings || "恭喜发财，万事如意！",
                    "red_packet_trademark": "红包"
                  },
                  "key": "red_packet"
                };
                MXCommonService.MXChat.sendRedpackageMessage(jsonParams,$scope.conversationId)
                  .then(function () {
                    $rootScope.MXWebUIBack();
                  }, function () {
                    UserInteractiveService.alert({template: "红包发送失败"})
                      .then(function () {
                      });
                  });

              }, function (error) {
                if (error && error.message) {
                  UserInteractiveService.alert({template: error.message})
                    .then(function () {
                    });
                } else {
                  UserInteractiveService.alert({template: JSON.stringify(error)})
                    .then(function () {
                    });
                }
              });
          });

      };
    }])

  .controller('HistoryCtrl', ['$rootScope', '$scope', '$ionicSlideBoxDelegate', '$HttpResource', '$ionicHistory', '$state', 'MXCommonService', 'RestfulResourcesAddressService', 'RestfulResources', '$interpolate', 'UserInteractiveService',
    function ($rootScope, $scope, $ionicSlideBoxDelegate, $HttpResource, $ionicHistory, $state, MXCommonService, RestfulResourcesAddressService, RestfulResources, $interpolate, UserInteractiveService) {
      $scope.tabsFlag = 0;


      $scope.$on('$ionicView.beforeEnter', function (e) {

        $scope.clear = $state.params.clear;

        $scope.backView = $ionicHistory.backView();

        MXCommonService.MXCommon.getCurrentUser()
          .then(function (currentUser) {
            $scope.currentUser = currentUser;
          }, function (error) {
            alert(error);
          });

        $scope.receiveRedPackageUrl = RestfulResourcesAddressService.getRestfulResourceAddress() + RestfulResources.QUERY_USER_GET_RECORDS;
        $scope.sendRedPackageUrl = RestfulResourcesAddressService.getRestfulResourceAddress() + RestfulResources.QUERY_MYSEND_HONGBAO;

        $scope.getSendRedPackageList();
        $scope.getReceiveRedPackageList();

      });


      //手势状态联动-tabs to silde
      $scope.$watch("tabsFlag", function (value) {
        $ionicSlideBoxDelegate.slide(value);
      });

      //手势状态联动-silde to tabs
      $scope.tabsSlideChanged = function (index) {
        $scope.tabsFlag = index;
      };


      //第一次等待刷新 加载状态
      $scope.isShowLoadingOfSendRedPackage = true;
      $scope.isShowLoadingOfReceiveRedPackage = true;

      $scope.sendRedPackageList = [];
      $scope.receiveRedPackageList = [];

      $scope.sendRedPackageAmount = 0;
      $scope.receiveRedPackageAmount = 0;

      function sumRedPackageAmount(list, type) {

        var count = 0;

        angular.forEach(list, function (item) {
          count = count + item.amount * 1;
        });

        $scope[type] = count;
      }

      function convertAvatarURl(list) {

        MXCommonService.MXCommon.getServerUrl().then(function (url) {
          angular.forEach(list, function (item) {
            item.avatar_url = url + "/photos/" + item.createUserAccount;
          });
        });

      }

      //获取即将开始列表信息
      $scope.getSendRedPackageList = function () {
        if (null == $scope.sendRedPackageList || $scope.sendRedPackageList.length === 0) {
          $scope.isShowLoadingOfSendRedPackage = true;
        }
        new $HttpResource.get($scope.sendRedPackageUrl, {}).then(function (data) {
          $scope.isShowLoadingOfSendRedPackage = false;
          $scope.sendRedPackageList = data.mySendHongbaos;

          sumRedPackageAmount($scope.sendRedPackageList, "sendRedPackageAmount");
        }, function (error) {
          $scope.isShowLoadingOfSendRedPackage = false;
        });
      };

      //获取已经开始列表信息
      $scope.getReceiveRedPackageList = function () {
        if (null == $scope.receiveRedPackageList || $scope.receiveRedPackageList.length === 0) {
          $scope.isShowLoadingOfReceiveRedPackage = true;
        }
        new $HttpResource.get($scope.receiveRedPackageUrl, {})
          .then(function (data) {
            $scope.isShowLoadingOfReceiveRedPackage = false;
            $scope.receiveRedPackageList = data.detail;

            convertAvatarURl($scope.receiveRedPackageList);
            sumRedPackageAmount($scope.receiveRedPackageList, "receiveRedPackageAmount");
          }, function (error) {
            $scope.isShowLoadingOfReceiveRedPackage = false;
          });
      };


      //下拉刷新 上提示刷新
      $scope.doRefreshSendRedPackageList = function () {

        new $HttpResource.get($scope.sendRedPackageUrl, {}, false)
          .then(function (data) {
            $scope.sendRedPackageList = data.mySendHongbaos;
            sumRedPackageAmount($scope.sendRedPackageList, "sendRedPackageAmount");
            $scope.$broadcast('scroll.refreshComplete');
          }, function (error) {
            $scope.$broadcast('scroll.refreshComplete');
          });
      };

      //下拉刷新 上提示刷新
      $scope.doRefreshReceiveRedPackageList = function () {

        new $HttpResource.get($scope.receiveRedPackageUrl, {}, false)
          .then(function (data) {
            $scope.receiveRedPackageList = data.detail;
            convertAvatarURl($scope.receiveRedPackageList);
            sumRedPackageAmount($scope.receiveRedPackageList, "receiveRedPackageAmount");
            $scope.$broadcast('scroll.refreshComplete');
          }, function (error) {
            $scope.$broadcast('scroll.refreshComplete');
          });
      };

    }])

  .controller('SendCtrl', ['$scope', '$rootScope', '$ionicSlideBoxDelegate', '$HttpResource', '$ionicHistory', '$state', 'RestfulResourcesAddressService', '$interpolate', 'RestfulResources', 'MXCommonService', 'UserInteractiveService',
    function ($scope, $rootScope, $ionicSlideBoxDelegate, $HttpResource, $ionicHistory, $state, RestfulResourcesAddressService, $interpolate, RestfulResources, MXCommonService, UserInteractiveService) {

      $scope.$on('$ionicView.beforeEnter', function (e) {

        $scope.hongbao = {};
        $scope.lingQuHongbaoCount = 0;
        $scope.hongbaoId = $state.params.hongbaoId;
        $scope.clear = $state.params.clear;

        if ($state.params.clear) {
          $ionicHistory.clearCache();
          $ionicHistory.clearHistory();
        }

        $scope.backView = $ionicHistory.backView();

        $scope.receiveRedPackageUrl = RestfulResourcesAddressService.getRestfulResourceAddress() + $interpolate(RestfulResources.QUERY_HONGBAO_GRAB)({hongbaoId: $scope.hongbaoId});

        new $HttpResource.get($scope.receiveRedPackageUrl, {})
          .then(function (data) {

            $scope.hongbao = data;

            MXCommonService.MXCommon.getServerUrl().then(function (url) {
              MXCommonService.MXCommon.getCurrentUser().then(
                function (mxUser) {
                  $scope.hongbao.payChecksSend.avatar_url = url + "/photos/" + mxUser.login_name;
                }
              );

              angular.forEach($scope.hongbao.payGrabs, function (item) {
                item.avatar_url = url + "/photos/" + item.userInfoId;
                if (item.status == "1") {
                  $scope.lingQuHongbaoCount += 1;
                }
              });
            });
          }, function (error) {
            if (error && error.message) {
              UserInteractiveService.alert({template: error.message})
                .then(function () {
                  $rootScope.MXWebUIBack();
                });
            } else {
              UserInteractiveService.alert({template: JSON.stringify(error)})
                .then(function () {
                  $rootScope.MXWebUIBack();
                });
            }
          });


      });

    }])

  .controller('ReceiveCtrl', ['$rootScope', '$state', '$scope', '$ionicModal', '$ionicSlideBoxDelegate', '$HttpResource', '$ionicHistory', 'RestfulResources', 'RestfulResourcesAddressService', '$interpolate', 'MXCommonService', '$q', '$location', 'UserInteractiveService',
    function ($rootScope, $state, $scope, $ionicModal, $ionicSlideBoxDelegate, $HttpResource, $ionicHistory, RestfulResources, RestfulResourcesAddressService, $interpolate, MXCommonService, $q, $location, UserInteractiveService) {

      $scope.$on('$ionicView.beforeEnter', function (e) {

        $scope.clear = $state.params.clear;

        $scope.hongbaoId = $state.params.hongbaoId;


        if ($state.params.clear) {
          $ionicHistory.clearCache();
          $ionicHistory.clearHistory();
        }

        $scope.backView = $ionicHistory.backView();

        $scope.showMoreHongnao = false;

        $scope.hongbao = {};


        $scope.hongbaoFace = [];

        $scope.hideHongbao = function () {
          angular.forEach($scope.hongbaoFace, function (face) {
            face.hide();
          });
        };

        $scope.showHongbao = function () {
          angular.forEach($scope.hongbaoFace, function (face) {
            face.show();
          });
        };

        initHongbao().then(function () {
          MXCommonService.MXCommon.getCurrentUser()
            .then(function (currentUser) {
              $scope.currentUser = currentUser;
              checkHongBao();
            }, function () {
              $rootScope.MXWebUIBack();
            });
        });

      });

      function checkHongBao() {
        var restfulAddress = $interpolate(RestfulResources.QUERY_HONGBAO)({
          hongbaoId: $scope.hongbaoId,
          currentUserId: $scope.currentUser && $scope.currentUser.login_name
        });

        $HttpResource.get(RestfulResourcesAddressService.getRestfulResourceAddress() + restfulAddress, {})
          .then(function (data) {

            console.log(data);

            if (data.payChecksSend.receiverType != '1') {
              $scope.showMoreHongnao = true;
            }

            if (!data.received) {//未接受
              //可接受
              if (data.receivable) {
                if (data.payChecksSend.status == '1') {
                  $scope.hongbao.none = "您来晚了";
                  $scope.hongbao.message = data.payChecksSend.blessings;
                } else {
                  $scope.showHongbao();
                }
              } else {//不可接收
                //自己发自己看，看列表
                $state.go("redPackage.send", {hongbaoId: $scope.hongbaoId, clear: true});
              }
            } else {//已经接收

              if (data.payGrabs && data.payGrabs.length > 0) {
                $scope.hongbao.amount = data.payGrabs[0].amount;
              }

              $scope.hongbao.message = data.payChecksSend.blessings;
              $scope.hongbao.serialNO = data.payChecksSend.oid;

            }
          }, function (error) {
            if (error && error.message) {
              UserInteractiveService.alert({template: error.message})
                .then(function () {
                  $rootScope.MXWebUIBack();
                });
            } else {
              UserInteractiveService.alert({template: JSON.stringify(error)})
                .then(function () {
                  $rootScope.MXWebUIBack();
                });
            }
          });

      }


      function initHongbao() {

        var deferred = $q.defer();

        $ionicModal.fromTemplateUrl('templates/service/hongbao/left.html', {
          scope: $scope,
          animation: 'slide-in-left'
        }).then(function (modal) {
          $scope.hongbaoFace.push(modal);
          $ionicModal.fromTemplateUrl('templates/service/hongbao/right.html', {
            scope: $scope,
            animation: 'slide-in-right'
          }).then(function (modal) {
            $scope.hongbaoFace.push(modal);
            deferred.resolve();
          });
        });

        return deferred.promise;

      }


      $scope.kaiHongbao = function () {

        var restfulAddress = $interpolate(RestfulResources.EXECUTE_GET_HB)({
          hongbaoId: $scope.hongbaoId,
          currentUserId: $scope.currentUser && $scope.currentUser.login_name
        });

        $HttpResource.get(RestfulResourcesAddressService.getRestfulResourceAddress() + restfulAddress, {})
          .then(function (data) {

            if (data.payChecksSend.receiverType != '1') {
              $scope.showMoreHongnao = true;
            }

            console.log(data);

            if (data.errorMessage) {
              $scope.hongbao.none = data.errorMessage;
            }
            else {
              if (data.payGrabs && data.payGrabs.length > 0) {
                $scope.hongbao.amount = data.payGrabs[0].amount;
              }
            }

            $scope.hongbao.serialNO = data.payChecksSend.oid;
            $scope.hongbao.message = data.payChecksSend.blessings;

            $scope.hideHongbao();
          }, function (error) {
            if (error && error.message) {
              UserInteractiveService.alert({template: error.message})
                .then(function () {
                  $rootScope.MXWebUIBack();
                });
            } else {
              UserInteractiveService.alert({template: JSON.stringify(error)})
                .then(function () {
                  $rootScope.MXWebUIBack();
                });
            }
          });

      }

      $scope.$on('$destroy', function () {
        angular.forEach($scope.hongbaoFace, function (face) {
          face.remove();
        });
      });

    }

  ]);
