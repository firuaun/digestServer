var helpers = require("./helpers");
var AWS = require("aws-sdk");
var sqsUtils = require("./sqscommand");
var AWS_CONFIG_FILE = "./config.json";
var SQS_CONFIG_FILE = "./sqsconfig.json";
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
        try {
            queue.pop(function(err,data){
                console.log(data);
                if(!data)
                    return _pool();
                var params = null;
                try {
                    params = JSON.parse(data.Body);
                    params.negative = eval(params.negative);
                    params.brightness = Number(params.brightness);
                    if(params.brightness === 100 && !params.negative){
                        console.warn("Nothing to do");
                        return _pool();
                    }
                    var s3param = {
                        Bucket: params.bucket,
                        Key: params.key
                    };
                    s3.getObject(s3param,function(err, data){
                        //manipulate the data.Body
                        if(err) return handle("S3 get obj error: ",err);
                        console.log("Rozmiar buffora: ",data.Body.length);
                        var image = gm(data.Body);
                        if(params.negative) {
                            image = image.negative();
                        }
                        image.modulate(params.brightness).toBuffer(getTypeOfImage(s3param.Key),function(err,buffer){
                            if (err) return handle(err);
                            console.log('Obrazek zmieniono i stworzono buffor');
                            s3param.Body = buffer;
                            s3.putObject(s3param,function(err,data){
                                if (err) return handle(err);
                                console.log('Wrzucono na S3, gratuluje');
                                _pool();
                            });
                        });
                    });  
                }catch(e){
                    console.error("Inappropriate content of massage: Massage must be a stringified JSON",e);
                    _pool();
                }
            });
        }
        catch(e){
            console.error(e);
            _pool();
        }
    }
   // while(true){
    _pool();    
   // }
})();

