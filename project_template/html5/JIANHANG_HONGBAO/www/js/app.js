/***
 * @author 赵俊明
 */
console.log(window.location.href);
if ((window.location.href.indexOf("conversation_id") > 0
      || window.location.href.indexOf("receive=") > 0 )
      && window.location.href.indexOf("?") > 0) {
    window.location.replace(window.location.href.toString().replace("?", "/"));
}

angular.module('starter', ['ionic', 'ngIOS9UIWebViewPatch', 'starter.controllers', 'starter.services'])

    .run(['$ionicPlatform', '$rootScope', '$ionicHistory',
        function ($ionicPlatform, $rootScope, $ionicHistory) {

            $ionicPlatform.ready(function () {

                $rootScope.$ionicPlatform = ionic.Platform;

                $rootScope.closeWindow = function () {
                    MXWebui.closeWindow();
                };

                $rootScope.MXWebUIBack = function () {
                    if ($ionicHistory.backView()) {
                        $ionicHistory.goBack();
                    } else {
                        MXWebui.closeWindow();
                    }
                }
            });
        }])

    .run([
        '$rootScope',
        '$ionicPlatform',
        '$ionicHistory',
        'IONIC_BACK_PRIORITY',
        function ($rootScope, $ionicPlatform, $ionicHistory, IONIC_BACK_PRIORITY) {

            function onHardwareBackButton(e) {
                var backView = $ionicHistory.backView();
                if (backView) {
                    backView.go();
                } else {
                    MXWebui.closeWindow();
                }
                e.preventDefault();
                return false;
            }

            $ionicPlatform.registerBackButtonAction(
                onHardwareBackButton,
                IONIC_BACK_PRIORITY.view
            );

        }])

    .config(['$stateProvider', '$urlRouterProvider', '$ionicConfigProvider',
        function ($stateProvider, $urlRouterProvider, $ionicConfigProvider) {

            //配置ionic平台相关参数 主要针对IOS Android

            $ionicConfigProvider.platform.ios.navBar.alignTitle('center');
            $ionicConfigProvider.platform.android.navBar.alignTitle('center');

            $ionicConfigProvider.platform.ios.backButton.previousTitleText(true);
            $ionicConfigProvider.platform.android.backButton.previousTitleText(true);

        }])

    .constant("RestfulResourceAddress", "http://im.zsmarter.com:8080/hongbao")
    //.constant("RestfulResourceAddress", "http://127.0.0.1/hongbao")

    .constant("RestfulResources", {
        "PREP_CREATE": "/hongbao/saveConfirmInfo.json",
        "CREATE": "/hongbao/createHongbao.json",
        "QUERY_HONGBAO": "/hongbao/queryHongbao/{{hongbaoId}}.json",
        "EXECUTE_GET_HB": "/hongbao/executeGetHB/{{hongbaoId}}.json",
        "QUERY_USER_GET_RECORDS": "/hongbao/queryUserGetRecords.json",
        "QUERY_MYSEND_HONGBAO": "/hongbao/queryMySendHongbao.json",
        "QUERY_HONGBAO_GRAB": "/hongbao/queryHongbaoGrab/{{hongbaoId}}.json",
        "QUERY_ACCOUNT_INFO": "/ws/wallet/queryAccountInfo.json"
    })

    .constant("MXAPP", {
        ID : "JIANHANG_HONGBAO",
        //ID : "hongbao_pzy",
        CLIENT_FLAG : "yuelongxin"
        //CLIENT_FLAG : "zsmarter"
    })

    .config(["$stateProvider", "$urlRouterProvider",
        function ($stateProvider, $urlRouterProvider) {

            $stateProvider

                .state('redPackage', {
                    url: '/redPackage',
                    abstract: true,
                    resolve: {}
                })

                .state('redPackage.conversation_id', {
                    url: '^/conversation_id=:conversation_id',
                    resolve: {},
                    views: {
                        '@': {
                            templateUrl: 'templates/create.html',
                            controller: 'CreateCtrl'
                        }
                    }
                })

                .state('redPackage.create', {
                    url: '/create',
                    views: {
                        '@': {
                            templateUrl: 'templates/create.html',
                            controller: 'CreateCtrl'
                        }
                    }
                })

                .state('redPackage.createSingle', {
                    url: '/createSingle',
                    params: {
                        conversation_id: null,
                        conversations: null,
                        clear: false
                    },
                    views: {
                        '@': {
                            templateUrl: 'templates/createSingle.html',
                            controller: 'CreateSingleCtrl'
                        }
                    }
                })

                .state('redPackage.createMultiple', {
                    url: '/createMultiple',
                    params: {
                        conversation_id: null,
                        conversations: null,
                        clear: false
                    },
                    views: {
                        '@': {
                            templateUrl: 'templates/createMultiple.html',
                            controller: 'CreateMultipleCtrl'
                        }
                    }
                })

                .state('redPackage.history', {
                    url: '/history',
                    params: {
                        clear: false
                    },
                    views: {
                        '@': {
                            templateUrl: 'templates/history.html',
                            controller: 'HistoryCtrl'
                        }
                    }
                })

                .state('redPackage.send', {
                    url: '/send/:hongbaoId',
                    params: {
                        clear: false
                    },
                    views: {
                        '@': {
                            templateUrl: 'templates/send.html',
                            controller: 'SendCtrl'
                        }
                    }
                })

                .state('redPackage.receive', {
                    url: '^/receive=:hongbaoId&conversation_id=:conversation_id',
                    //url: '^/receive=:hongbaoId',
                    params: {
                        clear: false
                    },
                    views: {
                        '@': {
                            templateUrl: 'templates/receive.html',
                            controller: 'ReceiveCtrl'
                        }
                    }
                });

            $urlRouterProvider.otherwise('/redPackage/history');


        }]);
