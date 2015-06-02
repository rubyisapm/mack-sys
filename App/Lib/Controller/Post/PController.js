/**
 * Created by ruby on 2014/11/23.
 */
module.exports = Controller('Post/BaseController',function(){
  'use strict';
  //任务队列实现
  /*
  * 当一条数据save成功后，触发该观察者的方法，该方法中实现：查找队列中未完成save的对象，执行save方法
  * 该模式必须保证一次只有一个对象执行save方法
  * */
  var taskQueue=new TaskQueue();
  function save(queue){
    var data=queue.queue[0].data,
      data_domain={
        domain:data.domain,
        port: data.port,
        path:data.path,
        domain_fast_id: data.domain_fast_id,
        path_fast_id:data.path_fast_id
      },
      data_result= {
        id: data.result_id,
        data:data.resultPath
    };
    //这里用到result_id仅仅是为了保证队列中每项数据存储时生成的临时表名字是不一样的。
    var temp_domain_table='domain'+data.result_id,
        temp_param_table='param'+data.result_id,
        model_domain = D(C_domainT),
        model_param = D(C_paramT),
        model_result=D(C_resultT);
    if(data.keys!=''){
      //如果有参数
      var data_param={
        keys:data.keys,
        param:data.param,
        result_id:data.result_id,
        keys_fast_id:data.keys_fast_id,
        param_fast_id:data.param_fast_id
      };
      model_domain.startTrans().then(function(){
        //无相同数据时才做插入
        var query='create temporary table '+temp_domain_table+' as select * from '+C_domainT+' where domain_fast_id="'+data_domain.domain_fast_id+'" and path_fast_id="'+data_domain.path_fast_id+'" and port="'+data_domain.port+'"';
        return model_domain.query(query);
      }).then(function(){
        return D(temp_domain_table).where({domain:data_domain.domain,path:data_domain.path}).select();
      }).then(function(data){
        if(data.length<1){
          //指定的路径不存在
          model_domain.add(data_domain).then(function(insertId){
            data_param.url_id=insertId;
            return model_param.add(data_param)
          }).then(function(insertId){
            data_result.version='0.0.0';
            //存入result表前，对文件夹改名
            var filePath=data_result.data;
            data_result.data=C_changeFilename(filePath,data_result.id+'('+data_result.version+')');
            return model_result.add(data_result);
          }).catch(function(err){
            console.log(err);
            queue.emit('stateFail',err);
            return model_domain.rollback();
          }).then(function(insertId){
            queue.emit('stateSuccess');
            return model_domain.commit();
          })
        }else{
          //指定的路径存在
          data_param.url_id=data[0].id;
          var query='create temporary table '+temp_param_table+' as select * from '+C_paramT+' where param_fast_id="'+data_param.param_fast_id+'" and keys_fast_id="'+data_param.keys_fast_id+'"';
          model_domain.query(query).then(function(){
            return D(temp_param_table).where({keys:data_param.keys,param:data_param.param,url_id:data_param.url_id}).select();
          }).then(function(data){
            if(data.length<1){
              //当参数不存在时，在param表中添加一条记录
              model_param.add(data_param).then(function(insertId){
                data_result.version='0.0.0';
                //存入result表前，对文件夹改名
                var filePath=data_result.data;
                data_result.data=C_changeFilename(filePath,data_result.id+'('+data_result.version+')');
                return model_result.add(data_result);
              }).then(function(insertId){
                queue.emit('stateSuccess');
                return model_domain.commit();
              }).catch(function(err){
                console.log(err);
                queue.emit('stateFail',err);
                model_domain.rollback();
              })
            }else{
              var result_id=data[0].result_id;
              model_result.where({id:result_id}).max('version').then(function(data){
                data_result.version=C_versionAdd(data);
                data_result.id=result_id;
                //存入result表前，对文件夹改名
                var filePath=data_result.data;
                data_result.data=C_changeFilename(filePath,data_result.id+'('+data_result.version+')');
                return model_result.add(data_result);
              }).then(function(){
                queue.emit('stateSuccess');
                return model_domain.commit();
              }).catch(function(err){
                console.log(err);
                queue.emit('stateFail',err);
                model_domain.rollback();
              })
            }
          }).catch(function(err){
            console.log(err);
            queue.emit('stateFail',err);
            return model_domain.rollback();
          })
        }
      }).catch(function(err){
        console.log(err);
        queue.emit('stateFail',err);
        return model_domain.rollback();
      })
    }else{
      //路径没有参数，只操作domain表
      data_domain.default_result_id=data.result_id;
      var model_domain = D(C_domainT);
      model_domain.startTrans().then(function(){
        var query='create temporary table '+temp_domain_table+' as select * from '+C_domainT+' where domain_fast_id="'+data_domain.domain_fast_id+'" and path_fast_id="'+data_domain.path_fast_id+'" and port="'+data_domain.port+'"';
        return model_domain.query(query);
      }).then(function(){
        return D(temp_domain_table).where({domain:data_domain.domain,path:data_domain.path}).select();
      }).then(function(data){
        if(data.length<1){
          model_domain.add(data_domain).then(function(insertId){
            data_result.version='0.0.0';
            //存入result表前，对文件夹改名
            var filePath=data_result.data;
            data_result.data=C_changeFilename(filePath,data_result.id+'('+data_result.version+')');
            return model_result.add(data_result);
          }).then(function(insertId){
            queue.emit('stateSuccess');
            return model_domain.commit();
          }).catch(function(err){
            console.log(err);
            queue.emit('stateFail',err);
            return model_domain.rollback();
          })
        }else{
          var default_result_id=data[0].default_result_id;
          if(default_result_id){

            model_result.where({id:default_result_id}).max('version').then(function(data){
              data_result.version=C_versionAdd(data);
              data_result.id=default_result_id;
              //存入result表前，对文件夹改名
              var filePath=data_result.data;
              data_result.data=C_changeFilename(filePath,data_result.id+'('+data_result.version+')');
              return model_result.add(data_result);
            }).then(function(insertId){
              queue.emit('stateSuccess');
              return model_domain.commit();
            }).catch(function(err){
              console.log(err);
              queue.emit('stateFail',err);
              return model_domain.rollback();
            })
          }else{
            model_domain.where({domain:data_domain.domain,path:data_domain.path}).update({default_result_id:data_domain.default_result_id}).then(function(){
              data_result.version='0.0.0';
              //存入result表前，对文件夹改名
              var filePath=data_result.data;
              data_result.data=C_changeFilename(filePath,data_result.id+'('+data_result.version+')');
              return model_result.add(data_result);
            }).then(function(insertId){
              queue.emit('stateSuccess');
              return model_domain.commit();
            }).catch(function(err){
              console.log(err);
              queue.emit('stateFail',err);
              return model_domain.rollback();
            })
          }
        }
      }).catch(function(err){
        console.log(err);
        queue.emit('stateFail',err);
        return model_domain.rollback();
      })
    }
  }

  return {
    /*接到接口上传文件时的处理*/
    receiveFilesAction:function(){
      var req=this,
        file=this.file('file');
      if(typeof file=='undefined') return;
      this.end({
        status:true,
        tempPath:file.path,
        originalFilename:file.originalFilename
      })
    },
    /*保存接口信息到数据库*/
    saveAction:function() {
      var req = this,
        domain = this.post('domain'),
        port = this.post('port'),
        files = this.post('files'),
        fileId=this.post('fileId'),
        domain_fast_id = C_fastId(domain);
      var errMsg = this.valid([{
        name: 'domain',
        value: domain,
        valid: ['regexp'],
        //regexp_args:[/^(?:[^\W_](?:[^\W_]|-){0,61}[^\W_]\.)+[a-zA-Z]{2,6}\.?$/],
        regexp_args:[/^[a-zA-Z]{5,10}$/],
        msg: {
          regexp: "域名格式有误！"
        }
      }, {
        name: 'port',
        value: port,
        valid: ['range'],
        length_args: [0, 65535],
        msg: {
          range: "端口需为0~65535之间的整数！"
        }
      },{
        name: 'files',
        value: files,
        valid:function(){
          if(C_isEmpty(files)){
            return '没有检测到上传文件'
          }
        }
      }]);
      if(!C_isEmpty(errMsg)){
        return req.error(1001,'提交信息有误！',errMsg);
      }
      files=JSON.parse(files);
      for (var i=0;i<files.length;i++) {
        var analyzedPath = C_analysisPath(files[i].infAdd),
          path = analyzedPath.path,
          keys = analyzedPath.keys.join(','),
          param = analyzedPath.param;
        var data = {
          path: path,
          keys: keys,
          param: param,
          path_fast_id: C_fastId(path),
          keys_fast_id: C_fastId(keys),
          param_fast_id: C_fastId(param),
          resultPath: files[i].filePath,
          domain: domain,
          port: port,
          domain_fast_id: domain_fast_id,
          result_id: C_randomResultId()
        }
        taskQueue.queueIn({data:data,fileId:files[i].fileId});
      }
      //任务列表中的fileId标记了每个前端上传文件队列中的file.id，因为这里的数据操作不是原子操作，允许部分失败.
      taskQueue.on('stateSuccess',function(){
        this.result.push({task:this.queueOut(),errdata:false});
        if(!(this.isDone())){
          save(this);
        }else{
          this.over(req);
        }
      });
      taskQueue.on('stateFail',function(errdata){
        var first=this.queueOut();
        this.result.push({task:first,errdata:errdata});
        this.failLists.push({task:first,errdata:errdata});
        if(!(this.isDone())){
          save(this);
        }else{
          this.over(req);
        }
      });
      save(taskQueue);
    },
    /*pathList搜索处理*/
    searchPathAction:function(){
      var domain=this.post('domain'),
        port=this.post('port'),
        path=this.post('path'),
        page=this.post('page')||1,
        queryObj={};
      if(domain!=''){
        queryObj.domain=domain;
      }
      if(port!=''){
        queryObj.port=port;
      }
      if(path!=''){
        queryObj.path=path;
      }
      var _this=this,
        response={};
      D(C_domainT).where(queryObj).page(page,10).countSelect().then(function(data){
        var data = C_dataInit({
          data: data,
          visibleNum: 7,
          after: 3,
          thead: ['ID', '网站名称', '端口', '接口路径', '操作'],
          cols: [40, 240, 80, 400]
        });
        _this.assign(data.tableData);
        return _this.fetch('swig-module/table_path.html').then(function(content){
          response.html_table=content;
          return data;
        })
      }).then(function(data){
        _this.assign(data.pageData);
        return _this.fetch('swig-module/page.html').then(function(content){
          response.html_page=content;
          _this.end(response);
        })
      }).catch(function(err){
        console.log(err);
        _this.end();
      })
    },
    searchParamAction:function(){
      var _this=this,
        url_id=this.param('url_id'),
        page=this.param('page');
      var selectParam = D(C_paramT).page(page, 10).where({url_id: url_id}).countSelect();
      var html={};
      selectParam.catch(function (err) {
        _this.display('errmsg', '后端数据查询出错!');
      }).then(function (data) {
        var data = C_dataInit({
          data: data,
          visibleNum: 7,
          after: 3,
          thead: ['ID', '参数', '参数详情', '操作'],
          cols: [100, 260, 260]
        })
        _this.assign(data.pageData);
        return _this.fetch('swig-module/page.html').then(function(content){
          html.page=content;
          return data;
        })
      }).catch(function (err) {
        console.log(err)
        _this.display('errmsg', '页码渲染出错!');
      }).then(function(data){
        _this.assign(data.tableData);
        return _this.fetch('swig-module/table_param.html').then(function(content){
          html.table=content;
          _this.end(html);
        })
      }).catch(function (err) {
        _this.display('errmsg', '表格渲染出错!');
      })
    },
    searchVersionAction:function(){
      var _this=this,
        result_id=this.param('result_id'),
        page=this.param('page'),
        html={};
      D(C_resultT).where({id:result_id}).page(page,10).countSelect().then(function(data){
        var data=C_dataInit({
          data: data,
          visibleNum: 7,
          after: 3,
          thead: ['ID', '参数', '参数详情', '操作'],
          cols: [100, 260, 260]
        });
        _this.assign(data.tableData);
        return _this.fetch('swig-module/table_version.html').then(function(content){
          html.table=content;
          return data;
        })
      }).catch(function(err){
        _this.display('errmsg', '表格渲染出错!');
      }).then(function(data){
        _this.assign(data.page);
        _this.fetch('swig-module/page.html').then(function(content){
          html.page=content;
          _this.end(html);
        })
      }).catch(function(err){
        _this.display('errmsg','页码渲染出错!');
      })
    },
    /*处理versionList页面中的'查看doc文件'操作*/
    previewAction:function(){
      var docFile=this.post('')
    }





  }
})