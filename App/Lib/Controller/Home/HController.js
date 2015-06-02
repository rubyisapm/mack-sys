/**
 * controller
 * @return
 */

module.exports = Controller("Home/BaseController", function () {
  "use strict";
  return {
    pathListAction: function () {
      var _this = this;
      var selectPromise = D(C_domainT).page(1, 10).countSelect();
      selectPromise.then(function (data) {
        var data = C_dataInit({
          data: data,
          visibleNum: 7,
          after: 3,
          thead: ['ID', '网站名称', '端口', '接口路径', '操作'],
          cols: [40, 240, 80, 400]
        });
        _this.assign('data', data);
        _this.display();
      }).catch(function (err) {
        _this.display('errmsg', '后端数据查询出错!');
      })
    },
    paramListAction: function () {
      var url_id = this.get('url_id');
      var _this = this;
      if (url_id != '') {
        var selectDomain = D(C_domainT).where({id: url_id}).select();
        var selectParam = D(C_paramT).page(1, 10).where({url_id: url_id}).countSelect();
        var assignData = {},
            defaultResult={};
        selectDomain.then(function(data){
          if(data.length>0 && data[0].default_result_id!=null){
            defaultResult={
              id:'-',
              keys:'-',
              param:'-',
              result_id:data[0].default_result_id
            };
          }
        }).catch(function(err){
          console.log(err);
        }).then(function(){
          return selectParam;
        }).then(function (data) {
          if(typeof defaultResult.result_id!='undefined'){
            data.data.push(defaultResult);
          }
          assignData = C_dataInit({
            data: data,
            visibleNum: 7,
            after: 3,
            thead: ['ID', '参数', '参数详情', '操作'],
            cols: [100, 260, 260]
          })
          return selectDomain;
        }).catch(function (err) {
          _this.display('errmsg', '后端数据查询出错!');
        }).then(function (data) {
          assignData.searchData = data[0];
          _this.assign('data', assignData);
          return _this.display();
        }).catch(function (err) {
          _this.display('errmsg', '后端数据查询出错!');
        })


      } else {
        _this.display('errmsg', '后端数据查询出错!');
      }

    },
    versionListAction: function () {
      var result_id = this.get('result_id');
      var selectResult = D(C_resultT).page(1, 10).where({id: result_id}).countSelect();
      var _this = this;
      var assignData = {};
      selectResult.then(function (data) {
        assignData = C_dataInit({
          data: data,
          visibleNum: 7,
          after: 3,
          thead: ['ID', '版本号', 'json文件', 'doc文件', 'mock文件'],
          cols: [100, 260, 260]
        });
        _this.assign('data', assignData);
        return _this.display();
      }).catch(function (err) {
        _this.display('errmsg','后端数据查询出错!');
      })

    },
    infUpLoadAction: function () {
      this.display();
    },
    docPreviewAction:function(){
      var resultId=this.get('id'),
          version=this.get('version'),
          _this=this;
      D(C_resultT).field('data').where({id:resultId,version:version}).select().then(function(data){
        var file=data[0].data;
        var content=fs.readFileSync(file+'/doc/i.html','utf-8');
        _this.assign('data',{html:content});
        _this.display();
        //拿到数据开始渲染说明文件
      }).catch(function(err){
        console.log(err);
      })
    }
  };
});