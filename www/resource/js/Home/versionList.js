/**
 * Created by ruby on 2015/1/3.
 */
$(function(){
  var pathList={
    searchData:{},
    init:function(){
      this.bindEvent();
    },
    toSearchObj:function(str){
      var search=str.substr(1),
        arr=search.split('&'),
        searchObj={};
      arr.map(function(v,i,a){
        var temp=v.split('=');
        searchObj[temp[0]]=temp[1];
      })
      return searchObj;
    },
    bindEvent:function(){
      var _this=this,
        url_id=_this.toSearchObj(location.search)['result_id'];
      $('#page').delegate('.every','click',function(){
        var page=parseInt($(this).html());
        _this.loadData($.extend(_this.searchData,{page:page,result_id:result_id}));
      });
      $('#page').delegate('.prev','click',function(){
        var page=parseInt($('#page .current').html())-1;
        if(page<1) return;
        _this.loadData($.extend(_this.searchData,{page:page,result_id:result_id}));
      });
      $('#page').delegate('.next','click',function(){
        var page=parseInt($('#page .current').html())+ 1,
          last=parseInt($(this).prev().html());
        if(page>last) return;
        _this.loadData($.extend(_this.searchData,{page:page,result_id:result_id}));
      })
    },
    loadData:function(param,isSearch){
      var _this=this;
      Promise.resolve($.ajax({
        url:'/Post/P/searchVersion',
        type:'post',
        async:false,
        data:param,
        contentType:'json'
      })).then(JSON.parse).then(function(data){
        $('#result').html(data.table);
        $('#page').html(data.page);
        isSearch && _this.resetSearchData(param);
      }).catch(function(err, e,a){
        alert('请求超时！');
      })
    },
    resetSearchData:function(search){
      this.searchData=search;
    }

  }
  pathList.init();
})