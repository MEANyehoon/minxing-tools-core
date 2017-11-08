/*
* @Author: lizhen
* @Date:   2015-11-10 14:11:42
* @Last Modified by:   lizhen
* @Last Modified time: 2015-11-12 11:20:19
*/

jQuery.extend({
    initNavigation: function(e){
        var _mxNavUl = $(".mx_nav .first_nav");
        var _mxCode = $(".mx_code");
        var _mxView = $(".mx_view .main");
        var _typeCode = ".txt";
        var _typeView = ".html";
        var _htmlStr = '';
        var _navfId;
        var _navsId;

        //插入一级分类
        for(var i = 0; i < e.length; i++){
            _htmlStr += '<li class="am-nav first_nav_them am-titlebar am-titlebar-default" data-am-collapse="{target: '+ '\'#' +e[i].sUid+ '\'' +'}"  data-am-widget="titlebar" uid = "'+ e[i].sUid +'" >'
                     + '<h2 class="am-titlebar-title ">'
                     + e[i].name
                     + '</h2>'
                     +'</li>';
            //插入二级分类
            if(e[i].them.length > 0){
                _htmlStr += '<ul id="'+ e[i].sUid +'" class="second_nav am-nav am-collapse" pid="'+ i +'">';
                for(var j = 0; j < e[i].them.length; j++){
                    _htmlStr += '<li class="cursor" sid='+ j +'><a>'+ e[i].them[j].navName +'</a></li>';
                }
                _htmlStr += '</ul>'
            }
        }

        //插入导航
        _mxNavUl.append(_htmlStr);

        //获取nav id
        _mxNavUl.find("li").click(function(){
            var _themNum = $(this).attr("uid");
            if(_themNum){   //一级
                $("#" + _themNum).find('li:eq(0)').click();
            }else{  //二级
                //获取父级index
                _navfId = $(this).parent().attr("pid");
                //获取当前index
                _navsId = $(this).attr("sid");

                //选中状态
                _mxNavUl.find("li").removeClass('am-active');
                $(this).addClass('am-active');

                //load code
                _mxCode.show().load(e[_navfId].them[_navsId].codeUrl+e[_navfId].them[_navsId].tempName+_typeCode);

                //load view
                _mxView.load(e[_navfId].them[_navsId].viewUrl+e[_navfId].them[_navsId].tempName+_typeView);
            };
        });
    }
});


;!$(function(){
    //nav data
    var navDatas = [
                        {
                            "name":"全局web组件",
                            "sUid":"menu",
                            "them":[
                                {
                                    "navName":"Header",
                                    "tempName":"header",
                                    "codeUrl":"template/code/",
                                    "viewUrl":"template/view/"
                                },
                                {
                                    "navName":"导航列表",
                                    "tempName":"nav-list",
                                    "codeUrl":"template/code/",
                                    "viewUrl":"template/view/"
                                },
                                {
                                    "navName":"列表页",
                                    "tempName":"list",
                                    "codeUrl":"template/code/",
                                    "viewUrl":"template/view/"
                                },
                                {
                                    "navName":"选项卡",
                                    "tempName":"tabs",
                                    "codeUrl":"template/code/",
                                    "viewUrl":"template/view/"
                                }
                            ]
                        },
                        {
                            "name":"JS 插件",
                            "sUid":"jsFn",
                            "them":[
                                {
                                    "navName":"侧边栏",
                                    "tempName":"sidebar",
                                    "codeUrl":"template/code/",
                                    "viewUrl":"template/view/"
                                },
                                {
                                    "navName":"模态对话框",
                                    "tempName":"modal",
                                    "codeUrl":"template/code/",
                                    "viewUrl":"template/view/"
                                }
                            ]
                        },
                        {
                            "name":"MX NativeJSAPI",
                            "sUid":"jsAPI",
                            "them":[
                                {
                                    "navName":"基础接口",
                                    "tempName":"baseInterface",
                                    "codeUrl":"template/code/",
                                    "viewUrl":"template/view/"
                                },
                                {
                                    "navName":"界面操作",
                                    "tempName":"interfaceOpera",
                                    "codeUrl":"template/code/",
                                    "viewUrl":"template/view/"
                                },
                                {
                                    "navName":"分享接口",
                                    "tempName":"shareInterface",
                                    "codeUrl":"template/code/",
                                    "viewUrl":"template/view/"
                                },
                                {
                                    "navName":"发送opengraph接口",
                                    "tempName":"sendOpengraph",
                                    "codeUrl":"template/code/",
                                    "viewUrl":"template/view/"
                                }
                            ]
                        },
                        {
                            "name":"页面组件",
                            "sUid":"menu1",
                            "them":[
                                {
                                    "navName":"OA搜索页",
                                    "tempName":"search",
                                    "codeUrl":"template/code/",
                                    "viewUrl":"template/view/"
                                },
                                {
                                    "navName":"OA内容页",
                                    "tempName":"content",
                                    "codeUrl":"template/code/",
                                    "viewUrl":"template/view/"
                                },
                                {
                                    "navName":"OA正文页",
                                    "tempName":"article",
                                    "codeUrl":"template/code/",
                                    "viewUrl":"template/view/"
                                },
                                {
                                    "navName":"OA附件页",
                                    "tempName":"file",
                                    "codeUrl":"template/code/",
                                    "viewUrl":"template/view/"
                                },
                                {
                                    "navName":"热度榜列表页",
                                    "tempName":"hotviewranking-list",
                                    "codeUrl":"template/code/",
                                    "viewUrl":"template/view/"
                                }
                            ]
                        }
                   ];

    $.initNavigation(navDatas);

   $(".mx_nav a:eq(0)").click();   //首次加载
});