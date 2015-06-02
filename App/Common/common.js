//这里定义一些全局通用的函数，该文件会被自动加
// 载
//项目中所有用到的模块引用
global.crypto = require('crypto');
global.fs = require('fs');
global.path = require('path');
global.mockPlus = require('mock-plus');
global.crypto = require('crypto');
global.util = require('util');
global.EventEmitter = require('events').EventEmitter;
global.rimraf=require('rimraf');
global.marked=require('marked');
//项目中所有用到的数据表配置
global.C_domainT = 'domain';
global.C_paramT = 'param';
global.C_resultT = 'result';
/*
 * 数据库操作常用方法对象
 * */
global.C_getUrlInfo = function (url) {
  url = url.replace(/\/\//, '$');
  var tempArr = url.split('/');
  return{
    domName: tempArr[0].replace(/\$/, '\/\/'),
    infAdd: '/' + tempArr.slice(1).join('/')
  }
}
/*
 * 数据库常见错误解析
 * */
global._errorInfo = {
  ENOTFOUND: '指定的地址出错',
  ECONNREFUSED: '端口出错或服务器未开启无法连接到数据库',
  1045: '错误的用户名或密码',
  1044: '权限不足',
  1049: '数据库异常（没有指定名字的数据库）',
  1203: '超出数据库最大连接',
  1054: '查询的列不存在',
  1146: '指定的表不存在',
  1064: '语法出错',
  1136: '存入数据的指定列数与表中列数不一致',
  1062: '存入数据与表内已有的列重复，而该列被约束为唯一或该列为主键',
  1406: '存入数据太长，不符合该列的约束规则',
  1036: '存入数据列数与表内列数不符合',
  1452: '存入数据时因外键约束无法存入，如存入时需要check另一表中是否有相关数据',
  1451: '删除数据时因外键约束无法删除，如表中的某一列作为外键被另一个表使用',
  1360: '数据缺失!表中的某些键不能为空！',
  1364: '数据缺失!表中的某些键不能为空！'
};
global.C_dbError = function (err) {
  return global._errorInfo[err.errno];
}

//网站上传文件路径
global.C_MOCK_PATH = path.normalize(VIEW_PATH + '/../../www/mockSys');
global.C_SWIG_PATH = path.normalize(VIEW_PATH + '/swig-module');


/*promise化*/
//读取文件
global.promise_readFile = function (path,encoding) {
  return new Promise(function (resolve, reject) {
    fs.readFile(path, encoding,function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    })
  })
};
//写入文件
global.promise_writeFile = function (path, data) {
  return new Promise(function (resolve, reject) {
    fs.writeFile(path, data, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    })
  })
};
//生成mock对象
global.promise_toMock = function (input, output) {
  return new Promise(function (resolve, reject) {
    try {
      mockPlus.toMock(input, output);
      resolve();
    }
    catch (err) {
      reject(err);
    }
  })
};
//生成markdown文件
global.promise_toHtml = function (input, output) {
  return new Promise(function (resolve, reject) {
    try {
      mockPlus.toHtml(input, output);
      resolve();
    }
    catch (err) {
      reject(err);
    }
  })
}
/*promise化 end*/
//解析出文件名称（不含后缀）
global.C_getFileName = function (originName) {
  var temp = originName.split('.'),
    exceptLast = temp.slice(0, temp.length - 1);
  return exceptLast.join('.');
}
//根据路径创建目录，该路径中文件存在时不覆盖，不存在时添加
global.C_createFileByPath = function (base, path) {
  /*
   * base:基路径
   * path:要创建的路径
   * */
  var pathArr = path.split('/');
  if (pathArr[0] == '') {
    pathArr = pathArr.slice(1);
  }
  for (var i = 0; i < pathArr.length; i++) {
    var v = pathArr[i];
    if (fs.existsSync(base + '/' + v)) {
      base = base + '/' + v;
      continue;
    }
    fs.mkdirSync(base + '/' + v);
    base = base + '/' + v;
  }
}

/*
 * 随机生成一个路径，如果路径已存在，不覆盖并重新生成路径，直至创建一个唯一的路径
 * 在该路径中加入json mock doc三个文件
 * 返回以上三个路径
 * */
global.C_createUniquePath = function (tempPath) {
  var tempArr1=tempPath.split('\\');
  var tempArr2=tempArr1[tempArr1.length-1].split('.');
  var random = tempArr2[0];
  if (fs.existsSync(C_MOCK_PATH + '/' + random)) {
    C_createUniquePath();
  }
  C_createFileByPath(C_MOCK_PATH, '/' + random + '/json');
  C_createFileByPath(C_MOCK_PATH, '/' + random + '/mock');
  C_createFileByPath(C_MOCK_PATH, '/' + random + '/doc');
  return {
    basePath: C_MOCK_PATH + '/' + random,
    jsonPath: C_MOCK_PATH + '/' + random + '/json',
    mockPath: C_MOCK_PATH + '/' + random + '/mock',
    docPath: C_MOCK_PATH + '/' + random + '/doc'
  }
}

