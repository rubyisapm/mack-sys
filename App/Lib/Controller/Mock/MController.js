/**
 * Created by ruby on 2014/11/23.
 */
module.exports = Controller('Mock/BaseController', function () {
  'use strict';
  return {
    getMockAction: function () {
      /*
      * http://localhost:8360/mock/domain/port/introduce/list
      * */
      var req = this;
      var requestParam = this.param();
      var domain = requestParam.domain;
      var path = requestParam.path;
      var port = requestParam.port;
      var version = requestParam.version;
      //domain path port为必需值
      if(!(/^[a-zA-Z]{5,10}$/.test(domain) && /^\d+$/.test(port) && port>0 && port<65535 && path!='')){
        req.end({
          status:false,
          msg:'请输入正确的数据请求路径!'
        })
      }
      req.type('json');
      var param = [],
        keys = [];
      for (var i in requestParam) {
        if (i != 'domain' && i != 'path' && i != 'port' && i != 'version' && i!='jsonp' && i!="_") {
          /*
          * 还原param
          * */
          keys.push(i);
          param.push(i + '=' + requestParam[i]);
        }
      }
      keys = keys.join(',');
      param = param.join('&');

      var jsonp=requestParam['jsonp'];
      console.log(jsonp);
      var domain_fast_id = C_fastId(domain),
        path_fast_id = C_fastId(path);

      var model_domain = D(C_domainT),
        model_param = D(C_paramT),
        model_result = D(C_resultT),
        temp_domain_table='temp_domain_table'+(+new Date),
        query = 'create temporary table '+temp_domain_table+' as select * from ' + C_domainT +
          ' where domain_fast_id="' + domain_fast_id + '" and path_fast_id="' +
          path_fast_id + '" and port="' + port + '"';
      if (keys == '') {
        //接口没有查询参数的情况
        model_domain.query(query).then(function (data) {
          return D(temp_domain_table).where({domain: domain, path: path}).select();
        }).then(function (data) {
          if (data.length < 1) {
            req.end({
              status: false,
              msg: '没有相应的接口路径信息!请检查项目名称和接口地址是否正确!'
            })
          } else {
              if(typeof version!='undefined'){
                model_result.where({version:version,id:data[0].default_result_id}).select().then(function (data) {
                  if(data.length<1){
                    req.end({
                      status:false,
                      msg:'没有相关的版本!'
                    })
                  }else{
                    var mockData = mockPlus.mock(data[0].data + '/mock/i.json');

                    req.end(jsonp+'('+mockData+')')
                  }
                }).catch(function (err) {
                  console.log(err);
                  req.end();
                })
              }else{
                //如果没有指定version，那么默认去查找最新版本的数据
                model_result.where({id:data[0].default_result_id}).max('version').then(function(version){
                  model_result.where({version:version,id:data[0].default_result_id}).select().then(function (data) {
                    var mockData = mockPlus.mock(data[0].data + '/mock/i.json');
                    req.end(jsonp+'('+mockData+')')

                  }).catch(function (err) {
                    console.log(err);
                    req.end();
                  })
                })
              }
          }
        })
      } else {
        //接口含有查询参数的情况
        var keys_fast_id = C_fastId(keys),
          param_fast_id = C_fastId(param);
        var result_id = '';
        var temp_param_table='temp_param_table'+(+new Date);
        var query = 'create temporary table '+temp_param_table+' as select * from ' + C_paramT +
          ' where keys_fast_id="' + keys_fast_id + '" and param_fast_id="' + param_fast_id + '"';
        model_param.query(query).then(function () {
          return D(temp_param_table).where({param: param, keys: keys}).select();
        }).then(function (paramData) {
          if (paramData.length > 0) {
            /*参数信息可以对应上*/
            for(var i=0;i<paramData.length;i++){
              var url_id=paramData[i].url_id,
                result_id=paramData[i].result_id,
                done=false;//用于标记是否进行到有匹配域名且取值的情况
              model_domain.where({id: url_id, domain: domain, path: path}).select().then(function (data) {
                //检验该路径是否对应请求的域名
                if (data.length > 0) {
                  if(typeof version!='undefined'){
                    model_result.where({version:version,id:result_id}).select().then(function (data) {
                      var mockData = mockPlus.mock(data[0].data + '/mock/i.json');
                      if (data.length > 0) {
                        req.end(jsonp+'('+mockData+')')
                      } else {
                        req.end({
                          status: false,
                          data: '该接口的没有该版本下的数据信息!'
                        })
                      }

                    }).catch(function (err) {
                      console.log(err);
                      req.end();
                    })
                  }else{
                    model_result.where({id:result_id}).max('version').then(function(version){
                      //此处version一定有值，故不做判断

                      model_result.where({version:version,id:result_id}).select().then(function (data) {
                        var mockData = mockPlus.mock(data[0].data + '/mock/i.json');
                        if (data.length > 0) {
                          req.end(jsonp+'('+mockData+')')
                        } else {
                          req.end({
                            status: false,
                            data: '该接口的没有该版本下的数据信息!'
                          })
                        }
                        done=true;

                      }).catch(function (err) {
                        console.log(err);
                        done=true;
                        req.end();
                      })

                    })
                  }

                } else {
                  if(i==paramData.length && done){
                    //循环完成且没有匹配到数据，则返回无数据的情况
                    req.end({
                      status: false,
                      msg: '没有相关的版本!'
                    })
                  }
                }
              }).catch(function (err) {
                console.log(err);
                req.end();
              })




            }


          } else {
            req.end({
              status: false,
              msg: '没有相应的接口数据信息!'
            })
          }
        }).catch(function (err) {
          console.log(err);
          req.end();
        })
      }
    }
  }
})