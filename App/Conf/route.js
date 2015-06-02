/**
 * Created by SYSTEM on 2015/1/25.
 */
//正则路由
module.exports = [
    [/^mock\/([^\/]*)\/([^\/]*)(.*)(?:.*)$/, "mock/m/getMock?domain=:1&port=:2&path=:3"]
]