/*
 * 将原来暂存的文件路径改为result中要存的路径
 * */
global.C_changeFilename = function (filePath, result_id) {
  var tempArr = filePath.split('/');
  var before = tempArr[0];
  var newFilePath = before + '/' + result_id;
  fs.renameSync(filePath, newFilePath);
  return newFilePath;
}


//常用函数
//判断对象是否为一个空对象
global.C_isEmpty = function (obj) {
  for (var i in obj) {
    return false;
  }
  return true;
}
//根据接口全路径解析出路径、参数、值
global.C_analysisPath = function (path) {
  var tempArr = path.split('?');
  var path = tempArr[0];
  var keys = [];
  var param = '';
  if (tempArr.length > 1) {
    param = tempArr[1];
    var paramArr = param.split('&');
    paramArr.forEach(function (v) {
      keys.push(v.split('=')[0]);
    })
  }
  return {
    path: path,
    keys: keys,
    param: param
  }
}

//生成数组
global.C_generateArr=function(begin,end){
  var arr=[];
  for(var i=begin;i<end+1;i++){
    arr.push(i);
  }
  return arr;
}

//页码和表格数据初始化，用于模版渲染
global.C_dataInit=function(args){
  /*
  * visibleNum:页码明确显示的页数
  * after:当前页码后面要显示的页码数
  * */
  /*data:{
   count: 123, //总条数
   total: 10, //总页数
   page: 1, //当前页
   num: 20, //每页显示多少条
   data: [{}, {}] //详细的数据
   }*/
  var data=args.data,
    visibleNum=args.visibleNum,
    after=args.after,
    thead=args.thead,
    cols=args.cols,
    pages=[],
    more=false;
  if(visibleNum>data.total || visibleNum==data.total){
    pages=C_generateArr(1,data.total);
    more=false;
  }else if(data.total-data.page<after || data.total-data.page==after){
    pages=C_generateArr(data.total-visibleNum+1,data.total);
    more=false;
  }else if(data.page+after>visibleNum || data.page+after==visibleNum){
    pages=C_generateArr(data.page+after-visibleNum+1,data.page+after);
    more=true;
  }else{
    pages=C_generateArr(1,visibleNum);
    more=true;
  }
  return{
    pageData:{
      count:data.count,
      total:data.total,
      page:data.page,
      num:data.num,
      pages:pages,
      more:more
    },
    tableData:{
      data:data.data,
      thead:thead,
      cols:cols
    }
  }

}

//fastId
global.C_fastId = function (str) {
  var hash = 1;
  var len = str.length;
  for (var i = 0; i < len; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i);
  }
  return (Math.abs(hash)) % 1000000000;
}

//random
global.C_randomResultId = function () {
  var str = crypto.randomBytes(5).toString('hex');
  return C_fastId(str);
}

//version增加0.0.1
global.C_versionAdd = function (version) {
  /*每次增加0.0.1*/
  var temp = version.split('.');
  if (temp[2] < 9) {
    temp[2] = temp[2] * 1 + 1;
    return temp.join('.');
  } else if (temp[1] < 9) {
    temp[2] = 0;
    temp[1] = temp[1] * 1 + 1;
    return temp.join('.');
  } else {
    temp[2] = 0;
    temp[1] = 0;
    temp[0] = temp[0] * 1 + 1;
    return temp.join('.');
  }
}

/*自动清除无效的文件*/
global.C_clearUp=function(){
  /*
  * 定时清理临时文件夹和mockSys中无效的文件
  * */
  var files=fs.readdirSync(C_MOCK_PATH);
  files.forEach(function(v){
    if(!/^\d+\(\d\.\d\.\d\)$/.test(v)){
      rimraf(C_MOCK_PATH+'/'+ v,function(err){
        if(err){
          console.error('mockSys delete failed!');
        }
      })
    }
  })
  var files_temp=fs.readdirSync(RUNTIME_PATH+'/Temp');
  files_temp.forEach(function(v){
    rimraf(RUNTIME_PATH+'/Temp/'+v,function(err){
      if(err){
        console.error('temp delete failed!');
      }
    })
  })
 }

/*taskQueue*/
util.inherits(TaskQueue, EventEmitter);
function TaskQueue () {
  EventEmitter.call(this);
  this.queue = [];
  this.failLists=[];
  this.result=[];
};
TaskQueue.prototype.queueIn = function (o) {
  this.queue.push(o);
}
TaskQueue.prototype.queueOut = function () {
  return this.queue.shift();
};

TaskQueue.prototype.isDone = function () {
  if (this.queue.length < 1) {
    return true;
  } else {
    return false;
  }
}

TaskQueue.prototype.over=function(req){
  var result=this.result;
  var failLists=this.failLists;
  if(failLists.length<1){
    req.end({
      status:true,
      msg:'数据已存储!'
    });
  }else{
    var detail=[];
    for(var i in result){
      detail.push({fileId:result[i].task.fileId,errdata:result[i].errdata});
    }
    req.error(1002,'存储文件部分失败！',detail);
  }
}

global.TaskQueue = TaskQueue;



