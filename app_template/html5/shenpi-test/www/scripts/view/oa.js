/* 
* @Author: lizhen
* @Date:   2015-11-12 16:32:53
* @Last Modified by:   lizhen
* @Last Modified time: 2015-11-18 10:17:54
*/

jQuery.extend({
    initNavigation: function(){
        var _them = $(".left_nav a");
        _them.click(function(){
            var _titleBar = $(this).find("span").text();
            $(".am-header-title").text(_titleBar);
            
        });
    }
});


;!$(function(){
    $.initNavigation();
});