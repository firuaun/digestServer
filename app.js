var helpers = require("./helpers");
var AWS = require("aws-sdk");
var sqsUtils = require("./sqscommand");
var waterfall = require('async-waterfall');
var AWS_CONFIG_FILE = "./config.json";
var SQS_CONFIG_FILE = "./sqsconfig.json";
var SIMPLEDB_CONFIG_FILE = "simpledbconfig.json";
var NoSQL = require("./nosql");
var simpledbconfig = helpers.readJSONFile(SIMPLEDB_CONFIG_FILE);
var gm = require('gm');


AWS.config.loadFromPath(AWS_CONFIG_FILE);
var queue = new sqsUtils.SQSQueue(new AWS.SQS(), helpers.readJSONFile(SQS_CONFIG_FILE).QueueURL);
var s3 = new AWS.S3();

function handle(err){
    console.error(err);
}
function getTypeOfImage(key) {
    var tmp = key.split('.');
    return tmp[tmp.length-1].toUpperCase();
}
(function(){
    function _pool(){


        waterfall([
            function(call){
                queue.pop(function(err,data){
                    call(err,data);
                });
            },
            function(data,call){
                var params = null;
                try {
                    params = JSON.parse(data.Body);
                    params.negative = eval(params.negative);
                    params.brightness = Number(params.brightness);
                    if(params.brightness === 100 && !params.negative){
                        return call(new Error("Nothing to do"),null);
                    }
                    var s3param = {
                        Bucket: params.bucket,
                        Key: params.key
                    };
                    s3.getObject(s3param,function(err, data){
                        call(err,data,params,s3param);
                    });  
                }catch(e){
                    return call(new Error("Inappropriate content of massage: Massage must be a stringified JSON"),null);
                }
            },
            function(data,params,s3param,call) {
                //manipulate the data.Body
                console.log("Rozmiar buffora: ",data.Body.length);
                var image = gm(data.Body);
                if(params.negative) {
                    image = image.negative();
                }
                image.modulate(params.brightness).toBuffer(getTypeOfImage(s3param.Key),function(err,buffer){
                    call(err, buffer, data, s3param, params);
                });
            },
            function(buffer, data, s3param, params, call){
                console.log('Obrazek zmieniono i stworzono buffor');
                s3param.Body = buffer;
                s3param.Metadata = data.Metadata;
                s3.putObject(s3param,function(err,data){
                    call(err,data,params);
                });
            },
            function(data,params,call) {
                console.log('Wrzucono na S3, gratuluje');
                call(null,data,params);
            },
            function(data,params,call) {
                NoSQL.open(new AWS.SimpleDB(), simpledbconfig,function(nosql){
                    call(null, data, nosql, params);
                },NoSQL.CREATE_IF_NOT_EXISTS);
            },
            function(data, nosql, params, call){
                var attr = [
                    {Name:'LastProcessed',
                    Value: JSON.stringify([Date.now(),params.brightness,params.negative]),
                    Replace:true}
                ];
                nosql.put(params.key,attr,function(err,data){
                    call(err,data);
                });
            },
            function(data,call){
                console.log('Wrzucono info na SimpleDB');
                call(null,data);
            }
        ],function(err,data){
            if(err) handle(err);
            return _pool();
        });

    }
   // while(true){
    _pool();    
   // }
})();

