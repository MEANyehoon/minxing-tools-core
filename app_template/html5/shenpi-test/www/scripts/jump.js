/*
* @Author: lizhen
* @Date:   2015-11-10 14:11:42
* @Last Modified by:   lizhen
* @Last Modified time: 2015-11-18 12:12:19
*/


//$.locationHash()是读取当前页面的hash，$.locationHash("a")是设置当前页面的hash，$(window).hashchange()监听hash改变事件（在第一次绑定事件的时候如果页面有hash值，则立即触发一次事件）。
$.extend({
    initMXPage: {
        intoHtml : function(className){
            //className : load-left ? load-default ? load-right
            var htmlStr = '<div class="mx_page '+ className +'"></div>';
            $(".MX-pages").append(htmlStr);
        }
    },
    initJump: function(){
        var tempUrl = 'oa-template/'; //配置跳转页面模版文件夹
        var className = 'load-right';
        var _arr = ['index'];   //创建返回数组
        var _jumpGo = false;
        var _isReturn = true;
        //监听hash
        $(window).hashchange(function() {
            var hash = location.hash; //获取跳转页面
            console.log(hash.length);
            if(hash.length < 15){
                hash = hash.substring(1,hash.Length);
                _isReturn = true;
            }else{
                hash = hash.substring(1,16);
                _isReturn = false;
            }

            if(hash=='index'){
                hash='index';
                _arr=['index'];
            }else if(hash==''){
                return false;
            }else if(hash == "conversation_id"){ //判断公众号返回 conversation_id
                hash =  "content";
            }else if(_jumpGo == false){
                _arr.push(hash);
                console.info("_jumpGo==",_jumpGo);
            }else{
                _arr.length > 0 ? _arr.pop() : '';
            }
            $(document).on("click",".jumpgo",function(){
                var arrLength = _arr.length;
                _jumpGo = true;
                hash = _arr[arrLength-2];
                location.href='#'+hash;
            });



            var hashUrl = tempUrl + hash + '.html';

            if(_jumpGo == true){
                className = 'load-left';
                $.initMXPage.intoHtml(className);
                $(".mx_page:eq(1)").load(hashUrl,function(){
                    if(_isReturn == false){
                        $(".jumpgo").remove(); 
                    }
                });
                $(".mx_page:eq(1)").animate({"left":"0%"},300);
                $(".mx_page:eq(0)").animate({"left":"100%"},300,function(){
                    $(".mx_page:eq(0)").remove();
                });
                _jumpGo = false;
            } else{
                className = 'load-right';
                $.initMXPage.intoHtml(className);
                $(".mx_page:eq(1)").load(hashUrl,function(){
                    if(_isReturn == false){
                        $(".jumpgo").remove(); 
                    }
                });
                $(".mx_page:eq(1)").animate({"left":"0%"},300);
                $(".mx_page:eq(0)").animate({"left":"-100%"},300,function(){
                    $(".mx_page:eq(0)").remove();
                });
            } 
        });
    }
});


;!$(function(){
   $.initJump();
});