var helpers = require("./helpers");
var AWS = require("aws-sdk");
var sqsUtils = require("./sqscommand");
var AWS_CONFIG_FILE = "./config.json";
var SQS_CONFIG_FILE = "./sqsconfig.json";


AWS.config.loadFromPath(AWS_CONFIG_FILE);
var queue = new sqsUtils.SQSQueue(new AWS.SQS(), helpers.readJSONFile(SQS_CONFIG_FILE).QueueURL);
var s3 = new AWS.S3();

(function(){
    function _pool(){
        queue.pop(function(err,data){
            console.log(data);
            var params = null;
            try {
                params = JSON.parse(data.Body);
                if(params.brightness === 100 && params.negative === 'off'){
                    console.warn("Nothing to do");
                }
                else {
                    var s3param = {
                        Bucket: params.bucket,
                        Key: params.key
                    };
                    s3.getObject(s3param,function(err, data){
                        //manipulate the data.Body
                    });                    
                }
            }catch(e){
                console.error("Inappropriate content of massage: Massage must be a stringified JSON",e);
            }
            _pool();
        });
    }
   // while(true){
    _pool();    
   // }
})();

