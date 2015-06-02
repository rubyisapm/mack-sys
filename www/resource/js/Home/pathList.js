/**
 * Created by ruby on 2015/1/3.
 */
$(function(){
  var pathList={
    searchData:{},
    init:function(){
      this.bindEvent();
    },
    bindEvent:function(){
      var _this=this;
      $('#btn_search').on('click',function(){
        var data={};
        data.domain= $.trim($('#domain').val());
        data.port=$.trim($('#port').val());
        data.path= $.trim($('#path').val());
        data.page=1;
        _this.loadData(data,true);
      });
      $('#page').delegate('.every','click',function(){
        var page=parseInt($(this).html());
        _this.loadData($.extend(_this.searchData,{page:page}));
      });
      $('#page').delegate('.prev','click',function(){
        var page=parseInt($('#page .current').html())-1;
        if(page<1) return;
        _this.loadData($.extend(_this.searchData,{page:page}));
      });
      $('#page').delegate('.next','click',function(){
        var page=parseInt($('#page .current').html())+ 1,
          last=parseInt($(this).prev().html());
        if(page>last) return;
        _this.loadData($.extend(_this.searchData,{page:page}));
      })
    },
    loadData:function(param,isSearch){
      var _this=this;
      Promise.resolve($.ajax({
        url:'/Post/P/searchPath',
        type:'post',
        async:false,
        data:param,
        contentType:'json'
      })).then(JSON.parse).then(function(data){
        $('#result').html(data.html_table);
        $('#page').html(data.html_page);
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